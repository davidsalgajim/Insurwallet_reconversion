import { getTranslations, setRequestLocale } from 'next-intl/server'

import { LegalDocumentLayout } from '@/components/legal/legal-document-layout'

type Props = { params: Promise<{ locale: string }> }

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('legal')

  return (
    <LegalDocumentLayout
      title={t('privacy.title')}
      lastUpdated={t('lastUpdatedDate')}
      backLabel={t('back')}
      updatedLabel={t('lastUpdatedLabel')}
    >
      <p>{t('privacy.intro')}</p>
      <h2>{t('privacy.sections.controller.title')}</h2>
      <p>
        {t('privacy.sections.controller.body')}{' '}
        <a href="mailto:privacidad@insurwallet.com">
          privacidad@insurwallet.com
        </a>
      </p>
      <h2>{t('privacy.sections.data.title')}</h2>
      <ul>
        <li>{t('privacy.sections.data.items.account')}</li>
        <li>{t('privacy.sections.data.items.policies')}</li>
        <li>{t('privacy.sections.data.items.documents')}</li>
        <li>{t('privacy.sections.data.items.technical')}</li>
      </ul>
      <h2>{t('privacy.sections.purpose.title')}</h2>
      <p>{t('privacy.sections.purpose.body')}</p>
      <h2>{t('privacy.sections.legalBasis.title')}</h2>
      <p>{t('privacy.sections.legalBasis.body')}</p>
      <h2>{t('privacy.sections.rights.title')}</h2>
      <p>{t('privacy.sections.rights.body')}</p>
      <h2>{t('privacy.sections.retention.title')}</h2>
      <p>{t('privacy.sections.retention.body')}</p>
      <h2>{t('privacy.sections.transfers.title')}</h2>
      <p>{t('privacy.sections.transfers.body')}</p>
    </LegalDocumentLayout>
  )
}
