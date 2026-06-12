'use client'

import { PoliciesEmptyState } from '@/components/policies/empty-state'
import { PolicyCard } from '@/components/policies/policy-card'
import { usePolicies } from '@/hooks/usePolicies'
import { cn } from '@/lib/utils/cn'

type PoliciesListProps = {
  className?: string
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

export function PoliciesList({ className }: PoliciesListProps) {
  const { policies, loading, error, isAuthenticated } = usePolicies()

  if (loading) {
    return <PoliciesListSkeleton />
  }

  if (error) {
    return (
      <div className={cn('px-6 py-16 text-center', className)}>
        <p className="text-sm font-medium text-[var(--primitive-danger)]">
          {error}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Verifica tu conexión o intenta de nuevo más tarde.
        </p>
      </div>
    )
  }

  if (!isAuthenticated || policies.length === 0) {
    return <PoliciesEmptyState className={className} />
  }

  return (
    <div className={cn('space-y-3 p-4 sm:p-6', className)}>
      {policies.map((policy) => (
        <PolicyCard key={policy.id} policy={policy} />
      ))}
    </div>
  )
}
