import { describe, expect, it } from 'vitest'

import { mergePolicyUpdate } from '@/lib/firebase/policies'
import {
  extractionFieldsToCreateInput,
  mergeExtractionFieldsIntoPolicy,
  sanitizeExtractionFieldsForPersist,
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
    expect(input.agent).toEqual(basePolicy.agent)
  })

  it('skips placeholder agent fallback when extraction omits agent', () => {
    const draftPolicy = {
      ...basePolicy,
      agent: {
        name: 'Por definir',
        phone: '+570000000000',
        email: 'pendiente@example.com',
      },
    }

    const input = extractionFieldsToCreateInput(
      { insurerName: 'Sura' },
      'user-1',
      draftPolicy
    )

    expect(input.agent).toBeUndefined()
  })

  it('maps extracted agent without placeholder fallback', () => {
    const draftPolicy = {
      ...basePolicy,
      agent: {
        name: 'Por definir',
        phone: '+570000000000',
        email: 'pendiente@example.com',
      },
    }

    const input = extractionFieldsToCreateInput(
      {
        agent: {
          name: 'Carlos Ruiz',
          phone: '+573001234567',
          email: 'carlos@corredor.com',
        },
      },
      'user-1',
      draftPolicy
    )

    expect(input.agent).toEqual({
      name: 'Carlos Ruiz',
      phone: '+573001234567',
      email: 'carlos@corredor.com',
    })
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

  it('maps insurer SAC contacts into agent when agent is empty (Alfa-like)', () => {
    const alfaSnippet = `
      Seguros de Vida Alfa S.A.
      Servicio al cliente
      servicioalcliente@segurosalfa.com.co
      (60-1) 7 43 53 33 Ext 14451
      Andrés Fernando Barón Tautiva
      Firma Autorizada
    `

    const input = extractionFieldsToCreateInput(
      {
        insurerName: 'Seguros de Vida Alfa S.A.',
        insurerContacts: {
          phone: '+5717435333',
          email: 'servicioalcliente@segurosalfa.com.co',
          label: 'Servicio al cliente - Alfa',
        },
        agent: {
          name: 'Andrés Fernando Barón Tautiva',
        },
      },
      'user-1',
      {
        ...basePolicy,
        agent: {
          name: 'Por definir',
          phone: '+570000000000',
          email: 'pendiente@example.com',
        },
      }
    )

    expect(input.agent).toEqual({
      name: 'Andrés Fernando Barón Tautiva',
      phone: '+5717435333',
      email: 'servicioalcliente@segurosalfa.com.co',
    })
    expect(alfaSnippet).toContain('Seguros de Vida Alfa')
  })

  it('fills agent phone/email from insurerContacts without SAC email as name', () => {
    const input = extractionFieldsToCreateInput(
      {
        insurerName: 'Seguros de Vida Alfa S.A.',
        insurerContacts: {
          phone: '+5717435333',
          email: 'servicioalcliente@segurosalfa.com.co',
        },
      },
      'user-1'
    )

    expect(input.agent).toEqual({
      name: 'Servicio al cliente - Seguros',
      phone: '+5717435333',
      email: 'servicioalcliente@segurosalfa.com.co',
    })
  })

  it('drops sentinel agent email and insurerContacts before persist', () => {
    const sanitized = sanitizeExtractionFieldsForPersist({
      agent: {
        name: 'ASA AGENCIA DE SEGUROS LTDA.',
        phone: '+5715320610',
        email: 'none',
      },
      insurerContacts: {
        email: 'n/a',
        phone: '+5715320610',
      },
      notes: 'pendiente',
    })

    expect(sanitized.agent).toEqual({
      name: 'ASA AGENCIA DE SEGUROS LTDA.',
      phone: '+5715320610',
      email: '',
    })
    expect(sanitized.insurerContacts).toEqual({ phone: '+5715320610' })
    expect(sanitized.notes).toBeUndefined()
  })

  it('mergeExtractionFieldsIntoPolicy survives agent email sentinel', () => {
    const merged = mergeExtractionFieldsIntoPolicy(basePolicy, {
      agent: {
        name: 'Laura Gómez',
        phone: '+573001112233',
        email: 'none',
      },
    })

    expect(() =>
      mergePolicyUpdate(basePolicy, {
        agent: merged.agent,
      })
    ).not.toThrow()
    expect(merged.agent.email).toBe('')
  })

  it('clears placeholder policy email when extraction sends sentinel', () => {
    const draftPolicy = {
      ...basePolicy,
      agent: {
        name: 'Por definir',
        phone: '+570000000000',
        email: 'pendiente@example.com',
      },
    }

    const merged = mergeExtractionFieldsIntoPolicy(draftPolicy, {
      agent: {
        name: 'Laura Gómez',
        phone: '+573001112233',
        email: 'none',
      },
    })

    expect(merged.agent).toEqual({
      name: 'Laura Gómez',
      phone: '+573001112233',
      email: '',
    })
  })
})
