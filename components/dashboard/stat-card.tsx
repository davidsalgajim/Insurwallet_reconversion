import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

type StatCardProps = {
  label: string
  value: string
  icon: LucideIcon
  tone?: 'primary' | 'warning' | 'success' | 'accent'
  hint?: string
  className?: string
}

const toneClass: Record<NonNullable<StatCardProps['tone']>, string> = {
  primary: 'stat-icon-primary',
  warning: 'stat-icon-warning',
  success: 'stat-icon-success',
  accent: 'stat-icon-accent',
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'primary',
  hint,
  className,
}: StatCardProps) {
  return (
    <article
      className={cn(
        'glass-panel group flex flex-col gap-3 p-4 hover:-translate-y-0.5 sm:gap-4 sm:p-5',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            'icon-circle size-11 shrink-0 border-0',
            toneClass[tone]
          )}
        >
          <Icon className="size-5" strokeWidth={1.75} />
        </div>
        {hint ? (
          <span className="pill-badge bg-white/60 text-muted-foreground">
            {hint}
          </span>
        ) : null}
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 font-mono text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {value}
        </p>
      </div>
    </article>
  )
}
