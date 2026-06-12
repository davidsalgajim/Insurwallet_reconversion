'use client'

import { FileText, Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils/cn'

type PoliciesEmptyStateProps = {
  className?: string
}

export function PoliciesEmptyState({ className }: PoliciesEmptyStateProps) {
  const t = useTranslations('policies.empty')

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-6 py-20 text-center',
        className
      )}
    >
      <div className="icon-circle mb-6 size-16 stat-icon-primary border-0">
        <FileText className="size-7" strokeWidth={1.5} />
      </div>
      <h2 className="max-w-sm text-balance text-xl font-semibold tracking-tight">
        {t('title')}
      </h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        {t('description')}
      </p>
      <Button
        asChild
        size="lg"
        variant="ink"
        className="mt-8 rounded-[var(--radius-pill)]"
      >
        <Link href="/policies/new">
          <Plus className="size-4" strokeWidth={1.5} />
          {t('cta')}
        </Link>
      </Button>
    </div>
  )
}
