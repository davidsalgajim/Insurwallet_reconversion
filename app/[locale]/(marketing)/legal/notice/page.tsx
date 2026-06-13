import { getTranslations, setRequestLocale } from 'next-intl/server'

import { LegalDocumentBody } from '@/components/legal/legal-document-body'
import { LegalDocumentLayout } from '@/components/legal/legal-document-layout'
import { getLegalNoticeContent } from '@/lib/legal/content/legal-notice'
import type { PreferredLanguage } from '@/lib/schemas/user'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function LegalNoticePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('legal')
  const document = getLegalNoticeContent(locale as PreferredLanguage)

  return (
    <LegalDocumentLayout
      title={document.title}
      lastUpdated={t('lastUpdatedDate')}
      backHref="/"
      backLabel={t('back')}
      updatedLabel={t('lastUpdatedLabel')}
    >
      <LegalDocumentBody document={document} />
    </LegalDocumentLayout>
  )
}
