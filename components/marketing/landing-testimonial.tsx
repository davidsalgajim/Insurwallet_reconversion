import { ArrowRight, Quote } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'

export async function LandingTestimonial() {
  const t = await getTranslations()

  return (
    <section className="px-4 py-20 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-display mx-auto mb-12 max-w-xl text-balance text-center text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {t('landing.testimonialSectionTitle')}
        </h2>

        <div className="marketing-light-card overflow-hidden lg:grid lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col justify-between p-8 sm:p-10">
            <div>
              <Quote
                className="size-8 text-primary/30"
                strokeWidth={1.25}
                aria-hidden
              />
              <blockquote className="mt-6 text-lg leading-relaxed text-ink sm:text-xl">
                {t('landing.testimonialQuote')}
              </blockquote>
            </div>
            <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-semibold text-ink">
                  {t('landing.testimonialAuthor')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('landing.testimonialRole')}
                </p>
              </div>
              <Button
                variant="secondary"
                asChild
                className="rounded-[var(--radius-pill)]"
              >
                <Link href="/login?redirect=%2Fdashboard">
                  {t('landing.testimonialCta')}
                  <ArrowRight className="size-4" strokeWidth={1.5} />
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative min-h-[240px] lg:min-h-full" aria-hidden>
            <div
              className="absolute inset-0 m-4 rounded-[var(--radius-card)] lg:m-6"
              style={{
                background:
                  'linear-gradient(145deg, #407AFF 0%, #1A2447 50%, #00D1C7 100%)',
              }}
            />
            <div className="absolute inset-0 m-4 flex items-end p-6 lg:m-6">
              <div className="marketing-glass-on-dark w-full rounded-[18px] p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-white/60">
                  {t('landing.testimonialVisualLabel')}
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {t('landing.testimonialVisualValue')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
