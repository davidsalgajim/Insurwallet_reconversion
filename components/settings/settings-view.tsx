'use client'

import {
  ChevronRight,
  Download,
  Globe,
  Shield,
  Trash2,
  User,
} from 'lucide-react'
import { useCallback, useState } from 'react'
import { useTranslations } from 'next-intl'

import { useAuth } from '@/components/auth/auth-provider'
import { LocaleSwitcher } from '@/components/i18n/locale-switcher'
import { AppTopbar } from '@/components/layout/app-topbar'
import { DeleteAccountDialog } from '@/components/settings/delete-account-dialog'
import { NotificationPrefsPanel } from '@/components/settings/notification-prefs-panel'
import { useFcmRegistration } from '@/hooks/useFcmRegistration'
import { Button } from '@/components/ui/button'
import { Link, useRouter } from '@/i18n/navigation'
import {
  requestAccountDeletion,
  requestDataExport,
} from '@/lib/account/account-actions'
import { cn } from '@/lib/utils/cn'

const settingsRowClass =
  'flex w-full min-h-[3.25rem] items-start gap-4 px-5 py-3.5'
const settingsTextBlockClass = 'min-w-0 flex-1 text-left'
const settingsLabelClass =
  'block break-words text-sm font-medium leading-snug text-foreground'
const settingsHintClass =
  'mt-0.5 block break-words text-xs leading-relaxed text-muted-foreground'
const settingsEmailHintClass =
  'mt-0.5 block break-all text-xs leading-relaxed text-muted-foreground'
const settingsIconClass =
  'icon-circle mt-0.5 size-10 shrink-0 border-0 bg-white/70 text-muted-foreground'

export function SettingsView() {
  const t = useTranslations('settings')
  const { user } = useAuth()
  const router = useRouter()
  const [pushEnabled, setPushEnabled] = useState(false)
  const handleChannelsChange = useCallback((channels: { push: boolean }) => {
    setPushEnabled(channels.push)
  }, [])
  useFcmRegistration({ uid: user?.uid, enabled: pushEnabled })
  const [exporting, setExporting] = useState(false)
  const [exportMessage, setExportMessage] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null)

  async function handleExport() {
    setExporting(true)
    setExportMessage(null)
    try {
      await requestDataExport()
      setExportMessage(t('exportSuccess'))
    } catch {
      setExportMessage(t('exportError'))
    } finally {
      setExporting(false)
    }
  }

  async function handleDeleteConfirm() {
    setDeleting(true)
    setDeleteMessage(null)
    try {
      await requestAccountDeletion()
      setDeleteOpen(false)
      router.push('/')
    } catch {
      setDeleteMessage(t('deleteError'))
      setDeleteOpen(false)
    } finally {
      setDeleting(false)
    }
  }

  const sections = [
    {
      id: 'profile',
      title: t('sections.profile'),
      items: [
        {
          icon: User,
          label: t('items.personalData'),
          hint: user?.email ?? t('items.personalDataHint'),
          profile: true as const,
        },
      ],
    },
    {
      id: 'privacy',
      title: t('sections.privacy'),
      items: [
        {
          icon: Shield,
          label: t('items.privacy'),
          hint: t('items.privacyHint'),
          href: '/legal/privacy?from=settings' as const,
        },
        {
          icon: Download,
          label: t('items.export'),
          hint: t('items.exportHint'),
          action: 'export' as const,
        },
        {
          icon: Trash2,
          label: t('items.deleteAccount'),
          hint: t('items.deleteAccountHint'),
          destructive: true,
          action: 'delete' as const,
        },
      ],
    },
    {
      id: 'preferences',
      title: t('sections.preferences'),
      items: [
        {
          icon: Globe,
          label: t('items.language'),
          hint: t('items.languageHint'),
          languageSwitcher: true,
        },
      ],
    },
  ] as const

  return (
    <div className="animate-fade-up">
      <AppTopbar title={t('title')} subtitle={t('subtitle')} />

      <div className="mx-auto w-full max-w-2xl">
        {(exportMessage || deleteMessage) && (
          <div
            className="mb-4 rounded-[var(--radius-inner)] border border-border bg-white/80 px-4 py-3 text-sm text-muted-foreground"
            role="status"
          >
            {exportMessage ?? deleteMessage}
          </div>
        )}

        <div className="space-y-6">
          {sections.map((section) => (
            <section
              key={section.id}
              aria-labelledby={`settings-${section.id}`}
            >
              <h2
                id={`settings-${section.id}`}
                className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {section.title}
              </h2>
              <ul className="glass-panel divide-y divide-border/60 overflow-hidden">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const isLanguage = 'languageSwitcher' in item

                  if (isLanguage) {
                    return (
                      <li key={item.label}>
                        <div className={settingsRowClass}>
                          <span className={settingsIconClass}>
                            <Icon className="size-4" strokeWidth={1.5} />
                          </span>
                          <span className={settingsTextBlockClass}>
                            <span className={settingsLabelClass}>
                              {item.label}
                            </span>
                            <span className={settingsHintClass}>
                              {item.hint}
                            </span>
                          </span>
                          <LocaleSwitcher className="mt-0.5 shrink-0" />
                        </div>
                      </li>
                    )
                  }

                  if ('profile' in item && item.profile) {
                    return (
                      <li key={item.label}>
                        <div className={settingsRowClass}>
                          <span className={settingsIconClass}>
                            <Icon className="size-4" strokeWidth={1.5} />
                          </span>
                          <span className={settingsTextBlockClass}>
                            <span className={settingsLabelClass}>
                              {user?.displayName ?? item.label}
                            </span>
                            <span className={settingsEmailHintClass}>
                              {user?.email ?? item.hint}
                            </span>
                          </span>
                        </div>
                      </li>
                    )
                  }

                  if ('href' in item && item.href) {
                    return (
                      <li key={item.label}>
                        <Link
                          href={item.href}
                          className={cn(
                            settingsRowClass,
                            'group text-left transition-[background-color] duration-200 hover:bg-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring'
                          )}
                        >
                          <span className={settingsIconClass}>
                            <Icon className="size-4" strokeWidth={1.5} />
                          </span>
                          <span className={settingsTextBlockClass}>
                            <span className={settingsLabelClass}>
                              {item.label}
                            </span>
                            <span className={settingsHintClass}>
                              {item.hint}
                            </span>
                          </span>
                          <ChevronRight
                            className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5"
                            strokeWidth={1.5}
                          />
                        </Link>
                      </li>
                    )
                  }

                  if ('action' in item && item.action === 'export') {
                    return (
                      <li key={item.label}>
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={exporting}
                          onClick={() => void handleExport()}
                          className={cn(
                            settingsRowClass,
                            'group h-auto justify-start rounded-none font-normal hover:bg-white/50'
                          )}
                        >
                          <span className={settingsIconClass}>
                            <Icon className="size-4" strokeWidth={1.5} />
                          </span>
                          <span className={settingsTextBlockClass}>
                            <span className={settingsLabelClass}>
                              {exporting ? t('exporting') : item.label}
                            </span>
                            <span className={settingsHintClass}>
                              {item.hint}
                            </span>
                          </span>
                          <ChevronRight
                            className="mt-1 size-4 shrink-0 text-muted-foreground"
                            strokeWidth={1.5}
                          />
                        </Button>
                      </li>
                    )
                  }

                  if ('action' in item && item.action === 'delete') {
                    return (
                      <li key={item.label}>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setDeleteOpen(true)}
                          className={cn(
                            settingsRowClass,
                            'group h-auto justify-start rounded-none font-normal hover:bg-white/50'
                          )}
                        >
                          <span className="icon-circle mt-0.5 size-10 shrink-0 border-0 bg-[var(--primitive-coral)]/12 text-[var(--primitive-coral)]">
                            <Icon className="size-4" strokeWidth={1.5} />
                          </span>
                          <span className={settingsTextBlockClass}>
                            <span className="block break-words text-sm font-medium leading-snug text-[var(--primitive-coral)]">
                              {item.label}
                            </span>
                            <span className={settingsHintClass}>
                              {item.hint}
                            </span>
                          </span>
                          <ChevronRight
                            className="mt-1 size-4 shrink-0 text-muted-foreground"
                            strokeWidth={1.5}
                          />
                        </Button>
                      </li>
                    )
                  }

                  return (
                    <li key={item.label}>
                      <button
                        type="button"
                        className={cn(
                          settingsRowClass,
                          'group text-left transition-[background-color] duration-200 hover:bg-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring'
                        )}
                      >
                        <span
                          className={cn(
                            'icon-circle mt-0.5 size-10 shrink-0 border-0',
                            'destructive' in item && item.destructive
                              ? 'bg-[var(--primitive-coral)]/12 text-[var(--primitive-coral)]'
                              : 'bg-white/70 text-muted-foreground'
                          )}
                        >
                          <Icon className="size-4" strokeWidth={1.5} />
                        </span>
                        <span className={settingsTextBlockClass}>
                          <span
                            className={cn(
                              'block break-words text-sm font-medium leading-snug',
                              'destructive' in item && item.destructive
                                ? 'text-[var(--primitive-coral)]'
                                : 'text-foreground'
                            )}
                          >
                            {item.label}
                          </span>
                          <span className={settingsHintClass}>{item.hint}</span>
                        </span>
                        <ChevronRight
                          className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5"
                          strokeWidth={1.5}
                        />
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}

          <section
            aria-labelledby="settings-notifications-panel"
            className="mt-6"
          >
            <h2
              id="settings-notifications-panel"
              className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              {t('sections.notifications')}
            </h2>
            <NotificationPrefsPanel onChannelsChange={handleChannelsChange} />
            <Link
              href="/alerts"
              className="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
            >
              {t('viewAlerts')}
            </Link>
          </section>
        </div>
      </div>

      <DeleteAccountDialog
        open={deleteOpen}
        deleting={deleting}
        onConfirm={() => void handleDeleteConfirm()}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  )
}
