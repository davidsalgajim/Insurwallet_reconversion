'use client'

import { Crown, Sparkles } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'

import { AppTopbar } from '@/components/layout/app-topbar'
import { useUserSubscription } from '@/lib/subscription/gates'
import {
  formatPremiumPrice,
  startPremiumCheckout,
} from '@/lib/subscription/checkout'
import { getClientFeatureFlags } from '@/lib/feature-flags'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils/cn'

export function SubscriptionView() {
  const t = useTranslations('subscription.page')
  const locale = useLocale()
  const searchParams = useSearchParams()
  const { subscription, loading, refresh } = useUserSubscription()
  const [checkingOut, setCheckingOut] = useState(false)
  const [error, setError] = useState<string | null>(null)
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
                  {formatPremiumPrice(locale)}
                  <span className="text-muted-foreground">
                    {' '}
                    / {t('perMonth')}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5 p-6">
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

            <div className="flex flex-col gap-3 sm:flex-row">
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
