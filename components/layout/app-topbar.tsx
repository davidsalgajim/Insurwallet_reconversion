'use client'

import { Bell, Calendar, Plus, Upload } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Suspense } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { SignOutButton } from '@/components/auth/sign-out-button'
import { PolicySearchInput } from '@/components/layout/policy-search-input'
import {
  IconCircleButton,
  IconCircleLink,
} from '@/components/ui/icon-circle-button'
import { Tooltip } from '@/components/ui/tooltip'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils/cn'
import { getUserDisplayInitials } from '@/lib/utils/user-display'

type AppTopbarProps = {
  title: string
  subtitle?: string
  className?: string
}

export function AppTopbar({ title, subtitle, className }: AppTopbarProps) {
  const t = useTranslations('common')
  const { user } = useAuth()
  const avatarInitials = getUserDisplayInitials(user)

  return (
    <header className={cn('@container mb-4 sm:mb-6 md:mb-8', className)}>
      <div className="flex flex-col gap-4 md:gap-5 @[56rem]:flex-row @[56rem]:flex-wrap @[56rem]:items-start @[56rem]:justify-between">
        <div className="w-full min-w-[min(100%,12rem)] @[56rem]:max-w-[min(100%,calc(100%-20rem))] @[56rem]:flex-1">
          <h1 className="font-display text-balance text-xl font-bold tracking-tight text-ink sm:text-2xl md:text-[1.75rem]">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1 w-full max-w-2xl text-sm leading-relaxed text-pretty text-muted-foreground sm:mt-1.5">
              {subtitle}
            </p>
          ) : null}
        </div>

        <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center @[56rem]:ms-auto @[56rem]:w-auto @[56rem]:shrink-0">
          <Suspense
            fallback={
              <div
                className="h-10 w-full animate-pulse rounded-[var(--radius-pill)] bg-white/50 sm:h-11 sm:min-w-[200px] md:min-w-[240px] lg:min-w-[280px]"
                aria-hidden
              />
            }
          >
            <PolicySearchInput />
          </Suspense>
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
                aria-label={t('topbar.profileAria', {
                  initials: avatarInitials,
                })}
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--primitive-accent-soft)] to-primary text-xs font-bold text-white shadow-md ring-2 ring-white/80 sm:size-11"
              >
                {avatarInitials}
              </Link>
            </Tooltip>
            <SignOutButton />
          </div>
        </div>
      </div>
    </header>
  )
}
