import { z } from 'zod'

import type { PolicyAgent } from '@/lib/schemas/policy'

const EXTRACTED_AGENT_EMAIL_SENTINELS = new Set([
  'none',
  'n/a',
  'na',
  'null',
  'nil',
  'sin email',
  'no email',
  'no aplica',
  'ninguno',
  'ninguna',
  'not available',
  'no disponible',
])

/** Claude/OCR sometimes emit sentinel strings instead of omitting agent email. */
export function normalizeExtractedAgentEmail(
  email: string | undefined | null
): string {
  const trimmed = email?.trim()
  if (!trimmed) {
    return ''
  }

  const lowered = trimmed.toLowerCase()
  if (EXTRACTED_AGENT_EMAIL_SENTINELS.has(lowered)) {
    return ''
  }

  return z.string().email().safeParse(trimmed).success ? trimmed : ''
}

/** Legacy persisted defaults — UI-only; never treat as extracted data. */
export const AGENT_PLACEHOLDER_NAME = 'Por definir'
export const AGENT_PLACEHOLDER_PHONE = '+570000000000'
export const AGENT_PLACEHOLDER_EMAIL = 'pendiente@example.com'

const PLACEHOLDER_VALUES: Record<keyof PolicyAgent, Set<string>> = {
  name: new Set([AGENT_PLACEHOLDER_NAME]),
  phone: new Set([AGENT_PLACEHOLDER_PHONE, '570000000000', '0000000000']),
  email: new Set([AGENT_PLACEHOLDER_EMAIL]),
}

export function isAgentPlaceholderField(
  field: keyof PolicyAgent,
  value: string | undefined | null
): boolean {
  const trimmed = value?.trim()
  if (!trimmed) {
    return false
  }
  return PLACEHOLDER_VALUES[field].has(trimmed)
}

export function isPlaceholderAgent(
  agent: Partial<PolicyAgent> | undefined
): boolean {
  if (!agent) {
    return false
  }
  const name = agent.name?.trim()
  const phone = agent.phone?.trim()
  const email = agent.email?.trim()
  if (!name && !phone && !email) {
    return false
  }
  return (
    (!name || isAgentPlaceholderField('name', name)) &&
    (!phone || isAgentPlaceholderField('phone', phone)) &&
    (!email || isAgentPlaceholderField('email', email))
  )
}

/** Strip legacy placeholder values for form display and extraction merge. */
export function sanitizeAgentForDisplay(
  agent: Partial<PolicyAgent> | undefined
): Partial<PolicyAgent> | undefined {
  if (!agent) {
    return undefined
  }

  const name = isAgentPlaceholderField('name', agent.name)
    ? undefined
    : agent.name?.trim()
  const phone = isAgentPlaceholderField('phone', agent.phone)
    ? undefined
    : agent.phone?.trim()
  const normalizedEmail = normalizeExtractedAgentEmail(agent.email)
  const email = isAgentPlaceholderField('email', normalizedEmail)
    ? undefined
    : normalizedEmail || undefined

  if (!name && !phone && !email) {
    return undefined
  }

  return {
    ...(name ? { name } : {}),
    ...(phone ? { phone } : {}),
    ...(email ? { email } : {}),
  }
}

export function resolveAgentForStorage(
  agent?: Partial<PolicyAgent>
): PolicyAgent {
  const name = isAgentPlaceholderField('name', agent?.name)
    ? ''
    : (agent?.name?.trim() ?? '')
  const phone = isAgentPlaceholderField('phone', agent?.phone)
    ? ''
    : (agent?.phone?.trim() ?? '')
  const normalizedEmail = normalizeExtractedAgentEmail(agent?.email)
  const email = isAgentPlaceholderField('email', normalizedEmail)
    ? ''
    : normalizedEmail

  return { name, phone, email }
}
