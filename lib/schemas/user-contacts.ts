import { z } from 'zod'

import { BeneficiaryIdTypeSchema } from '@/lib/schemas/policy'

export const InsuranceContactTypeSchema = z.enum([
  'agent',
  'insurer',
  'broker',
  'emergency',
  'other',
])
export type InsuranceContactType = z.infer<typeof InsuranceContactTypeSchema>

export const InsuranceContactInputSchema = z.object({
  type: InsuranceContactTypeSchema,
  name: z.string().min(1).max(120),
  company: z.string().max(120).optional(),
  phone: z.string().max(40).optional(),
  email: z.union([z.string().email(), z.literal('')]).optional(),
  notes: z.string().max(500).optional(),
})
export type InsuranceContactInput = z.infer<typeof InsuranceContactInputSchema>

export const InsuranceContactRecordSchema = InsuranceContactInputSchema.extend({
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})
export type InsuranceContactRecord = z.infer<
  typeof InsuranceContactRecordSchema
>

export const GlobalBeneficiaryInputSchema = z.object({
  name: z.string().min(1),
  idType: BeneficiaryIdTypeSchema,
  idNumber: z.string().min(1),
  relationship: z.string().min(1),
  pct: z.number().min(0).max(100).optional(),
})
export type GlobalBeneficiaryInput = z.infer<
  typeof GlobalBeneficiaryInputSchema
>

export const GlobalBeneficiaryRecordSchema =
  GlobalBeneficiaryInputSchema.extend({
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
  })
export type GlobalBeneficiaryRecord = z.infer<
  typeof GlobalBeneficiaryRecordSchema
>
