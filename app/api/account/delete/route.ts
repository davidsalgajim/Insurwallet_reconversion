import { NextResponse } from 'next/server'
import { z } from 'zod'

import { requireSession } from '@/lib/api/require-session'

export const runtime = 'nodejs'

const deleteRequestSchema = z.object({
  confirm: z.literal(true),
})

/**
 * GDPR account deletion skeleton (5.10).
 * Mirrors `functions/src/account/delete-user-account.ts` — no data is deleted yet.
 */
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

  const parsed = deleteRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Explicit confirmation required (confirm: true)' },
      { status: 400 }
    )
  }

  return NextResponse.json(
    {
      status: 'stub',
      message:
        'La eliminación de cuenta estará disponible pronto. Ningún dato fue borrado.',
      uid: session.uid,
      requestedAt: new Date().toISOString(),
    },
    { status: 202 }
  )
}
