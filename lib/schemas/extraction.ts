import { z } from 'zod'

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

export const PolicyExtractionFieldsSchema = z.object({
  insurerName: z.string().min(1).optional(),
  policyNumber: z.string().min(1).optional(),
  holderName: z.string().min(1).optional(),
  premium: z.number().nonnegative().optional(),
  currency: z.string().length(3).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
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
