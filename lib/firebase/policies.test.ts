import { Timestamp } from 'firebase/firestore'
import { describe, expect, it } from 'vitest'

import {
  auditLogToFirestoreData,
  buildPolicyFromInput,
  firestoreDateToDate,
  mergePolicyUpdate,
  parsePolicyDocument,
  policyToFirestoreData,
  type CreatePolicyInput,
} from './policies'

const baseInput: CreatePolicyInput = {
  ownerUid: 'user-123',
  insurerName: 'Seguros Demo',
  policyNumber: 'POL-001',
  startDate: new Date('2025-01-01'),
  endDate: new Date('2026-01-01'),
}

describe('policies helpers', () => {
  it('buildPolicyFromInput fills defaults and computes status', () => {
    const now = new Date('2025-06-01')
    const policy = buildPolicyFromInput(baseInput, now)

    expect(policy.ownerUid).toBe('user-123')
    expect(policy.policyType).toBe('other')
    expect(policy.holderName).toBe('Seguros Demo')
    expect(policy.premium).toBe(0)
    expect(policy.currency).toBe('COP')
    expect(policy.paymentFrequency).toBe('annual')
    expect(policy.status).toBe('active')
    expect(policy.createdAt).toEqual(now)
    expect(policy.updatedAt).toEqual(now)
  })

  it('policyToFirestoreData converts dates to Firestore timestamps', () => {
    const policy = buildPolicyFromInput(baseInput, new Date('2025-06-01'))
    const data = policyToFirestoreData(policy)

    expect(data.startDate).toBeInstanceOf(Timestamp)
    expect(data.endDate).toBeInstanceOf(Timestamp)
    expect(data.createdAt).toBeInstanceOf(Timestamp)
    expect(data.updatedAt).toBeInstanceOf(Timestamp)
  })

  it('parsePolicyDocument round-trips Firestore-shaped data', () => {
    const policy = buildPolicyFromInput(baseInput, new Date('2025-06-01'))
    const firestoreData = policyToFirestoreData(policy)

    const parsed = parsePolicyDocument('policy-abc', firestoreData)

    expect(parsed.id).toBe('policy-abc')
    expect(parsed.policyNumber).toBe('POL-001')
    expect(parsed.insurerName).toBe('Seguros Demo')
    expect(parsed.startDate).toEqual(baseInput.startDate)
  })

  it('firestoreDateToDate accepts Timestamp and Date values', () => {
    const date = new Date('2025-03-15')
    const timestamp = Timestamp.fromDate(date)

    expect(firestoreDateToDate(timestamp)).toEqual(date)
    expect(firestoreDateToDate(date)).toEqual(date)
  })

  it('mergePolicyUpdate recomputes status when end date changes', () => {
    const existing = buildPolicyFromInput(baseInput, new Date('2025-06-01'))
    const now = new Date('2025-11-15')

    const updated = mergePolicyUpdate(
      existing,
      { endDate: new Date('2025-12-01') },
      now
    )

    expect(updated.status).toBe('expiring')
    expect(updated.updatedAt).toEqual(now)
    expect(updated.policyNumber).toBe('POL-001')
  })

  it('parsePolicyDocument recomputes stale stored status on read', () => {
    const policy = buildPolicyFromInput(baseInput, new Date('2025-06-01'))
    const firestoreData = {
      ...policyToFirestoreData(policy),
      endDate: Timestamp.fromDate(new Date('2025-07-01')),
      status: 'active',
    }

    const parsed = parsePolicyDocument(
      'policy-abc',
      firestoreData,
      new Date('2025-06-01')
    )

    expect(parsed.status).toBe('expiring')
  })

  it('auditLogToFirestoreData converts createdAt to Timestamp', () => {
    const createdAt = new Date('2025-06-01T12:00:00.000Z')
    const data = auditLogToFirestoreData({
      action: 'delete',
      actorUid: 'user-123',
      createdAt,
      policyNumber: 'POL-001',
      insurerName: 'Seguros Demo',
    })

    expect(data.action).toBe('delete')
    expect(data.actorUid).toBe('user-123')
    expect(data.createdAt).toBeInstanceOf(Timestamp)
    expect(data.policyNumber).toBe('POL-001')
    expect(data.insurerName).toBe('Seguros Demo')
  })
})
