'use client'

import { useTranslations } from 'next-intl'

import { APP_VERSION } from '@/lib/app-version'

export function SettingsVersionFooter() {
  const t = useTranslations('settings.version')

  return (
    <p className="pt-2 text-center text-xs text-muted-foreground">
      {t('label', { version: APP_VERSION })}
    </p>
  )
}
