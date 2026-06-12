import { NextResponse } from 'next/server'
import { z } from 'zod'

import { requireSession } from '@/lib/api/require-session'
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
  } catch {
    return NextResponse.json(
      { error: 'Failed to create processing job' },
      { status: 500 }
    )
  }
}
