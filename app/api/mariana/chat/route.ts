import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getApiSession } from '@/lib/firebase/api-auth'
import { readUserDocument } from '@/lib/firebase/user-doc-server'
import { getFeatureFlags } from '@/lib/feature-flags'
import { loadMarianaPolicyContext } from '@/lib/server/mariana-context'
import { getServerEnv } from '@/lib/server/env-server'
import { toErrorMessage } from '@/lib/server/safe-error'
import { isCloudAIDeclined, UserConsentsSchema } from '@/lib/schemas/consents'
import {
  checkRateLimit,
  checkSessionTokenLimit,
  estimateTokens,
  isInsuranceScoped,
  validateMessageLength,
} from '@/mariana/guardrails'
import { encodeSseChunk, streamMarianaResponse } from '@/mariana/stream'

export const runtime = 'nodejs'

const chatRequestSchema = z.object({
  message: z.string().min(1),
  locale: z.enum(['es', 'en', 'pt']).default('es'),
  sessionId: z.string().min(1).optional(),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })
    )
    .default([]),
  rollingSummary: z.string().optional(),
})

function marianaServiceUnavailableMessage(locale: 'es' | 'en' | 'pt'): string {
  return locale === 'es'
    ? 'MarIAna no está disponible temporalmente. Intenta de nuevo en unos segundos.'
    : locale === 'pt'
      ? 'A MarIAna está temporariamente indisponível. Tente novamente em alguns segundos.'
      : 'MarIAna is temporarily unavailable. Please try again shortly.'
}

export async function POST(request: Request) {
  let locale: 'es' | 'en' | 'pt' = 'es'

  try {
    const session = await getApiSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!getFeatureFlags().marianaEnabled) {
      return NextResponse.json(
        { error: 'MarIAna is disabled' },
        { status: 403 }
      )
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = chatRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const parsedBody = parsed.data
    locale = parsedBody.locale
    const { message, history, rollingSummary } = parsedBody

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

    const policyContext = await loadMarianaPolicyContext(session.uid)
    const userData = await readUserDocument(session.uid)
    const consents = UserConsentsSchema.safeParse(userData?.consents)
    const cloudAiDeclined = isCloudAIDeclined(
      consents.success ? consents.data : null
    )
    const { ANTHROPIC_API_KEY } = getServerEnv()
    const apiKey = ANTHROPIC_API_KEY?.trim() || undefined

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamMarianaResponse({
            message,
            locale,
            apiKey,
            cloudAiConsented: !cloudAiDeclined,
            policies: policyContext.allPolicies,
            metadata: policyContext.metadata,
            toolContext: policyContext.toolContext,
            history,
            rollingSummary,
          })) {
            controller.enqueue(encoder.encode(encodeSseChunk(chunk)))
          }
        } catch (error) {
          console.error('[mariana/chat] stream failed:', toErrorMessage(error))
          controller.enqueue(
            encoder.encode(
              encodeSseChunk({
                type: 'error',
                content: marianaServiceUnavailableMessage(locale),
              })
            )
          )
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('[mariana/chat] request failed:', toErrorMessage(error))
    return NextResponse.json(
      { error: marianaServiceUnavailableMessage(locale) },
      { status: 500 }
    )
  }
}
