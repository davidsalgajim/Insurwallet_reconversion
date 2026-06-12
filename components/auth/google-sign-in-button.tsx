'use client'

import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'

type GoogleSignInButtonProps = {
  onGoogleClick: () => void | Promise<void>
  googleLoading?: boolean
  disabled?: boolean
}

export function GoogleSignInButton({
  onGoogleClick,
  googleLoading = false,
  disabled = false,
}: GoogleSignInButtonProps) {
  const t = useTranslations('auth')

  return (
    <Button
      type="button"
      variant="secondary"
      className="w-full rounded-[var(--radius-pill)] border border-border bg-white text-ink shadow-none hover:bg-muted/50"
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
  )
}

function GoogleIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="currentColor">
      <path d="M21.35 11.1h-9.17v2.73h6.51c-.33 1.73-2.05 5.08-6.51 5.08-3.92 0-7.11-3.24-7.11-7.23S8.26 4.45 12.18 4.45c2.23 0 3.73.95 4.59 1.77l3.15-3.04C17.45 1.62 15.04.75 12.18.75 6.75.75 2.36 5.14 2.36 10.57s4.39 9.82 9.82 9.82c5.67 0 9.43-3.99 9.43-9.61 0-.64-.07-1.13-.16-1.68Z" />
    </svg>
  )
}
