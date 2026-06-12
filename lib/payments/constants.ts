/** Premium monthly price in Colombian peso cents (29.900 COP). */
export const PREMIUM_MONTHLY_AMOUNT_CENTS = 2_990_000

export const PREMIUM_CURRENCY = 'COP' as const

export function buildSubscriptionReference(uid: string): string {
  return `iw_${uid}_${Date.now()}`
}

export function extractUidFromReference(reference: string): string | undefined {
  const match = /^iw_([A-Za-z0-9]{20,32})_\d+$/.exec(reference)
  return match?.[1]
}
