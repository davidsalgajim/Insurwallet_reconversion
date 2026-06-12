'use client'

import { ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useTranslations } from 'next-intl'

import { useAuth } from '@/components/auth/auth-provider'
import { Button } from '@/components/ui/button'
import { Link, useRouter } from '@/i18n/navigation'
import type { SharePreview } from '@/lib/server/shares'

type ShareAcceptPanelProps = {
  token: string
  preview: SharePreview
}

export function ShareAcceptPanel({ token, preview }: ShareAcceptPanelProps) {
  const t = useTranslations('share')
  const router = useRouter()
  const { user, loading } = useAuth()
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const statusKey =
    preview.status === 'pending'
      ? 'statusPending'
      : preview.status === 'accepted'
        ? 'statusAccepted'
        : preview.status === 'expired'
          ? 'statusExpired'
          : 'statusRevoked'

  async function handleAccept() {
    if (!user) {
      return
    }

    setAccepting(true)
    setError(null)

    try {
      const response = await fetch(`/api/shares/${token}/accept`, {
        method: 'POST',
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string
        } | null
        throw new Error(body?.error ?? 'accept_failed')
      }

      const body = (await response.json()) as { policyId: string }
      router.push(`/policies/${body.policyId}`)
    } catch {
      setError(t('acceptError'))
    } finally {
      setAccepting(false)
    }
  }

  const emailMatches =
    user?.email?.toLowerCase() === preview.recipientEmail.toLowerCase()

  return (
    <main className="app-shell-bg flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="glass-panel w-full max-w-lg p-8 text-center">
        <div className="icon-circle mx-auto mb-5 size-14 stat-icon-accent border-0">
          <ShieldCheck className="size-6" strokeWidth={1.5} />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t('description')}
        </p>

        <dl className="mt-6 space-y-2 rounded-[var(--radius-card)] border border-border/60 bg-white/50 p-4 text-left text-sm">
          {preview.insurerName ? (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{t('insurerLabel')}</dt>
              <dd className="truncate font-medium">{preview.insurerName}</dd>
            </div>
          ) : null}
          {preview.policyNumber ? (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">
                {t('policyNumberLabel')}
              </dt>
              <dd className="truncate font-mono text-xs">
                {preview.policyNumber}
              </dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{t('statusLabel')}</dt>
            <dd>{t(statusKey)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{t('recipientLabel')}</dt>
            <dd className="truncate">{preview.recipientEmail}</dd>
          </div>
        </dl>

        {error ? (
          <p
            className="mt-4 text-sm text-[var(--primitive-danger)]"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        {preview.status === 'pending' ? (
          <>
            {!user && !loading ? (
              <p className="mt-4 text-xs text-muted-foreground">
                {t('loginHint')}
              </p>
            ) : null}

            {user && !emailMatches ? (
              <p className="mt-4 text-xs text-[var(--primitive-warning)]">
                {t('emailMismatch', { email: preview.recipientEmail })}
              </p>
            ) : null}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              {!user ? (
                <Link
                  href={`/login?redirect=/share/${token}`}
                  className="inline-flex items-center justify-center rounded-[var(--radius-button)] bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
                >
                  {t('acceptCta')}
                </Link>
              ) : (
                <Button
                  type="button"
                  variant="ink"
                  className="rounded-[var(--radius-pill)]"
                  disabled={accepting || !emailMatches}
                  onClick={() => void handleAccept()}
                >
                  {accepting ? t('accepting') : t('acceptNow')}
                </Button>
              )}
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-[var(--radius-button)] border border-border px-5 py-2.5 text-sm font-medium"
              >
                {t('declineCta')}
              </Link>
            </div>
          </>
        ) : preview.status === 'accepted' ? (
          <p className="mt-4 text-sm text-muted-foreground">
            {t('alreadyAccepted')}
          </p>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            {t('unavailable')}
          </p>
        )}
      </div>
    </main>
  )
}
