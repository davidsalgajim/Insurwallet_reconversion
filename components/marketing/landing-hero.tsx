import { ArrowRight, FileSearch } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { DashboardPreview } from '@/components/marketing/dashboard-preview'
import { LandingStatsBar } from '@/components/marketing/landing-stats-bar'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'

export async function LandingHero() {
  const t = await getTranslations()

  return (
    <section className="relative px-4 pb-24 pt-8 sm:px-6 sm:pb-28 sm:pt-12 lg:pb-32">
      <div className="relative mx-auto max-w-6xl">
        <div className="marketing-hero-frame relative min-h-[420px] overflow-hidden sm:min-h-[480px] lg:min-h-[520px]">
          <div className="absolute inset-0 bg-navy" aria-hidden />
          <div
            className="absolute inset-0 opacity-90"
            style={{
              background:
                'radial-gradient(ellipse 80% 60% at 20% 30%, #407AFF55 0%, transparent 55%), radial-gradient(ellipse 50% 50% at 85% 20%, #00D1C733 0%, transparent 50%), linear-gradient(135deg, #0F1729 0%, #1A2447 50%, #0F1729 100%)',
            }}
            aria-hidden
          />

          <div className="relative grid h-full gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-10 lg:p-10">
            <div className="z-10 max-w-lg space-y-6">
              <span className="inline-flex items-center rounded-[var(--radius-pill)] border border-white/15 bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90 backdrop-blur-sm">
                {t('landing.heroBadge')}
              </span>
              <h1 className="font-display text-balance text-3xl font-bold leading-[1.08] tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
                {t('landing.heroTitle')}
              </h1>
              <p className="max-w-md text-base leading-relaxed text-white/70 sm:text-lg">
                {t('landing.heroSubtitle')}
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-1">
                <Button
                  size="lg"
                  asChild
                  className="rounded-[var(--radius-pill)] shadow-lg shadow-primary/30"
                >
                  <Link href="/register">
                    {t('landing.heroCtaPrimary')}
                    <ArrowRight className="size-4" strokeWidth={1.5} />
                  </Link>
                </Button>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/85 transition-colors hover:text-white"
                >
                  {t('landing.heroCtaSecondary')}
                  <ArrowRight className="size-4" strokeWidth={1.5} />
                </Link>
              </div>
            </div>

            <div className="relative lg:pl-4">
              <div className="marketing-floating-card absolute -top-2 right-0 z-20 hidden max-w-[200px] sm:block lg:-top-4 lg:right-4">
                <div className="flex items-start gap-3 p-4">
                  <span className="marketing-icon-ring-accent flex size-10 shrink-0 items-center justify-center">
                    <FileSearch
                      className="size-4 text-accent"
                      strokeWidth={1.75}
                    />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {t('landing.floatingCardTitle')}
                    </p>
                    <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                      {t('landing.floatingCardDesc')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative scale-[0.92] sm:scale-100 lg:translate-y-2">
                <div
                  className="pointer-events-none absolute -inset-3 rounded-[32px] bg-primary/20 blur-2xl"
                  aria-hidden
                />
                <DashboardPreview />
              </div>
            </div>
          </div>
        </div>

        <LandingStatsBar />
      </div>
    </section>
  )
}
