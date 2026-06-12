import { NextResponse } from 'next/server'
import { z } from 'zod'

import { requireSession } from '@/lib/api/require-session'
import { getAdminFirestore } from '@/lib/firebase/admin'
import { NotificationPrefsSchema } from '@/lib/schemas/user'

export const runtime = 'nodejs'

const prefsSchema = z.object({
  notificationPrefs: NotificationPrefsSchema,
})

export async function GET() {
  const session = await requireSession()

  if (!session?.uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userSnap = await getAdminFirestore()
    .collection('users')
    .doc(session.uid)
    .get()

  const prefs = NotificationPrefsSchema.safeParse(
    userSnap.data()?.notificationPrefs
  )

  return NextResponse.json({
    notificationPrefs: prefs.success
      ? prefs.data
      : {
          expiry30: true,
          expiry60: true,
          expiry90: false,
          renewals: true,
          events: false,
        },
  })
}

export async function PUT(request: Request) {
  const session = await requireSession()

  if (!session?.uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = prefsSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid preferences' }, { status: 400 })
  }

  await getAdminFirestore().collection('users').doc(session.uid).set(
    {
      notificationPrefs: parsed.data.notificationPrefs,
      updatedAt: new Date(),
    },
    { merge: true }
  )

  return NextResponse.json({ notificationPrefs: parsed.data.notificationPrefs })
}
