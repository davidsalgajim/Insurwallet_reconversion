import { describe, expect, it } from 'vitest'

import {
  BeneficiaryEntrySchema,
  CoverageEntrySchema,
  DeductibleEntrySchema,
  PolicySchema,
  PolicyStatusSchema,
  PolicyTypeSchema,
} from './policy'

const validPolicy = {
  ownerUid: 'user-123',
  policyNumber: 'POL-001',
  insurerName: 'Seguros Demo',
  policyType: 'auto',
  holderName: 'Jane Doe',
  startDate: new Date('2025-01-01'),
  endDate: new Date('2026-01-01'),
  premium: 1200000,
  currency: 'COP',
  paymentFrequency: 'monthly',
  coverages: 'Daños a terceros',
  agent: {
    name: 'Agent Smith',
    phone: '+573001112233',
    email: 'agent@demo.com',
  },
  coverageEntries: [{ name: 'RC', amount: 500000000 }],
  deductibleEntries: [
    { incidentType: 'collision', amount: 10, isPercentage: true },
  ],
  beneficiaryEntries: [
    {
      name: 'John Doe',
      idType: 'cc',
      idNumber: '1234567890',
      relationship: 'spouse',
      pct: 100,
    },
  ],
  sharedWith: [],
  status: 'active',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-02'),
}

describe('Policy schemas', () => {
  it('validates a complete policy object', () => {
    const result = PolicySchema.safeParse(validPolicy)

    expect(result.success).toBe(true)
  })

  it('rejects an invalid policy type', () => {
    const result = PolicyTypeSchema.safeParse('marine')

    expect(result.success).toBe(false)
  })

  it('rejects an invalid policy status', () => {
    const result = PolicyStatusSchema.safeParse('pending')

    expect(result.success).toBe(false)
  })

  it('validates coverage, deductible, and beneficiary entries', () => {
    expect(
      CoverageEntrySchema.safeParse({
        name: 'Hospitalización',
        amount: 10000000,
      }).success
    ).toBe(true)
    expect(
      DeductibleEntrySchema.safeParse({
        incidentType: 'theft',
        amount: 500000,
        isPercentage: false,
      }).success
    ).toBe(true)
    expect(
      BeneficiaryEntrySchema.safeParse({
        name: 'Maria',
        idType: 'cc',
        idNumber: '9876543210',
        relationship: 'child',
        pct: 50,
      }).success
    ).toBe(true)
  })

  it('rejects beneficiary percentage outside 0-100', () => {
    const result = BeneficiaryEntrySchema.safeParse({
      name: 'Maria',
      idType: 'cc',
      idNumber: '9876543210',
      relationship: 'child',
      pct: 150,
    })

    expect(result.success).toBe(false)
  })
})
