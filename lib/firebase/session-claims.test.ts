import { describe, expect, it } from 'vitest'

import {
  claimsNeedEmailVerification,
  parseSessionTokenClaims,
} from '@/lib/firebase/session-claims'

function encodePayload(payload: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64url')
}

describe('parseSessionTokenClaims', () => {
  it('parses email verification claims from a JWT payload', () => {
    const token = `header.${encodePayload({
      email_verified: false,
      firebase: { sign_in_provider: 'password' },
    })}.signature`

    expect(parseSessionTokenClaims(token)).toEqual({
      email_verified: false,
      firebase: { sign_in_provider: 'password' },
    })
  })

  it('returns null for malformed tokens', () => {
    expect(parseSessionTokenClaims('not-a-jwt')).toBeNull()
  })
})

describe('claimsNeedEmailVerification', () => {
  it('requires verification for unverified password sign-ins', () => {
    expect(
      claimsNeedEmailVerification({
        email_verified: false,
        firebase: { sign_in_provider: 'password' },
      })
    ).toBe(true)
  })

  it('skips OAuth providers and verified password users', () => {
    expect(
      claimsNeedEmailVerification({
        email_verified: true,
        firebase: { sign_in_provider: 'password' },
      })
    ).toBe(false)

    expect(
      claimsNeedEmailVerification({
        email_verified: false,
        firebase: { sign_in_provider: 'google.com' },
      })
    ).toBe(false)
  })
})
