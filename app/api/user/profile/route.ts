import { NextResponse } from 'next/server'

import { requireSession } from '@/lib/api/require-session'
import {
  mergeUserDocument,
  readUserDocument,
} from '@/lib/firebase/user-doc-server'
import { ProfileUpdateSchema } from '@/lib/schemas/user'

export const runtime = 'nodejs'

export async function GET() {
  const session = await requireSession()

  if (!session?.uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userData = await readUserDocument(session.uid)
  const parsed = ProfileUpdateSchema.safeParse({
    displayName: userData?.displayName ?? session.name ?? 'User',
    photoURL: userData?.photoURL,
  })

  return NextResponse.json({
    displayName: parsed.success
      ? parsed.data.displayName
      : (session.name ?? 'User'),
    photoURL: parsed.success ? parsed.data.photoURL : undefined,
    email: session.email,
  })
}

export async function PATCH(request: Request) {
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

  const parsed = ProfileUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid profile payload' },
      { status: 400 }
    )
  }

  await mergeUserDocument(session.uid, {
    displayName: parsed.data.displayName,
    ...(parsed.data.photoURL ? { photoURL: parsed.data.photoURL } : {}),
    updatedAt: new Date(),
  })

  return NextResponse.json(parsed.data)
}
