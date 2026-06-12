import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Firestore,
} from 'firebase/firestore'
import { z } from 'zod'

import {
  SharePermissionSchema,
  ShareSchema,
  type Share,
  type SharePermission,
} from '@/lib/schemas/share'
import { generateShareToken, hashShareToken } from '@/lib/utils/share-token'

const SHARES_COLLECTION = 'shares'

export const CreateShareInputSchema = z.object({
  policyId: z.string().min(1),
  ownerUid: z.string().min(1),
  recipientEmail: z.string().email(),
  permission: SharePermissionSchema,
  expiresInDays: z.number().int().min(1).max(90).default(7),
})

export type CreateShareInput = z.infer<typeof CreateShareInputSchema>

export type CreateShareResult = {
  token: string
  tokenHash: string
  share: Share
}

function shareToFirestoreData(share: Share): Record<string, unknown> {
  return {
    policyId: share.policyId,
    ownerUid: share.ownerUid,
    recipientEmail: share.recipientEmail,
    permission: share.permission,
    tokenHash: share.tokenHash,
    status: share.status,
    expiresAt: share.expiresAt,
    createdAt: share.createdAt,
    ...(share.recipientUid ? { recipientUid: share.recipientUid } : {}),
  }
}

export async function createShare(
  db: Firestore,
  input: CreateShareInput
): Promise<CreateShareResult> {
  const parsed = CreateShareInputSchema.parse(input)
  const token = generateShareToken()
  const tokenHash = await hashShareToken(token)
  const now = new Date()
  const expiresAt = new Date(now)
  expiresAt.setDate(expiresAt.getDate() + parsed.expiresInDays)

  const share: Share = {
    policyId: parsed.policyId,
    ownerUid: parsed.ownerUid,
    recipientEmail: parsed.recipientEmail,
    permission: parsed.permission,
    tokenHash,
    status: 'pending',
    expiresAt,
    createdAt: now,
  }

  ShareSchema.parse(share)

  await setDoc(doc(db, SHARES_COLLECTION, tokenHash), {
    ...shareToFirestoreData(share),
    createdAt: serverTimestamp(),
    expiresAt,
  })

  return { token, tokenHash, share }
}

export async function revokeShare(
  db: Firestore,
  tokenHash: string,
  ownerUid: string
): Promise<void> {
  const shareRef = doc(db, SHARES_COLLECTION, tokenHash)
  const snapshot = await getDoc(shareRef)

  if (!snapshot.exists()) {
    throw new Error('Share not found')
  }

  const data = snapshot.data()
  if (data.ownerUid !== ownerUid) {
    throw new Error('Unauthorized share revocation')
  }

  await updateDoc(shareRef, { status: 'revoked' })
}

export async function getShareByToken(
  db: Firestore,
  token: string
): Promise<(Share & { id: string }) | null> {
  const tokenHash = await hashShareToken(token)
  const snapshot = await getDoc(doc(db, SHARES_COLLECTION, tokenHash))

  if (!snapshot.exists()) {
    return null
  }

  const parsed = ShareSchema.safeParse({
    ...snapshot.data(),
    createdAt: snapshot.data().createdAt?.toDate?.() ?? new Date(),
    expiresAt: snapshot.data().expiresAt?.toDate?.() ?? new Date(),
  })

  if (!parsed.success) {
    return null
  }

  return { ...parsed.data, id: tokenHash }
}

export async function acceptShare(
  db: Firestore,
  token: string,
  recipientUid: string
): Promise<Share & { id: string }> {
  const share = await getShareByToken(db, token)

  if (!share) {
    throw new Error('Share not found')
  }

  if (share.status !== 'pending') {
    throw new Error('Share is not pending')
  }

  if (share.expiresAt.getTime() < Date.now()) {
    throw new Error('Share has expired')
  }

  await updateDoc(doc(db, SHARES_COLLECTION, share.id), {
    status: 'accepted',
    recipientUid,
  })

  return { ...share, status: 'accepted', recipientUid }
}

export type SharePermissionLevel = SharePermission
