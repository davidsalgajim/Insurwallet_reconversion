import { NextResponse } from 'next/server'
import { z } from 'zod'

import { requireSession } from '@/lib/api/require-session'
import {
  mergeUserDocument,
  readUserDocument,
} from '@/lib/firebase/user-doc-server'
import {
  NotificationChannelsSchema,
  NotificationPrefsSchema,
  defaultNotificationChannels,
  defaultNotificationPrefs,
} from '@/lib/schemas/user'

export const runtime = 'nodejs'

const prefsSchema = z.object({
  notificationPrefs: NotificationPrefsSchema,
  notificationChannels: NotificationChannelsSchema,
})

export async function GET() {
  const session = await requireSession()

  if (!session?.uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userData = await readUserDocument(session.uid)
  const prefs = NotificationPrefsSchema.safeParse(userData?.notificationPrefs)
  const channels = NotificationChannelsSchema.safeParse(
    userData?.notificationChannels
  )

  return NextResponse.json({
    notificationPrefs: prefs.success ? prefs.data : defaultNotificationPrefs(),
    notificationChannels: channels.success
      ? channels.data
      : defaultNotificationChannels(),
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

  await mergeUserDocument(session.uid, {
    notificationPrefs: parsed.data.notificationPrefs,
    notificationChannels: parsed.data.notificationChannels,
    updatedAt: new Date(),
  })

  return NextResponse.json({
    notificationPrefs: parsed.data.notificationPrefs,
    notificationChannels: parsed.data.notificationChannels,
  })
}
