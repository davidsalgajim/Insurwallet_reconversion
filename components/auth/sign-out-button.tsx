'use client'

import { Loader2, LogOut } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { IconCircleButton } from '@/components/ui/icon-circle-button'
import { signOut } from '@/lib/firebase/auth'
import { cn } from '@/lib/utils/cn'

type SignOutButtonProps = {
  className?: string
}

export function SignOutButton({ className }: SignOutButtonProps) {
  const t = useTranslations('common')
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSignOut() {
    setLoading(true)
    try {
      await signOut()
      router.replace('/login')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <span
        className={cn('icon-circle size-10 sm:size-11', className)}
        aria-busy="true"
        aria-label={t('signOut')}
      >
        <Loader2
          className="size-[17px] animate-spin sm:size-[18px]"
          aria-hidden
        />
      </span>
    )
  }

  return (
    <IconCircleButton
      icon={LogOut}
      label={t('signOut')}
      onClick={handleSignOut}
      className={className}
    />
  )
}
