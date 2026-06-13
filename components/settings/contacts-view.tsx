'use client'

import { useTranslations } from 'next-intl'

import { AppTopbar } from '@/components/layout/app-topbar'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'

import { GlobalBeneficiariesPanel } from './global-beneficiaries-panel'
import { GlobalContactsPanel } from './global-contacts-panel'

export function ContactsView() {
  const t = useTranslations('settings.contacts')

  return (
    <div className="animate-fade-up">
      <AppTopbar title={t('title')} subtitle={t('subtitle')} />

      <div className="mx-auto w-full max-w-2xl space-y-8">
        <GlobalContactsPanel />
        <GlobalBeneficiariesPanel />

        <Button
          asChild
          variant="secondary"
          className="rounded-[var(--radius-pill)]"
        >
          <Link href="/settings">{t('backToSettings')}</Link>
        </Button>
      </div>
    </div>
  )
}
