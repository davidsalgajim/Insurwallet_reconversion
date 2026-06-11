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
      <div className="mx-auto flex min-h-dvh max-w-[1440px] gap-3 p-3 sm:gap-4 sm:p-4 lg:p-5">
        {/* Slim icon rail — Dribbble CRM */}
        <aside
          className="glass-canvas fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-3 z-[var(--z-nav)] flex w-[calc(100%-1.5rem)] flex-row items-center justify-around gap-1 px-2 py-2 sm:left-4 sm:w-auto sm:flex-col sm:justify-start sm:px-2 sm:py-4 lg:static lg:bottom-auto lg:left-auto lg:w-[var(--rail-width)]"
          aria-label="Navegación principal"
        >
          <Link
            href={`/${locale}/dashboard`}
            className="mb-0 flex size-11 items-center justify-center rounded-full bg-[var(--primitive-ink)] text-xs font-bold text-white shadow-lg lg:mb-6 lg:size-12"
          >
            IW
          </Link>

          <nav className="flex flex-1 flex-row items-center justify-around gap-1 sm:flex-col sm:gap-2">
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
            className="icon-circle icon-circle-active mt-0 size-11 lg:mt-auto"
          >
            <Plus className="size-[18px]" strokeWidth={1.5} />
          </Link>
        </aside>

        {/* Main liquid glass canvas */}
        <div className="glass-canvas min-h-[calc(100dvh-1.5rem)] flex-1 overflow-hidden pb-20 lg:min-h-[calc(100dvh-2.5rem)] lg:pb-0">
          <div className="h-full overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
