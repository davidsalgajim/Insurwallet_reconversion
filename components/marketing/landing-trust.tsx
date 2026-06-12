import { getTranslations } from 'next-intl/server'

import { Shield, Heart, Lock, Globe, Users } from 'lucide-react'

export async function LandingTrust() {
  const t = await getTranslations()

  const chips = [
    { icon: Shield, label: t('landing.trustChip1') },
    { icon: Users, label: t('landing.trustChip2') },
    { icon: Heart, label: t('landing.trustChip3') },
    { icon: Lock, label: t('landing.trustChip4') },
    { icon: Globe, label: t('landing.trustChip5') },
  ] as const

  return (
    <section id="about" className="px-4 py-20 pt-28 sm:px-6 sm:py-24 sm:pt-32">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-16">
          <h2 className="font-display max-w-md text-balance text-2xl font-bold tracking-tight text-ink sm:text-3xl lg:text-[2rem]">
            {t('landing.trustTitle')}
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t('landing.trustDesc')}
          </p>
        </div>

        <ul className="mt-12 flex flex-wrap justify-center gap-3 sm:justify-start lg:gap-4">
          {chips.map((chip) => (
            <li key={chip.label}>
              <span className="marketing-trust-chip inline-flex items-center gap-2">
                <chip.icon className="size-4 text-primary" strokeWidth={1.75} />
                {chip.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
