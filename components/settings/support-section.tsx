'use client'

import { ChevronRight, HelpCircle, LifeBuoy, Mail } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { SUPPORT_EMAIL } from '@/lib/support'
import { cn } from '@/lib/utils/cn'

import {
  settingsHintClass,
  settingsIconClass,
  settingsLabelClass,
  settingsRowClass,
  settingsTextBlockClass,
} from './settings-shared'

export function SupportSection() {
  const t = useTranslations('settings.support')

  const items = [
    {
      icon: Mail,
      label: t('email'),
      hint: SUPPORT_EMAIL,
      href: `mailto:${SUPPORT_EMAIL}`,
    },
    {
      icon: HelpCircle,
      label: t('helpCenter'),
      hint: t('helpCenterHint'),
      href: '/settings/help' as const,
    },
    {
      icon: LifeBuoy,
      label: t('docs'),
      hint: t('docsHint'),
      href: 'https://docs.insurwallet.com' as const,
    },
  ] as const

  return (
    <ul className="glass-panel divide-y divide-border/60 overflow-hidden">
      {items.map((item) => {
        const Icon = item.icon
        const className = cn(
          settingsRowClass,
          'group transition-[background-color] duration-200 hover:bg-white/50'
        )

        if (item.href.startsWith('http') || item.href.startsWith('mailto:')) {
          return (
            <li key={item.label}>
              <a
                href={item.href}
                target={item.href.startsWith('http') ? '_blank' : undefined}
                rel={
                  item.href.startsWith('http')
                    ? 'noopener noreferrer'
                    : undefined
                }
                className={className}
              >
                <span className={settingsIconClass}>
                  <Icon className="size-4" strokeWidth={1.5} />
                </span>
                <span className={settingsTextBlockClass}>
                  <span className={settingsLabelClass}>{item.label}</span>
                  <span className={settingsHintClass}>{item.hint}</span>
                </span>
                <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
              </a>
            </li>
          )
        }

        return (
          <li key={item.label}>
            <Link href={item.href} className={className}>
              <span className={settingsIconClass}>
                <Icon className="size-4" strokeWidth={1.5} />
              </span>
              <span className={settingsTextBlockClass}>
                <span className={settingsLabelClass}>{item.label}</span>
                <span className={settingsHintClass}>{item.hint}</span>
              </span>
              <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
