import { getTranslations, setRequestLocale } from 'next-intl/server'

import { LegalDocumentBody } from '@/components/legal/legal-document-body'
import { LegalDocumentLayout } from '@/components/legal/legal-document-layout'
import { getPrivacyContent } from '@/lib/legal/content/privacy'
import type { PreferredLanguage } from '@/lib/schemas/user'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ from?: string }>
}

export default async function PrivacyPage({ params, searchParams }: Props) {
  const { locale } = await params
  const { from } = await searchParams
  setRequestLocale(locale)
  const t = await getTranslations('legal')
  const fromSettings = from === 'settings'
  const document = getPrivacyContent(locale as PreferredLanguage)

  return (
    <LegalDocumentLayout
      title={document.title}
      lastUpdated={t('lastUpdatedDate')}
      backHref={fromSettings ? '/settings' : '/'}
      backLabel={fromSettings ? t('backToSettings') : t('back')}
      updatedLabel={t('lastUpdatedLabel')}
    >
      <LegalDocumentBody document={document} />
    </LegalDocumentLayout>
  )
}
