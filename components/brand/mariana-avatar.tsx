import Image from 'next/image'
import { useTranslations } from 'next-intl'

import { cn } from '@/lib/utils/cn'

export const MARIANA_AVATAR_PATH = '/brand/mariana-avatar.png'

type MarianaAvatarProps = {
  size?: number
  className?: string
  priority?: boolean
}

export function MarianaAvatar({
  size = 64,
  className,
  priority = false,
}: MarianaAvatarProps) {
  const t = useTranslations('mariana')

  return (
    <Image
      src={MARIANA_AVATAR_PATH}
      alt={t('avatarAlt')}
      width={size}
      height={size}
      priority={priority}
      style={{ width: size, height: size }}
      className={cn('rounded-full object-cover', className)}
    />
  )
}
