'use client'

import { Loader2 } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Link, useRouter } from '@/i18n/navigation'
import {
  getAuthErrorMessage,
  signInWithEmail,
  signInWithGoogle,
} from '@/lib/firebase/auth'
import { type PreferredLanguage } from '@/lib/schemas/user'

import { SocialAuthButtons } from '@/components/auth/social-auth-buttons'

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

  const destination = redirectTo || '/dashboard'

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorKey(null)
    setSubmitting(true)

    try {
      await signInWithEmail(email, password)
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
      router.replace(destination)
    } catch (error) {
      setErrorKey(getAuthErrorMessage(error))
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <Card className="glass-surface-dark border-white/10 bg-card/60 text-white shadow-2xl">
      <CardHeader className="text-center">
        <div className="icon-circle mx-auto mb-2 size-12 border-0 bg-[var(--primitive-ink)] text-sm font-bold text-white shadow-lg">
          IW
        </div>
        <CardTitle className="text-2xl text-white">
          {t('welcomeBack')}
        </CardTitle>
        <CardDescription className="text-white/60">
          {tc('tagline')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-white/80"
              >
                {t('password')}
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-accent hover:underline"
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
            {tc('login')}
          </Button>
        </form>

        <SocialAuthButtons
          onGoogleClick={handleGoogleSignIn}
          googleLoading={googleLoading}
          disabled={submitting}
        />

        <p className="text-center text-sm text-white/50">
          {t('noAccount')}{' '}
          <Link
            href="/register"
            className="font-medium text-accent hover:underline"
          >
            {tc('register')}
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
