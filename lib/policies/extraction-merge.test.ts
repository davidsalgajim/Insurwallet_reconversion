import { describe, expect, it } from 'vitest'

import { mergePolicyExtractions } from '@/lib/policies/extraction-merge'
import type { PolicyExtraction } from '@/lib/schemas/extraction'

const baseExtraction = (
  overrides: Partial<PolicyExtraction> = {}
): PolicyExtraction => ({
  fields: {},
  confidence: {},
  method: 'odl',
  extractedAt: new Date('2026-01-01'),
  ...overrides,
})

describe('mergePolicyExtractions', () => {
  it('returns undefined when no extractions are provided', () => {
    expect(mergePolicyExtractions([])).toBeUndefined()
  })

  it('returns the single extraction unchanged', () => {
    const extraction = baseExtraction({
      fields: { insurerName: 'Sura', policyNumber: 'A-1' },
      confidence: { insurerName: 'high', policyNumber: 'medium' },
    })

    expect(mergePolicyExtractions([extraction])).toEqual(extraction)
  })

  it('prefers higher-confidence scalar fields across documents', () => {
    const cover = baseExtraction({
      fields: { insurerName: 'Baja confianza', policyNumber: 'POL-1' },
      confidence: { insurerName: 'low', policyNumber: 'high' },
    })
    const conditions = baseExtraction({
      fields: { insurerName: 'Seguros Bolívar', premium: 900000 },
      confidence: { insurerName: 'high', premium: 'medium' },
    })

    const merged = mergePolicyExtractions([cover, conditions])

    expect(merged?.fields.insurerName).toBe('Seguros Bolívar')
    expect(merged?.fields.policyNumber).toBe('POL-1')
    expect(merged?.fields.premium).toBe(900000)
    expect(merged?.confidence.insurerName).toBe('high')
  })

  it('merges structured coverage arrays without duplicates', () => {
    const merged = mergePolicyExtractions([
      baseExtraction({
        fields: {
          coverageEntries: [{ name: 'Hospitalización', amount: 10000000 }],
        },
      }),
      baseExtraction({
        fields: {
          coverageEntries: [
            { name: 'Hospitalización', amount: 10000000 },
            { name: 'Urgencias', amount: 2000000 },
          ],
        },
      }),
    ])

    expect(merged?.fields.coverageEntries).toHaveLength(2)
  })
})
