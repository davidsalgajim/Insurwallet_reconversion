'use client'

import { useLocale, useTranslations } from 'next-intl'

import { cn } from '@/lib/utils/cn'
import { appLocales, localeLabels, type AppLocale } from '@/i18n/locales'
import { usePathname, useRouter } from '@/i18n/navigation'

type LocaleSwitcherProps = {
  /** Light nav bar (default) or inverse for dark footer */
  variant?: 'default' | 'inverse'
  className?: string
}

export function LocaleSwitcher({
  variant = 'default',
  className,
}: LocaleSwitcherProps) {
  const t = useTranslations('common')
  const locale = useLocale() as AppLocale
  const pathname = usePathname()
  const router = useRouter()

  function selectLocale(nextLocale: AppLocale) {
    if (nextLocale === locale) return
    router.replace(pathname, { locale: nextLocale })
  }

  const isInverse = variant === 'inverse'

  return (
    <div
      role="group"
      aria-label={t('localeSwitcherAria')}
      className={cn(
        'inline-flex items-center gap-0.5 rounded-[var(--radius-pill)] p-0.5',
        isInverse
          ? 'border border-white/15 bg-white/10'
          : 'border border-border/80 bg-muted/50',
        className
      )}
    >
      {appLocales.map((code) => {
        const active = code === locale
        return (
          <button
            key={code}
            type="button"
            onClick={() => selectLocale(code)}
            aria-current={active ? 'true' : undefined}
            aria-label={t(`localeNames.${code}`)}
            title={t(`localeNames.${code}`)}
            className={cn(
              'min-w-[2.25rem] cursor-pointer rounded-[var(--radius-pill)] px-2 py-1 text-xs font-semibold tracking-wide transition-colors duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
              active
                ? isInverse
                  ? 'bg-white text-navy shadow-sm'
                  : 'bg-white text-ink shadow-sm ring-1 ring-border/60'
                : isInverse
                  ? 'text-white/70 hover:bg-white/10 hover:text-white'
                  : 'text-muted-foreground hover:bg-white/80 hover:text-ink'
            )}
          >
            {localeLabels[code]}
          </button>
        )
      })}
    </div>
  )
}
