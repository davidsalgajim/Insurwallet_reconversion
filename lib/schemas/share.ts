import { z } from 'zod'

export const SharePermissionSchema = z.enum(['view', 'view_download'])
export type SharePermission = z.infer<typeof SharePermissionSchema>

export const ShareStatusSchema = z.enum([
  'pending',
  'accepted',
  'revoked',
  'expired',
])
export type ShareStatus = z.infer<typeof ShareStatusSchema>

export const ShareSchema = z.object({
  policyId: z.string().min(1),
  ownerUid: z.string().min(1),
  recipientEmail: z.string().email(),
  recipientUid: z.string().min(1).optional(),
  permission: SharePermissionSchema,
  tokenHash: z.string().min(1),
  expiresAt: z.coerce.date(),
  status: ShareStatusSchema,
  createdAt: z.coerce.date(),
})
export type Share = z.infer<typeof ShareSchema>
