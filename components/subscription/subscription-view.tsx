'use client'

import { Crown, Sparkles } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'

import { AppTopbar } from '@/components/layout/app-topbar'
import { useUserSubscription } from '@/lib/subscription/gates'
import { startPremiumCheckout } from '@/lib/subscription/checkout'
import { getClientFeatureFlags } from '@/lib/feature-flags'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import type { BillingInterval } from '@/lib/schemas/user'
import {
  PREMIUM_ANNUAL_AMOUNT_CENTS,
  PREMIUM_MONTHLY_AMOUNT_CENTS,
} from '@/lib/payments/constants'
import { cn } from '@/lib/utils/cn'

function formatIntervalPrice(
  locale: string,
  interval: BillingInterval
): string {
  const cents =
    interval === 'annual'
      ? PREMIUM_ANNUAL_AMOUNT_CENTS
      : PREMIUM_MONTHLY_AMOUNT_CENTS
  const amount = cents / 100
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function SubscriptionView() {
  const t = useTranslations('subscription.page')
  const locale = useLocale()
  const searchParams = useSearchParams()
  const { subscription, loading, refresh } = useUserSubscription()
  const [checkingOut, setCheckingOut] = useState(false)
  const [canceling, setCanceling] = useState(false)
  const [savingInterval, setSavingInterval] = useState(false)
  const [billingIntervalOverride, setBillingIntervalOverride] =
    useState<BillingInterval | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const flags = getClientFeatureFlags()
  const returned = searchParams.get('status') === 'return'

  const isPremium =
    subscription?.plan === 'premium' &&
    (subscription.status === 'active' || subscription.status === 'trialing')

  async function handleCheckout() {
    setCheckingOut(true)
    setError(null)

    try {
      await startPremiumCheckout('/settings/subscription')
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : t('checkoutError')
      )
      setCheckingOut(false)
      await refresh()
    }
  }

  async function handleCancel() {
    setCanceling(true)
    setError(null)
    setStatusMessage(null)

    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
      })
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string
        } | null
        throw new Error(body?.error ?? t('cancelError'))
      }
      setStatusMessage(t('cancelSuccess'))
      await refresh()
    } catch (cancelError) {
      setError(
        cancelError instanceof Error ? cancelError.message : t('cancelError')
      )
    } finally {
      setCanceling(false)
    }
  }

  async function handleBillingIntervalChange(next: BillingInterval) {
    setBillingIntervalOverride(next)
    setSavingInterval(true)
    setError(null)
    setStatusMessage(null)

    try {
      const response = await fetch('/api/subscription/billing-interval', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingInterval: next }),
      })
      if (!response.ok) {
        throw new Error(t('intervalError'))
      }
      const body = (await response.json()) as {
        annualCheckoutAvailable: boolean
      }
      setStatusMessage(
        next === 'annual' && !body.annualCheckoutAvailable
          ? t('annualScaffoldNote')
          : t('intervalSaved')
      )
      await refresh()
    } catch (intervalError) {
      setError(
        intervalError instanceof Error
          ? intervalError.message
          : t('intervalError')
      )
      setBillingIntervalOverride(null)
    } finally {
      setSavingInterval(false)
    }
  }

  const billingInterval =
    billingIntervalOverride ?? subscription?.billingInterval ?? 'monthly'

  const features = [
    t('features.unlimitedPolicies'),
    t('features.mariana'),
    t('features.cloudExtraction'),
    t('features.prioritySupport'),
  ] as const

  return (
    <div className="animate-fade-up">
      <AppTopbar title={t('title')} subtitle={t('subtitle')} />

      <div className="mx-auto w-full max-w-2xl space-y-6">
        {returned ? (
          <div
            className="rounded-[var(--radius-inner)] border border-border bg-white/80 px-4 py-3 text-sm text-muted-foreground"
            role="status"
          >
            {t('returnMessage')}
          </div>
        ) : null}

        {error ? (
          <div
            className="rounded-[var(--radius-inner)] border border-[var(--primitive-danger)]/30 bg-[var(--primitive-danger)]/5 px-4 py-3 text-sm text-[var(--primitive-danger)]"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        {statusMessage ? (
          <div
            className="rounded-[var(--radius-inner)] border border-border bg-white/80 px-4 py-3 text-sm text-muted-foreground"
            role="status"
          >
            {statusMessage}
          </div>
        ) : null}

        <section className="glass-panel overflow-hidden">
          <div className="border-b border-border/60 bg-primary/5 px-6 py-5">
            <div className="flex items-start gap-3">
              <span className="icon-circle size-11 shrink-0 border-0 bg-primary/10 text-primary">
                <Crown className="size-5" strokeWidth={1.5} />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                  {t('planBadge')}
                </p>
                <h2 className="text-xl font-semibold tracking-tight">
                  {t('planName')}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatIntervalPrice(locale, billingInterval)}
                  <span className="text-muted-foreground">
                    {' '}
                    /{' '}
                    {billingInterval === 'annual'
                      ? t('perYear')
                      : t('perMonth')}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5 p-6">
            <div>
              <p className="mb-2 text-sm font-medium">{t('billingInterval')}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {(['monthly', 'annual'] as const).map((interval) => (
                  <button
                    key={interval}
                    type="button"
                    disabled={savingInterval || loading}
                    onClick={() => void handleBillingIntervalChange(interval)}
                    className={cn(
                      'rounded-xl border px-3 py-3 text-left text-sm transition',
                      billingInterval === interval
                        ? 'border-primary bg-primary/5'
                        : 'border-border/60 bg-white/50 hover:bg-white/70'
                    )}
                  >
                    <span className="font-medium">
                      {interval === 'monthly' ? t('monthly') : t('annual')}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {formatIntervalPrice(locale, interval)} /{' '}
                      {interval === 'monthly' ? t('perMonth') : t('perYear')}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <ul className="space-y-2.5">
              {features.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-sm">
                  <Sparkles
                    className="mt-0.5 size-4 shrink-0 text-[var(--color-accent)]"
                    strokeWidth={1.5}
                  />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="rounded-[var(--radius-inner)] border border-border/60 bg-white/50 px-4 py-3 text-sm text-muted-foreground">
              {loading
                ? t('loading')
                : isPremium
                  ? t('activeMessage')
                  : t('freeMessage')}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button
                type="button"
                className="rounded-[var(--radius-pill)]"
                disabled={!flags.paymentsEnabled || checkingOut || isPremium}
                onClick={() => void handleCheckout()}
              >
                {checkingOut
                  ? t('redirecting')
                  : isPremium
                    ? t('alreadyPremium')
                    : t('cta')}
              </Button>
              {isPremium ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="rounded-[var(--radius-pill)]"
                  disabled={canceling}
                  onClick={() => void handleCancel()}
                >
                  {canceling ? t('canceling') : t('cancel')}
                </Button>
              ) : null}
              <Button
                asChild
                variant="secondary"
                className="rounded-[var(--radius-pill)]"
              >
                <Link href="/settings">{t('backToSettings')}</Link>
              </Button>
            </div>

            {!flags.paymentsEnabled ? (
              <p className={cn('text-xs text-muted-foreground')}>
                {t('paymentsDisabled')}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {t('sandboxNote')}
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
