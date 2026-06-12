import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

import {
  createFirebaseSessionCookie,
  usesDevIdTokenSession,
  verifyFirebaseSessionCookie,
} from '@/lib/firebase/session-server'

const verifyFirebaseToken = vi.fn<
  (token: string) => Promise<{
    uid: string
    email?: string
    email_verified?: boolean
  } | null>
>()

vi.mock('@/lib/firebase/verify-session-edge', () => ({
  verifyFirebaseToken: (token: string) => verifyFirebaseToken(token),
}))

describe('session-server dev idToken fallback', () => {
  const originalEnv = {
    nodeEnv: process.env.NODE_ENV,
    emulators: process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS,
    serviceAccount: process.env.FIREBASE_SERVICE_ACCOUNT,
    credPath: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  }

  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'development')
    delete process.env.FIREBASE_SERVICE_ACCOUNT
    delete process.env.GOOGLE_APPLICATION_CREDENTIALS
    vi.stubEnv('NEXT_PUBLIC_USE_FIREBASE_EMULATORS', 'false')
    verifyFirebaseToken.mockReset()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    if (originalEnv.serviceAccount) {
      process.env.FIREBASE_SERVICE_ACCOUNT = originalEnv.serviceAccount
    } else {
      delete process.env.FIREBASE_SERVICE_ACCOUNT
    }
    if (originalEnv.credPath) {
      process.env.GOOGLE_APPLICATION_CREDENTIALS = originalEnv.credPath
    } else {
      delete process.env.GOOGLE_APPLICATION_CREDENTIALS
    }
    vi.restoreAllMocks()
  })

  it('uses dev idToken session when Admin credentials are missing', () => {
    expect(usesDevIdTokenSession()).toBe(true)
  })

  it('stores a verified idToken as the session cookie in dev', async () => {
    verifyFirebaseToken.mockResolvedValue({
      uid: 'user-123',
      email: 'user@example.com',
      email_verified: true,
    })

    const token = 'valid-id-token'
    await expect(createFirebaseSessionCookie(token)).resolves.toBe(token)
    await expect(verifyFirebaseSessionCookie(token)).resolves.toMatchObject({
      uid: 'user-123',
      email: 'user@example.com',
    })
  })

  it('rejects invalid tokens in dev fallback mode', async () => {
    verifyFirebaseToken.mockResolvedValue(null)

    await expect(createFirebaseSessionCookie('not-a-jwt')).rejects.toThrow(
      'Invalid ID token'
    )
  })
})
