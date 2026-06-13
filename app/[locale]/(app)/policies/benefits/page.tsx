import { getTranslations, setRequestLocale } from 'next-intl/server'

import { BenefitsPageContent } from '@/components/policies/benefits-page-content'

type BenefitsPageProps = {
  params: Promise<{ locale: string }>
}

export default async function BenefitsPage({ params }: BenefitsPageProps) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('policies.benefitsPage')

  return <BenefitsPageContent title={t('title')} subtitle={t('subtitle')} />
}
