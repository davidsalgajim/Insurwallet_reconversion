import type { DecodedIdToken } from 'firebase-admin/auth'

import { getAdminAuth, hasFirebaseAdminCredentials } from '@/lib/firebase/admin'
import { SESSION_MAX_AGE_MS } from '@/lib/firebase/session-config'
import { verifyFirebaseToken } from '@/lib/firebase/verify-session-edge'

export function usesDevIdTokenSession(): boolean {
  return (
    process.env.NODE_ENV === 'development' &&
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS !== 'true' &&
    !hasFirebaseAdminCredentials()
  )
}

export async function createFirebaseSessionCookie(
  idToken: string
): Promise<string> {
  if (usesDevIdTokenSession()) {
    const verified = await verifyFirebaseToken(idToken)
    if (!verified) {
      throw new Error('Invalid ID token')
    }

    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[session] Dev mode: storing verified ID token as session cookie. ' +
          'Add FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS for production-style session cookies.'
      )
    }

    return idToken
  }

  return getAdminAuth().createSessionCookie(idToken, {
    expiresIn: SESSION_MAX_AGE_MS,
  })
}

export async function verifyFirebaseSessionCookie(
  sessionCookie: string
): Promise<DecodedIdToken> {
  if (usesDevIdTokenSession()) {
    const verified = await verifyFirebaseToken(sessionCookie)
    if (!verified) {
      throw new Error('Invalid session token')
    }

    return {
      uid: verified.uid,
      email: verified.email,
      email_verified: verified.email_verified,
      firebase: verified.firebase,
    } as DecodedIdToken
  }

  const auth = getAdminAuth()

  try {
    return await auth.verifySessionCookie(sessionCookie, true)
  } catch {
    return auth.verifyIdToken(sessionCookie, true)
  }
}
