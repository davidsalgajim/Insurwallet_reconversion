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
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

const RAIL_NAV = [
  {
    href: '/dashboard',
    label: 'Inicio',
    icon: LayoutDashboard,
    match: (p: string) => p === '/dashboard' || p === '',
  },
  {
    href: '/policies',
    label: 'Pólizas',
    icon: FileText,
    match: (p: string) => p.startsWith('/policies'),
  },
  {
    href: '/mariana',
    label: 'MarIAna',
    icon: MessageSquareText,
    match: (p: string) => p.startsWith('/mariana'),
  },
  {
    href: '/alerts',
    label: 'Alertas',
    icon: Bell,
    match: (p: string) => p.startsWith('/alerts'),
  },
  {
    href: '/settings',
    label: 'Perfil',
    icon: Settings,
    match: (p: string) => p.startsWith('/settings'),
  },
] as const

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

export function AppShell({ locale, children }: AppShellProps) {
  const pathname = usePathname()
  const relativePath = stripLocalePrefix(pathname, locale)

  return (
    <div className="app-shell-bg text-foreground">
      <div className="mx-auto flex min-h-dvh max-w-[1440px] gap-0 p-2 sm:gap-3 sm:p-3 md:p-4 lg:gap-4 lg:p-5">
        {/* Desktop / tablet landscape: vertical icon rail */}
        <aside
          className="glass-canvas app-rail-desktop hidden shrink-0 flex-col items-center px-2 py-4 lg:flex lg:w-[var(--rail-width)]"
          aria-label="Navegación principal"
        >
          <Link
            href={`/${locale}/dashboard`}
            className="mb-6 flex size-12 items-center justify-center rounded-full bg-[var(--primitive-ink)] text-xs font-bold text-white shadow-lg"
          >
            IW
          </Link>

          <nav className="flex flex-col items-center gap-2">
            {RAIL_NAV.map((item) => {
              const active = item.match(relativePath)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={`/${locale}${item.href}`}
                  aria-label={item.label}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'icon-circle size-11',
                    active && 'icon-circle-active'
                  )}
                >
                  <Icon
                    className="size-[18px]"
                    strokeWidth={active ? 2 : 1.5}
                  />
                </Link>
              )
            })}
          </nav>

          <Link
            href={`/${locale}/policies/new`}
            aria-label="Nueva póliza"
            className="icon-circle icon-circle-active mt-auto size-11"
          >
            <Plus className="size-[18px]" strokeWidth={1.5} />
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
        aria-label="Navegación principal"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      >
        {RAIL_NAV.map((item) => {
          const active = item.match(relativePath)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={`/${locale}${item.href}`}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 transition-colors duration-200',
                active ? 'text-[var(--primitive-ink)]' : 'text-muted-foreground'
              )}
            >
              <span
                className={cn(
                  'icon-circle size-10',
                  active && 'icon-circle-active'
                )}
              >
                <Icon className="size-[17px]" strokeWidth={active ? 2 : 1.5} />
              </span>
              <span className="max-w-full truncate text-[10px] font-semibold">
                {item.label}
              </span>
            </Link>
          )
        })}
        <Link
          href={`/${locale}/policies/new`}
          aria-label="Nueva póliza"
          className="flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5"
        >
          <span className="icon-circle icon-circle-active size-10">
            <Plus className="size-[17px]" strokeWidth={1.5} />
          </span>
          <span className="text-[10px] font-semibold text-[var(--primitive-ink)]">
            Nueva
          </span>
        </Link>
      </nav>
    </div>
  )
}
