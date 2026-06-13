import { firebaseConfig } from '@/lib/firebase/config'

export function normalizeSessionToken(token: string): string {
  return decodeURIComponent(token.trim())
}

export function decodeJwtPayload(
  token: string
): Record<string, unknown> | null {
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
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return null
  }
}

export function getTokenIssuer(token: string): string | undefined {
  const payload = decodeJwtPayload(normalizeSessionToken(token))
  return typeof payload?.iss === 'string' ? payload.iss : undefined
}

/** Firestore REST accepts Firebase ID tokens, not Admin session cookies. */
export function assertIdTokenForFirestoreRest(token: string): string {
  const normalized = normalizeSessionToken(token)
  const issuer = getTokenIssuer(normalized)
  const projectId = firebaseConfig.projectId
  const idTokenIssuer = `https://securetoken.google.com/${projectId}`

  if (issuer === idTokenIssuer) {
    return normalized
  }

  const sessionIssuer = `https://session.firebase.google.com/${projectId}`
  if (issuer === sessionIssuer) {
    throw new Error(
      'Firestore REST requires a Firebase ID token. Sign out and sign in again without Admin credentials in dev.'
    )
  }

  return normalized
}
