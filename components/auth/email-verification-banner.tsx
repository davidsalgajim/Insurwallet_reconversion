'use client'

import { AlertTriangle, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { useAuth } from '@/components/auth/auth-provider'
import { Link } from '@/i18n/navigation'
import { userNeedsEmailVerification } from '@/lib/firebase/auth'
import { isEmailVerificationRequired } from '@/lib/firebase/email-verification-policy'

export function EmailVerificationBanner() {
  const t = useTranslations('auth')
  const { user, loading } = useAuth()
  const [dismissed, setDismissed] = useState(false)

  if (
    loading ||
    dismissed ||
    isEmailVerificationRequired() ||
    !user ||
    !userNeedsEmailVerification(user)
  ) {
    return null
  }

  return (
    <div
      className="mb-4 flex items-start gap-3 rounded-2xl border border-[var(--semantic-warning)]/30 bg-[var(--semantic-warning)]/10 px-4 py-3 text-sm text-ink"
      role="status"
    >
      <AlertTriangle
        className="mt-0.5 size-4 shrink-0 text-[var(--semantic-warning)]"
        strokeWidth={1.5}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="font-medium">{t('verifyEmailBannerTitle')}</p>
        <p className="mt-1 text-muted-foreground">
          {t('verifyEmailBannerDesc')}
        </p>
        <Link
          href="/verify-email"
          className="mt-2 inline-block font-medium text-primary hover:underline"
        >
          {t('verifyEmailBannerAction')}
        </Link>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-black/5 hover:text-ink"
        aria-label={t('verifyEmailBannerDismiss')}
      >
        <X className="size-4" strokeWidth={1.5} />
      </button>
    </div>
  )
}
