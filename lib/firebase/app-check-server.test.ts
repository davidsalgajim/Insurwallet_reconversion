import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/firebase/config', () => ({
  firebaseConfig: {
    projectId: 'insurwallet-staging',
    appId: '1:000:web:abc',
    apiKey: 'test-api-key',
  },
}))

vi.mock('@/lib/env', () => ({
  env: {
    NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY: 'site-key',
    NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN: undefined,
  },
}))

import { getAppCheckTokenForRest } from '@/lib/firebase/app-check-server'

describe('app-check-server', () => {
  const originalDebugToken = process.env.FIREBASE_APPCHECK_DEBUG_TOKEN

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    delete process.env.FIREBASE_APPCHECK_DEBUG_TOKEN
  })

  afterEach(() => {
    process.env.FIREBASE_APPCHECK_DEBUG_TOKEN = originalDebugToken
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('returns null when no debug token is configured', async () => {
    await expect(getAppCheckTokenForRest()).resolves.toBeNull()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('exchanges a registered debug token for an App Check JWT', async () => {
    process.env.FIREBASE_APPCHECK_DEBUG_TOKEN = 'debug-uuid'

    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ token: 'app-check-jwt', ttl: '3600' }), {
        status: 200,
      })
    )

    await expect(getAppCheckTokenForRest()).resolves.toBe('app-check-jwt')
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('exchangeDebugToken'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ debugToken: 'debug-uuid' }),
      })
    )
  })
})
