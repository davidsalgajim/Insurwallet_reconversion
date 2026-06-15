import type { PolicyDocument } from '@/lib/firebase/policies'
import {
  PolicyStatusSchema,
  PolicyTypeSchema,
  type PolicyStatus,
  type PolicyType,
} from '@/lib/schemas/policy'

export const POLICY_TYPE_ORDER = PolicyTypeSchema.options

export const POLICY_STATUS_ORDER = PolicyStatusSchema.options

export type PolicyTypeFilter = PolicyType | 'all'
export type PolicyStatusFilter = PolicyStatus | 'all'

export type PolicyListFilters = {
  type: PolicyTypeFilter
  status: PolicyStatusFilter
}

export const DEFAULT_POLICY_LIST_FILTERS: PolicyListFilters = {
  type: 'all',
  status: 'all',
}

export function resolveListPolicyStatus(policy: PolicyDocument): PolicyStatus {
  return policy.status
}

export function filterPoliciesByType(
  policies: PolicyDocument[],
  type: PolicyTypeFilter
): PolicyDocument[] {
  if (type === 'all') {
    return policies
  }

  return policies.filter((policy) => policy.policyType === type)
}

export function filterPoliciesByStatus(
  policies: PolicyDocument[],
  status: PolicyStatusFilter
): PolicyDocument[] {
  if (status === 'all') {
    return policies
  }

  return policies.filter((policy) => resolveListPolicyStatus(policy) === status)
}

export function applyPolicyListFilters(
  policies: PolicyDocument[],
  filters: PolicyListFilters
): PolicyDocument[] {
  return filterPoliciesByStatus(
    filterPoliciesByType(policies, filters.type),
    filters.status
  )
}

export function hasActivePolicyListFilters(
  filters: PolicyListFilters
): boolean {
  return filters.type !== 'all' || filters.status !== 'all'
}

export type PolicyTypeCount = {
  type: PolicyType
  count: number
}

export function countPoliciesByType(
  policies: PolicyDocument[]
): PolicyTypeCount[] {
  const counts = new Map<PolicyType, number>()

  for (const policy of policies) {
    counts.set(policy.policyType, (counts.get(policy.policyType) ?? 0) + 1)
  }

  return POLICY_TYPE_ORDER.filter((type) => (counts.get(type) ?? 0) > 0).map(
    (type) => ({
      type,
      count: counts.get(type) ?? 0,
    })
  )
}

export type PolicyTypeGroup = {
  type: PolicyType
  policies: PolicyDocument[]
}

export function groupPoliciesByType(
  policies: PolicyDocument[]
): PolicyTypeGroup[] {
  const groups = new Map<PolicyType, PolicyDocument[]>()

  for (const policy of policies) {
    const existing = groups.get(policy.policyType) ?? []
    existing.push(policy)
    groups.set(policy.policyType, existing)
  }

  return POLICY_TYPE_ORDER.filter((type) => groups.has(type)).map((type) => ({
    type,
    policies: groups.get(type) ?? [],
  }))
}
