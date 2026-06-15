import Anthropic from '@anthropic-ai/sdk'

import type { MarianaPolicyContext } from '@/lib/server/mariana-context'
import { toErrorMessage } from '@/lib/server/safe-error'
import { prefetchToolsForAgent } from '@/lib/server/mariana-tools'
import { embedText, isEmbeddingsConfigured } from '@/lib/server/embeddings'
import { getAgentSystemPromptWithSpecialist } from '@/mariana/agents'
import { buildCachedSystemBlocks } from '@/mariana/agents/prompt-cache'
import { classifyWithHaiku } from '@/mariana/haiku-router'
import {
  isInsuranceScopedResponse,
  wrapDocumentData,
} from '@/mariana/guardrails'
import { routeMessage } from '@/mariana/router'
import { formatHistoryForModel, type ChatTurn } from '@/mariana/rolling-summary'
import { MARIANA_SPECIALIST_MODEL } from '@/mariana/models'
import { buildTier0Response } from '@/mariana/tier0-respond'
import type {
  MarianaChatChunk,
  MarianaCitation,
  PolicyMetadata,
  RouteDecision,
} from '@/mariana/types'
import type { ToolContext } from '@/mariana/tools'

type StreamInput = {
  message: string
  locale: 'es' | 'en' | 'pt'
  apiKey?: string
  cloudAiConsented?: boolean
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
  locale: 'es' | 'en' | 'pt',
  policyTypes?: string[]
): string {
  const scoped = policyTypes?.length
    ? policies.filter((policy) =>
        policyTypes.includes(policy.policyType.toLowerCase())
      )
    : policies
  const contact = scoped[0]?.agent ?? policies[0]?.agent
  const insurer = scoped[0]?.insurerName ?? policies[0]?.insurerName
  const templates: Record<'es' | 'en' | 'pt', string> = {
    es: `Entiendo que puede tratarse de una emergencia. MarIAna es de solo lectura y no gestiona siniestros.

Pasos inmediatos:
1. Asegura tu integridad y la de terceros.
2. Llama a emergencias locales si hay lesionados.
3. Contacta a tu aseguradora lo antes posible.

${scoped.length === 0 ? 'No encontré una póliza del tipo relevante en tu cartera. ' : ''}¿En qué ciudad ocurrió? Con eso puedo orientarte mejor.

Contacto registrado (${insurer ?? 'aseguradora'}): ${contact?.name ?? 'tu agente'} — ${contact?.phone ?? 'teléfono en la póliza'} — ${contact?.email ?? ''}`,
    en: `This may be an emergency. MarIAna is read-only and cannot file claims.

Immediate steps:
1. Ensure everyone's safety.
2. Call local emergency services if needed.
3. Contact your insurer as soon as possible.

${scoped.length === 0 ? 'I did not find a matching policy type in your portfolio. ' : ''}Which city did this happen in? That helps me guide you better.

Registered contact (${insurer ?? 'insurer'}): ${contact?.name ?? 'your agent'} — ${contact?.phone ?? 'phone on policy'} — ${contact?.email ?? ''}`,
    pt: `Pode ser uma emergência. A MarIAna é somente leitura e não registra sinistros.

Passos imediatos:
1. Garanta a segurança de todos.
2. Ligue para serviços de emergência se necessário.
3. Contate sua seguradora o quanto antes.

${scoped.length === 0 ? 'Não encontrei uma apólice do tipo relevante na sua carteira. ' : ''}Em qual cidade ocorreu? Isso me ajuda a orientar melhor.

Contato registrado (${insurer ?? 'seguradora'}): ${contact?.name ?? 'seu agente'} — ${contact?.phone ?? 'telefone na apólice'} — ${contact?.email ?? ''}`,
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

function marianaApiFailureMessage(
  error: unknown,
  locale: 'es' | 'en' | 'pt',
  hasApiKey: boolean
): string {
  const detail = toErrorMessage(error)
  const lower = detail.toLowerCase()

  if (
    !hasApiKey ||
    lower.includes('authentication') ||
    lower.includes('api key') ||
    lower.includes('x-api-key')
  ) {
    return locale === 'es'
      ? 'MarIAna no puede conectar con el servicio de IA. Configura ANTHROPIC_API_KEY en el servidor.'
      : locale === 'pt'
        ? 'A MarIAna não consegue conectar ao serviço de IA. Configure ANTHROPIC_API_KEY no servidor.'
        : 'MarIAna cannot reach the AI service. Set ANTHROPIC_API_KEY on the server.'
  }

  if (lower.includes('not_found') || lower.includes('model')) {
    return locale === 'es'
      ? 'El modelo de IA configurado ya no está disponible. Actualiza los IDs de modelo de MarIAna.'
      : locale === 'pt'
        ? 'O modelo de IA configurado não está mais disponível. Atualize os IDs de modelo da MarIAna.'
        : 'The configured AI model is no longer available. Update MarIAna model IDs.'
  }

  return locale === 'es'
    ? 'No pude completar la respuesta con IA en este momento. Intenta de nuevo en unos segundos.'
    : locale === 'pt'
      ? 'Não consegui concluir a resposta com IA agora. Tente novamente em alguns segundos.'
      : 'Could not complete the AI response right now. Please try again shortly.'
}

async function streamSpecialist(
  decision: RouteDecision,
  input: StreamInput
): Promise<AsyncGenerator<MarianaChatChunk>> {
  async function* generator(): AsyncGenerator<MarianaChatChunk> {
    const systemPrompt =
      getAgentSystemPromptWithSpecialist({
        agentId: decision.agent,
        locale: input.locale,
        situationalIntent: decision.entities.situationalIntent,
        policyTypes: decision.entities.policyTypes,
      }) ??
      getAgentSystemPromptWithSpecialist({
        agentId: 'documental',
        locale: input.locale,
      })!

    const queryEmbedding =
      input.cloudAiConsented !== false && isEmbeddingsConfigured()
        ? ((await embedText(input.message)) ?? undefined)
        : undefined

    const toolResults = await prefetchToolsForAgent({
      agent: decision.agent,
      policyHint: decision.entities.policyHint,
      message: input.message,
      context: input.toolContext,
      policies: input.policies,
      metadata: input.metadata,
      decision,
      cloudAiConsented: input.cloudAiConsented,
      queryEmbedding,
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

    let fullText = ''
    try {
      const stream = await client.messages.stream({
        model: MARIANA_SPECIALIST_MODEL,
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
    } catch (error) {
      const fallback = marianaApiFailureMessage(
        error,
        input.locale,
        Boolean(input.apiKey)
      )
      yield { type: 'delta', content: fallback, agent: decision.agent }
      yield {
        type: 'done',
        agent: decision.agent,
        citations,
      }
      return
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
  const cloudBlocked = input.cloudAiConsented === false
  const decision = await resolveRoute(
    input.message,
    input.metadata,
    cloudBlocked ? undefined : input.apiKey
  )

  if (
    cloudBlocked &&
    decision.agent !== 'tier0' &&
    decision.agent !== 'emergency'
  ) {
    const refusal: Record<'es' | 'en' | 'pt', string> = {
      es: 'Has rechazado el procesamiento con IA en la nube. MarIAna solo puede responder con datos locales (Tier 0) y emergencias. Puedes cambiar tu preferencia en Configuración → Legal.',
      en: 'You declined cloud AI processing. MarIAna can only answer with local data (Tier 0) and emergencies. Change your preference in Settings → Legal.',
      pt: 'Você recusou o processamento com IA na nuvem. A MarIAna só pode responder com dados locais (Tier 0) e emergências. Altere sua preferência em Configurações → Legal.',
    }
    yield { type: 'delta', content: refusal[input.locale], agent: 'tier0' }
    yield { type: 'done', agent: 'tier0' }
    return
  }

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
    if (input.apiKey && input.cloudAiConsented !== false) {
      const specialist = await streamSpecialist(decision, input)
      yield* specialist
      return
    }

    const text = emergencyTemplate(
      input.policies,
      input.locale,
      decision.entities.policyTypes
    )
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
      policies.map(
        (policy): MarianaPolicyContext => ({
          ...policy,
          premium: policy.premium ?? 0,
          currency: policy.currency ?? 'COP',
          startDate: policy.startDate ?? policy.endDate,
          holderName: policy.holderName ?? '',
          paymentFrequency: policy.paymentFrequency ?? 'annual',
          coverageCount: policy.coverageCount ?? 0,
          deductibleCount: policy.deductibleCount ?? 0,
          beneficiaryCount: policy.beneficiaryCount ?? 0,
          benefitCount: policy.benefitCount ?? 0,
          agent: {
            name: 'Agent',
            phone: '+570000000000',
            email: 'a@example.com',
          },
          coverageEntries: [],
          deductibleEntries: [],
          beneficiaryEntries: [],
          benefitEntries: [],
        })
      ),
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
