import { setRequestLocale } from 'next-intl/server'

import { LandingFeatures } from '@/components/marketing/landing-features'
import { LandingFooter } from '@/components/marketing/landing-footer'
import { LandingHero } from '@/components/marketing/landing-hero'
import { LandingNav } from '@/components/marketing/landing-nav'
import { LandingServices } from '@/components/marketing/landing-services'
import { LandingTestimonial } from '@/components/marketing/landing-testimonial'
import { LandingTrust } from '@/components/marketing/landing-trust'

type Props = { params: Promise<{ locale: string }> }

export default async function LandingPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <div className="min-h-dvh bg-white text-ink">
      <LandingNav />
      <main>
        <LandingHero />
        <LandingTrust />
        <LandingFeatures />
        <LandingServices />
        <LandingTestimonial />
      </main>
      <LandingFooter />
    </div>
  )
}
