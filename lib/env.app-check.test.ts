import { afterEach, describe, expect, it, vi } from 'vitest'

import { validateAppCheckEnv } from '@/lib/env-app-check'

describe('validateAppCheckEnv', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('requires reCAPTCHA site key when VERCEL_ENV=production', () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    vi.stubEnv('NODE_ENV', 'production')

    expect(() =>
      validateAppCheckEnv({
        NEXT_PUBLIC_USE_FIREBASE_EMULATORS: false,
      })
    ).toThrow(/NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY/)
  })

  it('allows debug token in development', () => {
    vi.stubEnv('NODE_ENV', 'development')

    expect(() =>
      validateAppCheckEnv({
        NEXT_PUBLIC_USE_FIREBASE_EMULATORS: false,
        NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN: 'debug-token',
      })
    ).not.toThrow()
  })

  it('allows debug token with emulators outside development', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('VERCEL_ENV', 'preview')

    expect(() =>
      validateAppCheckEnv({
        NEXT_PUBLIC_USE_FIREBASE_EMULATORS: true,
        NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN: 'debug-token',
      })
    ).not.toThrow()
  })

  it('forbids debug token outside development without emulators', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('VERCEL_ENV', 'preview')

    expect(() =>
      validateAppCheckEnv({
        NEXT_PUBLIC_USE_FIREBASE_EMULATORS: false,
        NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN: 'debug-token',
      })
    ).toThrow(/NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN/)
  })

  it('allows debug token during local production build (no Vercel)', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.unstubAllEnvs()
    vi.stubEnv('NODE_ENV', 'production')

    expect(() =>
      validateAppCheckEnv({
        NEXT_PUBLIC_USE_FIREBASE_EMULATORS: false,
        NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN: 'debug-token',
      })
    ).not.toThrow()
  })
})
