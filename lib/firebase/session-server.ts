import type { DecodedIdToken } from 'firebase-admin/auth'

import { getAdminAuth } from '@/lib/firebase/admin'
import { SESSION_MAX_AGE_MS } from '@/lib/firebase/session-config'

export async function createFirebaseSessionCookie(
  idToken: string
): Promise<string> {
  return getAdminAuth().createSessionCookie(idToken, {
    expiresIn: SESSION_MAX_AGE_MS,
  })
}

export async function verifyFirebaseSessionCookie(
  sessionCookie: string
): Promise<DecodedIdToken> {
  const auth = getAdminAuth()

  try {
    return await auth.verifySessionCookie(sessionCookie, true)
  } catch {
    return auth.verifyIdToken(sessionCookie, true)
  }
}
