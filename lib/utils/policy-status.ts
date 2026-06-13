import type { PolicyStatus } from '@/lib/schemas/policy'

export const EXPIRING_THRESHOLD_DAYS = 90
const MS_PER_DAY = 1000 * 60 * 60 * 24

export type PolicyStatusInput = {
  startDate: Date
  endDate: Date
}

export function daysUntilPolicyEnd(
  endDate: Date,
  now: Date = new Date()
): number {
  return Math.ceil((endDate.getTime() - now.getTime()) / MS_PER_DAY)
}

export function computePolicyStatus(
  _startDate: Date,
  endDate: Date,
  now: Date = new Date(),
  hasNoExpiration = false
): PolicyStatus {
  if (hasNoExpiration) {
    return 'active'
  }

  if (now > endDate) {
    return 'expired'
  }

  const daysUntilEnd = daysUntilPolicyEnd(endDate, now)

  if (daysUntilEnd <= EXPIRING_THRESHOLD_DAYS) {
    return 'expiring'
  }

  return 'active'
}

export function resolvePolicyStatus<T extends PolicyStatusInput>(
  policy: T & { hasNoExpiration?: boolean },
  now: Date = new Date()
): PolicyStatus {
  return computePolicyStatus(
    policy.startDate,
    policy.endDate,
    now,
    policy.hasNoExpiration
  )
}
