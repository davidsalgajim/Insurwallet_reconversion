'use client'

import { Crown, Sparkles, X } from 'lucide-react'
import { useEffect, useRef, useSyncExternalStore } from 'react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { FREE_POLICY_LIMIT } from '@/lib/subscription/constants'
import { cn } from '@/lib/utils/cn'

export type PaywallReason = 'policy_limit' | 'cloud_ai' | 'generic'

type PaywallDialogProps = {
  open: boolean
  reason?: PaywallReason
  onClose: () => void
  onUpgrade?: () => void
}

export function PaywallDialog({
  open,
  reason = 'generic',
  onClose,
  onUpgrade,
}: PaywallDialogProps) {
  const t = useTranslations('subscription.paywall')
  const dialogRef = useRef<HTMLDialogElement>(null)
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || !mounted) {
      return
    }

    if (open && !dialog.open) {
      dialog.showModal()
      return
    }

    if (!open && dialog.open) {
      dialog.close()
    }
  }, [mounted, open])

  if (!mounted) {
    return null
  }

  const reasonKey =
    reason === 'policy_limit'
      ? 'policyLimit'
      : reason === 'cloud_ai'
        ? 'cloudAi'
        : 'generic'

  const features = [
    t('features.unlimitedPolicies'),
    t('features.mariana'),
    t('features.cloudExtraction'),
    t('features.prioritySupport'),
  ] as const

  return (
    <dialog
      ref={dialogRef}
      className={cn(
        'fixed inset-0 z-50 m-auto w-[min(100%-2rem,26rem)] rounded-[var(--radius-inner)] border border-border bg-white/95 p-0 shadow-[var(--shadow-float)] backdrop-blur-md',
        'open:animate-fade-up'
      )}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClose={onClose}
    >
      <div className="relative space-y-5 p-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={t('close')}
        >
          <X className="size-4" strokeWidth={1.5} />
        </button>

        <div className="flex items-start gap-3 pr-8">
          <span className="icon-circle size-11 shrink-0 border-0 bg-primary/10 text-primary">
            <Crown className="size-5" strokeWidth={1.5} />
          </span>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              {t('badge')}
            </p>
            <h2 className="text-lg font-semibold tracking-tight">
              {t('title')}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t(`reasons.${reasonKey}`, { limit: FREE_POLICY_LIMIT })}
            </p>
          </div>
        </div>

        <ul className="glass-panel space-y-2.5 p-4">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-sm">
              <Sparkles
                className="mt-0.5 size-4 shrink-0 text-[var(--color-accent)]"
                strokeWidth={1.5}
              />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-3">
          <Button
            type="button"
            className="w-full rounded-[var(--radius-pill)]"
            onClick={() => {
              onUpgrade?.()
              onClose()
            }}
          >
            {t('cta')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full rounded-[var(--radius-pill)] text-muted-foreground"
            onClick={onClose}
          >
            {t('dismiss')}
          </Button>
        </div>
      </div>
    </dialog>
  )
}
