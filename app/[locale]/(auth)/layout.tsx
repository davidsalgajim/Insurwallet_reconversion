import type { ReactNode } from 'react'
import { getTranslations } from 'next-intl/server'

import { AppLogo } from '@/components/brand/app-logo'
import { Link } from '@/i18n/navigation'

export default async function AuthLayout({
  children,
}: {
  children: ReactNode
}) {
  const t = await getTranslations()

  return (
    <div className="marketing-surface flex min-h-dvh flex-col">
      <header className="sticky top-0 z-[var(--z-nav)] border-b border-border/60 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center px-4 py-4 sm:px-6">
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
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 sm:py-14">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  )
}
