import { NextResponse } from 'next/server'

import { getApiSession } from '@/lib/firebase/api-auth'
import { adminFirestoreUnavailableResponse } from '@/lib/firebase/admin-required'
import { getAdminFirestore, getAdminStorage } from '@/lib/firebase/admin'
import { parsePolicyDocument } from '@/lib/firebase/policies'
import { isValidPolicyDocumentStoragePath } from '@/lib/schemas/document'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{ id: string; docId: string }>
}

function resolveStorageBucketName(): string {
  const bucket =
    process.env.FIREBASE_STORAGE_BUCKET?.trim() ??
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim()

  if (!bucket) {
    throw new Error('FIREBASE_STORAGE_BUCKET is not configured')
  }

  return bucket
}

export async function GET(_request: Request, context: RouteContext) {
  const session = await getApiSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminUnavailable = adminFirestoreUnavailableResponse()
  if (adminUnavailable) {
    return adminUnavailable
  }

  const { id: policyId, docId } = await context.params
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

  const docSnap = await db
    .collection('policies')
    .doc(policyId)
    .collection('documents')
    .doc(docId)
    .get()

  if (!docSnap.exists) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  const docData = docSnap.data() as Record<string, unknown>
  const storagePath =
    typeof docData.storagePath === 'string' ? docData.storagePath : ''

  if (
    !storagePath ||
    !isValidPolicyDocumentStoragePath(storagePath, session.uid, policyId, docId)
  ) {
    return NextResponse.json(
      { error: 'Invalid document path' },
      { status: 400 }
    )
  }

  try {
    const bucket = getAdminStorage().bucket(resolveStorageBucketName())
    const file = bucket.file(storagePath)
    const [exists] = await file.exists()

    if (!exists) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const [buffer] = await file.download()
    const mimeType =
      typeof docData.mimeType === 'string'
        ? docData.mimeType
        : 'application/pdf'

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'private, max-age=300',
        'Content-Disposition': 'inline',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Download failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
