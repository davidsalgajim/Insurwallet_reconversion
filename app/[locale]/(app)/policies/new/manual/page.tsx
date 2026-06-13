'use client'

import { useTranslations } from 'next-intl'

import { AppTopbar } from '@/components/layout/app-topbar'
import { PolicyManualForm } from '@/components/policies/policy-manual-form'
import { PolicyWizardProgress } from '@/components/policies/policy-wizard-progress'

export default function ManualPolicyPage() {
  const t = useTranslations('policies')

  return (
    <div className="animate-fade-up mx-auto max-w-2xl">
      <AppTopbar
        title={t('manual.title')}
        subtitle={t('manual.stepSubtitleExtended')}
      />

      <PolicyWizardProgress currentStep={2} />

      <PolicyManualForm />
    </div>
  )
}
