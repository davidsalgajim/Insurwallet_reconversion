import { describe, expect, it } from 'vitest'

import {
  EXPIRING_THRESHOLD_DAYS,
  computePolicyStatus,
  daysUntilPolicyEnd,
  resolvePolicyStatus,
} from './policy-status'

function daysFrom(base: Date, days: number): Date {
  const result = new Date(base)
  result.setDate(result.getDate() + days)
  return result
}

describe('computePolicyStatus', () => {
  const startDate = new Date('2025-01-01')
  const now = new Date('2025-06-01')

  it('returns active when end date is more than 90 days away', () => {
    const endDate = daysFrom(now, 120)

    expect(computePolicyStatus(startDate, endDate, now)).toBe('active')
  })

  it('returns active when end date is exactly 91 days away', () => {
    const endDate = daysFrom(now, 91)

    expect(computePolicyStatus(startDate, endDate, now)).toBe('active')
  })

  it('returns expiring when end date is within 90 days', () => {
    const endDate = daysFrom(now, 45)

    expect(computePolicyStatus(startDate, endDate, now)).toBe('expiring')
  })

  it('returns expiring when end date is exactly 90 days away', () => {
    const endDate = daysFrom(now, 90)

    expect(computePolicyStatus(startDate, endDate, now)).toBe('expiring')
  })

  it('returns expiring when end date is today', () => {
    const endDate = new Date(now)

    expect(computePolicyStatus(startDate, endDate, now)).toBe('expiring')
  })

  it('returns expired when end date has passed', () => {
    const endDate = daysFrom(now, -1)

    expect(computePolicyStatus(startDate, endDate, now)).toBe('expired')
  })

  it('returns expired when end date passed long ago', () => {
    const endDate = new Date('2024-01-01')

    expect(computePolicyStatus(startDate, endDate, now)).toBe('expired')
  })

  it('uses the provided now parameter instead of the current date', () => {
    const customNow = new Date('2024-12-01')
    const endDate = new Date('2024-12-15')

    expect(computePolicyStatus(startDate, endDate, customNow)).toBe('expiring')
  })

  it('ignores start date when coverage has not started yet', () => {
    const futureStart = new Date('2026-01-01')
    const endDate = new Date('2027-01-01')

    expect(computePolicyStatus(futureStart, endDate, now)).toBe('active')
  })

  it('returns active when policy has no expiration flag', () => {
    const endDate = daysFrom(now, -30)

    expect(computePolicyStatus(startDate, endDate, now, true)).toBe('active')
  })

  it('exposes a 90-day expiring threshold constant', () => {
    expect(EXPIRING_THRESHOLD_DAYS).toBe(90)
  })
})

describe('daysUntilPolicyEnd', () => {
  it('returns ceil of remaining days', () => {
    const now = new Date('2025-06-01T12:00:00.000Z')
    const endDate = new Date('2025-06-03T00:00:00.000Z')

    expect(daysUntilPolicyEnd(endDate, now)).toBe(2)
  })
})

describe('resolvePolicyStatus', () => {
  it('derives status from policy dates', () => {
    const now = new Date('2025-06-01')

    expect(
      resolvePolicyStatus(
        {
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-01'),
        },
        now
      )
    ).toBe('active')
  })
})
