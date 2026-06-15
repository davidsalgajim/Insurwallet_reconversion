import { describe, expect, it } from 'vitest'

import type { PolicyDocument } from '@/lib/firebase/policies'
import {
  collectActivePolicyBenefits,
  groupBenefitsByCategory,
} from './benefits-aggregator'

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
    insurerContacts: [],
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

describe('benefits-aggregator', () => {
  it('collects benefits from active policies only', () => {
    const active = makePolicy({
      benefitEntries: [{ name: 'Hospitalización' }],
    })
    const expired = makePolicy({
      id: 'policy-2',
      endDate: new Date('2024-01-01'),
      status: 'expired',
      benefitEntries: [{ name: 'Dental' }],
    })

    const items = collectActivePolicyBenefits([active, expired], {
      now: new Date('2025-06-01'),
    })

    expect(items).toHaveLength(1)
    expect(items[0]?.benefit.name).toBe('Hospitalización')
  })

  it('filters by search query and policy type', () => {
    const health = makePolicy({
      benefitEntries: [{ name: 'Hospitalización', category: 'Salud' }],
    })
    const auto = makePolicy({
      id: 'policy-2',
      policyType: 'auto',
      benefitEntries: [{ name: 'Asistencia vial' }],
    })

    const items = collectActivePolicyBenefits([health, auto], {
      policyType: 'health',
      searchQuery: 'hosp',
      now: new Date('2025-06-01'),
    })

    expect(items).toHaveLength(1)
    expect(items[0]?.policy.policyType).toBe('health')
  })

  it('groups benefits by category with general fallback', () => {
    const grouped = groupBenefitsByCategory(
      [
        {
          benefit: { name: 'Dental', category: 'Salud' },
          policy: makePolicy(),
        },
        {
          benefit: { name: 'Funeral' },
          policy: makePolicy(),
        },
      ],
      'General'
    )

    expect(grouped).toHaveLength(2)
    expect(grouped[0]?.category).toBe('General')
    expect(grouped[1]?.category).toBe('Salud')
  })
})
