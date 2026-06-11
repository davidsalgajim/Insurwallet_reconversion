'use client'

import { Bell, Calendar, Plus, Search, Upload } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { IconCircleButton } from '@/components/ui/icon-circle-button'
import { cn } from '@/lib/utils/cn'

type AppTopbarProps = {
  title: string
  subtitle?: string
  className?: string
}

export function AppTopbar({ title, subtitle, className }: AppTopbarProps) {
  return (
    <header className={cn('mb-6 sm:mb-8', className)}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-balance text-2xl font-bold tracking-tight text-ink sm:text-[1.75rem]">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {subtitle}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <div className="relative min-w-0 flex-1 sm:min-w-[240px] lg:min-w-[280px]">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Buscar pólizas…"
              className="h-11 w-full rounded-[var(--radius-pill)] border border-border bg-white/70 pl-10 pr-4 text-sm shadow-[var(--shadow-soft)] outline-none backdrop-blur-sm transition-[box-shadow,border-color] duration-200 placeholder:text-muted-foreground focus:border-primary/30 focus:shadow-[var(--shadow-float)] focus:ring-2 focus:ring-primary/20"
              aria-label="Buscar"
            />
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/policies/new"
              aria-label="Nueva póliza"
              className="icon-circle size-11"
            >
              <Plus className="size-[18px]" strokeWidth={1.5} />
            </Link>
            <IconCircleButton icon={Upload} label="Subir documento" size="md" />
            <IconCircleButton icon={Calendar} label="Calendario" size="md" />
            <div className="relative">
              <IconCircleButton icon={Bell} label="Notificaciones" size="md" />
              <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-[var(--primitive-coral)] ring-2 ring-white" />
            </div>
            <div
              className="flex size-11 items-center justify-center rounded-full bg-gradient-to-br from-[var(--primitive-accent-soft)] to-primary text-xs font-bold text-white shadow-md ring-2 ring-white/80"
              aria-hidden
            >
              U
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
