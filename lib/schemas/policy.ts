import { z } from 'zod'

export const PolicyStatusSchema = z.enum(['active', 'expiring', 'expired'])
export type PolicyStatus = z.infer<typeof PolicyStatusSchema>

export const PolicyTypeSchema = z.enum([
  'life',
  'health',
  'auto',
  'home',
  'travel',
  'other',
])
export type PolicyType = z.infer<typeof PolicyTypeSchema>

export const PaymentFrequencySchema = z.enum([
  'monthly',
  'quarterly',
  'semi_annual',
  'annual',
  'single',
])
export type PaymentFrequency = z.infer<typeof PaymentFrequencySchema>

export const CoverageEntrySchema = z.object({
  name: z.string().min(1),
  amount: z.number().nonnegative(),
})
export type CoverageEntry = z.infer<typeof CoverageEntrySchema>

export const DeductibleEntrySchema = z.object({
  incidentType: z.string().min(1),
  amount: z.number().nonnegative(),
  isPercentage: z.boolean(),
})
export type DeductibleEntry = z.infer<typeof DeductibleEntrySchema>

export const BeneficiaryIdTypeSchema = z.enum([
  'cc',
  'ce',
  'passport',
  'nit',
  'other',
])
export type BeneficiaryIdType = z.infer<typeof BeneficiaryIdTypeSchema>

export const BeneficiaryEntrySchema = z.object({
  name: z.string().min(1),
  idType: BeneficiaryIdTypeSchema,
  idNumber: z.string().min(1),
  relationship: z.string().min(1),
  pct: z.number().min(0).max(100),
})
export type BeneficiaryEntry = z.infer<typeof BeneficiaryEntrySchema>

export const BenefitEntrySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  contactInfo: z.string().optional(),
  quantity: z.string().optional(),
})
export type BenefitEntry = z.infer<typeof BenefitEntrySchema>

export const PolicyAgentSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
})
export type PolicyAgent = z.infer<typeof PolicyAgentSchema>

export const PolicySchema = z.object({
  ownerUid: z.string().min(1),
  policyNumber: z.string().min(1),
  insurerName: z.string().min(1),
  policyType: PolicyTypeSchema,
  holderName: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  hasNoExpiration: z.boolean().default(false),
  premium: z.number().nonnegative(),
  currency: z.string().length(3),
  paymentFrequency: PaymentFrequencySchema,
  coverages: z.string().optional(),
  beneficiaries: z.string().optional(),
  exclusions: z.string().optional(),
  waitingPeriods: z.string().optional(),
  notes: z.string().optional(),
  agent: PolicyAgentSchema,
  coverageEntries: z.array(CoverageEntrySchema).default([]),
  deductibleEntries: z.array(DeductibleEntrySchema).default([]),
  beneficiaryEntries: z.array(BeneficiaryEntrySchema).default([]),
  benefitEntries: z.array(BenefitEntrySchema).default([]),
  sharedWith: z.array(z.string().min(1)).default([]),
  status: PolicyStatusSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})
export type Policy = z.infer<typeof PolicySchema>
