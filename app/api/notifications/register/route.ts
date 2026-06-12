import { FieldValue } from 'firebase-admin/firestore'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { requireSession } from '@/lib/api/require-session'
import { getAdminFirestore } from '@/lib/firebase/admin'

export const runtime = 'nodejs'

const registerSchema = z.object({
  token: z.string().min(1),
})

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

  const parsed = registerSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
  }

  const db = getAdminFirestore()
  const userRef = db.collection('users').doc(session.uid)

  await userRef.set(
    {
      fcmTokens: FieldValue.arrayUnion(parsed.data.token),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  )

  return NextResponse.json({ status: 'registered' })
}
