import { describe, expect, it } from 'vitest'

import type { PolicyDocument } from '@/lib/firebase/policies'

import {
  applyPolicyListFilters,
  countPoliciesByType,
  filterPoliciesByStatus,
  filterPoliciesByType,
  groupPoliciesByType,
  hasActivePolicyListFilters,
} from './list-filters'

function makePolicy(overrides: Partial<PolicyDocument> = {}): PolicyDocument {
  return {
    id: 'policy-1',
    ownerUid: 'user-1',
    policyNumber: 'POL-001',
    insurerName: 'Demo Seguros',
    policyType: 'health',
    holderName: 'Jane Doe',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2026-01-01'),
    hasNoExpiration: false,
    premium: 100,
    currency: 'COP',
    paymentFrequency: 'annual',
    agent: {
      name: 'Agent',
      phone: '+570000000000',
      email: 'agent@demo.com',
    },
    coverageEntries: [],
    deductibleEntries: [],
    beneficiaryEntries: [],
    benefitEntries: [],
    sharedWith: [],
    status: 'active',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  }
}

describe('filterPoliciesByType', () => {
  it('returns all policies when type is all', () => {
    const policies = [
      makePolicy({ id: '1', policyType: 'life' }),
      makePolicy({ id: '2', policyType: 'auto' }),
    ]

    expect(filterPoliciesByType(policies, 'all')).toHaveLength(2)
  })

  it('filters by policy type', () => {
    const policies = [
      makePolicy({ id: '1', policyType: 'life' }),
      makePolicy({ id: '2', policyType: 'auto' }),
      makePolicy({ id: '3', policyType: 'life' }),
    ]

    expect(filterPoliciesByType(policies, 'life')).toHaveLength(2)
    expect(filterPoliciesByType(policies, 'auto')).toHaveLength(1)
  })
})

describe('filterPoliciesByStatus', () => {
  it('returns all policies when status is all', () => {
    const policies = [
      makePolicy({ id: '1', status: 'active' }),
      makePolicy({ id: '2', status: 'expired' }),
    ]

    expect(filterPoliciesByStatus(policies, 'all')).toHaveLength(2)
  })

  it('filters by stored policy status', () => {
    const policies = [
      makePolicy({ id: '1', status: 'active' }),
      makePolicy({ id: '2', status: 'expiring' }),
      makePolicy({ id: '3', status: 'expired' }),
    ]

    expect(filterPoliciesByStatus(policies, 'expiring')).toHaveLength(1)
    expect(filterPoliciesByStatus(policies, 'expired')).toHaveLength(1)
  })
})

describe('applyPolicyListFilters', () => {
  it('combines type and status filters', () => {
    const policies = [
      makePolicy({ id: '1', policyType: 'life', status: 'active' }),
      makePolicy({ id: '2', policyType: 'life', status: 'expired' }),
      makePolicy({ id: '3', policyType: 'auto', status: 'active' }),
    ]

    expect(
      applyPolicyListFilters(policies, { type: 'life', status: 'active' })
    ).toEqual([policies[0]])
  })
})

describe('hasActivePolicyListFilters', () => {
  it('detects default vs active filters', () => {
    expect(hasActivePolicyListFilters({ type: 'all', status: 'all' })).toBe(
      false
    )
    expect(hasActivePolicyListFilters({ type: 'life', status: 'all' })).toBe(
      true
    )
    expect(
      hasActivePolicyListFilters({ type: 'all', status: 'expiring' })
    ).toBe(true)
  })
})

describe('countPoliciesByType', () => {
  it('returns counts sorted by policy type order', () => {
    const policies = [
      makePolicy({ id: '1', policyType: 'auto' }),
      makePolicy({ id: '2', policyType: 'life' }),
      makePolicy({ id: '3', policyType: 'life' }),
      makePolicy({ id: '4', policyType: 'health' }),
      makePolicy({ id: '5', policyType: 'health' }),
      makePolicy({ id: '6', policyType: 'health' }),
    ]

    expect(countPoliciesByType(policies)).toEqual([
      { type: 'life', count: 2 },
      { type: 'health', count: 3 },
      { type: 'auto', count: 1 },
    ])
  })

  it('omits types with zero count', () => {
    expect(countPoliciesByType([makePolicy({ policyType: 'pet' })])).toEqual([
      { type: 'pet', count: 1 },
    ])
  })
})

describe('groupPoliciesByType', () => {
  it('groups policies in canonical type order', () => {
    const auto = makePolicy({ id: 'auto', policyType: 'auto' })
    const life = makePolicy({ id: 'life', policyType: 'life' })
    const health = makePolicy({ id: 'health', policyType: 'health' })

    expect(groupPoliciesByType([auto, life, health])).toEqual([
      { type: 'life', policies: [life] },
      { type: 'health', policies: [health] },
      { type: 'auto', policies: [auto] },
    ])
  })
})
