import { cookies } from 'next/headers'

import { SESSION_COOKIE_NAME } from '@/lib/firebase/session-config'
import { verifyFirebaseSessionCookie } from '@/lib/firebase/session-server'

export type ApiSession = {
  uid: string
  email?: string
}

export async function getApiSession(): Promise<ApiSession | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!sessionCookie) {
    return null
  }

  try {
    const decoded = await verifyFirebaseSessionCookie(sessionCookie)
    return {
      uid: decoded.uid,
      email: decoded.email,
    }
  } catch {
    return null
  }
}
