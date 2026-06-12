'use client'

import { useTranslations } from 'next-intl'

import { cn } from '@/lib/utils/cn'

type PolicyWizardProgressProps = {
  currentStep: number
  totalSteps?: number
  className?: string
}

export function PolicyWizardProgress({
  currentStep,
  totalSteps = 4,
  className,
}: PolicyWizardProgressProps) {
  const t = useTranslations('policies.wizard')

  return (
    <div
      className={cn('mb-6 flex gap-2', className)}
      aria-label={t('progressAria')}
    >
      {Array.from({ length: totalSteps }, (_, index) => {
        const step = index + 1
        const isComplete = step <= currentStep

        return (
          <span
            key={step}
            className={cn(
              'flex size-8 items-center justify-center rounded-full text-xs font-semibold',
              isComplete
                ? 'bg-[var(--primitive-ink)] text-white shadow-md'
                : 'bg-white/60 text-muted-foreground ring-1 ring-border'
            )}
          >
            {step}
          </span>
        )
      })}
    </div>
  )
}
