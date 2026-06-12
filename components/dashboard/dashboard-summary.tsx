'use client'

import {
  ArrowRight,
  CalendarClock,
  CalendarRange,
  ChevronRight,
  FileText,
  MessageSquareText,
  Shield,
  Wallet,
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { createContext, useContext, useMemo, type ReactNode } from 'react'

import { StatCard } from '@/components/dashboard/stat-card'
import { Button } from '@/components/ui/button'
import { usePolicies } from '@/hooks/usePolicies'
import { Link } from '@/i18n/navigation'
import { formatPolicyDate } from '@/lib/i18n/format'
import type { PolicyDocument } from '@/lib/firebase/policies'
import {
  EXPIRING_THRESHOLD_DAYS,
  computePolicyStatus,
  daysUntilPolicyEnd,
} from '@/lib/utils/policy-status'
import { cn } from '@/lib/utils/cn'

type RenewalBucket = 30 | 60 | 90

type UpcomingRenewal = {
  policy: PolicyDocument
  daysRemaining: number
  bucket: RenewalBucket
}

type DashboardPolicyContextValue = ReturnType<typeof usePolicies>

const DashboardPolicyContext =
  createContext<DashboardPolicyContextValue | null>(null)

function useDashboardPolicies() {
  const context = useContext(DashboardPolicyContext)
  if (!context) {
    throw new Error(
      'Dashboard summary components must be used within DashboardPolicyProvider'
    )
  }
  return context
}

function getRenewalBucket(daysRemaining: number): RenewalBucket {
  if (daysRemaining <= 30) {
    return 30
  }
  if (daysRemaining <= 60) {
    return 60
  }
  return 90
}

function usePolicyMetrics(policies: PolicyDocument[], now: Date) {
  return useMemo(() => {
    let activeCount = 0
    let expiringCount = 0
    const upcomingRenewals: UpcomingRenewal[] = []

    for (const policy of policies) {
      const status = computePolicyStatus(policy.startDate, policy.endDate, now)

      if (status === 'active') {
        activeCount += 1
      } else if (status === 'expiring') {
        expiringCount += 1
        const daysRemaining = daysUntilPolicyEnd(policy.endDate, now)
        upcomingRenewals.push({
          policy,
          daysRemaining,
          bucket: getRenewalBucket(daysRemaining),
        })
      }
    }

    upcomingRenewals.sort(
      (a, b) => a.policy.endDate.getTime() - b.policy.endDate.getTime()
    )

    return { activeCount, expiringCount, upcomingRenewals }
  }, [policies, now])
}

function SummarySkeleton() {
  return (
    <>
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="glass-panel h-[132px] animate-pulse p-5 sm:h-[140px]"
        >
          <div className="size-11 rounded-full bg-white/50" />
          <div className="mt-4 h-4 w-24 rounded bg-white/50" />
          <div className="mt-2 h-8 w-16 rounded bg-white/50" />
        </div>
      ))}
    </>
  )
}

function UpcomingSkeleton() {
  return (
    <div className="space-y-3 px-4 py-6 sm:px-6">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="h-16 animate-pulse rounded-[var(--radius-inner)] bg-white/50"
        />
      ))}
    </div>
  )
}

type DashboardPolicyProviderProps = {
  children: ReactNode
}

export function DashboardPolicyProvider({
  children,
}: DashboardPolicyProviderProps) {
  const value = usePolicies()

  return (
    <DashboardPolicyContext.Provider value={value}>
      {children}
    </DashboardPolicyContext.Provider>
  )
}

export function DashboardSummary() {
  const t = useTranslations('dashboard')
  const { policies, loading, error } = useDashboardPolicies()
  const now = useMemo(() => new Date(), [])
  const { activeCount, expiringCount } = usePolicyMetrics(policies, now)

  if (loading) {
    return <SummarySkeleton />
  }

  if (error) {
    return (
      <div className="glass-panel col-span-full px-5 py-4 text-sm text-[var(--primitive-danger)]">
        {error}
      </div>
    )
  }

  return (
    <>
      <StatCard
        label={t('activePolicies')}
        value={String(activeCount)}
        icon={Shield}
        tone="success"
        hint={t('summary')}
      />
      <StatCard
        label={t('expiringSoon')}
        value={String(expiringCount)}
        icon={CalendarClock}
        tone="warning"
        hint={t('expiringHint', { days: EXPIRING_THRESHOLD_DAYS })}
      />
      <StatCard
        label={t('totalPremium')}
        value="—"
        icon={Wallet}
        tone="primary"
        hint={t('premiumHint')}
      />
      <StatCard
        label={t('marianaQueries')}
        value="0"
        icon={MessageSquareText}
        tone="accent"
        hint={t('marianaStatHint')}
      />
    </>
  )
}

type RenewalRowProps = {
  renewal: UpcomingRenewal
}

function RenewalRow({ renewal }: RenewalRowProps) {
  const { policy, daysRemaining } = renewal
  const locale = useLocale()
  const t = useTranslations('dashboard')

  return (
    <Link
      href={`/policies/${policy.id}`}
      className="group flex items-center gap-4 px-4 py-3 transition-colors hover:bg-white/40 sm:px-6"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground">
          {policy.insurerName}
        </p>
        <p className="mt-0.5 inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
          <CalendarRange className="size-3.5 shrink-0" strokeWidth={1.5} />
          {policy.policyNumber}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold text-foreground">
          {t('daysRemaining', { count: daysRemaining })}
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
  )
}

const BUCKET_ORDER: RenewalBucket[] = [30, 60, 90]

export function DashboardUpcomingRenewals() {
  const t = useTranslations('dashboard')
  const { policies, loading, error } = useDashboardPolicies()
  const now = useMemo(() => new Date(), [])
  const { upcomingRenewals } = usePolicyMetrics(policies, now)

  const renewalsByBucket = useMemo(() => {
    const grouped: Record<RenewalBucket, UpcomingRenewal[]> = {
      30: [],
      60: [],
      90: [],
    }

    for (const renewal of upcomingRenewals) {
      grouped[renewal.bucket].push(renewal)
    }

    return grouped
  }, [upcomingRenewals])

  return (
    <section
      className="glass-panel lg:col-span-7"
      aria-labelledby="upcoming-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-4 py-3 sm:px-6 sm:py-4">
        <h2 id="upcoming-heading" className="font-semibold text-foreground">
          {t('upcoming')}
        </h2>
        <span className="pill-badge bg-[var(--primitive-accent-soft)]/20 text-primary">
          {t('renewalWindow')}
        </span>
      </div>

      {loading ? (
        <UpcomingSkeleton />
      ) : error ? (
        <div className="px-4 py-10 text-center sm:px-6">
          <p className="text-sm font-medium text-[var(--primitive-danger)]">
            {error}
          </p>
        </div>
      ) : upcomingRenewals.length === 0 ? (
        <div className="flex flex-col items-center gap-5 px-4 py-10 text-center sm:px-6 sm:py-12">
          <div className="icon-circle size-16 stat-icon-primary border-0">
            <FileText className="size-7" strokeWidth={1.5} />
          </div>
          <div className="max-w-sm space-y-2">
            <p className="text-lg font-semibold">
              {policies.length === 0
                ? t('emptyTitle')
                : t('noUpcomingRenewals')}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {policies.length === 0
                ? t('emptyDesc')
                : t('noUpcomingRenewalsDesc')}
            </p>
          </div>
          {policies.length === 0 ? (
            <Button
              asChild
              size="lg"
              variant="ink"
              className="rounded-[var(--radius-pill)]"
            >
              <Link href="/policies/new">
                {t('addPolicy')}
                <ArrowRight className="size-4" strokeWidth={1.5} />
              </Link>
            </Button>
          ) : (
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="rounded-[var(--radius-pill)]"
            >
              <Link href="/policies">
                {t('viewAllPolicies')}
                <ArrowRight className="size-4" strokeWidth={1.5} />
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-border/60">
          {BUCKET_ORDER.map((bucket) => {
            const items = renewalsByBucket[bucket]
            if (items.length === 0) {
              return null
            }

            return (
              <div key={bucket}>
                <div className="flex items-center justify-between bg-white/30 px-4 py-2.5 sm:px-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t('daysBucket', { count: bucket })}
                  </p>
                  <span className="pill-badge bg-white/60 text-muted-foreground">
                    {items.length}
                  </span>
                </div>
                <div className={cn('divide-y divide-border/40')}>
                  {items.map((renewal) => (
                    <RenewalRow key={renewal.policy.id} renewal={renewal} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
