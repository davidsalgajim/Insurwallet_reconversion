'use client'

import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'

import { AppTopbar } from '@/components/layout/app-topbar'
import { PoliciesList } from '@/components/policies/policies-list'

type PoliciesPageContentProps = {
  title: string
  subtitle: string
  listAria: string
}

export function PoliciesPageContent({
  title,
  subtitle,
  listAria,
}: PoliciesPageContentProps) {
  const t = useTranslations('policies')
  const searchParams = useSearchParams()
  const searchQuery = searchParams.get('search') ?? ''

  return (
    <div className="animate-fade-up">
      <AppTopbar
        title={title}
        subtitle={searchQuery ? t('searchResultsSubtitle') : subtitle}
      />
      <section className="glass-panel" aria-label={listAria}>
        <PoliciesList searchQuery={searchQuery} />
      </section>
    </div>
  )
}
