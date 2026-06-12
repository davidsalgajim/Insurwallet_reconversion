import { Timestamp } from 'firebase-admin/firestore'
import { z } from 'zod'

import { getAdminFirestore } from '@/lib/firebase/admin'
import { parsePolicyDocument } from '@/lib/firebase/policies'
import {
  getServerEnv,
  hasResendApiKey,
  resolveAppUrl,
} from '@/lib/server/env-server'
import {
  buildShareEmailHtml,
  sendShareInviteEmail,
} from '@/lib/server/share-email'
import { SharePermissionSchema, ShareSchema } from '@/lib/schemas/share'
import { generateShareToken, hashShareToken } from '@/lib/utils/share-token'

const CreateShareBodySchema = z.object({
  policyId: z.string().min(1),
  recipientEmail: z.string().email(),
  permission: SharePermissionSchema.default('view'),
  expiresInDays: z.number().int().min(1).max(90).default(7),
  locale: z.enum(['es', 'en', 'pt']).default('es'),
})

export type PolicyShareRecord = {
  tokenHash: string
  recipientEmail: string
  permission: 'view' | 'view_download'
  status: 'pending' | 'accepted' | 'revoked' | 'expired'
  expiresAt: string
  createdAt: string
}

export async function createShareForPolicy(input: {
  ownerUid: string
  policyId: string
  recipientEmail: string
  permission: 'view' | 'view_download'
  expiresInDays: number
  locale: 'es' | 'en' | 'pt'
}): Promise<{ token: string; shareUrl: string; emailSent: boolean }> {
  const db = getAdminFirestore()
  const policySnap = await db.collection('policies').doc(input.policyId).get()

  if (!policySnap.exists) {
    throw new Error('Policy not found')
  }

  const policy = parsePolicyDocument(
    policySnap.id,
    policySnap.data() as Record<string, unknown>
  )

  if (policy.ownerUid !== input.ownerUid) {
    throw new Error('Unauthorized')
  }

  const token = generateShareToken()
  const tokenHash = await hashShareToken(token)
  const now = new Date()
  const expiresAt = new Date(now)
  expiresAt.setDate(expiresAt.getDate() + input.expiresInDays)

  const share = ShareSchema.parse({
    policyId: input.policyId,
    ownerUid: input.ownerUid,
    recipientEmail: input.recipientEmail,
    permission: input.permission,
    tokenHash,
    status: 'pending',
    expiresAt,
    createdAt: now,
  })

  await db
    .collection('shares')
    .doc(tokenHash)
    .set({
      ...share,
      createdAt: Timestamp.fromDate(now),
      expiresAt,
    })

  const shareUrl = `${resolveAppUrl()}/share/${token}`
  let emailSent = false

  const { RESEND_API_KEY, RESEND_FROM_EMAIL } = getServerEnv()
  if (hasResendApiKey() && RESEND_API_KEY && RESEND_FROM_EMAIL) {
    const result = await sendShareInviteEmail(
      {
        recipientEmail: input.recipientEmail,
        insurerName: policy.insurerName,
        policyNumber: policy.policyNumber,
        token,
        permission: input.permission,
        locale: input.locale,
      },
      RESEND_API_KEY,
      RESEND_FROM_EMAIL
    )
    emailSent = Boolean(result)
  }

  return { token, shareUrl, emailSent }
}

export async function listSharesForPolicy(input: {
  ownerUid: string
  policyId: string
}): Promise<PolicyShareRecord[]> {
  const db = getAdminFirestore()
  const policySnap = await db.collection('policies').doc(input.policyId).get()

  if (!policySnap.exists) {
    throw new Error('Policy not found')
  }

  const policy = parsePolicyDocument(
    policySnap.id,
    policySnap.data() as Record<string, unknown>
  )

  if (policy.ownerUid !== input.ownerUid) {
    throw new Error('Unauthorized')
  }

  const sharesSnap = await db
    .collection('shares')
    .where('policyId', '==', input.policyId)
    .where('ownerUid', '==', input.ownerUid)
    .get()

  return sharesSnap.docs
    .map((doc) => {
      const data = doc.data()
      const expiresAt = data.expiresAt?.toDate?.() ?? new Date()
      let status = String(data.status) as PolicyShareRecord['status']
      if (status === 'pending' && expiresAt.getTime() < Date.now()) {
        status = 'expired'
      }

      return {
        tokenHash: doc.id,
        recipientEmail: String(data.recipientEmail),
        permission: data.permission as 'view' | 'view_download',
        status,
        expiresAt: expiresAt.toISOString(),
        createdAt: (data.createdAt?.toDate?.() ?? new Date()).toISOString(),
      }
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function revokeShareByHash(input: {
  ownerUid: string
  tokenHash: string
}): Promise<void> {
  const db = getAdminFirestore()
  const shareRef = db.collection('shares').doc(input.tokenHash)
  const shareSnap = await shareRef.get()

  if (!shareSnap.exists) {
    throw new Error('Share not found')
  }

  const data = shareSnap.data()
  if (data?.ownerUid !== input.ownerUid) {
    throw new Error('Unauthorized')
  }

  await shareRef.update({ status: 'revoked' })
}

export { CreateShareBodySchema, buildShareEmailHtml }
