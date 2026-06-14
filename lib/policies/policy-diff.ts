import type { PolicyExtractionFields } from '@/lib/schemas/extraction'
import type { Policy } from '@/lib/schemas/policy'

export type PolicyFieldDiff = {
  field: 'endDate' | 'startDate' | 'premium' | 'coverages'
  labelKey: string
  current: string
  proposed: string
}

function formatDate(value: Date): string {
  return value.toISOString().slice(0, 10)
}

function formatPremium(value: number, currency: string): string {
  return `${currency} ${value.toLocaleString('es-CO')}`
}

/** Detect meaningful differences between an existing policy and new extraction fields. */
export function computePolicyExtractionDiff(
  policy: Policy,
  fields: PolicyExtractionFields
): PolicyFieldDiff[] {
  const diffs: PolicyFieldDiff[] = []

  if (fields.endDate && !policy.hasNoExpiration) {
    const proposed = formatDate(fields.endDate)
    const current = formatDate(policy.endDate)
    if (proposed !== current) {
      diffs.push({
        field: 'endDate',
        labelKey: 'endDate',
        current,
        proposed,
      })
    }
  }

  if (fields.startDate) {
    const proposed = formatDate(fields.startDate)
    const current = formatDate(policy.startDate)
    if (proposed !== current) {
      diffs.push({
        field: 'startDate',
        labelKey: 'startDate',
        current,
        proposed,
      })
    }
  }

  if (
    fields.premium !== undefined &&
    fields.premium > 0 &&
    fields.premium !== policy.premium
  ) {
    diffs.push({
      field: 'premium',
      labelKey: 'premium',
      current: formatPremium(policy.premium, policy.currency),
      proposed: formatPremium(
        fields.premium,
        fields.currency ?? policy.currency
      ),
    })
  }

  const proposedCoverages =
    fields.coverageEntries && fields.coverageEntries.length > 0
      ? fields.coverageEntries.length
      : fields.coverages?.trim()
        ? 1
        : 0
  const currentCoverages =
    policy.coverageEntries.length > 0
      ? policy.coverageEntries.length
      : policy.coverages?.trim()
        ? 1
        : 0

  if (proposedCoverages > 0 && proposedCoverages !== currentCoverages) {
    diffs.push({
      field: 'coverages',
      labelKey: 'coverages',
      current: String(currentCoverages),
      proposed: String(proposedCoverages),
    })
  }

  return diffs
}

export function hasRenewalDiff(
  policy: Policy,
  fields: PolicyExtractionFields
): boolean {
  return computePolicyExtractionDiff(policy, fields).length > 0
}
