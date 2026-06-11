'use client'

import {
  Bell,
  FileText,
  LayoutDashboard,
  MessageCircle,
  User,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils/cn'

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Dashboard',
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
    icon: MessageCircle,
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
    icon: User,
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
  if (pathname.startsWith(`${prefix}/`)) {
    return pathname.slice(prefix.length)
  }
  return pathname
}

export function AppShell({ locale, children }: AppShellProps) {
  const pathname = usePathname()
  const relativePath = stripLocalePrefix(pathname, locale)

  return (
    <div className="min-h-dvh bg-[#F7F8FA] font-[family-name:var(--font-plus-jakarta,'Plus_Jakarta_Sans',ui-sans-serif,system-ui,sans-serif)] text-[#0F1729]">
      <div className="mx-auto flex min-h-dvh max-w-[1280px]">
        <aside
          className={cn(
            'glass-surface fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/35 lg:flex',
            'bg-white/72 backdrop-blur-[20px]'
          )}
        >
          <div className="flex h-16 items-center gap-2.5 px-6">
            <span className="flex size-9 items-center justify-center rounded-xl bg-[#407AFF] text-sm font-bold text-white">
              IW
            </span>
            <span className="text-lg font-semibold tracking-tight">
              InsurWallet
            </span>
          </div>
          <nav
            className="flex flex-1 flex-col gap-1 px-3 py-4"
            aria-label="Principal"
          >
            {NAV_ITEMS.map((item) => {
              const active = item.match(relativePath)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={`/${locale}${item.href}`}
                  className={cn(
                    'flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors duration-200',
                    active
                      ? 'bg-[#407AFF]/10 text-[#407AFF]'
                      : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F1729]'
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon
                    className="size-5 shrink-0"
                    strokeWidth={active ? 2.25 : 1.75}
                  />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </aside>

        <div className="flex min-h-dvh flex-1 flex-col lg:pl-64">
          <header
            className={cn(
              'glass-surface sticky top-0 z-30 flex h-14 items-center border-b border-white/35 px-5 lg:hidden',
              'bg-white/72 backdrop-blur-[20px]'
            )}
          >
            <span className="text-base font-semibold">InsurWallet</span>
          </header>

          <main className="flex-1 px-5 pb-24 pt-6 md:px-6 lg:px-8 lg:pb-8">
            {children}
          </main>
        </div>
      </div>

      <nav
        className={cn(
          'glass-surface fixed inset-x-0 bottom-0 z-40 border-t border-white/35 lg:hidden',
          'bg-white/72 backdrop-blur-[20px]'
        )}
        aria-label="Navegación móvil"
      >
        <ul className="mx-auto flex max-w-lg items-stretch justify-around px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
          {NAV_ITEMS.map((item) => {
            const active = item.match(relativePath)
            const Icon = item.icon
            const isMariana = item.href === '/mariana'
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={`/${locale}${item.href}`}
                  className={cn(
                    'flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] font-medium transition-colors duration-200',
                    active
                      ? isMariana
                        ? 'text-[#00D1C7]'
                        : 'text-[#407AFF]'
                      : 'text-[#64748B]'
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
