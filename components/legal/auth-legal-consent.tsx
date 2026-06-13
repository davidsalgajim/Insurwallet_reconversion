'use client'

import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'

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
          <LegalConsentText
            termsLabel={t('termsLink')}
            privacyLabel={t('privacyLink')}
            template={t('registerLabel')}
          />
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
  const t = useTranslations('auth.legalConsent')

  return (
    <p
      className={cn(
        'text-center text-xs leading-relaxed text-muted-foreground',
        className
      )}
    >
      <LegalConsentText
        termsLabel={t('termsLink')}
        privacyLabel={t('privacyLink')}
        template={t('loginNotice')}
      />
    </p>
  )
}

type LegalConsentTextProps = {
  template: string
  termsLabel: string
  privacyLabel: string
}

function LegalConsentText({
  template,
  termsLabel,
  privacyLabel,
}: LegalConsentTextProps) {
  const parts = template.split(/(\{terms\}|\{privacy\})/)

  return (
    <>
      {parts.map((part, index) => {
        if (part === '{terms}') {
          return (
            <Link
              key={`terms-${index}`}
              href="/legal/terms"
              className="font-medium text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {termsLabel}
            </Link>
          )
        }

        if (part === '{privacy}') {
          return (
            <Link
              key={`privacy-${index}`}
              href="/legal/privacy"
              className="font-medium text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {privacyLabel}
            </Link>
          )
        }

        return <span key={`text-${index}`}>{part as ReactNode}</span>
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
