import { describe, expect, it } from 'vitest'

import {
  ManualBeneficiaryRowSchema,
  ManualBeneficiaryRowsSchema,
  isBeneficiaryPctTotalValid,
  manualBeneficiaryToEntry,
  sanitizeManualBeneficiaryRows,
  sumBeneficiaryPct,
} from './beneficiary'

describe('Manual beneficiary schema', () => {
  it('validates a row with name and percentage', () => {
    const result = ManualBeneficiaryRowSchema.safeParse({
      name: 'María López',
      pct: 50,
    })

    expect(result.success).toBe(true)
  })

  it('accepts optional observations', () => {
    const result = ManualBeneficiaryRowSchema.safeParse({
      name: 'Juan Pérez',
      pct: 25,
      observations: 'Hijo mayor',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.observations).toBe('Hijo mayor')
    }
  })

  it('rejects empty name', () => {
    const result = ManualBeneficiaryRowSchema.safeParse({
      name: '   ',
      pct: 10,
    })

    expect(result.success).toBe(false)
  })

  it('rejects percentage outside 0-100', () => {
    expect(
      ManualBeneficiaryRowSchema.safeParse({ name: 'Ana', pct: -1 }).success
    ).toBe(false)
    expect(
      ManualBeneficiaryRowSchema.safeParse({ name: 'Ana', pct: 101 }).success
    ).toBe(false)
  })

  it('sums percentages and flags totals above 100', () => {
    const rows = ManualBeneficiaryRowsSchema.parse([
      { name: 'A', pct: 60 },
      { name: 'B', pct: 50 },
    ])

    expect(sumBeneficiaryPct(rows)).toBe(110)
    expect(isBeneficiaryPctTotalValid(rows)).toBe(false)
  })

  it('allows total at or below 100', () => {
    const rows = ManualBeneficiaryRowsSchema.parse([
      { name: 'A', pct: 60 },
      { name: 'B', pct: 40 },
    ])

    expect(isBeneficiaryPctTotalValid(rows)).toBe(true)
  })

  it('maps manual rows to embedded beneficiary entries', () => {
    const entry = manualBeneficiaryToEntry({
      name: 'Carlos Ruiz',
      pct: 100,
      observations: 'Cónyuge',
    })

    expect(entry).toMatchObject({
      name: 'Carlos Ruiz',
      pct: 100,
      notes: 'Cónyuge',
    })
  })

  it('sanitizes rows and drops blank names', () => {
    const entries = sanitizeManualBeneficiaryRows([
      { name: '  ', pct: 10 },
      { name: 'Valid Name', pct: 90 },
    ])

    expect(entries).toHaveLength(1)
    expect(entries[0]?.name).toBe('Valid Name')
  })
})
