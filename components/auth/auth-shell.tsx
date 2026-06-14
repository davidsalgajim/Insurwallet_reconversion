import type { ReactNode } from 'react'

import { AppLogo } from '@/components/brand/app-logo'
import { cn } from '@/lib/utils/cn'

export const authInputClassName =
  'h-11 w-full rounded-[var(--radius-pill)] border border-border bg-white px-4 text-sm text-ink outline-none transition-shadow placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring'

export const authLabelClassName = 'text-sm font-medium text-ink'

type AuthShellProps = {
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export function AuthShell({
  title,
  description,
  children,
  className,
}: AuthShellProps) {
  return (
    <div
      className={cn(
        'marketing-light-card overflow-hidden p-8 sm:p-10',
        className
      )}
    >
      <header className="mb-8 text-center">
        <AppLogo size={56} priority className="mx-auto mb-5" />
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </header>
      {children}
    </div>
  )
}

export function AuthDivider({ label }: { label: string }) {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center" aria-hidden>
        <span className="w-full border-t border-border" />
      </div>
      <p className="relative mx-auto w-fit bg-white px-3 text-xs text-muted-foreground">
        {label}
      </p>
    </div>
  )
}

export function AuthFooterText({ children }: { children: ReactNode }) {
  return (
    <div className="text-center text-sm text-muted-foreground">{children}</div>
  )
}
