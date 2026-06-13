'use client'

import { Bot, FileText, Shield } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

import { CloudAIConsentModal } from '@/components/legal/cloud-ai-consent-modal'
import { Link } from '@/i18n/navigation'
import {
  getCloudAIConsentStatus,
  type CloudAIConsentOutcome,
  type UserConsents,
} from '@/lib/schemas/consents'
import { cn } from '@/lib/utils/cn'

import {
  settingsHintClass,
  settingsIconClass,
  settingsLabelClass,
  settingsRowClass,
  settingsTextBlockClass,
} from './settings-shared'

export function LegalConsentSection() {
  const t = useTranslations('settings.legal')
  const [consents, setConsents] = useState<UserConsents>({})
  const [loading, setLoading] = useState(true)
  const [consentOpen, setConsentOpen] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch('/api/consents')
        if (response.ok) {
          const body = (await response.json()) as { consents: UserConsents }
          setConsents(body.consents)
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  async function saveCloudAI(outcome: CloudAIConsentOutcome) {
    const response = await fetch('/api/consents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consent: outcome, source: 'settings' }),
    })

    if (!response.ok) {
      throw new Error('consent_failed')
    }

    const body = (await response.json()) as { consents: UserConsents }
    setConsents(body.consents)
    setMessage(
      outcome === 'accepted' ? t('aiConsentSaved') : t('aiConsentDeclinedSaved')
    )
  }

  const consentStatus = getCloudAIConsentStatus(consents)

  const statusHint = loading
    ? t('loading')
    : consentStatus === 'accepted'
      ? t('aiConsentGranted')
      : consentStatus === 'declined'
        ? t('aiConsentDeclined')
        : t('aiConsentMissing')

  const items = [
    {
      icon: Shield,
      label: t('privacy'),
      hint: t('privacyHint'),
      href: '/legal/privacy?from=settings' as const,
    },
    {
      icon: FileText,
      label: t('terms'),
      hint: t('termsHint'),
      href: '/legal/terms?from=settings' as const,
    },
  ] as const

  return (
    <>
      <ul className="glass-panel divide-y divide-border/60 overflow-hidden">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  settingsRowClass,
                  'group transition-[background-color] duration-200 hover:bg-white/50'
                )}
              >
                <span className={settingsIconClass}>
                  <Icon className="size-4" strokeWidth={1.5} />
                </span>
                <span className={settingsTextBlockClass}>
                  <span className={settingsLabelClass}>{item.label}</span>
                  <span className={settingsHintClass}>{item.hint}</span>
                </span>
              </Link>
            </li>
          )
        })}
        <li>
          <button
            type="button"
            className={cn(
              settingsRowClass,
              'group w-full text-left transition-[background-color] duration-200 hover:bg-white/50'
            )}
            onClick={() => setConsentOpen(true)}
            disabled={loading}
          >
            <span className={settingsIconClass}>
              <Bot className="size-4" strokeWidth={1.5} />
            </span>
            <span className={settingsTextBlockClass}>
              <span className={settingsLabelClass}>{t('aiConsent')}</span>
              <span
                className={cn(
                  settingsHintClass,
                  consentStatus === 'accepted' && 'text-success',
                  consentStatus === 'declined' && 'text-warning'
                )}
              >
                {statusHint}
              </span>
              {message ? (
                <span className={cn(settingsHintClass, 'text-primary')}>
                  {message}
                </span>
              ) : null}
            </span>
          </button>
        </li>
      </ul>

      <CloudAIConsentModal
        open={consentOpen}
        currentStatus={consentStatus}
        onCancel={() => setConsentOpen(false)}
        onAccept={() => {
          void saveCloudAI('accepted')
            .then(() => setConsentOpen(false))
            .catch(() => setMessage(t('aiConsentError')))
        }}
        onDecline={() => {
          void saveCloudAI('declined')
            .then(() => setConsentOpen(false))
            .catch(() => setMessage(t('aiConsentError')))
        }}
      />
    </>
  )
}
