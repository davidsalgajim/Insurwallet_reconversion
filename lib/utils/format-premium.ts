import type { PaymentFrequency } from '@/lib/schemas/policy'
import type { PolicyDocument } from '@/lib/firebase/policies'

const MONTHLY_MULTIPLIER: Record<PaymentFrequency, number> = {
  monthly: 1,
  quarterly: 1 / 3,
  semi_annual: 1 / 6,
  annual: 1 / 12,
  single: 0,
}

export function calculateMonthlyPremiumTotal(
  policies: PolicyDocument[]
): number | null {
  let total = 0
  let hasRecurringPremium = false

  for (const policy of policies) {
    if (policy.premium <= 0) {
      continue
    }

    const multiplier = MONTHLY_MULTIPLIER[policy.paymentFrequency]

    if (multiplier === 0) {
      continue
    }

    total += policy.premium * multiplier
    hasRecurringPremium = true
  }

  return hasRecurringPremium ? total : null
}

export function formatPremiumAmount(
  amount: number,
  currency: string,
  locale: string
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}
