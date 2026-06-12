import { NextResponse } from 'next/server'

import { getApiSession } from '@/lib/firebase/api-auth'
import {
  CreateShareBodySchema,
  createShareForPolicy,
} from '@/lib/server/share-admin'

export const runtime = 'nodejs'

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

  const parsed = CreateShareBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  try {
    const result = await createShareForPolicy({
      ownerUid: session.uid,
      policyId: parsed.data.policyId,
      recipientEmail: parsed.data.recipientEmail,
      permission: parsed.data.permission,
      expiresInDays: parsed.data.expiresInDays,
      locale: parsed.data.locale,
    })

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Share failed'
    const status = message === 'Unauthorized' ? 403 : 404
    return NextResponse.json({ error: message }, { status })
  }
}

export async function GET(request: Request) {
  const session = await getApiSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const policyId = searchParams.get('policyId')

  if (!policyId) {
    return NextResponse.json({ error: 'policyId required' }, { status: 400 })
  }

  try {
    const { listSharesForPolicy } = await import('@/lib/server/share-admin')
    const shares = await listSharesForPolicy({
      ownerUid: session.uid,
      policyId,
    })
    return NextResponse.json({ shares })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'List failed'
    const status = message === 'Unauthorized' ? 403 : 404
    return NextResponse.json({ error: message }, { status })
  }
}
