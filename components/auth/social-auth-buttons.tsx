'use client'

import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'

type SocialAuthButtonsProps = {
  onGoogleClick: () => void | Promise<void>
  googleLoading?: boolean
  disabled?: boolean
}

export function SocialAuthButtons({
  onGoogleClick,
  googleLoading = false,
  disabled = false,
}: SocialAuthButtonsProps) {
  const t = useTranslations('auth')

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="secondary"
        className="w-full border-white/15 bg-white/5 text-white hover:bg-white/10"
        size="lg"
        onClick={onGoogleClick}
        disabled={disabled || googleLoading}
      >
        {googleLoading ? (
          <Loader2 className="size-4 animate-spin" strokeWidth={1.5} />
        ) : (
          <GoogleIcon />
        )}
        {t('continueWithGoogle')}
      </Button>

      {/* Apple Sign-In requires Apple Developer config (Service ID, key, domain verification). */}
      <Button
        type="button"
        variant="secondary"
        className="w-full border-white/15 bg-white/5 text-white/40 hover:bg-white/5"
        size="lg"
        disabled
        title={t('appleSignInUnavailable')}
      >
        <AppleIcon />
        {t('continueWithApple')}
      </Button>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="currentColor">
      <path d="M21.35 11.1h-9.17v2.73h6.51c-.33 1.73-2.05 5.08-6.51 5.08-3.92 0-7.11-3.24-7.11-7.23S8.26 4.45 12.18 4.45c2.23 0 3.73.95 4.59 1.77l3.15-3.04C17.45 1.62 15.04.75 12.18.75 6.75.75 2.36 5.14 2.36 10.57s4.39 9.82 9.82 9.82c5.67 0 9.43-3.99 9.43-9.61 0-.64-.07-1.13-.16-1.68Z" />
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="currentColor">
      <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.793.89-2.04 1.57-3.24 1.475-.152-1.108.507-2.293 1.177-3.01.793-.914 2.178-1.598 3.24-1.545ZM20.64 17.193c-.618 1.412-1.358 2.682-2.18 3.803-1.152 1.573-2.486 3.35-4.287 3.37-1.618.017-2.028-1.04-3.778-1.04-1.75 0-2.128 1.023-3.777 1.057-1.927.044-3.407-2.01-4.56-3.578-3.125-4.274-3.496-9.288-1.545-11.93 1.004-1.435 2.578-2.302 4.287-2.327 1.683-.027 2.57 1.137 3.778 1.137 1.207 0 3.465-1.404 5.842-1.198.994.042 3.794.402 5.587 3.03-.145.09-3.337 1.948-3.305 5.81.034 4.618 4.035 6.155 4.078 6.173Z" />
    </svg>
  )
}
