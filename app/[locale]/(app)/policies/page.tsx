import { Suspense } from 'react'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { PoliciesPageContent } from '@/components/policies/policies-page-content'

type PoliciesPageProps = {
  params: Promise<{ locale: string }>
}

function PoliciesPageFallback() {
  return (
    <div className="animate-fade-up">
      <div className="mb-6 h-16 animate-pulse rounded-[var(--radius-card)] bg-white/50" />
      <div className="glass-panel h-64 animate-pulse" />
    </div>
  )
}

export default async function PoliciesPage({ params }: PoliciesPageProps) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('policies')

  return (
    <Suspense fallback={<PoliciesPageFallback />}>
      <PoliciesPageContent
        title={t('title')}
        subtitle={t('subtitle')}
        listAria={t('listAria')}
      />
    </Suspense>
  )
}
