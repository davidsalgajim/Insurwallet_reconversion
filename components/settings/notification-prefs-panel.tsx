'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

import type { NotificationPrefs } from '@/lib/schemas/user'

const DEFAULT_PREFS: NotificationPrefs = {
  expiry30: true,
  expiry60: true,
  expiry90: false,
  renewals: true,
  events: false,
}

type NotificationPrefsPanelProps = {
  className?: string
}

export function NotificationPrefsPanel({
  className,
}: NotificationPrefsPanelProps) {
  const t = useTranslations('settings.notifications')
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch('/api/notifications/prefs')

        if (response.ok) {
          const body = (await response.json()) as {
            notificationPrefs: NotificationPrefs
          }
          setPrefs(body.notificationPrefs)
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  async function savePrefs(next: NotificationPrefs) {
    setPrefs(next)
    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/notifications/prefs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationPrefs: next }),
      })

      if (!response.ok) {
        throw new Error('save_failed')
      }

      setMessage(t('saved'))
    } catch {
      setMessage(t('saveError'))
    } finally {
      setSaving(false)
    }
  }

  function togglePref(key: keyof NotificationPrefs) {
    void savePrefs({ ...prefs, [key]: !prefs[key] })
  }

  const items: Array<{ key: keyof NotificationPrefs; label: string }> = [
    { key: 'expiry30', label: t('expiry30') },
    { key: 'expiry60', label: t('expiry60') },
    { key: 'expiry90', label: t('expiry90') },
    { key: 'renewals', label: t('renewals') },
    { key: 'events', label: t('events') },
  ]

  return (
    <div className={className}>
      <p className="mb-3 text-sm text-muted-foreground">{t('description')}</p>
      <ul className="glass-panel divide-y divide-border/60 overflow-hidden">
        {items.map((item) => (
          <li
            key={item.key}
            className="flex items-center justify-between gap-4 px-4 py-3"
          >
            <span className="text-sm font-medium">{item.label}</span>
            <button
              type="button"
              role="switch"
              aria-checked={prefs[item.key]}
              disabled={loading || saving}
              onClick={() => togglePref(item.key)}
              className="relative inline-flex h-6 w-11 shrink-0 rounded-full border border-border/60 bg-muted transition data-[on=true]:bg-primary"
              data-on={prefs[item.key] ? 'true' : 'false'}
              style={{
                backgroundColor: prefs[item.key] ? 'var(--primary)' : undefined,
              }}
            >
              <span
                className="pointer-events-none inline-block size-5 translate-x-0.5 rounded-full bg-white shadow transition-transform"
                style={{
                  transform: prefs[item.key]
                    ? 'translateX(1.25rem)'
                    : undefined,
                }}
              />
            </button>
          </li>
        ))}
      </ul>
      {message ? (
        <p className="mt-3 text-sm text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}
    </div>
  )
}
