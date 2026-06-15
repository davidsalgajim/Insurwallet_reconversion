import { NextResponse } from 'next/server'

import { processDocumentJob } from '@/lib/server/document-job-runner'
import { WorkerProcessError } from '@/lib/server/worker-client'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ jobId: string }> }

export async function POST(request: Request, context: RouteContext) {
  const secret = process.env.INTERNAL_API_SECRET?.trim()
  const authHeader = request.headers.get('authorization')
  const bearer = authHeader?.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length)
    : null

  if (!secret || bearer !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { ownerUid?: string } | null = null

  try {
    body = (await request.json()) as { ownerUid?: string }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body?.ownerUid) {
    return NextResponse.json({ error: 'ownerUid required' }, { status: 400 })
  }

  const { jobId } = await context.params

  try {
    const result = await processDocumentJob(jobId, body.ownerUid)
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof WorkerProcessError) {
      console.error('[internal/jobs/process] worker failure', {
        jobId,
        code: error.code,
        httpStatus: error.httpStatus,
      })
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.httpStatus }
      )
    }

    const message = error instanceof Error ? error.message : 'Processing failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
