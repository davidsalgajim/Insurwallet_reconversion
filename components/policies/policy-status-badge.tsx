'use client'

import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'

import { usePolicyLabels } from '@/hooks/use-policy-labels'
import type { PolicyStatus } from '@/lib/schemas/policy'
import { cn } from '@/lib/utils/cn'

const STATUS_STYLE: Record<
  PolicyStatus,
  {
    icon: typeof CheckCircle2
    className: string
  }
> = {
  active: {
    icon: CheckCircle2,
    className: 'bg-[#33C773]/12 text-[#1F8F4E] border-[#33C773]/25',
  },
  expiring: {
    icon: AlertTriangle,
    className: 'bg-[#FFB833]/15 text-[#B45309] border-[#FFB833]/30',
  },
  expired: {
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
  const { status: statusLabel } = usePolicyLabels()
  const config = STATUS_STYLE[status]
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
      {statusLabel(status)}
    </span>
  )
}
