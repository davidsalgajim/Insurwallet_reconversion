import { cookies } from 'next/headers'
import type { DecodedIdToken } from 'firebase-admin/auth'

import { SESSION_COOKIE_NAME } from '@/lib/firebase/session-config'
import { verifyFirebaseSessionCookie } from '@/lib/firebase/session-server'

export async function requireSession(): Promise<DecodedIdToken | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!token) {
    return null
  }

  try {
    return await verifyFirebaseSessionCookie(token)
  } catch {
    return null
  }
}
