'use client'

import { useTranslations } from 'next-intl'

import type { PolicyFieldDiff } from '@/lib/policies/policy-diff'

type PolicyUpdatePromptProps = {
  diffs: PolicyFieldDiff[]
}

export function PolicyUpdatePrompt({ diffs }: PolicyUpdatePromptProps) {
  const t = useTranslations('policies.documents.updatePrompt')

  if (diffs.length === 0) {
    return null
  }

  return (
    <div
      className="rounded-[var(--radius-inner)] border border-primary/25 bg-primary/5 p-4"
      role="status"
    >
      <h3 className="text-sm font-semibold text-foreground">{t('title')}</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        {t('description')}
      </p>
      <ul className="mt-3 space-y-2">
        {diffs.map((diff) => (
          <li
            key={diff.field}
            className="rounded-[var(--radius-inner)] border border-border/60 bg-white/60 px-3 py-2 text-sm"
          >
            <p className="font-medium">{t(`fields.${diff.labelKey}`)}</p>
            <p className="mt-1 text-muted-foreground">
              {t('change', { current: diff.current, proposed: diff.proposed })}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
