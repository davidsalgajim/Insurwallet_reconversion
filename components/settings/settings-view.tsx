'use client'

import {
  ChevronRight,
  Crown,
  Download,
  Globe,
  Trash2,
  Users,
} from 'lucide-react'
import { useCallback, useState } from 'react'
import { useTranslations } from 'next-intl'

import { useAuth } from '@/components/auth/auth-provider'
import { Link, useRouter } from '@/i18n/navigation'
import { LocaleSwitcher } from '@/components/i18n/locale-switcher'
import { AppTopbar } from '@/components/layout/app-topbar'
import { CurrencyPreferenceRow } from '@/components/settings/currency-preference-row'
import { DeleteAccountDialog } from '@/components/settings/delete-account-dialog'
import { LegalConsentSection } from '@/components/settings/legal-consent-section'
import { NotificationPrefsPanel } from '@/components/settings/notification-prefs-panel'
import { ProfileSection } from '@/components/settings/profile-section'
import { SettingsVersionFooter } from '@/components/settings/settings-version-footer'
import { SupportSection } from '@/components/settings/support-section'
import {
  settingsHintClass,
  settingsIconClass,
  settingsLabelClass,
  settingsRowClass,
  settingsSectionTitleClass,
  settingsTextBlockClass,
} from '@/components/settings/settings-shared'
import { useFcmRegistration } from '@/hooks/useFcmRegistration'
import { Button } from '@/components/ui/button'
import {
  requestAccountDeletion,
  requestDataExport,
} from '@/lib/account/account-actions'
import { cn } from '@/lib/utils/cn'

export function SettingsView() {
  const t = useTranslations('settings')
  const router = useRouter()
  const { user } = useAuth()
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
          <section aria-labelledby="settings-profile">
            <h2 id="settings-profile" className={settingsSectionTitleClass}>
              {t('sections.profile')}
            </h2>
            <ProfileSection />
          </section>

          <section aria-labelledby="settings-subscription">
            <h2
              id="settings-subscription"
              className={settingsSectionTitleClass}
            >
              {t('sections.subscription')}
            </h2>
            <ul className="glass-panel divide-y divide-border/60 overflow-hidden">
              <li>
                <Link
                  href="/settings/subscription"
                  className={cn(
                    settingsRowClass,
                    'group transition-[background-color] duration-200 hover:bg-white/50'
                  )}
                >
                  <span className={settingsIconClass}>
                    <Crown className="size-4" strokeWidth={1.5} />
                  </span>
                  <span className={settingsTextBlockClass}>
                    <span className={settingsLabelClass}>
                      {t('items.subscription')}
                    </span>
                    <span className={settingsHintClass}>
                      {t('items.subscriptionHint')}
                    </span>
                  </span>
                  <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            </ul>
          </section>

          <section aria-labelledby="settings-preferences">
            <h2 id="settings-preferences" className={settingsSectionTitleClass}>
              {t('sections.preferences')}
            </h2>
            <ul className="glass-panel divide-y divide-border/60 overflow-hidden">
              <li>
                <div className={settingsRowClass}>
                  <span className={settingsIconClass}>
                    <Globe className="size-4" strokeWidth={1.5} />
                  </span>
                  <span className={settingsTextBlockClass}>
                    <span className={settingsLabelClass}>
                      {t('items.language')}
                    </span>
                    <span className={settingsHintClass}>
                      {t('items.languageHint')}
                    </span>
                  </span>
                  <LocaleSwitcher className="mt-0.5 shrink-0" />
                </div>
              </li>
              <CurrencyPreferenceRow />
            </ul>
          </section>

          <section aria-labelledby="settings-contacts">
            <h2 id="settings-contacts" className={settingsSectionTitleClass}>
              {t('sections.contacts')}
            </h2>
            <ul className="glass-panel divide-y divide-border/60 overflow-hidden">
              <li>
                <Link
                  href="/settings/contacts"
                  className={cn(
                    settingsRowClass,
                    'group transition-[background-color] duration-200 hover:bg-white/50'
                  )}
                >
                  <span className={settingsIconClass}>
                    <Users className="size-4" strokeWidth={1.5} />
                  </span>
                  <span className={settingsTextBlockClass}>
                    <span className={settingsLabelClass}>
                      {t('items.contacts')}
                    </span>
                    <span className={settingsHintClass}>
                      {t('items.contactsHint')}
                    </span>
                  </span>
                  <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            </ul>
          </section>

          <section aria-labelledby="settings-notifications">
            <NotificationPrefsPanel onChannelsChange={handleChannelsChange} />
            <Link
              href="/alerts"
              className="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
            >
              {t('viewAlerts')}
            </Link>
          </section>

          <section aria-labelledby="settings-legal">
            <h2 id="settings-legal" className={settingsSectionTitleClass}>
              {t('sections.legal')}
            </h2>
            <LegalConsentSection />
          </section>

          <section aria-labelledby="settings-support">
            <h2 id="settings-support" className={settingsSectionTitleClass}>
              {t('sections.support')}
            </h2>
            <SupportSection />
          </section>

          <section aria-labelledby="settings-privacy">
            <h2 id="settings-privacy" className={settingsSectionTitleClass}>
              {t('sections.privacy')}
            </h2>
            <ul className="glass-panel divide-y divide-border/60 overflow-hidden">
              <li>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={exporting}
                  onClick={() => void handleExport()}
                  className={cn(
                    settingsRowClass,
                    'h-auto justify-start rounded-none font-normal hover:bg-white/50'
                  )}
                >
                  <span className={settingsIconClass}>
                    <Download className="size-4" strokeWidth={1.5} />
                  </span>
                  <span className={settingsTextBlockClass}>
                    <span className={settingsLabelClass}>
                      {exporting ? t('exporting') : t('items.export')}
                    </span>
                    <span className={settingsHintClass}>
                      {t('items.exportHint')}
                    </span>
                  </span>
                  <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
                </Button>
              </li>
              <li>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setDeleteOpen(true)}
                  className={cn(
                    settingsRowClass,
                    'h-auto justify-start rounded-none font-normal hover:bg-white/50'
                  )}
                >
                  <span className="icon-circle mt-0.5 size-10 shrink-0 border-0 bg-[var(--primitive-coral)]/12 text-[var(--primitive-coral)]">
                    <Trash2 className="size-4" strokeWidth={1.5} />
                  </span>
                  <span className={settingsTextBlockClass}>
                    <span className="block break-words text-sm font-medium leading-snug text-[var(--primitive-coral)]">
                      {t('items.deleteAccount')}
                    </span>
                    <span className={settingsHintClass}>
                      {t('items.deleteAccountHint')}
                    </span>
                  </span>
                  <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
                </Button>
              </li>
            </ul>
          </section>

          <SettingsVersionFooter />
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
