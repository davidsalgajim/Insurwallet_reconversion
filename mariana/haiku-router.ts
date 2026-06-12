import Anthropic from '@anthropic-ai/sdk'

import type { PolicyMetadata, RouteDecision } from '@/mariana/types'
import { routeMessage } from '@/mariana/router'

const ROUTER_MODEL = 'claude-3-5-haiku-20241022'

const ROUTER_SYSTEM = `You classify insurance chat messages for MarIAna.
Return ONLY valid JSON with this shape:
{"agent":"documental|coverage|expiry|insurers|emergency","confidence":0.0-1.0,"policyHint":string|null,"topic":string|null}

Rules:
- insurance scope only
- emergency for accidents, theft, claims, emergencies
- documental for clauses, exclusions, fine print
- coverage for benefits, deductibles, what is covered
- expiry for renewals and expiration dates (when not a simple tier0 lookup)
- insurers for broker/agent/insurer questions`

export async function classifyWithHaiku(
  message: string,
  policies: PolicyMetadata[],
  apiKey: string
): Promise<RouteDecision> {
  const fallback = routeMessage(message, policies)
  const client = new Anthropic({ apiKey })

  const policyContext = policies
    .map(
      (policy) =>
        `${policy.id}: ${policy.insurerName} ${policy.policyType} ${policy.policyNumber} expires ${policy.endDate}`
    )
    .join('\n')

  try {
    const response = await client.messages.create({
      model: ROUTER_MODEL,
      max_tokens: 256,
      temperature: 0,
      system: ROUTER_SYSTEM,
      messages: [
        {
          role: 'user',
          content: `Policies:\n${policyContext || 'none'}\n\nMessage:\n${message}`,
        },
      ],
    })

    const textBlock = response.content.find((block) => block.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return fallback
    }

    const parsed = JSON.parse(textBlock.text.trim()) as {
      agent?: RouteDecision['agent']
      confidence?: number
      policyHint?: string | null
      topic?: string | null
    }

    if (!parsed.agent || parsed.agent === 'tier0') {
      return fallback
    }

    return {
      agent: parsed.agent,
      confidence: parsed.confidence ?? fallback.confidence,
      entities: {
        policyHint: parsed.policyHint ?? fallback.entities.policyHint,
        topic: parsed.topic ?? fallback.entities.topic,
      },
    }
  } catch {
    return fallback
  }
}
