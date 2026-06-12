import { getTranslations, setRequestLocale } from 'next-intl/server'

import { LegalDocumentLayout } from '@/components/legal/legal-document-layout'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ from?: string }>
}

export default async function TermsPage({ params, searchParams }: Props) {
  const { locale } = await params
  const { from } = await searchParams
  setRequestLocale(locale)
  const t = await getTranslations('legal')
  const fromSettings = from === 'settings'

  return (
    <LegalDocumentLayout
      title={t('terms.title')}
      lastUpdated={t('lastUpdatedDate')}
      backHref={fromSettings ? '/settings' : '/'}
      backLabel={fromSettings ? t('backToSettings') : t('back')}
      updatedLabel={t('lastUpdatedLabel')}
    >
      <p>{t('terms.intro')}</p>
      <h2>{t('terms.sections.acceptance.title')}</h2>
      <p>{t('terms.sections.acceptance.body')}</p>
      <h2>{t('terms.sections.service.title')}</h2>
      <p>{t('terms.sections.service.body')}</p>
      <h2>{t('terms.sections.accounts.title')}</h2>
      <p>{t('terms.sections.accounts.body')}</p>
      <h2>{t('terms.sections.ai.title')}</h2>
      <p>{t('terms.sections.ai.body')}</p>
      <h2>{t('terms.sections.liability.title')}</h2>
      <p>{t('terms.sections.liability.body')}</p>
      <h2>{t('terms.sections.contact.title')}</h2>
      <p>
        {t('terms.sections.contact.body')}{' '}
        <a href="mailto:legal@insurwallet.com">legal@insurwallet.com</a>
      </p>
    </LegalDocumentLayout>
  )
}
