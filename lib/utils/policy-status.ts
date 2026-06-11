import type { PolicyStatus } from '@/lib/schemas/policy'

const EXPIRING_THRESHOLD_DAYS = 90
const MS_PER_DAY = 1000 * 60 * 60 * 24

export function computePolicyStatus(
  _startDate: Date,
  endDate: Date,
  now: Date = new Date()
): PolicyStatus {
  if (now > endDate) {
    return 'expired'
  }

  const daysUntilEnd = (endDate.getTime() - now.getTime()) / MS_PER_DAY

  if (daysUntilEnd <= EXPIRING_THRESHOLD_DAYS) {
    return 'expiring'
  }

  return 'active'
}
