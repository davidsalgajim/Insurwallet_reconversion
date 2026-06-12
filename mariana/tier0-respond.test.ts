import { describe, expect, it } from 'vitest'

import { buildTier0Response } from '@/mariana/tier0-respond'

const samplePolicies = [
  {
    id: 'p1',
    policyNumber: 'AUTO-001',
    insurerName: 'Seguros Bolívar',
    policyType: 'auto',
    endDate: '2026-12-01',
    premium: 120000,
    currency: 'COP',
    startDate: '2025-12-01',
    agent: {
      name: 'Ana Agente',
      phone: '+573001112233',
      email: 'ana@example.com',
    },
    coverageEntries: [],
    deductibleEntries: [],
    beneficiaryEntries: [],
  },
]

describe('buildTier0Response', () => {
  it('lists expiry dates for policy_expiry intent', () => {
    const text = buildTier0Response('policy_expiry', samplePolicies, 'es')
    expect(text).toContain('vencimiento')
    expect(text).toContain('Seguros Bolívar')
  })

  it('lists premiums for premium_info intent', () => {
    const text = buildTier0Response('premium_info', samplePolicies, 'en')
    expect(text.toLowerCase()).toContain('premium')
  })

  it('handles empty policy list', () => {
    const text = buildTier0Response('contact_info', [], 'es')
    expect(text).toContain('No encontré pólizas')
  })
})
