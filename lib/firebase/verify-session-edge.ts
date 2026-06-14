import {
  createRemoteJWKSet,
  importX509,
  jwtVerify,
  type JWTPayload,
} from 'jose'

import type { SessionTokenClaims } from '@/lib/firebase/session-claims'
import { normalizeSessionToken } from '@/lib/firebase/session-token'

const GOOGLE_JWKS_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'

const IDENTITY_TOOLKIT_PUBLIC_KEYS_URL =
  'https://www.googleapis.com/identitytoolkit/v3/relyingparty/publicKeys'

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null

type IdentityToolkitKeyCache = {
  keys: Record<string, string>
  expiresAt: number
}

let identityToolkitKeyCache: IdentityToolkitKeyCache | null = null

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

export type VerifiedFirebaseToken = SessionTokenClaims & {
  uid: string
  email?: string
}

function payloadToVerifiedToken(
  payload: JWTPayload
): VerifiedFirebaseToken | null {
  if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
    return null
  }

  return {
    ...payloadToSessionClaims(payload),
    uid: payload.sub,
    email: typeof payload.email === 'string' ? payload.email : undefined,
  }
}

function parseMaxAgeSeconds(cacheControl: string | null): number {
  if (!cacheControl) {
    return 3600
  }

  const match = cacheControl.match(/max-age=(\d+)/i)
  return match ? Number.parseInt(match[1], 10) : 3600
}

async function getIdentityToolkitPublicKeys(): Promise<Record<string, string>> {
  const now = Date.now()

  if (identityToolkitKeyCache && identityToolkitKeyCache.expiresAt > now) {
    return identityToolkitKeyCache.keys
  }

  const response = await fetch(IDENTITY_TOOLKIT_PUBLIC_KEYS_URL)

  if (!response.ok) {
    throw new Error('Failed to fetch Identity Toolkit public keys')
  }

  const keys = (await response.json()) as Record<string, string>
  const maxAgeMs =
    parseMaxAgeSeconds(response.headers.get('cache-control')) * 1000

  identityToolkitKeyCache = {
    keys,
    expiresAt: now + maxAgeMs,
  }

  return keys
}

function resolveTokenKind(
  token: string,
  projectId: string
): 'session' | 'id' | 'unknown' {
  const payload = decodeJwtPayload(token)
  if (!payload?.iss || typeof payload.iss !== 'string') {
    return 'unknown'
  }

  if (payload.iss === `https://session.firebase.google.com/${projectId}`) {
    return 'session'
  }

  if (payload.iss === `https://securetoken.google.com/${projectId}`) {
    return 'id'
  }

  return 'unknown'
}

async function verifyFirebaseIdToken(
  token: string,
  projectId: string
): Promise<VerifiedFirebaseToken | null> {
  const keySet = getGoogleJwks()
  const issuer = `https://securetoken.google.com/${projectId}`

  try {
    const { payload } = await jwtVerify(token, keySet, {
      issuer,
      audience: projectId,
      algorithms: ['RS256'],
      clockTolerance: 60,
    })

    if (isJwtExpired(payload)) {
      return null
    }

    return payloadToVerifiedToken(payload)
  } catch {
    return null
  }
}

/** Admin session cookies use Identity Toolkit X.509 keys, not securetoken JWKS. */
async function verifyFirebaseSessionCookie(
  token: string,
  projectId: string
): Promise<VerifiedFirebaseToken | null> {
  const keys = await getIdentityToolkitPublicKeys()
  const issuer = `https://session.firebase.google.com/${projectId}`

  try {
    const { payload } = await jwtVerify(
      token,
      async (protectedHeader) => {
        const kid = protectedHeader.kid
        if (!kid) {
          throw new Error('Missing kid header')
        }

        const cert = keys[kid]
        if (!cert) {
          throw new Error('Unknown session cookie signing key')
        }

        return importX509(cert, 'RS256')
      },
      {
        issuer,
        audience: projectId,
        algorithms: ['RS256'],
        clockTolerance: 60,
      }
    )

    if (isJwtExpired(payload)) {
      return null
    }

    return payloadToVerifiedToken(payload)
  } catch {
    return null
  }
}

function verifyEmulatorSession(token: string): VerifiedFirebaseToken | null {
  const payload = decodeJwtPayload(token)
  if (!payload || isJwtExpired(payload)) {
    return null
  }

  return payloadToVerifiedToken(payload)
}

/** Verifies Firebase ID tokens and session cookies (Edge-safe, no Admin SDK). */
export async function verifyFirebaseToken(
  token: string
): Promise<VerifiedFirebaseToken | null> {
  const normalized = normalizeSessionToken(token)

  if (!normalized) {
    return null
  }

  if (isAuthEmulatorEnabled()) {
    return verifyEmulatorSession(normalized)
  }

  const projectId = resolveProjectId()
  const tokenKind = resolveTokenKind(normalized, projectId)

  if (tokenKind === 'session') {
    return verifyFirebaseSessionCookie(normalized, projectId)
  }

  if (tokenKind === 'id') {
    return verifyFirebaseIdToken(normalized, projectId)
  }

  return (
    (await verifyFirebaseIdToken(normalized, projectId)) ??
    (await verifyFirebaseSessionCookie(normalized, projectId))
  )
}

export async function verifySessionCookieEdge(
  sessionCookie: string
): Promise<SessionTokenClaims | null> {
  const verified = await verifyFirebaseToken(sessionCookie)
  return verified ? payloadToSessionClaims(verified) : null
}

/** @internal Test helper */
export function clearIdentityToolkitKeyCacheForTests(): void {
  identityToolkitKeyCache = null
}
