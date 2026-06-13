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
  persistOnboardingLegalConsent,
  RegisterLegalConsent,
} from '@/components/legal/auth-legal-consent'
import { Button } from '@/components/ui/button'
import { Link, useRouter } from '@/i18n/navigation'
import {
  getAuthErrorMessage,
  signInWithGoogle,
  signUpWithEmail,
  userNeedsEmailVerification,
} from '@/lib/firebase/auth'
import { isEmailVerificationRequired } from '@/lib/firebase/email-verification-policy'
import { type PreferredLanguage } from '@/lib/schemas/user'

type RegisterFormProps = {
  redirectTo?: string
}

export function RegisterForm({ redirectTo }: RegisterFormProps) {
  const t = useTranslations('auth')
  const tc = useTranslations('common')
  const locale = useLocale() as PreferredLanguage
  const router = useRouter()

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorKey, setErrorKey] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [legalAccepted, setLegalAccepted] = useState(false)
  const [legalError, setLegalError] = useState(false)

  const destination = redirectTo || '/dashboard'

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorKey(null)

    if (!legalAccepted) {
      setLegalError(true)
      return
    }

    setLegalError(false)
    setSubmitting(true)

    try {
      const user = await signUpWithEmail(email, password, displayName, locale)
      await persistOnboardingLegalConsent('onboarding')

      if (isEmailVerificationRequired() && userNeedsEmailVerification(user)) {
        router.replace('/verify-email')
      } else {
        router.replace(destination)
      }
    } catch (error) {
      setErrorKey(getAuthErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGoogleSignIn() {
    setErrorKey(null)

    if (!legalAccepted) {
      setLegalError(true)
      return
    }

    setLegalError(false)
    setGoogleLoading(true)

    try {
      await signInWithGoogle(locale)
      await persistOnboardingLegalConsent('onboarding')
      router.replace(destination)
    } catch (error) {
      setErrorKey(getAuthErrorMessage(error))
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <AuthShell title={t('createAccount')} description={tc('tagline')}>
      <div className="space-y-4">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="displayName" className={authLabelClassName}>
              {t('displayName')}
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              autoComplete="name"
              required
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className={authInputClassName}
            />
          </div>
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
            <label htmlFor="password" className={authLabelClassName}>
              {t('password')}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={authInputClassName}
            />
          </div>
          <RegisterLegalConsent
            checked={legalAccepted}
            onCheckedChange={(value) => {
              setLegalAccepted(value)
              if (value) {
                setLegalError(false)
              }
            }}
            error={legalError}
          />
          {errorKey ? (
            <p className="text-sm text-destructive" role="alert">
              {t(`errors.${errorKey}`)}
            </p>
          ) : null}
          <Button
            type="submit"
            className="w-full rounded-[var(--radius-pill)] shadow-md shadow-primary/20"
            size="lg"
            disabled={submitting || !legalAccepted}
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin" strokeWidth={1.5} />
            ) : null}
            {tc('register')}
          </Button>
        </form>

        <AuthDivider label={t('orContinueWith')} />

        <GoogleSignInButton
          onGoogleClick={handleGoogleSignIn}
          googleLoading={googleLoading}
          disabled={submitting || !legalAccepted}
        />

        <AuthFooterText>
          {t('hasAccount')}{' '}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            {tc('login')}
          </Link>
        </AuthFooterText>
      </div>
    </AuthShell>
  )
}
