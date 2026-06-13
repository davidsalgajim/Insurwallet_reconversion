'use client'

import { useTranslations } from 'next-intl'

import { AppTopbar } from '@/components/layout/app-topbar'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'

export function HelpView() {
  const t = useTranslations('settings.help')

  const faqKeys = [
    'policies',
    'ai',
    'subscription',
    'privacy',
    'account',
  ] as const

  return (
    <div className="animate-fade-up">
      <AppTopbar title={t('title')} subtitle={t('subtitle')} />

      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div className="glass-panel divide-y divide-border/60 overflow-hidden">
          {faqKeys.map((key) => (
            <details key={key} className="group px-5 py-4">
              <summary className="cursor-pointer list-none text-sm font-medium marker:content-none">
                {t(`faq.${key}.question`)}
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {t(`faq.${key}.answer`)}
              </p>
            </details>
          ))}
        </div>

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
