import { FileText, Plus } from 'lucide-react'
import Link from 'next/link'

import { cn } from '@/lib/utils/cn'

type PoliciesEmptyStateProps = {
  locale?: string
  className?: string
}

export function PoliciesEmptyState({
  locale = 'es',
  className,
}: PoliciesEmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-5 py-16 text-center',
        className
      )}
    >
      <div
        className="mb-6 flex size-16 items-center justify-center rounded-[20px] bg-[#407AFF]/10"
        aria-hidden
      >
        <FileText className="size-8 text-[#407AFF]" strokeWidth={1.75} />
      </div>
      <h2 className="max-w-sm text-balance text-xl font-semibold tracking-tight text-[#0F1729]">
        Aún no tienes pólizas
      </h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-[#64748B]">
        Centraliza tus seguros en un solo lugar. Sube un PDF o ingresa los datos
        manualmente.
      </p>
      <Link
        href={`/${locale}/policies/new`}
        className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#407AFF] px-5 py-2.5 text-sm font-semibold text-white transition-[transform,background-color] duration-200 hover:bg-[#3366E6] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#407AFF] focus-visible:ring-offset-2"
      >
        <Plus className="size-4" aria-hidden />
        Sube tu primera póliza
      </Link>
    </div>
  )
}
