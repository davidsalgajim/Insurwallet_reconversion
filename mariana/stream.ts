import Anthropic from '@anthropic-ai/sdk'

import type { MarianaPolicyContext } from '@/lib/server/mariana-context'
import { prefetchToolsForAgent } from '@/lib/server/mariana-tools'
import { getAgentSystemPrompt } from '@/mariana/agents'
import { buildCachedSystemBlocks } from '@/mariana/agents/prompt-cache'
import { classifyWithHaiku } from '@/mariana/haiku-router'
import {
  isInsuranceScopedResponse,
  wrapDocumentData,
} from '@/mariana/guardrails'
import { routeMessage } from '@/mariana/router'
import { formatHistoryForModel, type ChatTurn } from '@/mariana/rolling-summary'
import { buildTier0Response } from '@/mariana/tier0-respond'
import type {
  MarianaChatChunk,
  MarianaCitation,
  PolicyMetadata,
  RouteDecision,
} from '@/mariana/types'
import type { ToolContext } from '@/mariana/tools'

const SPECIALIST_MODEL = 'claude-3-5-sonnet-20241022'

type StreamInput = {
  message: string
  locale: 'es' | 'en' | 'pt'
  apiKey?: string
  policies: MarianaPolicyContext[]
  metadata: PolicyMetadata[]
  toolContext: ToolContext
  history?: ChatTurn[]
  rollingSummary?: string | null
}

function extractCitationsFromTools(
  toolResults: Array<{ name: string; data: unknown }>,
  policyHint?: string
): MarianaCitation[] {
  const citations: MarianaCitation[] = []

  for (const result of toolResults) {
    if (result.name !== 'search_document_chunks') {
      continue
    }

    const data = result.data as {
      policyId?: string | null
      chunks?: Array<{
        docId: string
        page: number
        fileName?: string
        text: string
      }>
    }

    const policyId = data.policyId ?? policyHint
    if (!policyId || !data.chunks) {
      continue
    }

    for (const chunk of data.chunks.slice(0, 3)) {
      citations.push({
        policyId,
        documentId: chunk.docId,
        page: chunk.page,
        label: chunk.fileName ?? `p.${chunk.page}`,
      })
    }
  }

  return citations
}

function buildToolContextBlock(
  toolResults: Array<{ name: string; data: unknown }>
): string {
  return toolResults
    .map(
      (result) =>
        `Tool ${result.name}:\n${wrapDocumentData(JSON.stringify(result.data, null, 2))}`
    )
    .join('\n\n')
}

function emergencyTemplate(
  policies: MarianaPolicyContext[],
  locale: 'es' | 'en' | 'pt'
): string {
  const contact = policies[0]?.agent
  const templates: Record<'es' | 'en' | 'pt', string> = {
    es: `Entiendo que puede tratarse de una emergencia. MarIAna es de solo lectura y no gestiona siniestros.

Pasos inmediatos:
1. Asegura tu integridad y la de terceros.
2. Llama a emergencias locales si hay lesionados.
3. Contacta a tu aseguradora lo antes posible.

Contacto registrado: ${contact?.name ?? 'tu agente'} — ${contact?.phone ?? 'teléfono en la póliza'} — ${contact?.email ?? ''}`,
    en: `This may be an emergency. MarIAna is read-only and cannot file claims.

Immediate steps:
1. Ensure everyone's safety.
2. Call local emergency services if needed.
3. Contact your insurer as soon as possible.

Registered contact: ${contact?.name ?? 'your agent'} — ${contact?.phone ?? 'phone on policy'} — ${contact?.email ?? ''}`,
    pt: `Pode ser uma emergência. A MarIAna é somente leitura e não registra sinistros.

Passos imediatos:
1. Garanta a segurança de todos.
2. Ligue para serviços de emergência se necessário.
3. Contate sua seguradora o quanto antes.

Contato registrado: ${contact?.name ?? 'seu agente'} — ${contact?.phone ?? 'telefone na apólice'} — ${contact?.email ?? ''}`,
  }
  return templates[locale]
}

async function resolveRoute(
  message: string,
  metadata: PolicyMetadata[],
  apiKey?: string
): Promise<RouteDecision> {
  const initial = routeMessage(message, metadata)
  if (initial.agent === 'tier0' || initial.agent === 'emergency') {
    return initial
  }

  if (!apiKey) {
    return initial
  }

  return classifyWithHaiku(message, metadata, apiKey)
}

async function streamSpecialist(
  decision: RouteDecision,
  input: StreamInput
): Promise<AsyncGenerator<MarianaChatChunk>> {
  async function* generator(): AsyncGenerator<MarianaChatChunk> {
    const systemPrompt =
      getAgentSystemPrompt(decision.agent, input.locale) ??
      getAgentSystemPrompt('documental', input.locale)!

    const toolResults = await prefetchToolsForAgent({
      agent: decision.agent,
      policyHint: decision.entities.policyHint,
      message: input.message,
      context: input.toolContext,
      policies: input.policies,
      metadata: input.metadata,
    })

    const citations = extractCitationsFromTools(
      toolResults,
      decision.entities.policyHint
    )

    for (const citation of citations) {
      yield { type: 'citation', citation, agent: decision.agent }
    }

    if (!input.apiKey) {
      const fallback = `[${decision.agent}] ${input.locale === 'es' ? 'Configura ANTHROPIC_API_KEY para respuestas con IA.' : 'Set ANTHROPIC_API_KEY for AI responses.'}\n\n${buildToolContextBlock(toolResults).slice(0, 800)}`
      yield { type: 'delta', content: fallback, agent: decision.agent }
      yield {
        type: 'done',
        agent: decision.agent,
        citations,
      }
      return
    }

    const client = new Anthropic({ apiKey: input.apiKey })
    const responseSuffix =
      'When citing documents, mention document name and page. End responses with a brief reminder to verify against the original policy.'
    const historyBlock = formatHistoryForModel({
      rollingSummary: input.rollingSummary ?? null,
      recentTurns: input.history ?? [],
      locale: input.locale,
    })

    const stream = await client.messages.stream({
      model: SPECIALIST_MODEL,
      max_tokens: 1_024,
      temperature: 0.2,
      system: buildCachedSystemBlocks(systemPrompt, responseSuffix),
      messages: [
        ...(historyBlock
          ? [{ role: 'user' as const, content: historyBlock }]
          : []),
        {
          role: 'user',
          content: `${buildToolContextBlock(toolResults)}\n\nUser question (${input.locale}):\n${input.message}`,
        },
      ],
    })

    let fullText = ''
    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        fullText += event.delta.text
        yield {
          type: 'delta',
          content: event.delta.text,
          agent: decision.agent,
        }
      }
    }

    if (!isInsuranceScopedResponse(fullText)) {
      const refusal =
        input.locale === 'es'
          ? 'Solo puedo ayudarte con temas de seguros y tus pólizas registradas.'
          : input.locale === 'pt'
            ? 'Só posso ajudar com temas de seguros e suas apólices registradas.'
            : 'I can only help with insurance topics and your registered policies.'
      yield { type: 'delta', content: `\n\n${refusal}`, agent: decision.agent }
    }

    yield {
      type: 'done',
      agent: decision.agent,
      citations,
    }
  }

  return generator()
}

export async function* streamMarianaResponse(
  input: StreamInput
): AsyncGenerator<MarianaChatChunk> {
  const decision = await resolveRoute(
    input.message,
    input.metadata,
    input.apiKey
  )

  if (decision.agent === 'tier0' && decision.tier0Intent) {
    const text = buildTier0Response(
      decision.tier0Intent,
      input.policies,
      input.locale
    )
    yield {
      type: 'delta',
      content: text,
      agent: 'tier0',
      tier0Intent: decision.tier0Intent,
    }
    yield {
      type: 'done',
      agent: 'tier0',
      tier0Intent: decision.tier0Intent,
    }
    return
  }

  if (decision.agent === 'emergency') {
    const text = emergencyTemplate(input.policies, input.locale)
    yield { type: 'delta', content: text, agent: 'emergency' }
    yield { type: 'done', agent: 'emergency' }
    return
  }

  const specialist = await streamSpecialist(decision, input)
  yield* specialist
}

export function encodeSseChunk(chunk: MarianaChatChunk): string {
  return `data: ${JSON.stringify(chunk)}\n\n`
}

/** @deprecated Use streamMarianaResponse — kept for unit tests */
export function buildStubResponse(
  message: string,
  locale: string,
  policies: PolicyMetadata[] = []
): { chunks: MarianaChatChunk[]; fullText: string } {
  const decision = routeMessage(message, policies)
  let fullText: string

  if (decision.agent === 'tier0' && decision.tier0Intent) {
    fullText = buildTier0Response(
      decision.tier0Intent,
      policies.map((policy) => ({
        ...policy,
        premium: 0,
        currency: 'COP',
        startDate: policy.endDate,
        agent: {
          name: 'Agent',
          phone: '+570000000000',
          email: 'a@example.com',
        },
        coverageEntries: [],
        deductibleEntries: [],
        beneficiaryEntries: [],
      })),
      locale as 'es' | 'en' | 'pt'
    )
  } else {
    fullText = `[${decision.agent}] Placeholder — use streamMarianaResponse in production.`
  }

  return {
    fullText,
    chunks: [
      {
        type: 'delta',
        content: fullText,
        agent: decision.agent,
        tier0Intent: decision.tier0Intent,
      },
      {
        type: 'done',
        agent: decision.agent,
        tier0Intent: decision.tier0Intent,
      },
    ],
  }
}
