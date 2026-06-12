'use client'

import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
    <Card className="glass-surface-dark border-white/10 bg-card/60 text-white shadow-2xl">
      <CardHeader className="text-center">
        <div className="icon-circle mx-auto mb-2 size-12 border-0 bg-[var(--primitive-ink)] text-sm font-bold text-white shadow-lg">
          IW
        </div>
        <CardTitle className="text-2xl text-white">
          {t('forgotPasswordTitle')}
        </CardTitle>
        <CardDescription className="text-white/60">
          {t('forgotPasswordDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sent ? (
          <p className="rounded-[var(--radius-pill)] border border-white/15 bg-white/5 px-4 py-3 text-sm text-white/80">
            {t('resetPasswordSent')}
          </p>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-white/80"
              >
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
                className="h-11 w-full rounded-[var(--radius-pill)] border border-white/15 bg-white/5 px-4 text-sm text-white outline-none ring-ring focus-visible:ring-2"
              />
            </div>
            {errorKey ? (
              <p className="text-sm text-red-300" role="alert">
                {t(`errors.${errorKey}`)}
              </p>
            ) : null}
            <Button
              type="submit"
              className="w-full"
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

        <p className="text-center text-sm text-white/50">
          <Link
            href="/login"
            className="font-medium text-accent hover:underline"
          >
            {t('backToLogin')}
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
