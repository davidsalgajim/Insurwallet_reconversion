import { Timestamp } from 'firebase/firestore'
import { describe, expect, it } from 'vitest'

import { parseDocumentExtraction } from '@/lib/firebase/parse-document-extraction'

describe('parseDocumentExtraction', () => {
  it('parses extraction fields with Firestore Timestamps', () => {
    const startDate = new Date('2025-03-28T12:00:00.000Z')
    const extractedAt = new Date('2025-06-14T10:00:00.000Z')

    const parsed = parseDocumentExtraction({
      extraction: {
        fields: {
          insurerName: 'Seguros de Vida Alfa S.A',
          policyNumber: 'GRD-482',
          policyType: 'life',
          holderName: 'David Andres Salgado Jimenez',
          startDate: Timestamp.fromDate(startDate),
          currency: 'COP',
          paymentFrequency: 'monthly',
          coverages: 'Muerte, ITP',
          hasNoExpiration: true,
          beneficiaryEntries: [{ name: 'Banco De Occidente', pct: 100 }],
          agent: {
            name: 'Andres Baron',
            phone: '6013077032',
            email: 'servicioalcliente@segurosalfa.com.co',
          },
        },
        confidence: {
          insurerName: 'high',
          policyNumber: 'high',
        },
        method: 'surya',
        extractedAt: Timestamp.fromDate(extractedAt),
      },
    })

    expect(parsed).toBeDefined()
    expect(parsed?.fields.insurerName).toBe('Seguros de Vida Alfa S.A')
    expect(parsed?.fields.policyType).toBe('life')
    expect(parsed?.fields.paymentFrequency).toBe('monthly')
    expect(parsed?.fields.hasNoExpiration).toBe(true)
    expect(parsed?.fields.startDate).toEqual(startDate)
    expect(parsed?.fields.beneficiaryEntries).toHaveLength(1)
    expect(parsed?.fields.agent?.name).toBe('Andres Baron')
    expect(parsed?.extractedAt).toEqual(extractedAt)
  })

  it('returns undefined when extraction is missing', () => {
    expect(parseDocumentExtraction({})).toBeUndefined()
  })
})
