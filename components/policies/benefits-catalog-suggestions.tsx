'use client'

import { Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import {
  benefitAlreadyMentioned,
  getCommonBenefitsForPolicyType,
} from '@/lib/policies/common-benefits-catalog'
import type { PolicyType } from '@/lib/schemas/policy'

type BenefitsCatalogSuggestionsProps = {
  policyType: PolicyType
  coveragesText?: string
  onAppend: (benefitLabel: string) => void
  disabled?: boolean
}

export function BenefitsCatalogSuggestions({
  policyType,
  coveragesText,
  onAppend,
  disabled = false,
}: BenefitsCatalogSuggestionsProps) {
  const t = useTranslations('policies.benefitsCatalog')
  const suggestions = getCommonBenefitsForPolicyType(policyType).filter(
    (benefit) =>
      !benefitAlreadyMentioned(coveragesText, t(`items.${benefit.labelKey}`))
  )

  if (suggestions.length === 0) {
    return null
  }

  return (
    <div className="rounded-[var(--radius-inner)] border border-border/60 bg-white/40 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="size-4 text-accent" strokeWidth={1.5} />
        <p className="text-sm font-medium">{t('title')}</p>
      </div>
      <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
        {t('description')}
      </p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((benefit) => {
          const label = t(`items.${benefit.labelKey}`)
          return (
            <Button
              key={benefit.id}
              type="button"
              variant="secondary"
              size="sm"
              disabled={disabled}
              className="rounded-[var(--radius-pill)] text-xs"
              onClick={() => onAppend(label)}
            >
              + {label}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
