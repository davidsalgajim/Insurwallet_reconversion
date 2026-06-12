import { BellRing } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { AppTopbar } from '@/components/layout/app-topbar'

type Props = { params: Promise<{ locale: string }> }

export default async function AlertsPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('alerts')

  return (
    <div className="animate-fade-up">
      <AppTopbar title={t('title')} subtitle={t('subtitle')} />
      <section className="glass-panel">
        <div className="flex flex-col items-center gap-4 px-6 py-20 text-center">
          <div className="icon-circle size-16 bg-white/80 text-muted-foreground">
            <BellRing className="size-7" strokeWidth={1.5} />
          </div>
          <p className="text-lg font-semibold tracking-tight">
            {t('emptyTitle')}
          </p>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            {t('emptyDescription')}
          </p>
        </div>
      </section>
    </div>
  )
}
