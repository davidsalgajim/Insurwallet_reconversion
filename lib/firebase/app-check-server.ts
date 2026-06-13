import { firebaseConfig } from '@/lib/firebase/config'
import { env } from '@/lib/env'

type AppCheckTokenResponse = {
  token?: string
  ttl?: string
}

let cachedToken: { value: string; expiresAt: number } | null = null

function resolveDebugToken(): string | null {
  const serverToken = process.env.FIREBASE_APPCHECK_DEBUG_TOKEN?.trim()
  if (serverToken && serverToken !== 'true') {
    return serverToken
  }

  const publicToken = env.NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN?.trim()
  if (publicToken && publicToken !== 'true') {
    return publicToken
  }

  return null
}

function isAppCheckConfigured(): boolean {
  return Boolean(env.NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY?.trim())
}

async function exchangeDebugToken(debugToken: string): Promise<string> {
  const projectId = firebaseConfig.projectId
  const appId = firebaseConfig.appId
  const apiKey = firebaseConfig.apiKey
  const url =
    `https://firebaseappcheck.googleapis.com/v1/projects/${projectId}/apps/${appId}:exchangeDebugToken` +
    `?key=${encodeURIComponent(apiKey)}`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ debugToken }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(
      `App Check token exchange failed (${response.status}): ${body}`
    )
  }

  const data = (await response.json()) as AppCheckTokenResponse
  if (!data.token) {
    throw new Error('App Check token exchange returned no token')
  }

  const ttlSeconds = Number(data.ttl ?? '3600')
  cachedToken = {
    value: data.token,
    expiresAt: Date.now() + ttlSeconds * 1000,
  }

  return data.token
}

/**
 * Returns an App Check JWT for Firestore REST when App Check is configured.
 * Requires a registered debug token (not "true") in FIREBASE_APPCHECK_DEBUG_TOKEN.
 */
export async function getAppCheckTokenForRest(): Promise<string | null> {
  if (!isAppCheckConfigured()) {
    return null
  }

  const debugToken = resolveDebugToken()
  if (!debugToken) {
    return null
  }

  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value
  }

  return exchangeDebugToken(debugToken)
}

export function appCheckDevHint(): string {
  return (
    'Register an App Check debug token in Firebase Console and set ' +
    'FIREBASE_APPCHECK_DEBUG_TOKEN to that UUID (not "true") for server-side Firestore REST in dev.'
  )
}
