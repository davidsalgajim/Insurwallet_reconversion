import type { BenefitEntry, PolicyType } from '@/lib/schemas/policy'
import type { PolicyDocument } from '@/lib/firebase/policies'
import { resolvePolicyStatus } from '@/lib/utils/policy-status'

export type PolicyBenefitItem = {
  benefit: BenefitEntry
  policy: PolicyDocument
}

export function collectActivePolicyBenefits(
  policies: PolicyDocument[],
  options?: {
    policyType?: PolicyType
    searchQuery?: string
    now?: Date
  }
): PolicyBenefitItem[] {
  const normalizedQuery = options?.searchQuery?.trim().toLowerCase() ?? ''
  const now = options?.now ?? new Date()

  const items: PolicyBenefitItem[] = []

  for (const policy of policies) {
    if (options?.policyType && policy.policyType !== options.policyType) {
      continue
    }

    if (resolvePolicyStatus(policy, now) === 'expired') {
      continue
    }

    for (const benefit of policy.benefitEntries) {
      if (normalizedQuery) {
        const haystack = [
          benefit.name,
          benefit.description ?? '',
          benefit.category ?? '',
          benefit.contactInfo ?? '',
          benefit.quantity ?? '',
          policy.insurerName,
          policy.policyNumber,
        ]
          .join(' ')
          .toLowerCase()

        if (!haystack.includes(normalizedQuery)) {
          continue
        }
      }

      items.push({ benefit, policy })
    }
  }

  return items
}

export function groupBenefitsByCategory(
  items: PolicyBenefitItem[],
  generalCategoryLabel: string
): Array<{ category: string; items: PolicyBenefitItem[] }> {
  const grouped = new Map<string, PolicyBenefitItem[]>()

  for (const item of items) {
    const category = item.benefit.category?.trim() || generalCategoryLabel
    const bucket = grouped.get(category) ?? []
    bucket.push(item)
    grouped.set(category, bucket)
  }

  return [...grouped.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([category, groupedItems]) => ({
      category,
      items: groupedItems,
    }))
}
