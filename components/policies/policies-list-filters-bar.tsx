'use client'

import { ChevronDown, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'

import { PoliciesSummaryChart } from '@/components/policies/policies-summary-chart'
import { POLICY_TYPE_VALUES, usePolicyLabels } from '@/hooks/use-policy-labels'
import type { PolicyTypeCount } from '@/lib/policies/list-filters'
import {
  POLICY_STATUS_ORDER,
  hasActivePolicyListFilters,
  type PolicyListFilters,
  type PolicyStatusFilter,
  type PolicyTypeFilter,
} from '@/lib/policies/list-filters'
import type { PolicyType } from '@/lib/schemas/policy'
import { cn } from '@/lib/utils/cn'

const filterSelectClassName =
  'h-9 w-full min-w-[9.5rem] appearance-none rounded-[var(--radius-inner)] border border-border bg-white px-3 pr-9 text-sm text-foreground shadow-[var(--shadow-soft)] outline-none transition-[border-color,box-shadow] duration-200 focus:border-primary/30 focus:ring-2 focus:ring-primary/20'

type PoliciesListFiltersBarProps = {
  filters: PolicyListFilters
  typeCounts: PolicyTypeCount[]
  totalCount: number
  onFiltersChange: (filters: PolicyListFilters) => void
  className?: string
}

function FilterSelect({
  id,
  label,
  value,
  onChange,
  children,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  children: ReactNode
}) {
  return (
    <div className="min-w-[9.5rem] flex-1 sm:flex-none">
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground"
      >
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={filterSelectClassName}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          strokeWidth={1.75}
          aria-hidden
        />
      </div>
    </div>
  )
}

export function PoliciesListFiltersBar({
  filters,
  typeCounts,
  totalCount,
  onFiltersChange,
  className,
}: PoliciesListFiltersBarProps) {
  const t = useTranslations('policies.list')
  const { policyType, status } = usePolicyLabels()

  const filtersActive = hasActivePolicyListFilters(filters)

  const setTypeFilter = (type: PolicyTypeFilter) => {
    onFiltersChange({ ...filters, type })
  }

  const setStatusFilter = (nextStatus: PolicyStatusFilter) => {
    onFiltersChange({ ...filters, status: nextStatus })
  }

  const toggleTypeFromSummary = (type: PolicyType) => {
    setTypeFilter(filters.type === type ? 'all' : type)
  }

  return (
    <div
      className={cn(
        'space-y-4 border-b border-border/60 px-4 py-4 sm:px-6',
        className
      )}
    >
      {typeCounts.length > 0 ? (
        <PoliciesSummaryChart
          typeCounts={typeCounts}
          totalCount={totalCount}
          activeType={filters.type}
          onTypeSelect={toggleTypeFromSummary}
        />
      ) : null}

      <div className="flex flex-wrap items-end gap-3">
        <FilterSelect
          id="policy-list-type-filter"
          label={t('filters.typeHeading')}
          value={filters.type}
          onChange={(value) => setTypeFilter(value as PolicyTypeFilter)}
        >
          <option value="all">{t('filters.allTypes')}</option>
          {POLICY_TYPE_VALUES.map((type) => (
            <option key={type} value={type}>
              {policyType(type)}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          id="policy-list-status-filter"
          label={t('filters.statusHeading')}
          value={filters.status}
          onChange={(value) => setStatusFilter(value as PolicyStatusFilter)}
        >
          <option value="all">{t('filters.allStatuses')}</option>
          {POLICY_STATUS_ORDER.map((value) => (
            <option key={value} value={value}>
              {status(value)}
            </option>
          ))}
        </FilterSelect>

        {filtersActive ? (
          <button
            type="button"
            onClick={() => onFiltersChange({ type: 'all', status: 'all' })}
            className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-pill)] px-3 text-xs font-semibold text-primary transition-colors hover:bg-primary/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <X className="size-3.5" strokeWidth={1.75} aria-hidden />
            {t('filters.clear')}
          </button>
        ) : null}
      </div>
    </div>
  )
}
