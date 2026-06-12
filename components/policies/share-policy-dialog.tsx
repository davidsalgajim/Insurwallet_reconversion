'use client'

import { Copy, Share2 } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'

type SharePolicyDialogProps = {
  open: boolean
  policyId: string
  ownerUid: string
  onClose: () => void
}

export function SharePolicyDialog({
  open,
  policyId,
  ownerUid,
  onClose,
}: SharePolicyDialogProps) {
  const t = useTranslations('policies.share')
  const [email, setEmail] = useState('')
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  if (!open) {
    return null
  }

  async function handleCreateShare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setShareUrl(null)
    setSubmitting(true)

    try {
      const [{ db }, { createShare }] = await Promise.all([
        import('@/lib/firebase/client'),
        import('@/lib/firebase/shares'),
      ])

      const { token } = await createShare(db, {
        policyId,
        ownerUid,
        recipientEmail: email.trim(),
        permission: 'view',
        expiresInDays: 7,
      })

      const path = `${window.location.origin}/share/${token}`
      setShareUrl(path)
    } catch {
      setError(t('createError'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCopy() {
    if (!shareUrl) {
      return
    }

    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-policy-title"
    >
      <div className="glass-panel w-full max-w-md p-6">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex size-10 items-center justify-center rounded-[var(--radius-inner)] bg-primary/10 text-primary">
            <Share2 className="size-5" strokeWidth={1.5} />
          </div>
          <div>
            <h2 id="share-policy-title" className="text-lg font-semibold">
              {t('title')}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('description')}
            </p>
          </div>
        </div>

        <form
          onSubmit={(event) => void handleCreateShare(event)}
          className="space-y-4"
        >
          <div>
            <label
              htmlFor="share-recipient-email"
              className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              {t('emailLabel')}
            </label>
            <input
              id="share-recipient-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-[var(--radius-inner)] border border-border/70 bg-white/80 px-3 py-2 text-sm outline-none ring-primary/30 focus-visible:ring-2"
              placeholder={t('emailPlaceholder')}
            />
          </div>

          {error ? (
            <p className="text-sm text-[var(--primitive-danger)]" role="alert">
              {error}
            </p>
          ) : null}

          {shareUrl ? (
            <div className="rounded-[var(--radius-inner)] border border-border/60 bg-white/50 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('linkLabel')}
              </p>
              <p className="mt-2 break-all font-mono text-xs">{shareUrl}</p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="mt-3 rounded-[var(--radius-pill)]"
                onClick={() => void handleCopy()}
              >
                <Copy className="size-4" strokeWidth={1.5} />
                {copied ? t('copied') : t('copyLink')}
              </Button>
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              className="rounded-[var(--radius-pill)]"
              onClick={onClose}
            >
              {t('close')}
            </Button>
            <Button
              type="submit"
              variant="ink"
              className="rounded-[var(--radius-pill)]"
              disabled={submitting}
            >
              {submitting ? t('creating') : t('createLink')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
