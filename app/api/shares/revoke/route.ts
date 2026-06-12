import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getApiSession } from '@/lib/firebase/api-auth'
import { revokeShareByHash } from '@/lib/server/share-admin'

export const runtime = 'nodejs'

const revokeBodySchema = z.object({
  tokenHash: z.string().min(1),
})

export async function POST(request: Request) {
  const session = await getApiSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = revokeBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  try {
    await revokeShareByHash({
      ownerUid: session.uid,
      tokenHash: parsed.data.tokenHash,
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Revoke failed'
    const status =
      message === 'Unauthorized'
        ? 403
        : message === 'Share not found'
          ? 404
          : 500
    return NextResponse.json({ error: message }, { status })
  }
}
