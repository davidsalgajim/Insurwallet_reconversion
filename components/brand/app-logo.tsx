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
  const imageSize = framed ? Math.round(size * 0.82) : size

  const image = (
    <Image
      src="/brand/insurwallet-logo.png"
      alt="InsurWallet"
      width={imageSize}
      height={imageSize}
      className="object-contain"
      priority={priority}
      sizes={`${size}px`}
    />
  )

  if (!framed) {
    return (
      <span
        className={cn(
          'inline-flex shrink-0 items-center justify-center',
          className
        )}
        style={{ width: size, height: size }}
      >
        {image}
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-soft)] ring-1 ring-border',
        className
      )}
      style={{ width: size, height: size }}
    >
      {image}
    </span>
  )
}
