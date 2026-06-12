'use client'

import {
  Bell,
  ChevronRight,
  Download,
  Globe,
  Shield,
  Trash2,
  User,
} from 'lucide-react'
import { useState } from 'react'
import { useTranslations } from 'next-intl'

import { LocaleSwitcher } from '@/components/i18n/locale-switcher'
import { AppTopbar } from '@/components/layout/app-topbar'
import { DeleteAccountDialog } from '@/components/settings/delete-account-dialog'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import {
  requestAccountDeletion,
  requestDataExport,
} from '@/lib/account/account-actions'
import { cn } from '@/lib/utils/cn'

export function SettingsView() {
  const t = useTranslations('settings')
  const [exporting, setExporting] = useState(false)
  const [exportMessage, setExportMessage] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null)

  async function handleExport() {
    setExporting(true)
    setExportMessage(null)
    try {
      const result = await requestDataExport()
      setExportMessage(result.message)
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
      const result = await requestAccountDeletion()
      setDeleteMessage(result.message)
      setDeleteOpen(false)
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
          hint: t('items.personalDataHint'),
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
          href: '/legal/privacy' as const,
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
          icon: Bell,
          label: t('items.notifications'),
          hint: t('items.notificationsHint'),
        },
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
    <div className="animate-fade-up mx-auto w-full max-w-2xl">
      <AppTopbar title={t('title')} subtitle={t('subtitle')} />

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
          <section key={section.id} aria-labelledby={`settings-${section.id}`}>
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
                      <div className="flex w-full min-h-[3.25rem] items-center gap-4 px-5 py-3.5">
                        <span className="icon-circle size-10 shrink-0 border-0 bg-white/70 text-muted-foreground">
                          <Icon className="size-4" strokeWidth={1.5} />
                        </span>
                        <span className="min-w-0 flex-1 text-left">
                          <span className="block text-sm font-medium text-foreground">
                            {item.label}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {item.hint}
                          </span>
                        </span>
                        <LocaleSwitcher />
                      </div>
                    </li>
                  )
                }

                if ('href' in item && item.href) {
                  return (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className="group flex w-full min-h-[3.25rem] items-center gap-4 px-5 py-3.5 text-left transition-[background-color] duration-200 hover:bg-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                      >
                        <span className="icon-circle size-10 shrink-0 border-0 bg-white/70 text-muted-foreground">
                          <Icon className="size-4" strokeWidth={1.5} />
                        </span>
                        <span className="min-w-0 flex-1 text-left">
                          <span className="block text-sm font-medium text-foreground">
                            {item.label}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {item.hint}
                          </span>
                        </span>
                        <ChevronRight
                          className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5"
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
                        className="group h-auto w-full min-h-[3.25rem] justify-start gap-4 rounded-none px-5 py-3.5 font-normal hover:bg-white/50"
                      >
                        <span className="icon-circle size-10 shrink-0 border-0 bg-white/70 text-muted-foreground">
                          <Icon className="size-4" strokeWidth={1.5} />
                        </span>
                        <span className="min-w-0 flex-1 text-left">
                          <span className="block text-sm font-medium text-foreground">
                            {exporting ? t('exporting') : item.label}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {item.hint}
                          </span>
                        </span>
                        <ChevronRight
                          className="size-4 shrink-0 text-muted-foreground"
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
                        className="group h-auto w-full min-h-[3.25rem] justify-start gap-4 rounded-none px-5 py-3.5 font-normal hover:bg-white/50"
                      >
                        <span className="icon-circle size-10 shrink-0 border-0 bg-[var(--primitive-coral)]/12 text-[var(--primitive-coral)]">
                          <Icon className="size-4" strokeWidth={1.5} />
                        </span>
                        <span className="min-w-0 flex-1 text-left">
                          <span className="block text-sm font-medium text-[var(--primitive-coral)]">
                            {item.label}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {item.hint}
                          </span>
                        </span>
                        <ChevronRight
                          className="size-4 shrink-0 text-muted-foreground"
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
                      className="group flex w-full min-h-[3.25rem] items-center gap-4 px-5 py-3.5 text-left transition-[background-color] duration-200 hover:bg-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                    >
                      <span
                        className={cn(
                          'icon-circle size-10 shrink-0 border-0',
                          'destructive' in item && item.destructive
                            ? 'bg-[var(--primitive-coral)]/12 text-[var(--primitive-coral)]'
                            : 'bg-white/70 text-muted-foreground'
                        )}
                      >
                        <Icon className="size-4" strokeWidth={1.5} />
                      </span>
                      <span className="min-w-0 flex-1 text-left">
                        <span
                          className={cn(
                            'block text-sm font-medium',
                            'destructive' in item && item.destructive
                              ? 'text-[var(--primitive-coral)]'
                              : 'text-foreground'
                          )}
                        >
                          {item.label}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {item.hint}
                        </span>
                      </span>
                      <ChevronRight
                        className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5"
                        strokeWidth={1.5}
                      />
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
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
