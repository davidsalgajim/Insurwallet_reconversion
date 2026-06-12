import { ArrowRight } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'

export async function LandingServices() {
  const t = await getTranslations()

  const services = [
    {
      num: '01',
      title: t('landing.service1Title'),
      desc: t('landing.service1Desc'),
    },
    {
      num: '02',
      title: t('landing.service2Title'),
      desc: t('landing.service2Desc'),
    },
    {
      num: '03',
      title: t('landing.service3Title'),
      desc: t('landing.service3Desc'),
    },
    {
      num: '04',
      title: t('landing.service4Title'),
      desc: t('landing.service4Desc'),
    },
  ] as const

  return (
    <section id="services" className="px-4 py-20 sm:px-6 sm:py-24 lg:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <h2 className="font-display max-w-md text-balance text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {t('landing.servicesTitle')}
          </h2>
          <Button
            asChild
            className="mt-6 rounded-[var(--radius-pill)] shadow-md shadow-primary/20"
          >
            <Link href="/register">
              {t('landing.servicesCta')}
              <ArrowRight className="size-4" strokeWidth={1.5} />
            </Link>
          </Button>

          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {services.map((service) => (
              <article
                key={service.num}
                className="marketing-light-card group p-5 transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-float)]"
              >
                <span className="font-mono text-xs font-semibold text-primary">
                  {service.num}
                </span>
                <h3 className="mt-2 text-base font-semibold tracking-tight text-ink">
                  {service.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {service.desc}
                </p>
                <Link
                  href="/register"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-primary/80"
                >
                  {t('landing.serviceViewDetails')}
                  <ArrowRight className="size-3" strokeWidth={1.75} />
                </Link>
              </article>
            ))}
          </div>
        </div>

        <div className="marketing-product-visual relative min-h-[420px] overflow-hidden rounded-[var(--radius-panel)] sm:min-h-[480px]">
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(160deg, #0F1729 0%, #1A2447 40%, #407AFF 100%)',
            }}
            aria-hidden
          />
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                'radial-gradient(circle at 30% 20%, #00D1C744 0%, transparent 45%), radial-gradient(circle at 80% 70%, #407AFF55 0%, transparent 50%)',
            }}
            aria-hidden
          />

          <div className="relative flex h-full flex-col justify-between p-6 sm:p-8">
            <div className="marketing-floating-card max-w-[220px] p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                {t('common.mariana')}
              </p>
              <p className="mt-2 text-sm font-medium leading-snug text-ink">
                {t('landing.productVisualPrompt')}
              </p>
            </div>

            <div className="space-y-3">
              <div className="marketing-glass-on-dark rounded-[20px] p-4">
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>{t('landing.productVisualPolicy')}</span>
                  <span className="rounded-full bg-success/20 px-2 py-0.5 text-success">
                    {t('landing.productVisualActive')}
                  </span>
                </div>
                <p className="mt-2 font-mono text-lg font-semibold text-white">
                  ···· 4821
                </p>
                <p className="mt-1 text-sm text-white/70">
                  {t('landing.productVisualCoverage')}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-sm">
                  PDF
                </span>
                <span className="rounded-full border border-accent/30 bg-accent/15 px-3 py-1 text-xs font-medium text-accent backdrop-blur-sm">
                  {t('landing.stat3Value')}
                </span>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-sm">
                  {t('common.mariana')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
