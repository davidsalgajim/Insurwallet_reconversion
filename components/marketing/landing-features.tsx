import {
  Bell,
  FileSearch,
  MessageSquareText,
  Share2,
  Shield,
  Sparkles,
} from 'lucide-react'
import { getTranslations } from 'next-intl/server'

export async function LandingFeatures() {
  const t = await getTranslations()

  const features = [
    {
      icon: Shield,
      title: t('landing.feature1Title'),
      desc: t('landing.feature1Desc'),
      tone: 'primary' as const,
    },
    {
      icon: FileSearch,
      title: t('landing.feature2Title'),
      desc: t('landing.feature2Desc'),
      tone: 'success' as const,
    },
    {
      icon: MessageSquareText,
      title: t('landing.feature3Title'),
      desc: t('landing.feature3Desc'),
      tone: 'accent' as const,
    },
    {
      icon: Bell,
      title: t('landing.feature4Title'),
      desc: t('landing.feature4Desc'),
      tone: 'primary' as const,
    },
    {
      icon: Share2,
      title: t('landing.feature5Title'),
      desc: t('landing.feature5Desc'),
      tone: 'success' as const,
    },
    {
      icon: Sparkles,
      title: t('landing.feature6Title'),
      desc: t('landing.feature6Desc'),
      tone: 'accent' as const,
    },
  ] as const

  const toneClass = {
    primary: 'marketing-icon-ring-primary',
    success: 'marketing-icon-ring-success',
    accent: 'marketing-icon-ring-accent',
  }

  return (
    <section
      id="features"
      className="marketing-surface px-4 py-20 sm:px-6 sm:py-24 lg:py-28"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            {t('landing.platformLabel')}
          </p>
          <h2 className="font-display mt-3 text-balance text-2xl font-bold tracking-tight text-ink sm:text-3xl lg:text-4xl">
            {t('landing.featuresSectionTitle')}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t('landing.featuresSectionSubtitle')}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="marketing-light-card p-6 sm:p-7"
            >
              <span
                className={`mb-5 inline-flex size-12 items-center justify-center ${toneClass[feature.tone]}`}
              >
                <feature.icon className="size-5" strokeWidth={1.75} />
              </span>
              <h3 className="text-lg font-semibold tracking-tight text-ink">
                {feature.title}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                {feature.desc}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
