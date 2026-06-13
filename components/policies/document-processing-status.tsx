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
  const progress =
    activeIndex >= 0
      ? Math.min(100, ((activeIndex + 1) / PIPELINE.length) * 100)
      : 0

  return (
    <div
      className={cn(
        'glass-panel space-y-5 p-6 motion-safe:transition-[box-shadow] motion-safe:duration-200 motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)]',
        state === 'ready' &&
          'motion-safe:shadow-[var(--shadow-soft)] ring-1 ring-[var(--primitive-success)]/20',
        className
      )}
    >
      <div>
        <p className="text-sm font-semibold">{t('title')}</p>
        <p className="mt-1 truncate text-sm text-muted-foreground">
          {fileName}
        </p>
      </div>

      <div className="space-y-2" aria-hidden="true">
        <div className="h-1.5 overflow-hidden rounded-full bg-white/60 ring-1 ring-border/60">
          <div
            className={cn(
              'h-full rounded-full bg-primary motion-safe:transition-[width] motion-safe:duration-200 motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)]',
              isFailed && 'bg-[var(--primitive-danger)]'
            )}
            style={{ width: isFailed ? '100%' : `${progress}%` }}
          />
        </div>
      </div>

      <ol className="space-y-2" aria-label={t('title')}>
        {PIPELINE.map((step, index) => {
          const isDone = !isFailed && index < activeIndex
          const isActive = !isFailed && index === activeIndex
          const Icon = isDone ? CheckCircle2 : isActive ? Loader2 : Circle

          return (
            <li
              key={step}
              className={cn(
                'flex items-center gap-3 rounded-[var(--radius-inner)] px-2 py-1.5 text-sm motion-safe:transition-[color,background-color,transform] motion-safe:duration-200 motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)]',
                isDone && 'text-foreground',
                isActive &&
                  'translate-x-0.5 bg-primary/5 font-medium text-foreground',
                !isDone && !isActive && 'text-muted-foreground'
              )}
            >
              <Icon
                className={cn(
                  'size-4 shrink-0 motion-safe:transition-[color,transform] motion-safe:duration-200 motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)]',
                  isDone && 'text-[var(--primitive-success)]',
                  isActive &&
                    'motion-safe:animate-spin text-primary motion-reduce:animate-none',
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
        <p className="text-sm text-[var(--primitive-danger)] motion-safe:animate-fade-up motion-reduce:animate-none">
          {t('failed')}
        </p>
      ) : state === 'ready' ? (
        <p className="text-sm text-[var(--primitive-success)] motion-safe:animate-fade-up motion-reduce:animate-none">
          {t('ready')}
        </p>
      ) : (
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t('pendingNote')}
        </p>
      )}
    </div>
  )
}
