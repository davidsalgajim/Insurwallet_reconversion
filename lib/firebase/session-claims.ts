import type { User } from 'firebase/auth'

export type SessionTokenClaims = {
  email_verified?: boolean
  firebase?: {
    sign_in_provider?: string
  }
}

export function parseSessionTokenClaims(
  token: string
): SessionTokenClaims | null {
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
    const json =
      typeof atob === 'function'
        ? atob(padded)
        : Buffer.from(padded, 'base64').toString('utf8')

    return JSON.parse(json) as SessionTokenClaims
  } catch {
    return null
  }
}

export function isPasswordSignInProvider(
  provider: string | undefined
): boolean {
  return provider === 'password'
}

export function claimsNeedEmailVerification(
  claims: SessionTokenClaims | null
): boolean {
  if (!claims) {
    return false
  }

  if (!isPasswordSignInProvider(claims.firebase?.sign_in_provider)) {
    return false
  }

  return claims.email_verified !== true
}

export function userNeedsEmailVerification(user: User): boolean {
  const hasPasswordProvider = user.providerData.some(
    (provider) => provider.providerId === 'password'
  )

  if (!hasPasswordProvider) {
    return false
  }

  return !user.emailVerified
}
