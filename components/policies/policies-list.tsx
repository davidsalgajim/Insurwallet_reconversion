'use client'

import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'

import { PoliciesEmptyState } from '@/components/policies/empty-state'
import { PoliciesListFiltersBar } from '@/components/policies/policies-list-filters-bar'
import { PolicyCard } from '@/components/policies/policy-card'
import { PoliciesListSkeleton } from '@/components/policies/policies-list-skeleton'
import { SharedPolicyCard } from '@/components/policies/shared-policy-card'
import { usePolicyLabels } from '@/hooks/use-policy-labels'
import { usePolicies } from '@/hooks/usePolicies'
import { Link } from '@/i18n/navigation'
import {
  applyPolicyListFilters,
  countPoliciesByType,
  DEFAULT_POLICY_LIST_FILTERS,
  groupPoliciesByType,
  hasActivePolicyListFilters,
  type PolicyListFilters,
} from '@/lib/policies/list-filters'
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
  const tFilters = useTranslations('policies.list.filters')
  const { policyType } = usePolicyLabels()
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') === 'shared' ? 'shared' : 'owned'
  const [activeTab, setActiveTab] = useState<PoliciesTab>(initialTab)
  const [filters, setFilters] = useState<PolicyListFilters>(
    DEFAULT_POLICY_LIST_FILTERS
  )
  const { ownedPolicies, sharedPolicies, loading, error, isAuthenticated } =
    usePolicies()

  const tabPolicies = activeTab === 'owned' ? ownedPolicies : sharedPolicies

  const searchFiltered = useMemo(
    () => filterPoliciesByQuery(tabPolicies, searchQuery),
    [tabPolicies, searchQuery]
  )

  const typeCounts = useMemo(
    () => countPoliciesByType(searchFiltered),
    [searchFiltered]
  )

  const filteredPolicies = useMemo(
    () => applyPolicyListFilters(searchFiltered, filters),
    [searchFiltered, filters]
  )

  const groupedPolicies = useMemo(
    () => groupPoliciesByType(filteredPolicies),
    [filteredPolicies]
  )

  const filtersActive = hasActivePolicyListFilters(filters)

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

  const totalPolicies = tabPolicies.length
  const showFilters = totalPolicies > 0

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

      {showFilters ? (
        <PoliciesListFiltersBar
          filters={filters}
          typeCounts={typeCounts}
          totalCount={searchFiltered.length}
          onFiltersChange={setFilters}
        />
      ) : null}

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
      ) : filteredPolicies.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <p className="text-sm font-medium text-foreground">
            {filtersActive ? tFilters('emptyTitle') : tList('searchEmptyTitle')}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {filtersActive ? tFilters('emptyDesc') : tList('searchEmptyDesc')}
          </p>
          {filtersActive ? (
            <button
              type="button"
              className="mt-4 text-sm font-semibold text-primary hover:underline"
              onClick={() => setFilters(DEFAULT_POLICY_LIST_FILTERS)}
            >
              {tFilters('clear')}
            </button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-6 p-4 sm:p-6">
          {groupedPolicies.map((group) => (
            <section key={group.type} aria-label={policyType(group.type)}>
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <h3 className="text-sm font-semibold tracking-tight text-foreground">
                  {policyType(group.type)}
                </h3>
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  {tList('list.group.count', { count: group.policies.length })}
                </span>
              </div>
              <div className="space-y-3">
                {activeTab === 'owned'
                  ? group.policies.map((policy) => (
                      <PolicyCard key={policy.id} policy={policy} />
                    ))
                  : group.policies.map((policy) => (
                      <SharedPolicyCard key={policy.id} policy={policy} />
                    ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
