'use client'

import { Shield } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils/cn'

type CloudAIConsentModalProps = {
  open: boolean
  onAccept: () => void
  onCancel: () => void
}

export function CloudAIConsentModal({
  open,
  onAccept,
  onCancel,
}: CloudAIConsentModalProps) {
  const t = useTranslations('legal.cloudAi')

  if (!open) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cloud-ai-consent-title"
    >
      <div className="glass-panel w-full max-w-lg p-6">
        <div className="mb-4 flex items-start gap-3">
          <span className="icon-circle size-11 shrink-0 border-0 bg-primary/10 text-primary">
            <Shield className="size-5" strokeWidth={1.5} />
          </span>
          <div className="space-y-2">
            <h2 id="cloud-ai-consent-title" className="text-lg font-semibold">
              {t('title')}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t('description')}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              <Link
                href="/legal/privacy"
                className="font-medium text-primary hover:underline"
              >
                {t('privacyLink')}
              </Link>
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            className="rounded-[var(--radius-pill)]"
            onClick={onCancel}
          >
            {t('cancel')}
          </Button>
          <Button
            type="button"
            className={cn('rounded-[var(--radius-pill)]')}
            onClick={onAccept}
          >
            {t('accept')}
          </Button>
        </div>
      </div>
    </div>
  )
}
