'use client'

import { useRouter } from '@/i18n/navigation'
import { getClientFeatureFlags } from '@/lib/feature-flags'
import { PREMIUM_MONTHLY_AMOUNT_CENTS } from '@/lib/payments/constants'

export async function startPremiumCheckout(
  returnPath = '/settings/subscription'
): Promise<void> {
  const flags = getClientFeatureFlags()

  if (!flags.paymentsEnabled) {
    throw new Error('Payments are disabled')
  }

  const returnUrl = `${window.location.origin}${returnPath}?status=return`

  const response = await fetch('/api/payments/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ returnUrl }),
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string
    } | null
    throw new Error(body?.error ?? 'Checkout failed')
  }

  const payload = (await response.json()) as { checkoutUrl?: string }

  if (!payload.checkoutUrl) {
    throw new Error('Missing checkout URL')
  }

  window.location.assign(payload.checkoutUrl)
}

export function formatPremiumPrice(locale: string): string {
  const amount = PREMIUM_MONTHLY_AMOUNT_CENTS / 100
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function usePremiumCheckout() {
  const router = useRouter()

  return {
    startCheckout: async (returnPath?: string) => {
      try {
        await startPremiumCheckout(returnPath)
      } catch {
        router.push('/settings/subscription')
      }
    },
  }
}
