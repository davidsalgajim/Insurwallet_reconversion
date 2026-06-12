'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'

type NavItem = {
  href: string
  labelKey: 'nav.summary' | 'policies' | 'mariana' | 'alerts'
  match: (path: string) => boolean
}

const APP_NAV: NavItem[] = [
  {
    href: '/dashboard',
    labelKey: 'nav.summary',
    match: (p) => p === '/dashboard' || p === '',
  },
  {
    href: '/policies',
    labelKey: 'policies',
    match: (p) => p.startsWith('/policies'),
  },
  {
    href: '/mariana',
    labelKey: 'mariana',
    match: (p) => p.startsWith('/mariana'),
  },
  {
    href: '/alerts',
    labelKey: 'alerts',
    match: (p) => p.startsWith('/alerts'),
  },
]

type AppSubnavProps = {
  locale: string
  className?: string
}

function stripLocalePrefix(pathname: string, locale: string) {
  const prefix = `/${locale}`
  if (pathname === prefix || pathname === `${prefix}/`) return ''
  if (pathname.startsWith(`${prefix}/`)) return pathname.slice(prefix.length)
  return pathname
}

export function AppSubnav({ locale, className }: AppSubnavProps) {
  const pathname = usePathname()
  const relativePath = stripLocalePrefix(pathname, locale)
  const t = useTranslations('common')

  return (
    <nav
      aria-label={t('nav.sectionsAria')}
      className={cn(
        'mb-4 hidden w-full overflow-x-auto md:block sm:mb-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className
      )}
    >
      <div className="inline-flex min-w-min gap-1 rounded-[var(--radius-pill)] bg-white/45 p-1 ring-1 ring-border backdrop-blur-sm">
        {APP_NAV.map((item) => {
          const active = item.match(relativePath)
          const label =
            item.labelKey === 'nav.summary'
              ? t('nav.summary')
              : t(item.labelKey)
          return (
            <Link
              key={item.href}
              href={`/${locale}${item.href}`}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'shrink-0 rounded-[var(--radius-pill)] px-3 py-2 text-xs font-semibold tracking-wide transition-[background-color,color,box-shadow] duration-200 sm:px-4',
                active
                  ? 'bg-[var(--primitive-ink)] text-white shadow-md'
                  : 'text-muted-foreground hover:bg-white/70 hover:text-foreground'
              )}
            >
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
