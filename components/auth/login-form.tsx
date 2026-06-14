'use client'

import { Loader2 } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'

import {
  AuthDivider,
  AuthFooterText,
  AuthShell,
  authInputClassName,
  authLabelClassName,
} from '@/components/auth/auth-shell'
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button'
import {
  ensureLegalConsentAfterLogin,
  LoginLegalNotice,
} from '@/components/legal/auth-legal-consent'
import { Button } from '@/components/ui/button'
import { Link, useRouter } from '@/i18n/navigation'
import {
  getAuthErrorMessage,
  signInWithEmail,
  signInWithGoogle,
  userNeedsEmailVerification,
} from '@/lib/firebase/auth'
import { createServerSession } from '@/lib/firebase/session-cookie'
import { isEmailVerificationRequired } from '@/lib/firebase/email-verification-policy'
import { type PreferredLanguage } from '@/lib/schemas/user'
import { safeRedirect } from '@/lib/utils/safe-redirect'

type LoginFormProps = {
  redirectTo?: string
}

export function LoginForm({ redirectTo }: LoginFormProps) {
  const t = useTranslations('auth')
  const tc = useTranslations('common')
  const locale = useLocale() as PreferredLanguage
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorKey, setErrorKey] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const destination = safeRedirect(redirectTo, '/dashboard')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorKey(null)
    setSubmitting(true)

    try {
      const user = await signInWithEmail(email, password)

      if (userNeedsEmailVerification(user) && isEmailVerificationRequired()) {
        router.replace(
          destination === '/dashboard'
            ? '/verify-email'
            : `/verify-email?redirect=${encodeURIComponent(destination)}`
        )
        return
      }

      await createServerSession(await user.getIdToken())
      await ensureLegalConsentAfterLogin()
      router.replace(destination)
    } catch (error) {
      setErrorKey(getAuthErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGoogleSignIn() {
    setErrorKey(null)
    setGoogleLoading(true)

    try {
      await signInWithGoogle(locale)
      await ensureLegalConsentAfterLogin()
      router.replace(destination)
    } catch (error) {
      setErrorKey(getAuthErrorMessage(error))
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <AuthShell title={t('welcomeBack')} description={tc('tagline')}>
      <div className="space-y-4">
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
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="password" className={authLabelClassName}>
                {t('password')}
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-primary hover:underline"
              >
                {t('forgotPassword')}
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
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
            {tc('login')}
          </Button>
        </form>

        <AuthDivider label={t('orContinueWith')} />

        <GoogleSignInButton
          onGoogleClick={handleGoogleSignIn}
          googleLoading={googleLoading}
          disabled={submitting}
        />

        <AuthFooterText>
          <LoginLegalNotice className="mb-3" />
          {t('noAccount')}{' '}
          <Link
            href="/register"
            className="font-medium text-primary hover:underline"
          >
            {tc('register')}
          </Link>
        </AuthFooterText>
      </div>
    </AuthShell>
  )
}
