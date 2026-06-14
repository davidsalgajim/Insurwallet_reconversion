import { describe, expect, it } from 'vitest'

import { computePolicyExtractionDiff } from '@/lib/policies/policy-diff'
import type { Policy } from '@/lib/schemas/policy'

const basePolicy: Policy = {
  ownerUid: 'user-1',
  policyNumber: 'POL-1',
  insurerName: 'Demo',
  policyType: 'health',
  holderName: 'Jane',
  startDate: new Date('2025-01-01'),
  endDate: new Date('2026-01-01'),
  hasNoExpiration: false,
  premium: 500000,
  currency: 'COP',
  paymentFrequency: 'annual',
  agent: { name: 'Agent', phone: '+573001112233', email: 'a@demo.com' },
  coverageEntries: [{ name: 'Base', amount: 1000000 }],
  deductibleEntries: [],
  beneficiaryEntries: [],
  benefitEntries: [],
  sharedWith: [],
  status: 'expired',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
}

describe('computePolicyExtractionDiff', () => {
  it('detects endDate changes for renewal documents', () => {
    const diffs = computePolicyExtractionDiff(basePolicy, {
      endDate: new Date('2027-01-01'),
    })

    expect(diffs).toHaveLength(1)
    expect(diffs[0]?.field).toBe('endDate')
    expect(diffs[0]?.proposed).toBe('2027-01-01')
  })

  it('detects premium changes', () => {
    const diffs = computePolicyExtractionDiff(basePolicy, {
      premium: 750000,
      currency: 'COP',
    })

    expect(diffs.some((diff) => diff.field === 'premium')).toBe(true)
  })

  it('returns empty diff when extraction matches policy', () => {
    const diffs = computePolicyExtractionDiff(basePolicy, {
      endDate: basePolicy.endDate,
      premium: basePolicy.premium,
      coverageEntries: basePolicy.coverageEntries,
    })

    expect(diffs).toHaveLength(0)
  })
})
