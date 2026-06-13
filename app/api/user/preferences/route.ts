import { NextResponse } from 'next/server'
import { z } from 'zod'

import { requireSession } from '@/lib/api/require-session'
import {
  mergeUserDocument,
  readUserDocument,
} from '@/lib/firebase/user-doc-server'
import {
  UserPreferencesSchema,
  defaultUserPreferences,
} from '@/lib/schemas/user'

export const runtime = 'nodejs'

const preferencesBodySchema = z.object({
  preferences: UserPreferencesSchema,
})

export async function GET() {
  const session = await requireSession()

  if (!session?.uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userData = await readUserDocument(session.uid)
  const parsed = UserPreferencesSchema.safeParse(userData?.preferences)

  return NextResponse.json({
    preferences: parsed.success ? parsed.data : defaultUserPreferences(),
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

  const parsed = preferencesBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid preferences payload' },
      { status: 400 }
    )
  }

  await mergeUserDocument(session.uid, {
    preferences: parsed.data.preferences,
    updatedAt: new Date(),
  })

  return NextResponse.json({ preferences: parsed.data.preferences })
}
