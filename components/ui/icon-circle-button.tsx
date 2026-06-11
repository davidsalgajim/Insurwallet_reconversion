import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

type IconCircleButtonProps = {
  icon: LucideIcon
  label: string
  active?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
} & React.ButtonHTMLAttributes<HTMLButtonElement>

const sizeMap = {
  sm: 'size-9',
  md: 'size-11',
  lg: 'size-12',
} as const

const iconSizeMap = {
  sm: 'size-4',
  md: 'size-[18px]',
  lg: 'size-5',
} as const

export function IconCircleButton({
  icon: Icon,
  label,
  active = false,
  size = 'md',
  className,
  ...props
}: IconCircleButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        'icon-circle',
        sizeMap[size],
        active && 'icon-circle-active',
        className
      )}
      {...props}
    >
      <Icon className={iconSizeMap[size]} strokeWidth={1.5} />
    </button>
  )
}

export function IconCircleLink({
  icon: Icon,
  label,
  active = false,
  size = 'md',
  className,
  href,
}: {
  icon: LucideIcon
  label: string
  active?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  href: string
}) {
  return (
    <a
      href={href}
      aria-label={label}
      className={cn(
        'icon-circle',
        sizeMap[size],
        active && 'icon-circle-active',
        className
      )}
    >
      <Icon className={iconSizeMap[size]} strokeWidth={1.5} />
    </a>
  )
}
