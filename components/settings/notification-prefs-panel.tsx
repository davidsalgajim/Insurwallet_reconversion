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
import {
  settingsHintClass,
  settingsLabelClass,
  settingsSectionTitleClass,
} from '@/components/settings/settings-shared'
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
  const tSettings = useTranslations('settings')
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
      <div className="glass-panel overflow-hidden">
        <div className="px-5 pt-4">
          <h2 id="settings-notifications" className={settingsSectionTitleClass}>
            {tSettings('sections.notifications')}
          </h2>
        </div>

        <div className="border-t border-border/60 px-5 py-4">
          <p className={settingsLabelClass}>{t('channels.title')}</p>
          <p className={settingsHintClass}>{t('channels.description')}</p>
          <div
            className="mt-3 grid gap-2 rounded-[var(--radius-inner)] bg-white/40 p-2 sm:grid-cols-3"
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
          <p className={cn(settingsHintClass, 'mt-2')}>
            {t('channels.pushHint')}
          </p>
        </div>

        <div className="border-t border-border/60">
          <div className="px-5 pt-4 pb-2">
            <p className={settingsLabelClass}>{t('eventsTitle')}</p>
            <p className={settingsHintClass}>{t('description')}</p>
          </div>
          <ul className="divide-y divide-border/60">
            {items.map((item) => (
              <li
                key={item.key}
                className="flex items-start justify-between gap-4 px-5 py-3.5"
              >
                <span className={cn(settingsLabelClass, 'min-w-0 flex-1')}>
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
                    backgroundColor: prefs[item.key]
                      ? 'var(--primary)'
                      : undefined,
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
        </div>

        {message ? (
          <div className="border-t border-border/60 px-5 py-3">
            <p className={cn(settingsHintClass, 'text-primary')} role="status">
              {message}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
