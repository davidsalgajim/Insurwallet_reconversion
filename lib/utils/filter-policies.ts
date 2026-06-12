import type { PolicyDocument } from '@/lib/firebase/policies'

export function filterPoliciesByQuery(
  policies: PolicyDocument[],
  query: string
): PolicyDocument[] {
  const normalized = query.trim().toLowerCase()

  if (!normalized) {
    return policies
  }

  return policies.filter((policy) => {
    const haystack = [
      policy.insurerName,
      policy.policyNumber,
      policy.holderName,
      policy.notes ?? '',
    ]
      .join(' ')
      .toLowerCase()

    return haystack.includes(normalized)
  })
}
