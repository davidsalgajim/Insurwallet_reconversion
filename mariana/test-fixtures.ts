import type { MarianaPolicyContext } from '@/lib/server/mariana-context'
import type { PolicyMetadata } from '@/mariana/types'

export function makePolicyMetadata(
  overrides: Partial<PolicyMetadata> = {}
): PolicyMetadata {
  return {
    id: 'policy-1',
    policyNumber: 'POL-001',
    insurerName: 'Demo',
    policyType: 'auto',
    holderName: 'Jane Doe',
    startDate: '2025-01-01',
    endDate: '2026-01-01',
    premium: 1000,
    currency: 'COP',
    paymentFrequency: 'annual',
    coverageCount: 0,
    deductibleCount: 0,
    beneficiaryCount: 0,
    benefitCount: 0,
    ...overrides,
  }
}

export function makeMarianaPolicyContext(
  overrides: Partial<MarianaPolicyContext> = {}
): MarianaPolicyContext {
  const base = makePolicyMetadata(overrides)
  return {
    ...base,
    agent: {
      name: 'Agent Smith',
      phone: '+573001112233',
      email: 'agent@demo.com',
    },
    coverageEntries: [],
    deductibleEntries: [],
    beneficiaryEntries: [],
    benefitEntries: [],
    ...overrides,
  }
}
