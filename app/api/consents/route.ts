import { NextResponse } from 'next/server'
import { z } from 'zod'

import { requireSession } from '@/lib/api/require-session'
import {
  mergeUserDocument,
  readUserDocument,
} from '@/lib/firebase/user-doc-server'
import { UserConsentsSchema } from '@/lib/schemas/consents'

export const runtime = 'nodejs'

const consentSchema = z.object({
  cookies: z.boolean().optional(),
  cloudAI: z.boolean().optional(),
})

export async function GET() {
  const session = await requireSession()

  if (!session?.uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userData = await readUserDocument(session.uid)
  const consents = UserConsentsSchema.safeParse(userData?.consents)

  return NextResponse.json({
    consents: consents.success ? consents.data : {},
  })
}

export async function POST(request: Request) {
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

  const parsed = consentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid consent payload' },
      { status: 400 }
    )
  }

  const now = new Date()
  const update: Record<string, unknown> = {
    updatedAt: now,
  }

  if (parsed.data.cookies) {
    update.consents = { cookies: now }
  }

  if (parsed.data.cloudAI) {
    update.consents = {
      ...(typeof update.consents === 'object' && update.consents !== null
        ? (update.consents as Record<string, unknown>)
        : {}),
      cloudAI: now,
    }
  }

  await mergeUserDocument(session.uid, update)

  return NextResponse.json({ status: 'ok' })
}
