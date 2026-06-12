'use client'

import { Bell, Calendar, Plus, Search, Upload } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { SignOutButton } from '@/components/auth/sign-out-button'
import {
  IconCircleButton,
  IconCircleLink,
} from '@/components/ui/icon-circle-button'
import { Tooltip } from '@/components/ui/tooltip'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils/cn'

type AppTopbarProps = {
  title: string
  subtitle?: string
  className?: string
}

export function AppTopbar({ title, subtitle, className }: AppTopbarProps) {
  const t = useTranslations('common')

  return (
    <header className={cn('mb-4 sm:mb-6 md:mb-8', className)}>
      <div className="flex flex-col gap-4 md:gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-balance text-xl font-bold tracking-tight text-ink sm:text-2xl md:text-[1.75rem]">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground sm:mt-1.5">
              {subtitle}
            </p>
          ) : null}
        </div>

        <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center lg:w-auto lg:max-w-none">
          <div className="relative min-w-0 w-full sm:flex-1 sm:min-w-[200px] md:min-w-[240px] lg:min-w-[280px]">
            <label htmlFor="app-topbar-search" className="sr-only">
              {t('topbar.searchAria')}
            </label>
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              strokeWidth={1.5}
              aria-hidden
            />
            <input
              id="app-topbar-search"
              type="search"
              placeholder={t('topbar.searchPlaceholder')}
              className="h-10 w-full rounded-[var(--radius-pill)] border border-border bg-white/70 pl-10 pr-4 text-sm shadow-[var(--shadow-soft)] outline-none backdrop-blur-sm transition-[box-shadow,border-color] duration-200 placeholder:text-muted-foreground focus:border-primary/30 focus:shadow-[var(--shadow-float)] focus:ring-2 focus:ring-primary/20 sm:h-11"
            />
          </div>
          <div
            className="flex items-center justify-end gap-1.5 sm:gap-2"
            role="toolbar"
            aria-label={t('topbar.actionsAria')}
          >
            <IconCircleLink
              href="/policies/new"
              icon={Plus}
              label={t('nav.newPolicy')}
            />
            <IconCircleLink
              href="/policies/new/upload"
              icon={Upload}
              label={t('topbar.uploadDocument')}
              className="hidden sm:inline-flex"
            />
            <IconCircleButton
              icon={Calendar}
              label={t('topbar.calendar')}
              disabled
              title={t('topbar.comingSoon')}
              aria-disabled
              className="hidden md:inline-flex"
            />
            <div className="relative">
              <IconCircleLink
                href="/alerts"
                icon={Bell}
                label={t('topbar.notifications')}
              />
              <span
                className="pointer-events-none absolute right-2 top-2 size-2 rounded-full bg-[var(--primitive-coral)] ring-2 ring-white sm:right-2.5 sm:top-2.5"
                aria-hidden
              />
            </div>
            <Tooltip label={t('settings')}>
              <Link
                href="/settings"
                aria-label={t('settings')}
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--primitive-accent-soft)] to-primary text-xs font-bold text-white shadow-md ring-2 ring-white/80 sm:size-11"
              >
                U
              </Link>
            </Tooltip>
            <SignOutButton />
          </div>
        </div>
      </div>
    </header>
  )
}
