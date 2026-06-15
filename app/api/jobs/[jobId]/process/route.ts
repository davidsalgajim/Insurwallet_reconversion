import { NextResponse } from 'next/server'

import { requireSession } from '@/lib/api/require-session'
import { adminFirestoreUnavailableResponse } from '@/lib/firebase/admin-required'
import { processDocumentJob } from '@/lib/server/document-job-runner'
import { WorkerProcessError } from '@/lib/server/worker-client'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ jobId: string }> }

function jobProcessErrorResponse(jobId: string, error: unknown): NextResponse {
  if (error instanceof WorkerProcessError) {
    console.error('[jobs/process] worker failure', {
      jobId,
      code: error.code,
      httpStatus: error.httpStatus,
      ...(process.env.NODE_ENV === 'development' && error.devHint
        ? { devHint: error.devHint }
        : {}),
    })

    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        ...(process.env.NODE_ENV === 'development' && error.devHint
          ? { devHint: error.devHint }
          : {}),
      },
      { status: error.httpStatus }
    )
  }

  const message = error instanceof Error ? error.message : 'Processing failed'

  if (message === 'Job not found') {
    return NextResponse.json(
      { error: message, code: 'JOB_NOT_FOUND' },
      { status: 404 }
    )
  }

  if (message === 'Forbidden') {
    return NextResponse.json(
      { error: message, code: 'FORBIDDEN' },
      { status: 403 }
    )
  }

  console.error('[jobs/process] unexpected failure', { jobId, message })

  return NextResponse.json(
    { error: message, code: 'PROCESSING_FAILED' },
    { status: 500 }
  )
}

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
    return jobProcessErrorResponse(jobId, error)
  }
}
