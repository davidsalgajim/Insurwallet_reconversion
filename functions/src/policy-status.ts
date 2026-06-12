/**
 * Mirror of lib/utils/policy-status.ts — keep in sync when changing status rules.
 */

export type PolicyStatus = 'active' | 'expiring' | 'expired'

export const EXPIRING_THRESHOLD_DAYS = 90
const MS_PER_DAY = 1000 * 60 * 60 * 24

export function daysUntilPolicyEnd(
  endDate: Date,
  now: Date = new Date()
): number {
  return Math.ceil((endDate.getTime() - now.getTime()) / MS_PER_DAY)
}

export function computePolicyStatus(
  _startDate: Date,
  endDate: Date,
  now: Date = new Date()
): PolicyStatus {
  if (now > endDate) {
    return 'expired'
  }

  const daysUntilEnd = daysUntilPolicyEnd(endDate, now)

  if (daysUntilEnd <= EXPIRING_THRESHOLD_DAYS) {
    return 'expiring'
  }

  return 'active'
}
