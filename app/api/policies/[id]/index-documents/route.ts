import { NextResponse } from 'next/server'

import { getApiSession } from '@/lib/firebase/api-auth'
import { getAdminFirestore } from '@/lib/firebase/admin'
import { parsePolicyDocument } from '@/lib/firebase/policies'
import { indexPolicyDocumentsForRag } from '@/lib/server/document-chunks'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(_request: Request, context: RouteContext) {
  const session = await getApiSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: policyId } = await context.params
  const db = getAdminFirestore()
  const policySnap = await db.collection('policies').doc(policyId).get()

  if (!policySnap.exists) {
    return NextResponse.json({ error: 'Policy not found' }, { status: 404 })
  }

  const policy = parsePolicyDocument(
    policySnap.id,
    policySnap.data() as Record<string, unknown>
  )

  if (policy.ownerUid !== session.uid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const result = await indexPolicyDocumentsForRag(policyId)
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Index failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
