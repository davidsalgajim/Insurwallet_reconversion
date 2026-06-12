'use client'

import { CheckCircle2, Circle, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

import type { ProcessingState } from '@/lib/schemas/document'
import { cn } from '@/lib/utils/cn'

type DocumentProcessingStatusProps = {
  state: ProcessingState
  fileName: string
  className?: string
}

const PIPELINE: ProcessingState[] = [
  'pending',
  'extracting',
  'analyzing',
  'ready',
]

function stepIndex(state: ProcessingState): number {
  if (state === 'failed') return -1
  const index = PIPELINE.indexOf(state)
  return index >= 0 ? index : 0
}

export function DocumentProcessingStatus({
  state,
  fileName,
  className,
}: DocumentProcessingStatusProps) {
  const t = useTranslations('policies.upload.processing')
  const activeIndex = stepIndex(state)
  const isFailed = state === 'failed'

  return (
    <div className={cn('glass-panel space-y-5 p-6', className)}>
      <div>
        <p className="text-sm font-semibold">{t('title')}</p>
        <p className="mt-1 truncate text-sm text-muted-foreground">
          {fileName}
        </p>
      </div>

      <ol className="space-y-3" aria-label={t('title')}>
        {PIPELINE.map((step, index) => {
          const isDone = !isFailed && index < activeIndex
          const isActive = !isFailed && index === activeIndex
          const Icon = isDone ? CheckCircle2 : isActive ? Loader2 : Circle

          return (
            <li
              key={step}
              className={cn(
                'flex items-center gap-3 text-sm',
                isDone && 'text-foreground',
                isActive && 'font-medium text-foreground',
                !isDone && !isActive && 'text-muted-foreground'
              )}
            >
              <Icon
                className={cn(
                  'size-4 shrink-0',
                  isDone && 'text-[var(--primitive-success)]',
                  isActive && 'animate-spin text-primary',
                  !isDone && !isActive && 'text-muted-foreground/60'
                )}
                strokeWidth={1.5}
              />
              <span>{t(`steps.${step}`)}</span>
            </li>
          )
        })}
      </ol>

      {isFailed ? (
        <p className="text-sm text-[var(--primitive-danger)]">{t('failed')}</p>
      ) : state === 'ready' ? (
        <p className="text-sm text-[var(--primitive-success)]">{t('ready')}</p>
      ) : (
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t('pendingNote')}
        </p>
      )}
    </div>
  )
}
