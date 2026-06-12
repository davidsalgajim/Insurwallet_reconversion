import { getTranslations, setRequestLocale } from 'next-intl/server'

import { AppTopbar } from '@/components/layout/app-topbar'
import { PoliciesList } from '@/components/policies/policies-list'

type PoliciesPageProps = {
  params: Promise<{ locale: string }>
}

export default async function PoliciesPage({ params }: PoliciesPageProps) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('policies')

  return (
    <div className="animate-fade-up">
      <AppTopbar title={t('title')} subtitle={t('subtitle')} />
      <section className="glass-panel" aria-label={t('listAria')}>
        <PoliciesList />
      </section>
    </div>
  )
}
