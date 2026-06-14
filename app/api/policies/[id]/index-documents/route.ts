import { NextResponse } from 'next/server'

import { getApiSession } from '@/lib/firebase/api-auth'
import { adminFirestoreUnavailableResponse } from '@/lib/firebase/admin-required'
import { getAdminFirestore } from '@/lib/firebase/admin'
import { parsePolicyDocument } from '@/lib/firebase/policies'
import { readUserDocument } from '@/lib/firebase/user-doc-server'
import { hasCloudAIConsent, UserConsentsSchema } from '@/lib/schemas/consents'
import { indexPolicyDocumentsForRag } from '@/lib/server/document-chunks'
import { isEmbeddingsConfigured } from '@/lib/server/embeddings'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(_request: Request, context: RouteContext) {
  const session = await getApiSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminUnavailable = adminFirestoreUnavailableResponse()
  if (adminUnavailable) {
    return adminUnavailable
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
    const userData = await readUserDocument(session.uid)
    const consents = UserConsentsSchema.safeParse(userData?.consents)
    const generateEmbeddings =
      hasCloudAIConsent(consents.success ? consents.data : null) &&
      isEmbeddingsConfigured()

    const result = await indexPolicyDocumentsForRag(policyId, {
      generateEmbeddings,
    })
    return NextResponse.json({
      ...result,
      embeddingsGenerated: generateEmbeddings,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Index failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
