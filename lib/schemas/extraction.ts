/**
 * Claude / worker extraction output — fields map 1:1 to CreatePolicyInput (lib/firebase/policies.ts).
 * manual wizard ≡ extraction ≡ MarIAna readable fields (lib/schemas/policy.ts).
 *
 * Field parity: see `lib/schemas/extraction-field-keys.ts` (21 extractable fields).
 * Never extracted from documents: ownerUid, sharedWith, status, createdAt, updatedAt.
 */
import { z } from 'zod'

import {
  BenefitEntrySchema,
  BeneficiaryEntrySchema,
  CoverageEntrySchema,
  DeductibleEntrySchema,
  InsurerContactLineSchema,
  PaymentFrequencySchema,
  PolicyAgentExtractionSchema,
  PolicyTypeSchema,
  type InsurerContactLine,
} from '@/lib/schemas/policy'

export { InsurerContactLineSchema, type InsurerContactLine }

export const ExtractionConfidenceSchema = z.enum(['high', 'medium', 'low'])
export type ExtractionConfidence = z.infer<typeof ExtractionConfidenceSchema>

export const FieldBboxSchema = z.object({
  page: z.number().int().positive(),
  left: z.number().min(0).max(1),
  top: z.number().min(0).max(1),
  width: z.number().min(0).max(1),
  height: z.number().min(0).max(1),
})
export type FieldBbox = z.infer<typeof FieldBboxSchema>

/** Insurer SAC / customer-service lines — merged into agent on review when agent is empty. */
export const InsurerContactsExtractionSchema = z.union([
  InsurerContactLineSchema,
  z.array(InsurerContactLineSchema),
])
export type InsurerContactsExtraction = z.infer<
  typeof InsurerContactsExtractionSchema
>

export const PolicyExtractionFieldsSchema = z.object({
  insurerName: z.string().min(1).optional(),
  policyNumber: z.string().min(1).optional(),
  policyType: PolicyTypeSchema.optional(),
  holderName: z.string().min(1).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  hasNoExpiration: z.boolean().optional(),
  premium: z.number().nonnegative().optional(),
  currency: z.string().length(3).optional(),
  paymentFrequency: PaymentFrequencySchema.optional(),
  coverages: z.string().optional(),
  beneficiaries: z.string().optional(),
  exclusions: z.string().optional(),
  waitingPeriods: z.string().optional(),
  notes: z.string().optional(),
  agent: PolicyAgentExtractionSchema.optional(),
  insurerContacts: InsurerContactsExtractionSchema.optional(),
  coverageEntries: z.array(CoverageEntrySchema).optional(),
  deductibleEntries: z.array(DeductibleEntrySchema).optional(),
  beneficiaryEntries: z.array(BeneficiaryEntrySchema).optional(),
  benefitEntries: z.array(BenefitEntrySchema).optional(),
})
export type PolicyExtractionFields = z.infer<
  typeof PolicyExtractionFieldsSchema
>

export const PolicyExtractionSchema = z.object({
  fields: PolicyExtractionFieldsSchema,
  confidence: z.record(z.string(), ExtractionConfidenceSchema),
  bboxes: z.record(z.string(), FieldBboxSchema).optional(),
  method: z.enum(['odl', 'surya', 'markitdown', 'stub']).default('stub'),
  extractedAt: z.coerce.date(),
})
export type PolicyExtraction = z.infer<typeof PolicyExtractionSchema>
