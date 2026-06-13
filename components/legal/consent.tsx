'use client'

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { useTranslations } from 'next-intl'

import { useAuth } from '@/components/auth/auth-provider'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import {
  getCloudAIConsentStatus,
  hasCloudAIConsent,
  hasCookieConsent,
  isCloudAIDeclined,
  type CloudAIConsentOutcome,
  type ConsentSource,
  type UserConsents,
} from '@/lib/schemas/consents'
import { cn } from '@/lib/utils/cn'

const CONSENT_STORAGE_KEY = 'iw_cookie_consent'

type PostConsentOptions = {
  source?: ConsentSource
}

async function postCloudAIConsent(
  outcome: CloudAIConsentOutcome,
  options?: PostConsentOptions
): Promise<UserConsents> {
  const response = await fetch('/api/consents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      consent: outcome,
      source: options?.source ?? 'settings',
    }),
  })

  if (!response.ok) {
    throw new Error('consent_failed')
  }

  const body = (await response.json()) as { consents?: UserConsents }
  return body.consents ?? {}
}

export function CookieConsentBanner() {
  const t = useTranslations('legal.cookies')
  const { user } = useAuth()
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
  const [dismissed, setDismissed] = useState(false)

  const persistConsent = useCallback(async () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, 'accepted')

    if (user) {
      await fetch('/api/consents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cookies: true }),
      }).catch(() => undefined)
    }

    setDismissed(true)
  }, [user])

  if (!mounted || dismissed) {
    return null
  }

  if (localStorage.getItem(CONSENT_STORAGE_KEY) === 'accepted') {
    return null
  }

  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-50 border-t border-border bg-white/95 p-4 shadow-[var(--shadow-float)] backdrop-blur-md',
        'animate-fade-up'
      )}
      role="dialog"
      aria-labelledby="cookie-consent-title"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p
            id="cookie-consent-title"
            className="text-sm font-semibold text-foreground"
          >
            {t('title')}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t('description')}{' '}
            <Link
              href="/legal/privacy"
              className="font-medium text-primary hover:underline"
            >
              {t('privacyLink')}
            </Link>
          </p>
        </div>
        <div className="flex shrink-0 gap-3">
          <Button
            type="button"
            variant="secondary"
            className="rounded-[var(--radius-pill)]"
            onClick={() => setDismissed(true)}
          >
            {t('dismiss')}
          </Button>
          <Button
            type="button"
            className="rounded-[var(--radius-pill)]"
            onClick={() => void persistConsent()}
          >
            {t('accept')}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function useCloudAIConsent() {
  const { user } = useAuth()
  const [consents, setConsents] = useState<UserConsents | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) {
      return
    }

    let cancelled = false

    const timer = window.setTimeout(() => {
      setLoading(true)

      void (async () => {
        try {
          const response = await fetch('/api/consents')
          if (!response.ok) {
            return
          }

          const body = (await response.json()) as { consents?: UserConsents }
          if (!cancelled) {
            setConsents(body.consents ?? null)
          }
        } finally {
          if (!cancelled) {
            setLoading(false)
          }
        }
      })()
    }, 0)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [user])

  const setCloudAIConsent = useCallback(
    async (outcome: CloudAIConsentOutcome, options?: PostConsentOptions) => {
      const updated = await postCloudAIConsent(outcome, options)
      setConsents(updated)
    },
    []
  )

  const grantCloudAIConsent = useCallback(
    async (options?: PostConsentOptions) => {
      await setCloudAIConsent('accepted', options)
    },
    [setCloudAIConsent]
  )

  const declineCloudAIConsent = useCallback(
    async (options?: PostConsentOptions) => {
      await setCloudAIConsent('declined', options)
    },
    [setCloudAIConsent]
  )

  const resolvedConsents = user ? consents : null

  return {
    loading: Boolean(user) && loading,
    consents: resolvedConsents,
    consentStatus: getCloudAIConsentStatus(resolvedConsents),
    hasConsent: hasCloudAIConsent(resolvedConsents),
    isDeclined: isCloudAIDeclined(resolvedConsents),
    hasCookieConsent: hasCookieConsent(resolvedConsents),
    grantCloudAIConsent,
    declineCloudAIConsent,
    setCloudAIConsent,
  }
}
