import { describe, expect, it } from 'vitest'

import {
  extractionFieldsToCreateInput,
  mergeExtractionFieldsIntoPolicy,
} from '@/lib/policies/extraction-mapping'
import type { PolicyExtractionFields } from '@/lib/schemas/extraction'

const basePolicy = {
  ownerUid: 'user-1',
  policyNumber: 'DRAFT-001',
  insurerName: 'Demo Seguros',
  policyType: 'health' as const,
  holderName: 'Jane Doe',
  startDate: new Date('2025-01-01'),
  endDate: new Date('2026-01-01'),
  hasNoExpiration: false,
  premium: 0,
  currency: 'COP',
  paymentFrequency: 'annual' as const,
  agent: {
    name: 'Agent',
    phone: '+573001112233',
    email: 'agent@demo.com',
  },
  coverageEntries: [],
  deductibleEntries: [],
  beneficiaryEntries: [],
  benefitEntries: [],
  sharedWith: [],
  status: 'active' as const,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
}

describe('extraction mapping', () => {
  it('maps extraction fields to create input with fallbacks', () => {
    const fields: PolicyExtractionFields = {
      insurerName: 'Sura',
      policyNumber: 'POL-99',
      premium: 500000,
      beneficiaryEntries: [{ name: 'Carlos', pct: 100 }],
    }

    const input = extractionFieldsToCreateInput(fields, 'user-1', basePolicy)

    expect(input.insurerName).toBe('Sura')
    expect(input.policyNumber).toBe('POL-99')
    expect(input.premium).toBe(500000)
    expect(input.beneficiaryEntries).toEqual([{ name: 'Carlos', pct: 100 }])
    expect(input.policyType).toBe('health')
  })

  it('merges structured extraction arrays into policy', () => {
    const merged = mergeExtractionFieldsIntoPolicy(basePolicy, {
      coverageEntries: [{ name: 'Hospitalización', amount: 10000000 }],
      deductibleEntries: [
        { incidentType: 'Consulta', amount: 50000, isPercentage: false },
      ],
    })

    expect(merged.coverageEntries).toHaveLength(1)
    expect(merged.deductibleEntries).toHaveLength(1)
  })
})
