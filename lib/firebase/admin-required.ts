import { NextResponse } from 'next/server'

import { usesDevIdTokenSession } from '@/lib/firebase/session-server'

const DEV_ADMIN_MESSAGE =
  'Firebase Admin credentials required for this operation in local dev. ' +
  'Set FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS, or enable NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true.'

export function adminFirestoreUnavailableResponse(): NextResponse | null {
  if (!usesDevIdTokenSession()) {
    return null
  }

  return NextResponse.json({ error: DEV_ADMIN_MESSAGE }, { status: 503 })
}
