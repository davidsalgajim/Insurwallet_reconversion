'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

import type {
  NotificationChannels,
  NotificationPrefs,
} from '@/lib/schemas/user'
import {
  defaultNotificationChannels,
  defaultNotificationPrefs,
} from '@/lib/schemas/user'
import { cn } from '@/lib/utils/cn'

type ChannelMode = 'email' | 'push' | 'both'

function channelsToMode(channels: NotificationChannels): ChannelMode {
  if (channels.email && channels.push) {
    return 'both'
  }

  if (channels.push) {
    return 'push'
  }

  return 'email'
}

function modeToChannels(mode: ChannelMode): NotificationChannels {
  switch (mode) {
    case 'email':
      return { email: true, push: false }
    case 'push':
      return { email: false, push: true }
    case 'both':
      return { email: true, push: true }
  }
}

type NotificationPrefsPanelProps = {
  className?: string
  onChannelsChange?: (channels: NotificationChannels) => void
}

export function NotificationPrefsPanel({
  className,
  onChannelsChange,
}: NotificationPrefsPanelProps) {
  const t = useTranslations('settings.notifications')
  const [prefs, setPrefs] = useState<NotificationPrefs>(
    defaultNotificationPrefs()
  )
  const [channels, setChannels] = useState<NotificationChannels>(
    defaultNotificationChannels()
  )
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
            notificationChannels: NotificationChannels
          }
          setPrefs(body.notificationPrefs)
          setChannels(body.notificationChannels)
          onChannelsChange?.(body.notificationChannels)
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [onChannelsChange])

  async function saveAll(
    nextPrefs: NotificationPrefs,
    nextChannels: NotificationChannels
  ) {
    setPrefs(nextPrefs)
    setChannels(nextChannels)
    onChannelsChange?.(nextChannels)
    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/notifications/prefs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationPrefs: nextPrefs,
          notificationChannels: nextChannels,
        }),
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
    void saveAll({ ...prefs, [key]: !prefs[key] }, channels)
  }

  function setChannelMode(mode: ChannelMode) {
    void saveAll(prefs, modeToChannels(mode))
  }

  const channelModes: Array<{ mode: ChannelMode; label: string }> = [
    { mode: 'email', label: t('channels.emailOnly') },
    { mode: 'push', label: t('channels.pushOnly') },
    { mode: 'both', label: t('channels.both') },
  ]

  const items: Array<{ key: keyof NotificationPrefs; label: string }> = [
    { key: 'expiry30', label: t('expiry30') },
    { key: 'expiry60', label: t('expiry60') },
    { key: 'expiry90', label: t('expiry90') },
    { key: 'renewals', label: t('renewals') },
    { key: 'events', label: t('events') },
  ]

  const activeMode = channelsToMode(channels)

  return (
    <div className={className}>
      <div className="mb-6">
        <p className="mb-1 text-sm font-medium text-foreground">
          {t('channels.title')}
        </p>
        <p className="mb-3 text-sm text-muted-foreground">
          {t('channels.description')}
        </p>
        <div
          className="glass-panel grid gap-2 p-2 sm:grid-cols-3"
          role="radiogroup"
          aria-label={t('channels.title')}
        >
          {channelModes.map((item) => (
            <button
              key={item.mode}
              type="button"
              role="radio"
              aria-checked={activeMode === item.mode}
              disabled={loading || saving}
              onClick={() => setChannelMode(item.mode)}
              className={cn(
                'rounded-xl px-3 py-2.5 text-left text-sm font-medium transition',
                activeMode === item.mode
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-white/60 text-foreground hover:bg-white/80'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {t('channels.pushHint')}
        </p>
      </div>

      <p className="mb-1 text-sm font-medium text-foreground">
        {t('eventsTitle')}
      </p>
      <p className="mb-3 text-sm text-muted-foreground">{t('description')}</p>
      <ul className="glass-panel divide-y divide-border/60 overflow-hidden">
        {items.map((item) => (
          <li
            key={item.key}
            className="flex items-start justify-between gap-4 px-4 py-3"
          >
            <span className="min-w-0 flex-1 text-sm font-medium leading-snug">
              {item.label}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={prefs[item.key]}
              disabled={loading || saving}
              onClick={() => togglePref(item.key)}
              className="relative mt-0.5 inline-flex h-6 w-11 shrink-0 rounded-full border border-border/60 bg-muted transition data-[on=true]:bg-primary"
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
