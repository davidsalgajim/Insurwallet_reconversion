import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

import { verifySessionCookieEdge } from '@/lib/firebase/verify-session-edge'

function encodePayload(payload: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64url')
}

function buildToken(payload: Record<string, unknown>): string {
  const exp = Math.floor(Date.now() / 1000) + 3600
  return `header.${encodePayload({ exp, sub: 'test-user', ...payload })}.signature`
}

describe('verifySessionCookieEdge', () => {
  const originalEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS

  beforeEach(() => {
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS = 'true'
  })

  afterEach(() => {
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS = originalEmulators
    vi.restoreAllMocks()
  })

  it('accepts valid emulator session JWTs with claims', async () => {
    const token = buildToken({
      email_verified: false,
      firebase: { sign_in_provider: 'password' },
    })

    await expect(verifySessionCookieEdge(token)).resolves.toEqual({
      email_verified: false,
      firebase: { sign_in_provider: 'password' },
    })
  })

  it('rejects expired emulator session JWTs', async () => {
    const token = `header.${encodePayload({
      exp: Math.floor(Date.now() / 1000) - 60,
      email_verified: true,
    })}.signature`

    await expect(verifySessionCookieEdge(token)).resolves.toBeNull()
  })

  it('rejects malformed tokens', async () => {
    await expect(verifySessionCookieEdge('not-a-jwt')).resolves.toBeNull()
  })
})
