import type { LucideIcon } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

const actionBaseClass =
  'relative inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-[var(--radius-pill)] border border-border bg-white/70 px-2.5 text-xs font-semibold text-foreground shadow-[var(--shadow-soft)] backdrop-blur-sm transition-[box-shadow,background-color,border-color,transform] duration-200 hover:bg-white hover:shadow-[var(--shadow-float)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:px-3'

type LabeledActionLinkProps = {
  href: string
  icon: LucideIcon
  label: string
  active?: boolean
  className?: string
  children?: ReactNode
} & Omit<
  ComponentPropsWithoutRef<typeof Link>,
  'href' | 'children' | 'className'
>

export function LabeledActionLink({
  href,
  icon: Icon,
  label,
  active = false,
  className,
  children,
  ...props
}: LabeledActionLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        actionBaseClass,
        active &&
          'border-[var(--primitive-ink)] bg-[var(--primitive-ink)] text-white shadow-md hover:bg-[#1a2028]',
        className
      )}
      {...props}
    >
      <Icon className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />
      <span>{label}</span>
      {children}
    </Link>
  )
}

type LabeledActionButtonProps = {
  icon: LucideIcon
  label: string
  className?: string
  children?: ReactNode
} & ComponentPropsWithoutRef<'button'>

export function LabeledActionButton({
  icon: Icon,
  label,
  className,
  children,
  type = 'button',
  ...props
}: LabeledActionButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        actionBaseClass,
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      <Icon className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />
      <span>{label}</span>
      {children}
    </button>
  )
}
