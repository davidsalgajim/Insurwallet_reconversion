import { getAgentSystemPrompt } from '@/mariana/agents'
import { buildTier0Placeholder, routeMessage } from '@/mariana/router'
import type { MarianaChatChunk, PolicyMetadata } from '@/mariana/types'

export function buildStubResponse(
  message: string,
  locale: string,
  policies: PolicyMetadata[] = []
): { chunks: MarianaChatChunk[]; fullText: string } {
  const decision = routeMessage(message, policies)
  const agentPrompt = getAgentSystemPrompt(decision.agent, locale)

  let fullText: string

  if (decision.agent === 'tier0' && decision.tier0Intent) {
    fullText = buildTier0Placeholder(decision.tier0Intent, locale)
  } else if (agentPrompt) {
    fullText = `[${decision.agent}] Placeholder response — real Claude integration pending. Routed with confidence ${decision.confidence}.`
  } else {
    fullText = `[${decision.agent}] Placeholder response — specialist prompt stub pending.`
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

export function encodeSseChunk(chunk: MarianaChatChunk): string {
  return `data: ${JSON.stringify(chunk)}\n\n`
}
