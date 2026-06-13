'use client'

import { CalendarRange, ChevronRight, Users } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import { PolicyStatusBadge } from '@/components/policies/policy-status-badge'
import { Link } from '@/i18n/navigation'
import type { PolicyDocument } from '@/lib/firebase/policies'
import { formatPolicyDate } from '@/lib/i18n/format'
import { cn } from '@/lib/utils/cn'

type SharedPolicyCardProps = {
  policy: PolicyDocument
  className?: string
}

export function SharedPolicyCard({ policy, className }: SharedPolicyCardProps) {
  const locale = useLocale()
  const t = useTranslations('policies.sharedWithMe')

  return (
    <Link
      href={`/policies/${policy.id}`}
      className={cn(
        'glass-panel group flex flex-col gap-4 p-5 transition-transform duration-200 hover:-translate-y-0.5',
        className
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold tracking-tight">
              {policy.insurerName}
            </h3>
            <PolicyStatusBadge status={policy.status} />
            <span className="pill-badge bg-[var(--primitive-cyan)]/10 text-[var(--primitive-cyan)]">
              {t('badge')}
            </span>
          </div>
          <p className="font-mono text-sm text-muted-foreground">
            {policy.policyNumber}
          </p>
          <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarRange className="size-3.5 shrink-0" strokeWidth={1.5} />
            {policy.hasNoExpiration
              ? t('noExpiration')
              : `${formatPolicyDate(policy.startDate, locale)} — ${formatPolicyDate(policy.endDate, locale)}`}
          </p>
        </div>
        <ChevronRight
          className="size-5 shrink-0 self-end text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 sm:self-center"
          strokeWidth={1.5}
        />
      </div>
      <div className="flex items-center gap-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">
        <Users className="size-3.5 shrink-0" strokeWidth={1.5} />
        <span>{t('sharedAccess')}</span>
      </div>
    </Link>
  )
}
