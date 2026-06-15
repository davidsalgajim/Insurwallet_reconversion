import { NextResponse } from 'next/server'

import { requireSession } from '@/lib/api/require-session'
import { adminFirestoreUnavailableResponse } from '@/lib/firebase/admin-required'
import { processDocumentJob } from '@/lib/server/document-job-runner'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ jobId: string }> }

export async function POST(request: Request, context: RouteContext) {
  const session = await requireSession()

  if (!session?.uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminUnavailable = adminFirestoreUnavailableResponse()
  if (adminUnavailable) {
    return adminUnavailable
  }

  const { jobId } = await context.params

  const force = new URL(request.url).searchParams.get('force') === 'true'

  try {
    const result = await processDocumentJob(jobId, session.uid, { force })
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Processing failed'

    if (message === 'Job not found') {
      return NextResponse.json({ error: message }, { status: 404 })
    }

    if (message === 'Forbidden') {
      return NextResponse.json({ error: message }, { status: 403 })
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
