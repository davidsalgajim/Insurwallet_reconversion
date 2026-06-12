import type { LucideIcon } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils/cn'

type IconCircleButtonProps = {
  icon: LucideIcon
  label: string
  active?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showTooltip?: boolean
} & React.ButtonHTMLAttributes<HTMLButtonElement>

const sizeMap = {
  sm: 'size-9',
  md: 'size-10 sm:size-11',
  lg: 'size-12',
} as const

const iconSizeMap = {
  sm: 'size-4',
  md: 'size-[17px] sm:size-[18px]',
  lg: 'size-5',
} as const

export function IconCircleButton({
  icon: Icon,
  label,
  active = false,
  size = 'md',
  className,
  showTooltip = true,
  ...props
}: IconCircleButtonProps) {
  const button = (
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
      <Icon className={iconSizeMap[size]} strokeWidth={1.5} aria-hidden />
    </button>
  )

  if (!showTooltip) return button

  return <Tooltip label={label}>{button}</Tooltip>
}

type IconCircleLinkProps = {
  icon: LucideIcon
  label: string
  href: string
  active?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showTooltip?: boolean
}

export function IconCircleLink({
  icon: Icon,
  label,
  href,
  active = false,
  size = 'md',
  className,
  showTooltip = true,
}: IconCircleLinkProps) {
  const link = (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        'icon-circle',
        sizeMap[size],
        active && 'icon-circle-active',
        className
      )}
    >
      <Icon className={iconSizeMap[size]} strokeWidth={1.5} aria-hidden />
    </Link>
  )

  if (!showTooltip) return link

  return <Tooltip label={label}>{link}</Tooltip>
}
