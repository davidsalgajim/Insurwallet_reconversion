import { NextResponse } from 'next/server'
import { z } from 'zod'

import { requireSession } from '@/lib/api/require-session'
import { adminFirestoreUnavailableResponse } from '@/lib/firebase/admin-required'
import { hasFirebaseAdminCredentials } from '@/lib/firebase/admin'
import { createDocumentProcessingJobAdmin } from '@/lib/firebase/jobs-server'
import { isValidPolicyDocumentStoragePath } from '@/lib/schemas/document'

export const runtime = 'nodejs'

const createJobRequestSchema = z.object({
  policyId: z.string().min(1),
  docId: z.string().min(1),
  storagePath: z.string().min(1),
})

export async function POST(request: Request) {
  const session = await requireSession()

  if (!session?.uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminUnavailable = adminFirestoreUnavailableResponse()
  if (adminUnavailable) {
    return adminUnavailable
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = createJobRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid job payload' }, { status: 400 })
  }

  const { policyId, docId, storagePath } = parsed.data

  if (
    !isValidPolicyDocumentStoragePath(storagePath, session.uid, policyId, docId)
  ) {
    return NextResponse.json({ error: 'Invalid storage path' }, { status: 403 })
  }

  try {
    const job = await createDocumentProcessingJobAdmin({
      ownerUid: session.uid,
      policyId,
      docId,
      storagePath,
    })

    return NextResponse.json({ jobId: job.id, state: job.state })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[api/jobs] Failed to create job', error)
    }

    const message =
      error instanceof Error ? error.message : 'Failed to create processing job'
    const needsAdmin =
      !hasFirebaseAdminCredentials() &&
      process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS !== 'true'

    return NextResponse.json(
      {
        error: needsAdmin
          ? 'Server cannot create processing jobs. Set FIREBASE_SERVICE_ACCOUNT or enable Firebase emulators.'
          : message,
      },
      { status: 500 }
    )
  }
}
