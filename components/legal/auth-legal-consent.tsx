'use client'

import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { PRIVACY_VERSION, TERMS_VERSION } from '@/lib/legal/versions'
import { cn } from '@/lib/utils/cn'

type RegisterLegalConsentProps = {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  id?: string
  error?: boolean
}

export function RegisterLegalConsent({
  checked,
  onCheckedChange,
  id = 'legal-consent',
  error = false,
}: RegisterLegalConsentProps) {
  const t = useTranslations('auth.legalConsent')

  return (
    <div className="space-y-1">
      <label
        htmlFor={id}
        className={cn(
          'flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm leading-relaxed transition-colors',
          error
            ? 'border-destructive/50 bg-destructive/5'
            : 'border-border/70 bg-white/40 hover:border-primary/30'
        )}
      >
        <input
          id={id}
          name="legalConsent"
          type="checkbox"
          required
          checked={checked}
          onChange={(event) => onCheckedChange(event.target.checked)}
          className="mt-0.5 size-4 shrink-0 rounded border-border text-primary focus-visible:ring-2 focus-visible:ring-ring"
          aria-invalid={error || undefined}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <span className="text-muted-foreground">
          <LegalConsentRichText messageKey="registerLabel" />
        </span>
      </label>
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive" role="alert">
          {t('registerRequired')}
        </p>
      ) : null}
    </div>
  )
}

type LoginLegalNoticeProps = {
  className?: string
}

export function LoginLegalNotice({ className }: LoginLegalNoticeProps) {
  return (
    <div
      className={cn(
        'text-center text-xs leading-relaxed text-muted-foreground',
        className
      )}
    >
      <LegalConsentRichText messageKey="loginNotice" />
    </div>
  )
}

const legalLinkClassName = 'font-medium text-primary hover:underline'

type LegalConsentRichTextProps = {
  messageKey: 'registerLabel' | 'loginNotice'
}

function LegalConsentRichText({ messageKey }: LegalConsentRichTextProps) {
  const t = useTranslations('auth.legalConsent')

  return (
    <>
      {t.rich(messageKey, {
        terms: (chunks) => (
          <Link
            href="/legal/terms"
            className={legalLinkClassName}
            target="_blank"
            rel="noopener noreferrer"
          >
            {chunks}
          </Link>
        ),
        privacy: (chunks) => (
          <Link
            href="/legal/privacy"
            className={legalLinkClassName}
            target="_blank"
            rel="noopener noreferrer"
          >
            {chunks}
          </Link>
        ),
      })}
    </>
  )
}

export async function persistOnboardingLegalConsent(
  source: 'onboarding' | 'login' = 'onboarding'
): Promise<void> {
  await fetch('/api/consents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      terms: true,
      privacy: true,
      source,
    }),
  })
}

export async function ensureLegalConsentAfterLogin(): Promise<void> {
  try {
    const response = await fetch('/api/consents')
    if (!response.ok) {
      return
    }

    const body = (await response.json()) as {
      consents?: {
        termsVersion?: string
        privacyVersion?: string
        termsAcceptedAt?: string
        privacyAcceptedAt?: string
      }
    }

    const consents = body.consents
    const needsTerms =
      !consents?.termsAcceptedAt || consents.termsVersion !== TERMS_VERSION
    const needsPrivacy =
      !consents?.privacyAcceptedAt ||
      consents.privacyVersion !== PRIVACY_VERSION

    if (needsTerms || needsPrivacy) {
      await persistOnboardingLegalConsent('login')
    }
  } catch {
    // Non-blocking: login should not fail if consent API is unavailable
  }
}
