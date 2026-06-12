import Image from 'next/image'
import { cn } from '@/lib/utils/cn'

type AppLogoProps = {
  size?: number
  /** White tile + soft shadow — legible on glass and dark auth panels */
  framed?: boolean
  className?: string
  priority?: boolean
}

export function AppLogo({
  size = 40,
  framed = true,
  className,
  priority = false,
}: AppLogoProps) {
  return (
    <span
      className={cn(
        'relative inline-block shrink-0',
        framed &&
          'overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-soft)] ring-1 ring-border',
        className
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src="/brand/insurwallet-logo.png"
        alt="InsurWallet"
        fill
        className={cn('object-contain', framed && 'p-[9%]')}
        priority={priority}
        sizes={`${size}px`}
      />
    </span>
  )
}
