'use client'

import { Info } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { cn } from '@/lib/utils/cn'

type ProtectedPdfWarningProps = {
  className?: string
}

export function ProtectedPdfWarning({ className }: ProtectedPdfWarningProps) {
  const t = useTranslations('policies.upload')

  return (
    <div
      className={cn(
        'flex gap-2.5 rounded-[var(--radius-inner)] border border-primary/20 bg-primary/5 px-3 py-2.5 text-sm leading-relaxed text-muted-foreground',
        className
      )}
      role="note"
    >
      <Info
        className="mt-0.5 size-4 shrink-0 text-primary"
        strokeWidth={1.5}
        aria-hidden
      />
      <p>{t('protectedPdfWarning')}</p>
    </div>
  )
}
