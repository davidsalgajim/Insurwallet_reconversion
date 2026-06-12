'use client'

import { Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'

type ShareRecord = {
  tokenHash: string
  recipientEmail: string
  permission: 'view' | 'view_download'
  status: 'pending' | 'accepted' | 'revoked' | 'expired'
  expiresAt: string
}

type PolicySharesPanelProps = {
  policyId: string
  refreshKey?: number
}

export function PolicySharesPanel({
  policyId,
  refreshKey = 0,
}: PolicySharesPanelProps) {
  const t = useTranslations('policies.share')
  const [shares, setShares] = useState<ShareRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [revoking, setRevoking] = useState<string | null>(null)

  const loadShares = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/shares?policyId=${encodeURIComponent(policyId)}`
      )
      if (!response.ok) {
        throw new Error('load failed')
      }
      const payload = (await response.json()) as { shares: ShareRecord[] }
      setShares(payload.shares)
    } catch {
      setError(t('listError'))
    } finally {
      setLoading(false)
    }
  }, [policyId, t])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadShares()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadShares, refreshKey])

  async function handleRevoke(tokenHash: string) {
    setRevoking(tokenHash)
    try {
      const response = await fetch('/api/shares/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenHash }),
      })
      if (!response.ok) {
        throw new Error('revoke failed')
      }
      await loadShares()
    } catch {
      setError(t('revokeError'))
    } finally {
      setRevoking(null)
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">{t('listLoading')}</p>
  }

  if (error) {
    return <p className="text-sm text-[var(--primitive-danger)]">{error}</p>
  }

  if (shares.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('listEmpty')}</p>
  }

  return (
    <ul className="space-y-3">
      {shares.map((share) => (
        <li
          key={share.tokenHash}
          className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-inner)] border border-border/60 bg-white/50 px-4 py-3"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {share.recipientEmail}
            </p>
            <p className="text-xs text-muted-foreground">
              {share.permission === 'view_download'
                ? t('permissionViewDownload')
                : t('permissionView')}{' '}
              · {t(`status.${share.status}`)}
            </p>
          </div>
          {share.status === 'pending' || share.status === 'accepted' ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="rounded-[var(--radius-pill)] text-[var(--primitive-danger)]"
              disabled={revoking === share.tokenHash}
              onClick={() => void handleRevoke(share.tokenHash)}
            >
              <Trash2 className="size-4" strokeWidth={1.5} />
              {revoking === share.tokenHash ? t('revoking') : t('revoke')}
            </Button>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
