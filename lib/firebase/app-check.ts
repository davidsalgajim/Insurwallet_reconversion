'use client'

import type { FirebaseApp } from 'firebase/app'
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
  type AppCheck,
} from 'firebase/app-check'

import { env } from '@/lib/env'
import { useFirebaseEmulators } from '@/lib/firebase/config'

const APP_CHECK_INIT_KEY = '__insurwalletAppCheckInitialized__'

type AppCheckWindow = Window & {
  [APP_CHECK_INIT_KEY]?: boolean
  FIREBASE_APPCHECK_DEBUG_TOKEN?: string | boolean
}

/**
 * Firebase Console — App Check (reCAPTCHA v3):
 * 1. Build → App Check → Register the web app → Provider: reCAPTCHA v3.
 * 2. Add allowed domains (localhost, staging, production) in the reCAPTCHA admin console.
 * 3. Firestore + Storage → App Check tabs → enable in **Monitor** mode first; switch to
 *    Enforce after traffic metrics look healthy.
 * 4. Local dev against a real Firebase project (not emulators): App Check → Manage debug tokens,
 *    then set NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN=true (auto token) or paste the token.
 *
 * Server-side secrets (Claude, payments, Resend) belong in Google Secret Manager in prod/staging.
 * The reCAPTCHA site key is public by design and lives in NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY.
 */
export function initAppCheck(app: FirebaseApp): AppCheck | null {
  if (typeof window === 'undefined' || useFirebaseEmulators) {
    return null
  }

  const win = window as AppCheckWindow

  if (win[APP_CHECK_INIT_KEY]) {
    return null
  }

  const siteKey = env.NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY?.trim()
  const debugToken = env.NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN?.trim()

  if (process.env.NODE_ENV === 'development' && debugToken) {
    win.FIREBASE_APPCHECK_DEBUG_TOKEN =
      debugToken === 'true' ? true : debugToken
  }

  if (!siteKey) {
    console.warn(
      '[app-check] Skipped — set NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY or enable emulators.'
    )
    return null
  }

  const appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(siteKey),
    isTokenAutoRefreshEnabled: true,
  })

  win[APP_CHECK_INIT_KEY] = true
  return appCheck
}
