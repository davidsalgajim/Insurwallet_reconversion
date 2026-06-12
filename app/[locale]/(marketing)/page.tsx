import { ArrowRight, FileSearch, MessageSquareText, Shield } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { AppLogo } from '@/components/brand/app-logo'
import { DashboardPreview } from '@/components/marketing/dashboard-preview'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'

type Props = { params: Promise<{ locale: string }> }

export default async function LandingPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations()

  const features = [
    {
      icon: Shield,
      title: t('landing.feature1Title'),
      desc: t('landing.feature1Desc'),
      iconClass: 'marketing-feature-icon-primary',
    },
    {
      icon: FileSearch,
      title: t('landing.feature2Title'),
      desc: t('landing.feature2Desc'),
      iconClass: 'marketing-feature-icon-success',
    },
    {
      icon: MessageSquareText,
      title: t('landing.feature3Title'),
      desc: t('landing.feature3Desc'),
      iconClass: 'marketing-feature-icon-accent',
    },
  ] as const

  return (
    <div className="dark-surface min-h-dvh overflow-hidden bg-navy">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 90% 70% at 10% -10%, #407AFF40 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 90% 10%, #00D1C728 0%, transparent 50%), radial-gradient(circle at 50% 100%, #1A2447 0%, transparent 50%)',
        }}
      />

      <header className="relative z-10 mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex items-center gap-3">
          <AppLogo size={44} priority className="rounded-2xl" />
          <div>
            <p className="text-lg font-semibold tracking-tight text-white">
              {t('common.appName')}
            </p>
            <p className="text-xs text-white/50">{t('common.tagline')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            asChild
            className="text-white/80 hover:bg-white/10 hover:text-white"
          >
            <Link href="/login">{t('common.login')}</Link>
          </Button>
          <Button asChild className="shadow-lg shadow-primary/25">
            <Link href="/register">{t('common.getStarted')}</Link>
          </Button>
        </div>
      </header>

      <section className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-2 sm:gap-12 sm:px-6 sm:pb-20 sm:pt-4 lg:grid-cols-2 lg:gap-16 lg:pb-28 lg:pt-10">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-white/80 backdrop-blur-sm">
            <MessageSquareText
              className="size-4 text-accent"
              strokeWidth={1.5}
            />
            Asistente MarIAna incluido
          </div>
          <h1 className="font-display max-w-xl text-balance text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-4xl md:text-5xl lg:text-[3.25rem]">
            {t('landing.heroTitle')}
          </h1>
          <p className="max-w-lg text-lg leading-relaxed text-white/65">
            {t('landing.heroSubtitle')}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              size="lg"
              asChild
              className="rounded-[var(--radius-pill)] shadow-lg shadow-primary/30"
            >
              <Link href="/register">
                {t('common.getStarted')}
                <ArrowRight className="size-4" strokeWidth={1.5} />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="secondary"
              asChild
              className="rounded-[var(--radius-pill)] border-white/15 bg-white/8 text-white hover:bg-white/12"
            >
              <Link href="/dashboard">Ver demo del dashboard</Link>
            </Button>
          </div>
          <dl className="grid grid-cols-3 gap-4 border-t border-white/10 pt-8">
            {[
              { n: '4', label: 'Tipos de seguro' },
              { n: '3', label: 'Idiomas' },
              { n: 'IA', label: 'Extracción PDF' },
            ].map((item) => (
              <div key={item.label}>
                <dt className="font-mono text-2xl font-bold text-white">
                  {item.n}
                </dt>
                <dd className="mt-1 text-xs text-white/50">{item.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative lg:pl-4">
          <div className="absolute -inset-4 rounded-[32px] bg-gradient-to-br from-primary/20 via-transparent to-accent/15 blur-2xl" />
          <DashboardPreview />
        </div>
      </section>

      <section className="relative z-10 px-4 py-20 sm:px-6 sm:py-24 lg:py-28">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute left-[15%] top-[35%] size-96 rounded-full bg-primary/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute right-[8%] top-[15%] size-72 rounded-full bg-accent/8 blur-3xl"
          aria-hidden
        />

        <div className="relative mx-auto max-w-6xl">
          <div className="mb-12 max-w-2xl md:mb-14">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
              {t('landing.platformLabel')}
            </p>
            <h2 className="mt-4 text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {t('landing.featuresTitle')}
            </h2>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/60">
              {t('landing.featuresSubtitle')}
            </p>
          </div>

          <div className="grid gap-4 sm:gap-5 md:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="marketing-feature-card group relative overflow-hidden p-6 sm:p-7"
              >
                <div
                  className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  aria-hidden
                />
                <div
                  className={`mb-5 inline-flex size-14 items-center justify-center rounded-[18px] ${feature.iconClass}`}
                >
                  <feature.icon className="size-6" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-semibold tracking-tight text-white">
                  {feature.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-white/55">
                  {feature.desc}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
