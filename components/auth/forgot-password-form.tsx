'use client'

import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import {
  AuthFooterText,
  AuthShell,
  authInputClassName,
  authLabelClassName,
} from '@/components/auth/auth-shell'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { getAuthErrorMessage, resetPassword } from '@/lib/firebase/auth'

export function ForgotPasswordForm() {
  const t = useTranslations('auth')

  const [email, setEmail] = useState('')
  const [errorKey, setErrorKey] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorKey(null)
    setSubmitting(true)

    try {
      await resetPassword(email)
      setSent(true)
    } catch (error) {
      setErrorKey(getAuthErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title={t('forgotPasswordTitle')}
      description={t('forgotPasswordDesc')}
    >
      <div className="space-y-4">
        {sent ? (
          <p className="rounded-[var(--radius-pill)] border border-border bg-muted/40 px-4 py-3 text-sm text-ink">
            {t('resetPasswordSent')}
          </p>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="email" className={authLabelClassName}>
                {t('email')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={authInputClassName}
              />
            </div>
            {errorKey ? (
              <p className="text-sm text-destructive" role="alert">
                {t(`errors.${errorKey}`)}
              </p>
            ) : null}
            <Button
              type="submit"
              className="w-full rounded-[var(--radius-pill)] shadow-md shadow-primary/20"
              size="lg"
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" strokeWidth={1.5} />
              ) : null}
              {t('sendResetLink')}
            </Button>
          </form>
        )}

        <AuthFooterText>
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            {t('backToLogin')}
          </Link>
        </AuthFooterText>
      </div>
    </AuthShell>
  )
}
