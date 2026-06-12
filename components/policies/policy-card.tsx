import { CalendarRange, ChevronRight } from 'lucide-react'

import { PolicyStatusBadge } from '@/components/policies/policy-status-badge'
import { Link } from '@/i18n/navigation'
import type { PolicyDocument } from '@/lib/firebase/policies'
import { cn } from '@/lib/utils/cn'

type PolicyCardProps = {
  policy: PolicyDocument
  className?: string
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function PolicyCard({ policy, className }: PolicyCardProps) {
  return (
    <Link
      href={`/policies/${policy.id}`}
      className={cn(
        'glass-panel group flex flex-col gap-4 p-5 transition-transform duration-200 hover:-translate-y-0.5 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-base font-semibold tracking-tight">
            {policy.insurerName}
          </h3>
          <PolicyStatusBadge status={policy.status} />
        </div>
        <p className="font-mono text-sm text-muted-foreground">
          {policy.policyNumber}
        </p>
        <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarRange className="size-3.5 shrink-0" strokeWidth={1.5} />
          {formatDate(policy.startDate)} — {formatDate(policy.endDate)}
        </p>
      </div>
      <ChevronRight
        className="size-5 shrink-0 self-end text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 sm:self-center"
        strokeWidth={1.5}
      />
    </Link>
  )
}
