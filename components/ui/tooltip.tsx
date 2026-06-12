import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

type TooltipProps = {
  label: string
  children: ReactNode
  className?: string
  side?: 'top' | 'bottom'
}

export function Tooltip({
  label,
  children,
  className,
  side = 'top',
}: TooltipProps) {
  return (
    <span className={cn('group/tooltip relative inline-flex', className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute left-1/2 z-[var(--z-tooltip,50)] -translate-x-1/2 whitespace-nowrap rounded-lg border border-border bg-[var(--primitive-ink)] px-2.5 py-1.5 text-[11px] font-semibold text-white opacity-0 shadow-md transition-[opacity,transform] duration-150 group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100 motion-reduce:transition-none',
          side === 'top'
            ? 'bottom-full mb-2 translate-y-1 group-hover/tooltip:translate-y-0 group-focus-within/tooltip:translate-y-0'
            : 'top-full mt-2 -translate-y-1 group-hover/tooltip:translate-y-0 group-focus-within/tooltip:translate-y-0'
        )}
      >
        {label}
      </span>
    </span>
  )
}
