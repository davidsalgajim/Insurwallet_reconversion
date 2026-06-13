import type { MarianaPolicyContext } from '@/lib/server/mariana-context'
import {
  ASSISTANCE_KEYWORDS,
  SITUATIONAL_POLICY_TYPES,
} from '@/mariana/situational'
import type { SituationalIntent } from '@/mariana/types'

export { ASSISTANCE_KEYWORDS, SITUATIONAL_POLICY_TYPES }

export type { SituationalIntent }

function normalizeText(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')
}

function tokenizeQuery(query: string): string[] {
  return normalizeText(query)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => token.length >= 3)
}

function textMatchesQuery(text: string, tokens: string[]): boolean {
  const normalized = normalizeText(text)
  return tokens.some((token) => normalized.includes(token))
}

export function filterPoliciesByType(
  policies: MarianaPolicyContext[],
  policyTypes?: readonly string[]
): MarianaPolicyContext[] {
  if (!policyTypes || policyTypes.length === 0) {
    return policies
  }

  const allowed = new Set(policyTypes.map((type) => type.toLowerCase()))
  return policies.filter((policy) =>
    allowed.has(policy.policyType.toLowerCase())
  )
}

export function searchCoverageForEvent(
  policies: MarianaPolicyContext[],
  query: string,
  policyTypes?: readonly string[]
) {
  const scoped = filterPoliciesByType(policies, policyTypes)
  const tokens = tokenizeQuery(query)

  return scoped.map((policy) => {
    const matchedEntries = policy.coverageEntries.filter((entry) =>
      textMatchesQuery(`${entry.name} ${entry.amount}`, tokens)
    )

    const matchedDeductibles = policy.deductibleEntries.filter((entry) =>
      textMatchesQuery(`${entry.incidentType} ${entry.amount}`, tokens)
    )

    const coveragesTextMatch =
      policy.coverages && textMatchesQuery(policy.coverages, tokens)
    const exclusionsTextMatch =
      policy.exclusions && textMatchesQuery(policy.exclusions, tokens)

    const keywordMatch =
      matchedEntries.length > 0 ||
      matchedDeductibles.length > 0 ||
      Boolean(coveragesTextMatch) ||
      Boolean(exclusionsTextMatch)

    return {
      policyId: policy.id,
      policyNumber: policy.policyNumber,
      insurerName: policy.insurerName,
      policyType: policy.policyType,
      keywordMatch,
      matchedCoverageEntries: matchedEntries,
      matchedDeductibleEntries: matchedDeductibles,
      coveragesText: coveragesTextMatch ? policy.coverages : undefined,
      exclusionsText: exclusionsTextMatch ? policy.exclusions : undefined,
      allCoverageEntries: policy.coverageEntries,
      allDeductibleEntries: policy.deductibleEntries,
      coveragesFullText: policy.coverages ?? null,
      exclusionsFullText: policy.exclusions ?? null,
    }
  })
}

export function searchBenefitsAssistances(
  policies: MarianaPolicyContext[],
  query?: string,
  policyTypes?: readonly string[]
) {
  const scoped = filterPoliciesByType(policies, policyTypes)
  const tokens = query ? tokenizeQuery(query) : []
  const assistanceTokens = new Set([
    ...tokens,
    ...ASSISTANCE_KEYWORDS.map((keyword) => normalizeText(keyword)),
  ])

  return scoped.flatMap((policy) =>
    policy.benefitEntries
      .filter((benefit) => {
        const haystack = [
          benefit.name,
          benefit.description ?? '',
          benefit.category ?? '',
          benefit.contactInfo ?? '',
          benefit.quantity ?? '',
        ].join(' ')

        if (tokens.length === 0) {
          return true
        }

        return [...assistanceTokens].some((token) =>
          normalizeText(haystack).includes(token)
        )
      })
      .map((benefit) => ({
        policyId: policy.id,
        policyNumber: policy.policyNumber,
        insurerName: policy.insurerName,
        policyType: policy.policyType,
        benefit,
      }))
  )
}

export function collectContactsForPolicies(policies: MarianaPolicyContext[]) {
  return policies.map((policy) => ({
    policyId: policy.id,
    policyNumber: policy.policyNumber,
    insurerName: policy.insurerName,
    policyType: policy.policyType,
    agent: policy.agent,
  }))
}
