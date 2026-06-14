import { Timestamp } from 'firebase-admin/firestore'
import { describe, expect, it } from 'vitest'

import { buildPolicyFromInput } from '@/lib/firebase/policies'
import {
  extractionFieldsToAdminFirestore,
  policyToAdminFirestoreData,
} from '@/lib/firebase/policies-admin'

describe('policies-admin', () => {
  it('policyToAdminFirestoreData uses firebase-admin Timestamp', () => {
    const policy = buildPolicyFromInput(
      {
        ownerUid: 'user-1',
        insurerName: 'Mapfre',
        policyNumber: 'POL-1',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2026-01-01'),
      },
      new Date('2025-06-01')
    )

    const data = policyToAdminFirestoreData(policy)

    expect(data.startDate).toBeInstanceOf(Timestamp)
    expect(data.endDate).toBeInstanceOf(Timestamp)
    expect(Object.values(data)).not.toContain(undefined)
  })

  it('extractionFieldsToAdminFirestore stores ISO date strings for client parsing', () => {
    const data = extractionFieldsToAdminFirestore({
      insurerName: 'Sura',
      startDate: new Date('2024-05-03'),
      endDate: new Date('2025-05-03'),
    })

    expect(data.insurerName).toBe('Sura')
    expect(data.startDate).toBe('2024-05-03')
    expect(data.endDate).toBe('2025-05-03')
  })
})
