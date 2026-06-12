import { NextResponse } from 'next/server'

import { requireSession } from '@/lib/api/require-session'
import { processDocumentJob } from '@/lib/server/document-job-runner'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ jobId: string }> }

export async function POST(_request: Request, context: RouteContext) {
  const session = await requireSession()

  if (!session?.uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { jobId } = await context.params

  try {
    const result = await processDocumentJob(jobId, session.uid)
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
