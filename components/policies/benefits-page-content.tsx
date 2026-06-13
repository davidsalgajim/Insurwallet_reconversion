'use client'

import { FormEvent, useMemo, useState } from 'react'
import { ChevronDown, Star } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { AppTopbar } from '@/components/layout/app-topbar'
import { PoliciesListSkeleton } from '@/components/policies/policies-list-skeleton'
import { usePolicies } from '@/hooks/usePolicies'
import { Link } from '@/i18n/navigation'
import {
  collectActivePolicyBenefits,
  groupBenefitsByCategory,
} from '@/lib/policies/benefits-aggregator'
import { cn } from '@/lib/utils/cn'

type BenefitsPageContentProps = {
  title: string
  subtitle: string
}

function BenefitRow({
  benefitName,
  insurerName,
  description,
  quantity,
}: {
  benefitName: string
  insurerName: string
  description?: string
  quantity?: string
}) {
  const [expanded, setExpanded] = useState(false)
  const hasDetails = Boolean(description || quantity)

  return (
    <button
      type="button"
      className="w-full px-4 py-3 text-left"
      onClick={() => hasDetails && setExpanded((current) => !current)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{benefitName}</p>
          <p className="text-xs text-muted-foreground">{insurerName}</p>
        </div>
        {hasDetails ? (
          <ChevronDown
            className={cn(
              'size-4 shrink-0 text-muted-foreground transition-transform',
              expanded && 'rotate-180'
            )}
          />
        ) : null}
      </div>
      {expanded ? (
        <div className="mt-3 space-y-2 text-sm text-muted-foreground">
          {quantity ? (
            <p>
              <span className="font-medium text-foreground">{quantity}</span>
            </p>
          ) : null}
          {description ? <p>{description}</p> : null}
        </div>
      ) : null}
    </button>
  )
}

export function BenefitsPageContent({
  title,
  subtitle,
}: BenefitsPageContentProps) {
  const t = useTranslations('policies.benefitsPage')
  const { ownedPolicies, loading, error } = usePolicies()
  const [searchQuery, setSearchQuery] = useState('')

  const items = useMemo(
    () =>
      collectActivePolicyBenefits(ownedPolicies, {
        searchQuery,
      }),
    [ownedPolicies, searchQuery]
  )
  const grouped = useMemo(
    () => groupBenefitsByCategory(items, t('generalCategory')),
    [items, t]
  )
  const totalBenefits = ownedPolicies.reduce(
    (count, policy) => count + policy.benefitEntries.length,
    0
  )
  const policiesWithBenefits = ownedPolicies.filter(
    (policy) => policy.benefitEntries.length > 0
  ).length

  return (
    <div className="animate-fade-up">
      <div className="mb-4">
        <Link
          href="/policies"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          {t('backToPolicies')}
        </Link>
      </div>
      <AppTopbar title={title} subtitle={subtitle} />

      {loading ? <PoliciesListSkeleton /> : null}

      {!loading && error ? (
        <div className="glass-panel px-6 py-12 text-center">
          <p className="text-sm font-medium text-[var(--primitive-danger)]">
            {error}
          </p>
        </div>
      ) : null}

      {!loading && !error ? (
        <section className="glass-panel space-y-6 p-4 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="elevated-card p-5">
              <p className="text-3xl font-bold text-primary">{totalBenefits}</p>
              <p className="text-sm text-muted-foreground">
                {t('totalBenefits')}
              </p>
            </div>
            <div className="elevated-card p-5">
              <p className="text-3xl font-bold text-[var(--primitive-cyan)]">
                {policiesWithBenefits}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('policiesWithBenefits')}
              </p>
            </div>
          </div>

          <form
            onSubmit={(event: FormEvent<HTMLFormElement>) =>
              event.preventDefault()
            }
          >
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={t('searchPlaceholder')}
              className="h-11 w-full rounded-[var(--radius-inner)] border border-border bg-white/70 px-4 text-sm shadow-[var(--shadow-soft)] outline-none focus:ring-2 focus:ring-primary/20"
            />
          </form>

          {totalBenefits === 0 ? (
            <div className="px-2 py-12 text-center">
              <Star className="mx-auto mb-3 size-8 text-muted-foreground" />
              <p className="text-sm font-medium">{t('emptyTitle')}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {t('emptyDesc')}
              </p>
            </div>
          ) : items.length === 0 ? (
            <div className="px-2 py-12 text-center">
              <p className="text-sm font-medium">{t('noResultsTitle')}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {t('noResultsDesc')}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {grouped.map((group) => (
                <div key={group.category} className="space-y-3">
                  <h2 className="flex items-center gap-2 text-sm font-semibold">
                    <Star className="size-4 text-[var(--primitive-cyan)]" />
                    {group.category}
                    <span className="text-muted-foreground">
                      ({group.items.length})
                    </span>
                  </h2>
                  <div className="overflow-hidden rounded-[var(--radius-inner)] border border-border/70 bg-white/60">
                    {group.items.map((item, index) => (
                      <div
                        key={`${item.policy.id}-${item.benefit.name}-${index}`}
                        className={cn(index > 0 && 'border-t border-border/60')}
                      >
                        <BenefitRow
                          benefitName={item.benefit.name}
                          insurerName={item.policy.insurerName}
                          description={item.benefit.description}
                          quantity={item.benefit.quantity}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}
    </div>
  )
}
