import { ArrowRight, Check } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { AppLogo } from '@/components/brand/app-logo'
import { LocaleSwitcher } from '@/components/i18n/locale-switcher'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'

export async function LandingFooter() {
  const t = await getTranslations()

  const navLinks = [
    { href: '#features', label: t('landing.navFeatures') },
    { href: '#services', label: t('landing.navServices') },
    { href: '#about', label: t('landing.navAbout') },
    { href: '/login', label: t('common.login') },
  ] as const

  const benefits = [
    t('landing.footerCtaBenefit1'),
    t('landing.footerCtaBenefit2'),
  ] as const

  return (
    <footer className="bg-navy text-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="font-display max-w-md text-balance text-2xl font-bold tracking-tight sm:text-3xl">
              {t('landing.footerCtaTitle')}
            </h2>
            <ul className="mt-8 space-y-3">
              {benefits.map((benefit) => (
                <li
                  key={benefit}
                  className="flex items-start gap-3 text-white/80"
                >
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/20">
                    <Check className="size-3 text-primary" strokeWidth={2.5} />
                  </span>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col justify-center lg:items-end lg:text-right">
            <p className="max-w-sm text-base leading-relaxed text-white/65 lg:ml-auto">
              {t('landing.footerCtaDesc')}
            </p>
            <Button
              size="lg"
              asChild
              className="mt-6 rounded-[var(--radius-pill)] bg-white text-navy shadow-lg hover:bg-white/95"
            >
              <Link href="/register">
                {t('landing.footerCtaButton')}
                <ArrowRight className="size-4" strokeWidth={1.5} />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="flex items-center gap-3">
            <AppLogo size={36} />
            <span className="font-semibold">{t('common.appName')}</span>
          </Link>

          <nav
            className="flex flex-wrap gap-6"
            aria-label={t('landing.footerNavAria')}
          >
            {navLinks.map((link) =>
              link.href.startsWith('#') ? (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm text-white/60 transition-colors hover:text-white"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-white/60 transition-colors hover:text-white"
                >
                  {link.label}
                </Link>
              )
            )}
          </nav>
        </div>

        <div className="mx-auto flex max-w-6xl flex-col gap-4 border-t border-white/10 px-4 py-6 text-sm text-white/45 sm:px-6 md:flex-row md:items-center md:justify-between">
          <p>
            {t('landing.footerCopyright', { year: new Date().getFullYear() })}
          </p>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <LocaleSwitcher variant="inverse" />
            <Link
              href="/legal/terms"
              className="transition-colors hover:text-white/70"
            >
              {t('landing.footerTerms')}
            </Link>
            <Link
              href="/legal/privacy"
              className="transition-colors hover:text-white/70"
            >
              {t('landing.footerPrivacy')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
