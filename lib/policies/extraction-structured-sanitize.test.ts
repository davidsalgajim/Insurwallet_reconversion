import { describe, expect, it } from 'vitest'

import {
  sanitizeBeneficiaryEntriesForPersist,
  sanitizeBenefitEntriesForPersist,
  sanitizeCoverageEntriesForPersist,
  sanitizeDeductibleEntriesForPersist,
} from '@/lib/policies/extraction-structured-sanitize'

describe('extraction structured sanitize', () => {
  it('drops beneficiary rows without name or invalid pct', () => {
    const rows = sanitizeBeneficiaryEntriesForPersist([
      { name: 'Carlos', pct: 100 },
      { name: 'none', pct: 50 },
      { name: 'Ana', pct: -5 },
      { name: 'Luis', pct: 150 },
      { name: 'pendiente', pct: 25, notes: 'n/a' },
    ] as never)

    expect(rows).toEqual([
      { name: 'Carlos', pct: 100 },
      { name: 'Luis', pct: 100 },
    ])
  })

  it('drops coverage rows with sentinel names or negative amounts', () => {
    const rows = sanitizeCoverageEntriesForPersist([
      { name: 'Hospitalización', amount: 10_000_000 },
      { name: 'n/a', amount: 1 },
      { name: 'RC', amount: -100 },
      { name: 'none', amount: 0 },
    ] as never)

    expect(rows).toEqual([{ name: 'Hospitalización', amount: 10_000_000 }])
  })

  it('drops deductible rows with invalid incidentType or amount', () => {
    const rows = sanitizeDeductibleEntriesForPersist([
      { incidentType: 'Consulta', amount: 50_000, isPercentage: false },
      { incidentType: 'none', amount: 10, isPercentage: false },
      { incidentType: 'Urgencias', amount: -1, isPercentage: true },
    ] as never)

    expect(rows).toEqual([
      { incidentType: 'Consulta', amount: 50_000, isPercentage: false },
    ])
  })

  it('normalizes benefit contactInfo and quantity, drops invalid rows', () => {
    const rows = sanitizeBenefitEntriesForPersist([
      {
        name: 'Asistencia vial',
        contactInfo: 'none',
        quantity: '3',
      },
      {
        name: 'Soporte',
        contactInfo: 'soporte@aseguradora.com',
        quantity: -2,
      },
      {
        name: 'n/a',
        contactInfo: '+573001112233',
      },
      {
        name: 'Grúa',
        contactInfo: 'not-an-email',
        quantity: 'pendiente',
      },
    ] as never)

    expect(rows).toEqual([
      { name: 'Asistencia vial', quantity: '3' },
      {
        name: 'Soporte',
        contactInfo: 'soporte@aseguradora.com',
      },
      {
        name: 'Grúa',
        contactInfo: 'not-an-email',
      },
    ])
  })

  it('drops contact-like benefit rows duplicated from insurerContacts', () => {
    const insurerContacts = [
      { label: 'América Latina', phone: '+5451155551500' },
      { label: 'Norteamérica', phone: '+18008742223' },
      { label: 'WhatsApp asistencia', phone: '+5491127039665' },
    ]

    const rows = sanitizeBenefitEntriesForPersist(
      [
        { name: 'WhatsApp asistencia', contactInfo: '+5491127039665' },
        { name: 'América Latina', contactInfo: '+5451155551500' },
        { name: 'Asistencia — Europa', contactInfo: '+34917883333' },
        { name: 'Traslado médico', description: 'USD 50,000' },
        { name: 'Grúa', contactInfo: '+573001112233' },
      ] as never,
      insurerContacts
    )

    expect(rows).toEqual([
      { name: 'Traslado médico', description: 'USD 50,000' },
      { name: 'Grúa', contactInfo: '+573001112233' },
    ])
  })
})
