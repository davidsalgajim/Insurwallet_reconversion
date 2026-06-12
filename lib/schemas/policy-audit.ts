import { z } from 'zod'

export const PolicyAuditActionSchema = z.enum([
  'create',
  'update',
  'delete',
  'share',
])
export type PolicyAuditAction = z.infer<typeof PolicyAuditActionSchema>

export const PolicyAuditLogSchema = z.object({
  action: PolicyAuditActionSchema,
  actorUid: z.string().min(1),
  createdAt: z.coerce.date(),
  policyNumber: z.string().optional(),
  insurerName: z.string().optional(),
})
export type PolicyAuditLog = z.infer<typeof PolicyAuditLogSchema>
