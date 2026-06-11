import { FileText, MessageCircle, Shield } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Link } from '@/i18n/navigation'

type Props = { params: Promise<{ locale: string }> }

export default async function LandingPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations()

  return (
    <div className="dark-surface min-h-dvh bg-navy text-foreground">
      <div className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 20% 0%, #407AFF33 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 20%, #00D1C722 0%, transparent 55%)',
          }}
        />

        <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
              IW
            </span>
            <span className="text-lg font-semibold text-white">
              {t('common.appName')}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              asChild
              className="text-white/80 hover:bg-white/10 hover:text-white"
            >
              <Link href="/login">{t('common.login')}</Link>
            </Button>
            <Button asChild>
              <Link href="/register">{t('common.getStarted')}</Link>
            </Button>
          </div>
        </header>

        <section className="relative z-10 mx-auto grid max-w-6xl gap-12 px-6 pb-24 pt-8 lg:grid-cols-2 lg:items-center lg:pt-16">
          <div className="space-y-6">
            <p className="text-sm font-medium uppercase tracking-widest text-accent">
              {t('common.tagline')}
            </p>
            <h1 className="max-w-xl text-balance text-4xl font-bold leading-tight text-white md:text-5xl">
              {t('landing.heroTitle')}
            </h1>
            <p className="max-w-lg text-lg text-white/70">
              {t('landing.heroSubtitle')}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/register">{t('common.getStarted')}</Link>
              </Button>
              <Button
                size="lg"
                variant="secondary"
                asChild
                className="border-white/20 bg-white/10 text-white hover:bg-white/15"
              >
                <Link href="/dashboard">Ver demo</Link>
              </Button>
            </div>
          </div>

          <div className="glass-surface-dark relative mx-auto w-full max-w-md rounded-[var(--radius-card)] p-6 lg:mx-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white/60">
                  Dashboard
                </span>
                <span className="rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-semibold text-accent">
                  MarIAna
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: t('dashboard.activePolicies'), value: '—' },
                  { label: t('dashboard.expiringSoon'), value: '—' },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-2xl bg-white/5 p-4">
                    <p className="text-xs text-white/50">{stat.label}</p>
                    <p className="mt-1 font-mono text-2xl font-semibold text-white">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-dashed border-white/20 p-6 text-center">
                <FileText className="mx-auto size-8 text-white/40" />
                <p className="mt-2 text-sm text-white/60">
                  {t('dashboard.emptyTitle')}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="bg-background px-6 py-20 text-foreground">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          {[
            {
              icon: Shield,
              title: t('landing.feature1Title'),
              desc: t('landing.feature1Desc'),
            },
            {
              icon: FileText,
              title: t('landing.feature2Title'),
              desc: t('landing.feature2Desc'),
            },
            {
              icon: MessageCircle,
              title: t('landing.feature3Title'),
              desc: t('landing.feature3Desc'),
            },
          ].map((feature) => (
            <Card key={feature.title} className="border-border/80">
              <CardHeader>
                <feature.icon
                  className="size-8 text-primary"
                  strokeWidth={1.75}
                />
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.desc}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
