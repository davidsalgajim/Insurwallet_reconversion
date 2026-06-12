'use client'

import { useTranslations } from 'next-intl'

import { PoliciesEmptyState } from '@/components/policies/empty-state'
import { PolicyCard } from '@/components/policies/policy-card'
import { usePolicies } from '@/hooks/usePolicies'
import { filterPoliciesByQuery } from '@/lib/utils/filter-policies'
import { cn } from '@/lib/utils/cn'

type PoliciesListProps = {
  className?: string
  searchQuery?: string
}

function PoliciesListSkeleton() {
  return (
    <div className="space-y-3 p-4 sm:p-6">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="h-24 animate-pulse rounded-[var(--radius-inner)] bg-white/50"
        />
      ))}
    </div>
  )
}

export function PoliciesList({
  className,
  searchQuery = '',
}: PoliciesListProps) {
  const t = useTranslations('policies.errors')
  const tList = useTranslations('policies')
  const { policies, loading, error, isAuthenticated } = usePolicies()
  const filteredPolicies = filterPoliciesByQuery(policies, searchQuery)

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

  if (!isAuthenticated || policies.length === 0) {
    return <PoliciesEmptyState className={className} />
  }

  if (filteredPolicies.length === 0) {
    return (
      <div className={cn('px-6 py-16 text-center', className)}>
        <p className="text-sm font-medium text-foreground">
          {tList('searchEmptyTitle')}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {tList('searchEmptyDesc')}
        </p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-3 p-4 sm:p-6', className)}>
      {filteredPolicies.map((policy) => (
        <PolicyCard key={policy.id} policy={policy} />
      ))}
    </div>
  )
}
