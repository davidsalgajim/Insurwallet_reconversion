import { getTranslations } from 'next-intl/server'

import { AppLogo } from '@/components/brand/app-logo'
import { LocaleSwitcher } from '@/components/i18n/locale-switcher'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'

export async function LandingNav() {
  const t = await getTranslations()

  const links = [
    { href: '#features', label: t('landing.navFeatures') },
    { href: '#services', label: t('landing.navServices') },
    { href: '#about', label: t('landing.navAbout') },
  ] as const

  return (
    <header className="sticky top-0 z-[var(--z-nav)] border-b border-border/60 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <AppLogo size={40} priority />
          <div className="hidden sm:block">
            <p className="text-base font-semibold tracking-tight text-ink">
              {t('common.appName')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('common.tagline')}
            </p>
          </div>
        </Link>

        <nav
          className="order-3 flex w-full justify-center gap-6 sm:order-none sm:w-auto"
          aria-label={t('landing.navAria')}
        >
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <LocaleSwitcher />
          <Button variant="ghost" asChild className="text-muted-foreground">
            <Link href="/login">{t('common.login')}</Link>
          </Button>
          <Button
            asChild
            className="rounded-[var(--radius-pill)] shadow-md shadow-primary/20"
          >
            <Link href="/register">{t('common.getStarted')}</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
