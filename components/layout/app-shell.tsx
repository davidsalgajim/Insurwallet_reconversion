'use client'

import {
  Bell,
  FileText,
  LayoutDashboard,
  MessageSquareText,
  Plus,
  Settings,
} from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { AppLogo } from '@/components/brand/app-logo'
import { cn } from '@/lib/utils/cn'

type RailNavItem = {
  href: string
  labelKey: 'dashboard' | 'policies' | 'mariana' | 'alerts' | 'settings'
  icon: LucideIcon
  match: (p: string) => boolean
}

const RAIL_NAV: RailNavItem[] = [
  {
    href: '/dashboard',
    labelKey: 'dashboard',
    icon: LayoutDashboard,
    match: (p) => p === '/dashboard' || p === '',
  },
  {
    href: '/policies',
    labelKey: 'policies',
    icon: FileText,
    match: (p) => p.startsWith('/policies'),
  },
  {
    href: '/mariana',
    labelKey: 'mariana',
    icon: MessageSquareText,
    match: (p) => p.startsWith('/mariana'),
  },
  {
    href: '/alerts',
    labelKey: 'alerts',
    icon: Bell,
    match: (p) => p.startsWith('/alerts'),
  },
  {
    href: '/settings',
    labelKey: 'settings',
    icon: Settings,
    match: (p) => p.startsWith('/settings'),
  },
]

type AppShellProps = {
  locale: string
  children: ReactNode
}

function stripLocalePrefix(pathname: string, locale: string) {
  const prefix = `/${locale}`
  if (pathname === prefix || pathname === `${prefix}/`) return ''
  if (pathname.startsWith(`${prefix}/`)) return pathname.slice(prefix.length)
  return pathname
}

function RailNavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string
  label: string
  icon: LucideIcon
  active: boolean
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex w-full min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-1.5 transition-colors duration-200',
        active
          ? 'text-[var(--primitive-ink)]'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      <span
        className={cn(
          'icon-circle size-10 lg:size-11',
          active && 'icon-circle-active'
        )}
      >
        <Icon
          className="size-[17px] lg:size-[18px]"
          strokeWidth={active ? 2 : 1.5}
          aria-hidden
        />
      </span>
      <span className="max-w-full truncate text-center text-[10px] font-semibold leading-tight">
        {label}
      </span>
    </Link>
  )
}

export function AppShell({ locale, children }: AppShellProps) {
  const pathname = usePathname()
  const relativePath = stripLocalePrefix(pathname, locale)
  const t = useTranslations('common')

  return (
    <div className="app-shell-bg text-foreground">
      <div className="mx-auto flex min-h-dvh max-w-[1440px] gap-0 p-2 sm:gap-3 sm:p-3 md:p-4 lg:gap-4 lg:p-5">
        {/* Desktop / tablet landscape: vertical rail with visible labels */}
        <aside
          className="glass-canvas app-rail-desktop hidden shrink-0 flex-col items-stretch px-2 py-4 lg:flex lg:w-[var(--rail-width)]"
          aria-label={t('nav.mainAria')}
        >
          <Link
            href={`/${locale}/dashboard`}
            aria-label={t('nav.homeAria')}
            className="mb-4 flex justify-center transition-[transform,box-shadow] duration-200 hover:scale-[1.02] hover:shadow-[var(--shadow-float)]"
          >
            <AppLogo size={48} priority className="rounded-[14px]" />
          </Link>

          <nav className="flex flex-col items-stretch gap-1">
            {RAIL_NAV.map((item) => {
              const active = item.match(relativePath)
              return (
                <RailNavLink
                  key={item.href}
                  href={`/${locale}${item.href}`}
                  label={t(item.labelKey)}
                  icon={item.icon}
                  active={active}
                />
              )
            })}
          </nav>

          <Link
            href={`/${locale}/policies/new`}
            aria-current={
              relativePath.startsWith('/policies/new') ? 'page' : undefined
            }
            className="mt-auto flex w-full flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[var(--primitive-ink)]"
          >
            <span className="icon-circle icon-circle-active size-10 lg:size-11">
              <Plus
                className="size-[17px] lg:size-[18px]"
                strokeWidth={1.5}
                aria-hidden
              />
            </span>
            <span className="max-w-full truncate text-center text-[10px] font-semibold leading-tight">
              {t('nav.newPolicy')}
            </span>
          </Link>
        </aside>

        {/* Main liquid glass canvas */}
        <div className="glass-canvas app-main-canvas min-h-dvh min-w-0 flex-1 overflow-hidden lg:min-h-[calc(100dvh-2.5rem)]">
          <div className="app-main-scroll h-full overflow-y-auto overflow-x-hidden px-3 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6 lg:px-8 lg:py-7">
            {children}
          </div>
        </div>
      </div>

      {/* Mobile + tablet portrait: bottom navigation */}
      <nav
        className="app-bottom-nav glass-canvas fixed inset-x-0 bottom-0 z-[var(--z-nav)] flex items-center justify-around gap-0.5 px-2 py-2 lg:hidden"
        aria-label={t('nav.mainAria')}
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      >
        {RAIL_NAV.map((item) => {
          const active = item.match(relativePath)
          return (
            <RailNavLink
              key={item.href}
              href={`/${locale}${item.href}`}
              label={t(item.labelKey)}
              icon={item.icon}
              active={active}
            />
          )
        })}
        <Link
          href={`/${locale}/policies/new`}
          aria-current={
            relativePath.startsWith('/policies/new') ? 'page' : undefined
          }
          className="flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5"
        >
          <span className="icon-circle icon-circle-active size-10">
            <Plus className="size-[17px]" strokeWidth={1.5} aria-hidden />
          </span>
          <span className="max-w-full truncate text-[10px] font-semibold text-[var(--primitive-ink)]">
            {t('nav.newShort')}
          </span>
        </Link>
      </nav>
    </div>
  )
}
