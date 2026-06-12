import { FieldValue } from 'firebase-admin/firestore'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { requireSession } from '@/lib/api/require-session'
import { getAdminFirestore } from '@/lib/firebase/admin'
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

  const userSnap = await getAdminFirestore()
    .collection('users')
    .doc(session.uid)
    .get()

  const consents = UserConsentsSchema.safeParse(userSnap.data()?.consents)

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
    updatedAt: FieldValue.serverTimestamp(),
  }

  if (parsed.data.cookies) {
    update['consents.cookies'] = now
  }

  if (parsed.data.cloudAI) {
    update['consents.cloudAI'] = now
  }

  await getAdminFirestore().collection('users').doc(session.uid).set(update, {
    merge: true,
  })

  return NextResponse.json({ status: 'ok' })
}
