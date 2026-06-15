import type { CreatePolicyInput } from '@/lib/firebase/policies'
import {
  isPlaceholderAgent,
  normalizeExtractedAgentEmail,
  resolveAgentForStorage,
  sanitizeAgentForDisplay,
} from '@/lib/policies/agent-placeholders'
import type {
  InsurerContactsExtraction,
  PolicyExtractionFields,
} from '@/lib/schemas/extraction'
import type { Policy, PolicyAgent } from '@/lib/schemas/policy'
import { normalizeOptionalString } from '@/lib/utils/normalize-optional-string'

const OPTIONAL_TEXT_FIELDS = [
  'coverages',
  'beneficiaries',
  'exclusions',
  'waitingPeriods',
  'notes',
] as const satisfies ReadonlyArray<keyof PolicyExtractionFields>

/** Single choke point before CreatePolicyInput / mergePolicyUpdate. */
export function sanitizeExtractionFieldsForPersist(
  fields: PolicyExtractionFields
): PolicyExtractionFields {
  const sanitized: PolicyExtractionFields = { ...fields }

  if (sanitized.agent || fields.agent) {
    sanitized.agent = sanitizeAgentForDisplay(fields.agent, {
      forPersist: true,
    })
    if (!sanitized.agent) {
      delete sanitized.agent
    }
  }

  if (sanitized.insurerContacts) {
    const phone = normalizeOptionalString(sanitized.insurerContacts.phone)
    const email = normalizeExtractedAgentEmail(sanitized.insurerContacts.email)
    const label = normalizeOptionalString(sanitized.insurerContacts.label)

    if (!phone && !email && !label) {
      delete sanitized.insurerContacts
    } else {
      sanitized.insurerContacts = {
        ...(phone ? { phone } : {}),
        ...(email ? { email } : {}),
        ...(label && !label.includes('@') ? { label } : {}),
      }
    }
  }

  for (const key of OPTIONAL_TEXT_FIELDS) {
    const value = sanitized[key]
    if (typeof value === 'string') {
      const normalized = normalizeOptionalString(value)
      sanitized[key] = normalized || undefined
    }
  }

  return sanitized
}

function shortInsurerLabel(insurerName?: string): string | undefined {
  const trimmed = insurerName?.trim()
  if (!trimmed) {
    return undefined
  }
  const firstWord = trimmed.split(/\s+/)[0]
  return firstWord.length >= 2 ? firstWord : trimmed
}

function mergeInsurerContactsIntoAgent(
  agent: Partial<PolicyAgent> | undefined,
  contacts: InsurerContactsExtraction | undefined,
  insurerName?: string
): Partial<PolicyAgent> | undefined {
  if (!contacts) {
    return agent
  }

  const merged: Partial<PolicyAgent> = { ...(agent ?? {}) }

  if (!merged.phone?.trim() && contacts.phone?.trim()) {
    merged.phone = contacts.phone.trim()
  }
  if (!merged.email?.trim() && contacts.email?.trim()) {
    const normalizedEmail = normalizeExtractedAgentEmail(contacts.email)
    if (normalizedEmail) {
      merged.email = normalizedEmail.toLowerCase()
    }
  }
  if (!merged.name?.trim()) {
    const label = contacts.label?.trim()
    if (label && !label.includes('@')) {
      merged.name = label
    } else {
      const short = shortInsurerLabel(insurerName)
      if (short && (merged.phone || merged.email)) {
        merged.name = `Servicio al cliente - ${short}`
      }
    }
  }

  return sanitizeAgentForDisplay(merged)
}

/** Resolves agent for review/create, merging insurer SAC contacts when agent is sparse. */
export function resolveAgentForReview(
  fields: PolicyExtractionFields | undefined,
  fallback?: Partial<Policy>
): PolicyAgent | undefined {
  if (!fields) {
    const base = sanitizeAgentForDisplay(fallback?.agent)
    if (base && !isPlaceholderAgent(fallback?.agent)) {
      return base as PolicyAgent
    }
    return undefined
  }

  const extracted = mergeInsurerContactsIntoAgent(
    sanitizeAgentForDisplay(fields.agent, { forPersist: true }),
    fields.insurerContacts,
    fields.insurerName ?? fallback?.insurerName
  )
  if (extracted) {
    return extracted as PolicyAgent
  }

  const base = sanitizeAgentForDisplay(fallback?.agent)
  if (base && !isPlaceholderAgent(fallback?.agent)) {
    return base as PolicyAgent
  }

  return undefined
}

function resolveAgentFromExtraction(
  fields: PolicyExtractionFields,
  fallback?: Partial<Policy>
): PolicyAgent | undefined {
  return resolveAgentForReview(fields, fallback)
}

/** Maps extracted fields onto CreatePolicyInput, falling back to existing policy values. */
export function extractionFieldsToCreateInput(
  fields: PolicyExtractionFields,
  ownerUid: string,
  fallback?: Partial<Policy>
): CreatePolicyInput {
  const normalizedFields = sanitizeExtractionFieldsForPersist(fields)
  const base = fallback ?? {}
  const startDate = normalizedFields.startDate ?? base.startDate ?? new Date()
  const hasNoExpiration =
    normalizedFields.hasNoExpiration ?? base.hasNoExpiration ?? false
  const agent = resolveAgentFromExtraction(normalizedFields, base)

  return {
    ownerUid,
    insurerName: normalizedFields.insurerName ?? base.insurerName ?? '',
    policyNumber: normalizedFields.policyNumber ?? base.policyNumber ?? '',
    policyType: normalizedFields.policyType ?? base.policyType ?? 'other',
    holderName:
      normalizedFields.holderName ?? base.holderName ?? base.insurerName ?? '',
    startDate,
    endDate: normalizedFields.endDate ?? base.endDate ?? startDate,
    hasNoExpiration,
    premium: normalizedFields.premium ?? base.premium ?? 0,
    currency: normalizedFields.currency ?? base.currency ?? 'COP',
    paymentFrequency:
      normalizedFields.paymentFrequency ?? base.paymentFrequency ?? 'annual',
    coverages: normalizedFields.coverages ?? base.coverages,
    beneficiaries: normalizedFields.beneficiaries ?? base.beneficiaries,
    exclusions: normalizedFields.exclusions ?? base.exclusions,
    waitingPeriods: normalizedFields.waitingPeriods ?? base.waitingPeriods,
    notes: normalizedFields.notes ?? base.notes,
    ...(agent ? { agent } : {}),
    coverageEntries:
      normalizedFields.coverageEntries ?? base.coverageEntries ?? [],
    deductibleEntries:
      normalizedFields.deductibleEntries ?? base.deductibleEntries ?? [],
    beneficiaryEntries:
      normalizedFields.beneficiaryEntries ?? base.beneficiaryEntries ?? [],
    benefitEntries:
      normalizedFields.benefitEntries ?? base.benefitEntries ?? [],
  }
}

/** Merge extraction onto an existing policy document (for worker auto-merge). */
export function mergeExtractionFieldsIntoPolicy(
  policy: Policy,
  fields: PolicyExtractionFields
): Policy {
  const input = extractionFieldsToCreateInput(fields, policy.ownerUid, policy)
  return {
    ...policy,
    insurerName: input.insurerName,
    policyNumber: input.policyNumber,
    policyType: input.policyType ?? policy.policyType,
    holderName: input.holderName ?? policy.holderName,
    startDate: input.startDate,
    endDate: input.endDate,
    hasNoExpiration: input.hasNoExpiration ?? policy.hasNoExpiration,
    premium: input.premium ?? policy.premium,
    currency: input.currency ?? policy.currency,
    paymentFrequency: input.paymentFrequency ?? policy.paymentFrequency,
    coverages: input.coverages,
    beneficiaries: input.beneficiaries,
    exclusions: input.exclusions,
    waitingPeriods: input.waitingPeriods,
    notes: input.notes,
    agent: input.agent
      ? resolveAgentForStorage({ ...policy.agent, ...input.agent })
      : isPlaceholderAgent(policy.agent)
        ? resolveAgentForStorage()
        : policy.agent,
    coverageEntries: input.coverageEntries ?? policy.coverageEntries,
    deductibleEntries: input.deductibleEntries ?? policy.deductibleEntries,
    beneficiaryEntries: input.beneficiaryEntries ?? policy.beneficiaryEntries,
    benefitEntries: input.benefitEntries ?? policy.benefitEntries,
  }
}
