import { Link } from '@/i18n/navigation'
import { ShieldCheck } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'

type Props = {
  params: Promise<{ locale: string; token: string }>
}

export default async function ShareAcceptPage({ params }: Props) {
  const { locale, token } = await params
  setRequestLocale(locale)
  const t = await getTranslations('share')

  return (
    <main className="app-shell-bg flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="glass-panel w-full max-w-lg p-8 text-center">
        <div className="icon-circle mx-auto mb-5 size-14 stat-icon-accent border-0">
          <ShieldCheck className="size-6" strokeWidth={1.5} />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t('description')}
        </p>

        <dl className="mt-6 space-y-2 rounded-[var(--radius-card)] border border-border/60 bg-white/50 p-4 text-left text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{t('tokenLabel')}</dt>
            <dd className="truncate font-mono text-xs">
              {token.slice(0, 12)}…
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{t('statusLabel')}</dt>
            <dd>{t('statusPending')}</dd>
          </div>
        </dl>

        <p className="mt-4 text-xs text-muted-foreground">{t('loginHint')}</p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-[var(--radius-button)] bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
          >
            {t('acceptCta')}
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-[var(--radius-button)] border border-border px-5 py-2.5 text-sm font-medium"
          >
            {t('declineCta')}
          </Link>
        </div>
      </div>
    </main>
  )
}
