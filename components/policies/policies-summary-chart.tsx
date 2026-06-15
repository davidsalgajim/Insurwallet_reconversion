'use client'

import {
  Briefcase,
  Car,
  Heart,
  HeartPulse,
  Home,
  MoreHorizontal,
  PawPrint,
  Plane,
  Shield,
  Smile,
  type LucideIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

import { usePolicyLabels } from '@/hooks/use-policy-labels'
import type { PolicyTypeCount } from '@/lib/policies/list-filters'
import type { PolicyType } from '@/lib/schemas/policy'
import { cn } from '@/lib/utils/cn'

const POLICY_TYPE_ICONS: Record<PolicyType, LucideIcon> = {
  life: Heart,
  health: HeartPulse,
  auto: Car,
  home: Home,
  travel: Plane,
  pet: PawPrint,
  funeral: Shield,
  dental: Smile,
  business: Briefcase,
  other: MoreHorizontal,
}

type PoliciesSummaryChartProps = {
  typeCounts: PolicyTypeCount[]
  totalCount: number
  activeType: PolicyType | 'all'
  onTypeSelect: (type: PolicyType) => void
  className?: string
}

export function PoliciesSummaryChart({
  typeCounts,
  totalCount,
  activeType,
  onTypeSelect,
  className,
}: PoliciesSummaryChartProps) {
  const t = useTranslations('policies.list.summary')
  const { policyType } = usePolicyLabels()

  const maxCount = useMemo(
    () => Math.max(1, ...typeCounts.map((entry) => entry.count)),
    [typeCounts]
  )

  if (typeCounts.length === 0) {
    return null
  }

  return (
    <section
      className={cn('elevated-card overflow-hidden', className)}
      aria-labelledby="policies-summary-heading"
    >
      <div className="grid gap-0 sm:grid-cols-[minmax(9rem,11rem)_1fr]">
        <div className="flex flex-col justify-center gap-3 border-b border-border/60 bg-gradient-to-br from-primary/6 via-transparent to-transparent p-5 sm:border-b-0 sm:border-r">
          <div className="icon-circle stat-icon-primary size-11 border-0">
            <Shield className="size-5" strokeWidth={1.75} aria-hidden />
          </div>
          <div>
            <p
              id="policies-summary-heading"
              className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              {t('totalLabel')}
            </p>
            <p className="mt-1 font-mono text-4xl font-bold tabular-nums tracking-tight text-primary">
              {totalCount}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {t('total', { count: totalCount })}
            </p>
          </div>
        </div>

        <div
          className="space-y-2 p-4 sm:p-5"
          role="group"
          aria-label={t('aria')}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('heading')}
          </p>
          <ul className="space-y-2">
            {typeCounts.map(({ type, count }) => {
              const Icon = POLICY_TYPE_ICONS[type]
              const active = activeType === type
              const widthPct = Math.round((count / maxCount) * 100)

              return (
                <li key={type}>
                  <button
                    type="button"
                    aria-pressed={active}
                    aria-label={t('filterByType', {
                      type: policyType(type),
                      count,
                    })}
                    onClick={() => onTypeSelect(type)}
                    className={cn(
                      'group flex w-full items-center gap-3 rounded-[var(--radius-inner)] px-2 py-1.5 text-left transition-colors duration-200',
                      'hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
                      active && 'bg-primary/8 ring-1 ring-primary/25'
                    )}
                  >
                    <span
                      className={cn(
                        'icon-circle size-8 shrink-0 border-0',
                        active
                          ? 'stat-icon-primary'
                          : 'bg-muted/80 text-muted-foreground'
                      )}
                    >
                      <Icon
                        className="size-3.5"
                        strokeWidth={1.75}
                        aria-hidden
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-medium text-foreground sm:text-sm">
                          {policyType(type)}
                        </span>
                        <span className="shrink-0 font-mono text-xs font-semibold tabular-nums text-foreground">
                          {count}
                        </span>
                      </span>
                      <span
                        className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-muted"
                        aria-hidden
                      >
                        <span
                          className={cn(
                            'block h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none',
                            active
                              ? 'bg-primary'
                              : 'bg-primary/45 group-hover:bg-primary/65'
                          )}
                          style={{ width: `${widthPct}%` }}
                        />
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}
