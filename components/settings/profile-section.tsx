'use client'

import { Pencil, User } from 'lucide-react'
import { useRef, useState } from 'react'
import { useTranslations } from 'next-intl'

import { useAuth } from '@/components/auth/auth-provider'
import { Button } from '@/components/ui/button'
import {
  reloadCurrentUser,
  updateUserProfile,
  uploadUserAvatar,
} from '@/lib/firebase/auth'
import { cn } from '@/lib/utils/cn'

import {
  settingsEmailHintClass,
  settingsHintClass,
  settingsIconClass,
  settingsLabelClass,
  settingsRowClass,
  settingsTextBlockClass,
} from './settings-shared'

export function ProfileSection() {
  const t = useTranslations('settings.profile')
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [editing, setEditing] = useState(false)
  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSave() {
    if (!user) {
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      await updateUserProfile({ displayName: displayName.trim() })
      await reloadCurrentUser()
      setEditing(false)
      setMessage(t('saved'))
    } catch {
      setMessage(t('saveError'))
    } finally {
      setSaving(false)
    }
  }

  async function handleAvatarChange(file: File | undefined) {
    if (!user || !file) {
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const photoURL = await uploadUserAvatar(file, user.uid)
      await updateUserProfile({
        displayName: (displayName || user.displayName || t('unnamed')).trim(),
        photoURL,
      })
      await reloadCurrentUser()
      setMessage(t('photoSaved'))
    } catch {
      setMessage(t('photoError'))
    } finally {
      setSaving(false)
    }
  }

  const initials = (user?.displayName ?? user?.email ?? '?')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="glass-panel overflow-hidden">
      <div className={settingsRowClass}>
        <button
          type="button"
          className="group relative mt-0.5 shrink-0"
          onClick={() => fileInputRef.current?.click()}
          aria-label={t('changePhoto')}
        >
          {user?.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element -- Firebase Storage URLs vary by bucket
            <img
              src={user.photoURL}
              alt=""
              className="size-10 rounded-full object-cover ring-2 ring-white/80"
            />
          ) : (
            <span className={cn(settingsIconClass, 'text-sm font-semibold')}>
              {initials}
            </span>
          )}
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-xs text-white opacity-0 transition group-hover:opacity-100">
            <User className="size-4" />
          </span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(event) => void handleAvatarChange(event.target.files?.[0])}
        />

        <span className={settingsTextBlockClass}>
          {editing ? (
            <input
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="h-9 w-full rounded-[var(--radius-inner)] border border-border bg-white/70 px-3 text-sm"
              maxLength={120}
            />
          ) : (
            <>
              <span className={settingsLabelClass}>
                {user?.displayName ?? t('unnamed')}
              </span>
              <span className={settingsEmailHintClass}>
                {user?.email ?? t('noEmail')}
              </span>
            </>
          )}
          {message ? (
            <span className={cn(settingsHintClass, 'text-primary')}>
              {message}
            </span>
          ) : null}
        </span>

        {editing ? (
          <div className="flex shrink-0 gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={saving}
              onClick={() => {
                setEditing(false)
                setDisplayName(user?.displayName ?? '')
              }}
            >
              {t('cancel')}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={saving || !displayName.trim()}
              onClick={() => void handleSave()}
            >
              {saving ? t('saving') : t('save')}
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-0.5 size-9 shrink-0 p-0"
            onClick={() => {
              setDisplayName(user?.displayName ?? '')
              setEditing(true)
            }}
            aria-label={t('edit')}
          >
            <Pencil className="size-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
