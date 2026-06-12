import { getTranslations } from 'next-intl/server'

export async function LandingStatsBar() {
  const t = await getTranslations()

  const stats = [
    { value: t('landing.stat1Value'), label: t('landing.stat1Label') },
    { value: t('landing.stat2Value'), label: t('landing.stat2Label') },
    { value: t('landing.stat3Value'), label: t('landing.stat3Label') },
  ] as const

  return (
    <div className="marketing-stat-bar absolute -bottom-10 left-4 right-4 sm:left-8 sm:right-auto sm:max-w-xl lg:-bottom-12 lg:left-10">
      <dl className="grid grid-cols-3 divide-x divide-border/80">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="px-4 py-5 text-center sm:px-6 sm:py-6 sm:text-left"
          >
            <dt className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              {stat.value}
            </dt>
            <dd className="mt-1 text-xs leading-snug text-muted-foreground sm:text-sm">
              {stat.label}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
