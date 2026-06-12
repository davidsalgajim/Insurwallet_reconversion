import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getApiSession } from '@/lib/firebase/api-auth'
import {
  checkRateLimit,
  checkSessionTokenLimit,
  estimateTokens,
  isInsuranceScoped,
  validateMessageLength,
} from '@/mariana/guardrails'
import { buildStubResponse, encodeSseChunk } from '@/mariana/respond'

export const runtime = 'nodejs'

const chatRequestSchema = z.object({
  message: z.string().min(1),
  locale: z.enum(['es', 'en', 'pt']).default('es'),
  sessionId: z.string().min(1).optional(),
})

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

  const parsed = chatRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { message, locale } = parsed.data

  if (!validateMessageLength(message)) {
    return NextResponse.json({ error: 'Message too long' }, { status: 400 })
  }

  if (!isInsuranceScoped(message)) {
    return NextResponse.json(
      { error: 'Out of scope — MarIAna only answers insurance questions' },
      { status: 422 }
    )
  }

  const rateLimit = checkRateLimit(session.uid)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfterMs: rateLimit.retryAfterMs },
      { status: 429 }
    )
  }

  if (!checkSessionTokenLimit(estimateTokens(message))) {
    return NextResponse.json(
      { error: 'Session token limit exceeded' },
      { status: 413 }
    )
  }

  const { chunks } = buildStubResponse(message, locale)

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(encodeSseChunk(chunk)))
      }
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
