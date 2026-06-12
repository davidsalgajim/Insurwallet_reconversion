import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'

import type { SessionTokenClaims } from '@/lib/firebase/session-claims'

const GOOGLE_JWKS_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null

function getGoogleJwks() {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(GOOGLE_JWKS_URL))
  }

  return jwks
}

function resolveProjectId(): string {
  return process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'insurwallet-staging'
}

function isAuthEmulatorEnabled(): boolean {
  return process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true'
}

function decodeJwtPayload(token: string): JWTPayload | null {
  const parts = token.split('.')
  if (parts.length !== 3) {
    return null
  }

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      '='
    )
    const json = Buffer.from(padded, 'base64').toString('utf8')
    return JSON.parse(json) as JWTPayload
  } catch {
    return null
  }
}

function isJwtExpired(payload: JWTPayload): boolean {
  if (typeof payload.exp !== 'number') {
    return true
  }

  return payload.exp * 1000 <= Date.now()
}

function payloadToSessionClaims(payload: JWTPayload): SessionTokenClaims {
  const firebase = payload.firebase

  return {
    email_verified:
      typeof payload.email_verified === 'boolean'
        ? payload.email_verified
        : undefined,
    firebase:
      firebase && typeof firebase === 'object'
        ? {
            sign_in_provider:
              'sign_in_provider' in firebase &&
              typeof firebase.sign_in_provider === 'string'
                ? firebase.sign_in_provider
                : undefined,
          }
        : undefined,
  }
}

async function verifyWithGoogleJwks(
  token: string,
  projectId: string
): Promise<SessionTokenClaims | null> {
  const keySet = getGoogleJwks()
  const sessionIssuer = `https://session.firebase.google.com/${projectId}`
  const idTokenIssuer = `https://securetoken.google.com/${projectId}`

  for (const issuer of [sessionIssuer, idTokenIssuer]) {
    try {
      const { payload } = await jwtVerify(token, keySet, {
        issuer,
        audience: projectId,
      })

      if (isJwtExpired(payload)) {
        return null
      }

      return payloadToSessionClaims(payload)
    } catch {
      continue
    }
  }

  return null
}

function verifyEmulatorSession(token: string): SessionTokenClaims | null {
  const payload = decodeJwtPayload(token)
  if (!payload || isJwtExpired(payload)) {
    return null
  }

  return payloadToSessionClaims(payload)
}

export async function verifySessionCookieEdge(
  sessionCookie: string
): Promise<SessionTokenClaims | null> {
  const token = decodeURIComponent(sessionCookie)

  if (!token) {
    return null
  }

  if (isAuthEmulatorEnabled()) {
    return verifyEmulatorSession(token)
  }

  return verifyWithGoogleJwks(token, resolveProjectId())
}
