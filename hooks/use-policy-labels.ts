'use client'

import { useTranslations } from 'next-intl'

import type {
  PaymentFrequency,
  PolicyStatus,
  PolicyType,
} from '@/lib/schemas/policy'

export function usePolicyLabels() {
  const t = useTranslations('policies')

  return {
    policyType: (value: PolicyType) => t(`types.${value}`),
    paymentFrequency: (value: PaymentFrequency) =>
      t(`paymentFrequency.${value}`),
    status: (value: PolicyStatus) => t(`status.${value}`),
  }
}

export const POLICY_TYPE_VALUES = [
  'life',
  'health',
  'auto',
  'home',
  'travel',
  'pet',
  'funeral',
  'dental',
  'business',
  'other',
] as const satisfies readonly PolicyType[]

export const PAYMENT_FREQUENCY_VALUES = [
  'monthly',
  'quarterly',
  'semi_annual',
  'annual',
  'single',
] as const satisfies readonly PaymentFrequency[]
