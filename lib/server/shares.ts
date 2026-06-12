import { FieldValue, Timestamp } from 'firebase-admin/firestore'

import { getAdminFirestore } from '@/lib/firebase/admin'
import { ShareSchema } from '@/lib/schemas/share'
import { hashShareToken } from '@/lib/utils/share-token'

export type SharePreview = {
  status: 'pending' | 'accepted' | 'revoked' | 'expired'
  permission: 'view' | 'view_download'
  recipientEmail: string
  insurerName: string | null
  policyNumber: string | null
  expiresAt: string
}

function resolveShareStatus(
  status: string,
  expiresAt: Date
): SharePreview['status'] {
  if (status === 'pending' && expiresAt.getTime() < Date.now()) {
    return 'expired'
  }

  if (status === 'pending' || status === 'accepted' || status === 'revoked') {
    return status
  }

  return 'revoked'
}

export async function getSharePreview(
  token: string
): Promise<SharePreview | null> {
  const db = getAdminFirestore()
  const tokenHash = await hashShareToken(token)
  const shareSnap = await db.collection('shares').doc(tokenHash).get()

  if (!shareSnap.exists) {
    return null
  }

  const share = ShareSchema.parse({
    ...shareSnap.data(),
    createdAt: shareSnap.data()?.createdAt?.toDate?.() ?? new Date(),
    expiresAt: shareSnap.data()?.expiresAt?.toDate?.() ?? new Date(),
  })

  const policySnap = await db.collection('policies').doc(share.policyId).get()
  const policyData = policySnap.data()

  return {
    status: resolveShareStatus(share.status, share.expiresAt),
    permission: share.permission,
    recipientEmail: share.recipientEmail,
    insurerName: policyData ? String(policyData.insurerName) : null,
    policyNumber: policyData ? String(policyData.policyNumber) : null,
    expiresAt: share.expiresAt.toISOString(),
  }
}

export async function acceptShareWithPolicyAccess(input: {
  token: string
  recipientUid: string
  recipientEmail: string
}): Promise<{ policyId: string }> {
  const db = getAdminFirestore()
  const tokenHash = await hashShareToken(input.token)
  const shareRef = db.collection('shares').doc(tokenHash)
  const shareSnap = await shareRef.get()

  if (!shareSnap.exists) {
    throw new Error('Share not found')
  }

  const share = ShareSchema.parse({
    ...shareSnap.data(),
    createdAt: shareSnap.data()?.createdAt?.toDate?.() ?? new Date(),
    expiresAt: shareSnap.data()?.expiresAt?.toDate?.() ?? new Date(),
  })

  if (
    share.recipientEmail.toLowerCase() !== input.recipientEmail.toLowerCase()
  ) {
    throw new Error('Recipient email mismatch')
  }

  if (resolveShareStatus(share.status, share.expiresAt) !== 'pending') {
    throw new Error('Share is not pending')
  }

  const policyRef = db.collection('policies').doc(share.policyId)
  const policySnap = await policyRef.get()

  if (!policySnap.exists) {
    throw new Error('Policy not found')
  }

  await db.runTransaction(async (transaction) => {
    transaction.update(shareRef, {
      status: 'accepted',
      recipientUid: input.recipientUid,
    })

    transaction.update(policyRef, {
      sharedWith: FieldValue.arrayUnion(input.recipientUid),
      updatedAt: Timestamp.now(),
    })
  })

  return { policyId: share.policyId }
}
