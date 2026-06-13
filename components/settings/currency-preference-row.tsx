'use client'

import { Coins } from 'lucide-react'
import { useState } from 'react'
import { useTranslations } from 'next-intl'

import { useUserPreferences } from '@/hooks/use-user-preferences'
import {
  SUPPORTED_CURRENCIES,
  type SupportedCurrency,
} from '@/lib/schemas/user'
import { cn } from '@/lib/utils/cn'

import {
  settingsHintClass,
  settingsIconClass,
  settingsLabelClass,
  settingsRowClass,
  settingsTextBlockClass,
} from './settings-shared'

export function CurrencyPreferenceRow() {
  const t = useTranslations('settings.currency')
  const { currency, loading, saveCurrency } = useUserPreferences()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleChange(next: SupportedCurrency) {
    setSaving(true)
    setMessage(null)
    try {
      await saveCurrency(next)
      setMessage(t('saved'))
    } catch {
      setMessage(t('saveError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <li>
      <div className={settingsRowClass}>
        <span className={settingsIconClass}>
          <Coins className="size-4" strokeWidth={1.5} />
        </span>
        <span className={settingsTextBlockClass}>
          <span className={settingsLabelClass}>{t('label')}</span>
          <span className={settingsHintClass}>{t('hint')}</span>
          {message ? (
            <span className={cn(settingsHintClass, 'text-primary')}>
              {message}
            </span>
          ) : null}
        </span>
        <select
          value={currency}
          disabled={loading || saving}
          onChange={(event) =>
            void handleChange(event.target.value as SupportedCurrency)
          }
          className="mt-0.5 h-9 shrink-0 rounded-[var(--radius-inner)] border border-border bg-white/70 px-2 text-sm font-mono"
          aria-label={t('label')}
        >
          {SUPPORTED_CURRENCIES.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
      </div>
    </li>
  )
}
