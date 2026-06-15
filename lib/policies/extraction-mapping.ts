import type { CreatePolicyInput } from '@/lib/firebase/policies'
import {
  isPlaceholderAgent,
  normalizeExtractedAgentEmail,
  resolveAgentForStorage,
  sanitizeAgentForDisplay,
} from '@/lib/policies/agent-placeholders'
import { sanitizeStructuredExtractionArraysForPersist } from '@/lib/policies/extraction-structured-sanitize'
import { phoneCollidesWithPolicyNumber } from '@/lib/policies/phone-policy-collision'
import type {
  InsurerContactLine,
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
  const withAgentEmail = liftInsurerContactEmailToAgent(fields)
  const sanitized: PolicyExtractionFields = { ...withAgentEmail }

  if (sanitized.agent || withAgentEmail.agent) {
    sanitized.agent = sanitizeAgentForDisplay(withAgentEmail.agent, {
      forPersist: true,
    })
    if (!sanitized.agent) {
      delete sanitized.agent
    }
  }

  if (sanitized.insurerContacts) {
    const lines = normalizeInsurerContactLines(sanitized.insurerContacts)
    if (lines.length === 0) {
      delete sanitized.insurerContacts
    } else {
      sanitized.insurerContacts = lines
    }
  }

  for (const key of OPTIONAL_TEXT_FIELDS) {
    const value = sanitized[key]
    if (typeof value === 'string') {
      const normalized = normalizeOptionalString(value)
      sanitized[key] = normalized || undefined
    }
  }

  return sanitizeStructuredExtractionArraysForPersist(sanitized)
}

function shortInsurerLabel(insurerName?: string): string | undefined {
  const trimmed = insurerName?.trim()
  if (!trimmed) {
    return undefined
  }
  const firstWord = trimmed.split(/\s+/)[0]
  return firstWord.length >= 2 ? firstWord : trimmed
}

function liftInsurerContactEmailToAgent(
  fields: PolicyExtractionFields
): PolicyExtractionFields {
  const raw = fields.insurerContacts
  if (!raw) {
    return fields
  }

  const items = Array.isArray(raw) ? raw : [raw]
  const existingEmail = normalizeExtractedAgentEmail(fields.agent?.email)
  if (existingEmail) {
    return fields
  }

  for (const item of items) {
    const email = normalizeExtractedAgentEmail(item.email)
    if (email) {
      return {
        ...fields,
        agent: {
          ...(fields.agent ?? {}),
          email: email.toLowerCase(),
        },
      }
    }
  }

  return fields
}

function normalizeInsurerContactLine(
  line: InsurerContactLine,
  policyNumber?: string
): InsurerContactLine | undefined {
  const phone = normalizeOptionalString(line.phone)
  const label = normalizeOptionalString(line.label)

  const safePhone =
    phone && !phoneCollidesWithPolicyNumber(phone, policyNumber)
      ? phone
      : undefined

  if (!safePhone) {
    return undefined
  }

  return {
    phone: safePhone,
    ...(label && !label.includes('@') ? { label } : {}),
  }
}

export function normalizeInsurerContactLines(
  contacts: InsurerContactsExtraction | undefined,
  policyNumber?: string
): InsurerContactLine[] {
  if (!contacts) {
    return []
  }
  const items = Array.isArray(contacts) ? contacts : [contacts]
  const normalized: InsurerContactLine[] = []
  for (const item of items) {
    const line = normalizeInsurerContactLine(item, policyNumber)
    if (line) {
      normalized.push(line)
    }
  }
  return normalized
}

function mergeInsurerContactsIntoAgent(
  agent: Partial<PolicyAgent> | undefined,
  contacts: InsurerContactsExtraction | undefined,
  insurerName?: string,
  policyNumber?: string
): Partial<PolicyAgent> | undefined {
  const lines = normalizeInsurerContactLines(contacts, policyNumber)
  if (lines.length === 0) {
    return agent
  }

  const primary = lines[0]
  const merged: Partial<PolicyAgent> = { ...(agent ?? {}) }

  if (!merged.phone?.trim() && primary?.phone?.trim()) {
    merged.phone = primary.phone.trim()
  }
  if (!merged.name?.trim()) {
    const label = primary?.label?.trim()
    if (label && !label.includes('@')) {
      merged.name = label
    } else {
      const short = shortInsurerLabel(insurerName)
      if (short && (merged.phone || merged.email)) {
        merged.name = `Servicio al cliente - ${short}`
      }
    }
  }

  if (
    merged.phone &&
    phoneCollidesWithPolicyNumber(merged.phone, policyNumber)
  ) {
    delete merged.phone
    const fallback = lines.find(
      (line) =>
        line.phone && !phoneCollidesWithPolicyNumber(line.phone, policyNumber)
    )
    if (fallback?.phone) {
      merged.phone = fallback.phone
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
    fields.insurerName ?? fallback?.insurerName,
    fields.policyNumber ?? fallback?.policyNumber
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

/** Regional assistance / SAC lines for review UI (not merged into agent alone). */
export function resolveInsurerContactsForReview(
  fields: PolicyExtractionFields | undefined,
  fallback?: Partial<Policy>
): InsurerContactLine[] {
  const fromExtraction = fields?.insurerContacts
    ? normalizeInsurerContactLines(
        fields.insurerContacts,
        fields.policyNumber ?? fallback?.policyNumber
      )
    : []
  if (fromExtraction.length > 0) {
    return fromExtraction
  }
  return fallback?.insurerContacts ?? []
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
  const insurerContacts = normalizeInsurerContactLines(
    normalizedFields.insurerContacts,
    normalizedFields.policyNumber ?? base.policyNumber
  )

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
    ...(insurerContacts.length > 0 ? { insurerContacts } : {}),
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
    insurerContacts: input.insurerContacts ?? policy.insurerContacts,
    coverageEntries: input.coverageEntries ?? policy.coverageEntries,
    deductibleEntries: input.deductibleEntries ?? policy.deductibleEntries,
    beneficiaryEntries: input.beneficiaryEntries ?? policy.beneficiaryEntries,
    benefitEntries: input.benefitEntries ?? policy.benefitEntries,
  }
}
