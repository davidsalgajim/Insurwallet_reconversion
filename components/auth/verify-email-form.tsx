'use client'

import { Loader2, MailCheck } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'

import { AuthFooterText, AuthShell } from '@/components/auth/auth-shell'
import { useAuth } from '@/components/auth/auth-provider'
import { Button } from '@/components/ui/button'
import { Link, useRouter } from '@/i18n/navigation'
import { safeRedirect } from '@/lib/utils/safe-redirect'
import {
  getAuthErrorMessage,
  reloadCurrentUser,
  resendVerificationEmail,
  signOut,
  userNeedsEmailVerification,
} from '@/lib/firebase/auth'
import { isEmailVerificationRequired } from '@/lib/firebase/email-verification-policy'
import { type PreferredLanguage } from '@/lib/schemas/user'

const RESEND_COOLDOWN_SECONDS = 60

type VerifyEmailFormProps = {
  redirectTo?: string
}

export function VerifyEmailForm({ redirectTo }: VerifyEmailFormProps) {
  const t = useTranslations('auth')
  const locale = useLocale() as PreferredLanguage
  const router = useRouter()
  const { user, loading } = useAuth()

  const [errorKey, setErrorKey] = useState<string | null>(null)
  const [infoKey, setInfoKey] = useState<string | null>('verifyEmailSent')
  const [resending, setResending] = useState(false)
  const [checking, setChecking] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  const destination = safeRedirect(redirectTo, '/dashboard')
  const verificationRequired = isEmailVerificationRequired()

  const goToDestination = useCallback(() => {
    router.replace(destination)
  }, [destination, router])

  useEffect(() => {
    if (loading) {
      return
    }

    if (!user) {
      router.replace('/login')
      return
    }

    if (!userNeedsEmailVerification(user)) {
      goToDestination()
    }
  }, [goToDestination, loading, router, user])

  useEffect(() => {
    if (cooldown <= 0) {
      return
    }

    const timer = window.setInterval(() => {
      setCooldown((value) => (value > 0 ? value - 1 : 0))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [cooldown])

  async function handleResend() {
    if (cooldown > 0) {
      return
    }

    setErrorKey(null)
    setInfoKey(null)
    setResending(true)

    try {
      await resendVerificationEmail(locale)
      setInfoKey('verifyEmailResent')
      setCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (error) {
      setErrorKey(getAuthErrorMessage(error))
    } finally {
      setResending(false)
    }
  }

  async function handleCheckVerified() {
    setErrorKey(null)
    setInfoKey(null)
    setChecking(true)

    try {
      const refreshed = await reloadCurrentUser()

      if (!refreshed || userNeedsEmailVerification(refreshed)) {
        setErrorKey('emailNotVerifiedYet')
        return
      }

      goToDestination()
    } catch (error) {
      setErrorKey(getAuthErrorMessage(error))
    } finally {
      setChecking(false)
    }
  }

  async function handleSignOut() {
    await signOut()
    router.replace('/login')
  }

  if (loading || !user) {
    return (
      <AuthShell
        title={t('verifyEmailTitle')}
        description={t('verifyEmailDesc')}
      >
        <div className="flex justify-center py-6">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell title={t('verifyEmailTitle')} description={t('verifyEmailDesc')}>
      <div className="space-y-5">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-muted/30 px-4 py-5 text-center">
          <span className="icon-circle icon-circle-active size-12">
            <MailCheck className="size-5" strokeWidth={1.5} />
          </span>
          <p className="text-sm text-muted-foreground">
            {t('verifyEmailSentTo')}
          </p>
          <p className="text-sm font-semibold text-ink">{user.email}</p>
        </div>

        {infoKey ? (
          <p className="text-sm text-[var(--semantic-success)]" role="status">
            {t(infoKey)}
          </p>
        ) : null}

        {errorKey ? (
          <p className="text-sm text-destructive" role="alert">
            {t(`errors.${errorKey}`)}
          </p>
        ) : null}

        <div className="space-y-3">
          <Button
            type="button"
            className="w-full rounded-[var(--radius-pill)]"
            size="lg"
            onClick={handleCheckVerified}
            disabled={checking || resending}
          >
            {checking ? (
              <Loader2 className="size-4 animate-spin" strokeWidth={1.5} />
            ) : null}
            {t('verifyEmailCheck')}
          </Button>

          <Button
            type="button"
            variant="secondary"
            className="w-full rounded-[var(--radius-pill)]"
            size="lg"
            onClick={handleResend}
            disabled={resending || checking || cooldown > 0}
          >
            {resending ? (
              <Loader2 className="size-4 animate-spin" strokeWidth={1.5} />
            ) : null}
            {cooldown > 0
              ? t('verifyEmailResendCooldown', { seconds: cooldown })
              : t('verifyEmailResend')}
          </Button>
        </div>

        {!verificationRequired ? (
          <Button
            type="button"
            variant="ghost"
            className="w-full rounded-[var(--radius-pill)] text-muted-foreground"
            onClick={goToDestination}
          >
            {t('verifyEmailContinueWithout')}
          </Button>
        ) : null}

        <AuthFooterText>
          <button
            type="button"
            onClick={handleSignOut}
            className="font-medium text-primary hover:underline"
          >
            {t('verifyEmailSignOut')}
          </button>
          {' · '}
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
