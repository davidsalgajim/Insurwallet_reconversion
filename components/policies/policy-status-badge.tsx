import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'

import type { PolicyStatus } from '@/lib/schemas/policy'
import { cn } from '@/lib/utils/cn'

const STATUS_CONFIG: Record<
  PolicyStatus,
  {
    label: string
    icon: typeof CheckCircle2
    className: string
  }
> = {
  active: {
    label: 'Activa',
    icon: CheckCircle2,
    className: 'bg-[#33C773]/12 text-[#1F8F4E] border-[#33C773]/25',
  },
  expiring: {
    label: 'Por vencer',
    icon: AlertTriangle,
    className: 'bg-[#FFB833]/15 text-[#B45309] border-[#FFB833]/30',
  },
  expired: {
    label: 'Vencida',
    icon: XCircle,
    className: 'bg-[#F55252]/12 text-[#C53030] border-[#F55252]/25',
  },
}

type PolicyStatusBadgeProps = {
  status: PolicyStatus
  className?: string
}

export function PolicyStatusBadge({
  status,
  className,
}: PolicyStatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide',
        config.className,
        className
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      {config.label}
    </span>
  )
}
