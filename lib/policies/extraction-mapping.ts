import type { CreatePolicyInput } from '@/lib/firebase/policies'
import type { PolicyExtractionFields } from '@/lib/schemas/extraction'
import type { Policy } from '@/lib/schemas/policy'

/** Maps extracted fields onto CreatePolicyInput, falling back to existing policy values. */
export function extractionFieldsToCreateInput(
  fields: PolicyExtractionFields,
  ownerUid: string,
  fallback?: Partial<Policy>
): CreatePolicyInput {
  const base = fallback ?? {}
  const startDate = fields.startDate ?? base.startDate ?? new Date()
  const hasNoExpiration =
    fields.hasNoExpiration ?? base.hasNoExpiration ?? false

  return {
    ownerUid,
    insurerName: fields.insurerName ?? base.insurerName ?? '',
    policyNumber: fields.policyNumber ?? base.policyNumber ?? '',
    policyType: fields.policyType ?? base.policyType ?? 'other',
    holderName: fields.holderName ?? base.holderName ?? base.insurerName ?? '',
    startDate,
    endDate: fields.endDate ?? base.endDate ?? startDate,
    hasNoExpiration,
    premium: fields.premium ?? base.premium ?? 0,
    currency: fields.currency ?? base.currency ?? 'COP',
    paymentFrequency:
      fields.paymentFrequency ?? base.paymentFrequency ?? 'annual',
    coverages: fields.coverages ?? base.coverages,
    beneficiaries: fields.beneficiaries ?? base.beneficiaries,
    exclusions: fields.exclusions ?? base.exclusions,
    waitingPeriods: fields.waitingPeriods ?? base.waitingPeriods,
    notes: fields.notes ?? base.notes,
    agent: fields.agent ?? base.agent,
    coverageEntries: fields.coverageEntries ?? base.coverageEntries ?? [],
    deductibleEntries: fields.deductibleEntries ?? base.deductibleEntries ?? [],
    beneficiaryEntries:
      fields.beneficiaryEntries ?? base.beneficiaryEntries ?? [],
    benefitEntries: fields.benefitEntries ?? base.benefitEntries ?? [],
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
      ? {
          name: input.agent.name ?? policy.agent.name,
          phone: input.agent.phone ?? policy.agent.phone,
          email: input.agent.email ?? policy.agent.email,
        }
      : policy.agent,
    coverageEntries: input.coverageEntries ?? policy.coverageEntries,
    deductibleEntries: input.deductibleEntries ?? policy.deductibleEntries,
    beneficiaryEntries: input.beneficiaryEntries ?? policy.beneficiaryEntries,
    benefitEntries: input.benefitEntries ?? policy.benefitEntries,
  }
}
