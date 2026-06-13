'use client'

import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'

import { PoliciesEmptyState } from '@/components/policies/empty-state'
import { PolicyCard } from '@/components/policies/policy-card'
import { PoliciesListSkeleton } from '@/components/policies/policies-list-skeleton'
import { SharedPolicyCard } from '@/components/policies/shared-policy-card'
import { usePolicies } from '@/hooks/usePolicies'
import { Link } from '@/i18n/navigation'
import { filterPoliciesByQuery } from '@/lib/utils/filter-policies'
import { cn } from '@/lib/utils/cn'

type PoliciesListProps = {
  className?: string
  searchQuery?: string
}

type PoliciesTab = 'owned' | 'shared'

export function PoliciesList({
  className,
  searchQuery = '',
}: PoliciesListProps) {
  const t = useTranslations('policies.errors')
  const tList = useTranslations('policies')
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') === 'shared' ? 'shared' : 'owned'
  const [activeTab, setActiveTab] = useState<PoliciesTab>(initialTab)
  const { ownedPolicies, sharedPolicies, loading, error, isAuthenticated } =
    usePolicies()

  const filteredOwned = useMemo(
    () => filterPoliciesByQuery(ownedPolicies, searchQuery),
    [ownedPolicies, searchQuery]
  )
  const filteredShared = useMemo(
    () => filterPoliciesByQuery(sharedPolicies, searchQuery),
    [sharedPolicies, searchQuery]
  )

  if (loading) {
    return <PoliciesListSkeleton />
  }

  if (error) {
    return (
      <div className={cn('px-6 py-16 text-center', className)}>
        <p className="text-sm font-medium text-[var(--primitive-danger)]">
          {error}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">{t('retryHint')}</p>
      </div>
    )
  }

  const activePolicies = activeTab === 'owned' ? filteredOwned : filteredShared
  const totalPolicies =
    activeTab === 'owned' ? ownedPolicies.length : sharedPolicies.length

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-4 py-4 sm:px-6">
        <div
          role="tablist"
          aria-label={tList('tabs.aria')}
          className="inline-flex gap-1 rounded-[var(--radius-pill)] bg-white/45 p-1 ring-1 ring-border"
        >
          {(['owned', 'shared'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              className={cn(
                'rounded-[var(--radius-pill)] px-3 py-2 text-xs font-semibold transition-colors sm:px-4 sm:text-sm',
                activeTab === tab
                  ? 'bg-[var(--primitive-ink)] text-white shadow-md'
                  : 'text-muted-foreground hover:bg-white/70 hover:text-foreground'
              )}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'owned'
                ? tList('tabs.owned')
                : tList('tabs.sharedWithMe')}
            </button>
          ))}
        </div>
        <Link
          href="/policies/benefits"
          className="text-xs font-semibold text-primary hover:underline sm:text-sm"
        >
          {tList('benefits.link')}
        </Link>
      </div>

      {!isAuthenticated || totalPolicies === 0 ? (
        activeTab === 'owned' ? (
          <PoliciesEmptyState />
        ) : (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium text-foreground">
              {tList('sharedWithMe.emptyTitle')}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {tList('sharedWithMe.emptyDesc')}
            </p>
          </div>
        )
      ) : activePolicies.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <p className="text-sm font-medium text-foreground">
            {tList('searchEmptyTitle')}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {tList('searchEmptyDesc')}
          </p>
        </div>
      ) : (
        <div className="space-y-3 p-4 sm:p-6">
          {activeTab === 'owned'
            ? activePolicies.map((policy) => (
                <PolicyCard key={policy.id} policy={policy} />
              ))
            : activePolicies.map((policy) => (
                <SharedPolicyCard key={policy.id} policy={policy} />
              ))}
        </div>
      )}
    </div>
  )
}
