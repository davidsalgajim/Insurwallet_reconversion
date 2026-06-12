'use client'

import { BellRing, ChevronRight } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useMemo } from 'react'

import {
  DashboardPolicyProvider,
  useDashboardPolicies,
} from '@/components/dashboard/dashboard-summary'
import { AppTopbar } from '@/components/layout/app-topbar'
import { Link } from '@/i18n/navigation'
import { formatPolicyDate } from '@/lib/i18n/format'
import type { PolicyDocument } from '@/lib/firebase/policies'
import {
  computePolicyStatus,
  daysUntilPolicyEnd,
} from '@/lib/utils/policy-status'

function AlertsListSkeleton() {
  return (
    <div className="space-y-3 p-4 sm:p-6">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="h-20 animate-pulse rounded-[var(--radius-inner)] bg-white/50"
        />
      ))}
    </div>
  )
}

type AlertItem = {
  policy: PolicyDocument
  daysRemaining: number
  kind: 'expiring' | 'expired'
}

function AlertsListInner() {
  const t = useTranslations('alerts')
  const locale = useLocale()
  const { policies, loading, error } = useDashboardPolicies()
  const now = useMemo(() => new Date(), [])

  const alertItems = useMemo(() => {
    const items: AlertItem[] = []

    for (const policy of policies) {
      const status = computePolicyStatus(policy.startDate, policy.endDate, now)

      if (status === 'expiring') {
        items.push({
          policy,
          daysRemaining: daysUntilPolicyEnd(policy.endDate, now),
          kind: 'expiring',
        })
      } else if (status === 'expired') {
        items.push({
          policy,
          daysRemaining: daysUntilPolicyEnd(policy.endDate, now),
          kind: 'expired',
        })
      }
    }

    items.sort(
      (a, b) => a.policy.endDate.getTime() - b.policy.endDate.getTime()
    )

    return items
  }, [policies, now])

  if (loading) {
    return <AlertsListSkeleton />
  }

  if (error) {
    return (
      <div className="px-6 py-16 text-center">
        <p className="text-sm font-medium text-[var(--primitive-danger)]">
          {error}
        </p>
      </div>
    )
  }

  if (alertItems.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 px-6 py-20 text-center">
        <div className="icon-circle size-16 bg-white/80 text-muted-foreground">
          <BellRing className="size-7" strokeWidth={1.5} />
        </div>
        <p className="text-lg font-semibold tracking-tight">
          {t('emptyTitle')}
        </p>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          {t('emptyDescription')}
        </p>
      </div>
    )
  }

  return (
    <ul className="divide-y divide-border/60">
      {alertItems.map(({ policy, daysRemaining, kind }) => (
        <li key={policy.id}>
          <Link
            href={`/policies/${policy.id}`}
            className="group flex items-center gap-4 px-4 py-4 transition-colors hover:bg-white/40 sm:px-6"
          >
            <span
              className={
                kind === 'expired'
                  ? 'pill-badge bg-[var(--primitive-danger)]/10 text-[var(--primitive-danger)]'
                  : 'pill-badge bg-[var(--primitive-warning)]/10 text-[var(--primitive-warning)]'
              }
            >
              {kind === 'expired' ? t('expiredBadge') : t('expiringBadge')}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-foreground">
                {policy.insurerName}
              </p>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                {policy.policyNumber}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold text-foreground">
                {kind === 'expired'
                  ? t('expiredDays', { count: Math.abs(daysRemaining) })
                  : t('daysRemaining', { count: daysRemaining })}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatPolicyDate(policy.endDate, locale)}
              </p>
            </div>
            <ChevronRight
              className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
              strokeWidth={1.5}
            />
          </Link>
        </li>
      ))}
    </ul>
  )
}

export function AlertsContent() {
  const t = useTranslations('alerts')

  return (
    <DashboardPolicyProvider>
      <div className="animate-fade-up">
        <AppTopbar title={t('title')} subtitle={t('subtitle')} />
        <section className="glass-panel">
          <AlertsListInner />
        </section>
      </div>
    </DashboardPolicyProvider>
  )
}
