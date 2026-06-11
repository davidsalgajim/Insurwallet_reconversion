import { describe, expect, it } from 'vitest'

import { computePolicyStatus } from './policy-status'

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

  it('returns expiring when end date is within 90 days', () => {
    const endDate = daysFrom(now, 45)

    expect(computePolicyStatus(startDate, endDate, now)).toBe('expiring')
  })

  it('returns expiring when end date is exactly 90 days away', () => {
    const endDate = daysFrom(now, 90)

    expect(computePolicyStatus(startDate, endDate, now)).toBe('expiring')
  })

  it('returns expired when end date has passed', () => {
    const endDate = daysFrom(now, -1)

    expect(computePolicyStatus(startDate, endDate, now)).toBe('expired')
  })

  it('uses the provided now parameter instead of the current date', () => {
    const customNow = new Date('2024-12-01')
    const endDate = new Date('2024-12-15')

    expect(computePolicyStatus(startDate, endDate, customNow)).toBe('expiring')
  })
})
