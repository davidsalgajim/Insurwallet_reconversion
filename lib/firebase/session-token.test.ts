import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/firebase/config', () => ({
  firebaseConfig: { projectId: 'insurwallet-staging' },
}))

import {
  assertIdTokenForFirestoreRest,
  decodeJwtPayload,
  getTokenIssuer,
  normalizeSessionToken,
} from '@/lib/firebase/session-token'

function encodePayload(payload: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64url')
}

function buildJwt(payload: Record<string, unknown>): string {
  return `header.${encodePayload(payload)}.signature`
}

describe('session-token', () => {
  it('normalizes URL-encoded tokens', () => {
    const token = 'abc.def%2Eghi'
    expect(normalizeSessionToken(token)).toBe('abc.def.ghi')
  })

  it('accepts Firebase ID tokens for Firestore REST', () => {
    const token = buildJwt({
      iss: 'https://securetoken.google.com/insurwallet-staging',
    })

    expect(assertIdTokenForFirestoreRest(token)).toBe(token)
    expect(getTokenIssuer(token)).toBe(
      'https://securetoken.google.com/insurwallet-staging'
    )
  })

  it('rejects Admin session cookies for Firestore REST', () => {
    const token = buildJwt({
      iss: 'https://session.firebase.google.com/insurwallet-staging',
    })

    expect(() => assertIdTokenForFirestoreRest(token)).toThrow(
      /Firebase ID token/
    )
  })

  it('decodes JWT payloads', () => {
    const token = buildJwt({ sub: 'user-1', exp: 4_000_000_000 })
    expect(decodeJwtPayload(token)).toMatchObject({
      sub: 'user-1',
      exp: 4_000_000_000,
    })
  })
})
