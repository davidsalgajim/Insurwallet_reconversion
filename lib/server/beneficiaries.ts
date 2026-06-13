import { Timestamp, type Firestore } from 'firebase-admin/firestore'
import { z } from 'zod'

import { getAdminFirestore } from '@/lib/firebase/admin'
import { parsePolicyDocument } from '@/lib/firebase/policies'
import { BeneficiaryRecordSchema } from '@/lib/schemas/chunk'
import { BeneficiaryEntrySchema } from '@/lib/schemas/policy'

const BeneficiaryInputSchema = BeneficiaryEntrySchema

export type BeneficiaryDto = z.infer<typeof BeneficiaryInputSchema> & {
  id: string
  createdAt: string
  updatedAt: string
}

export async function listBeneficiaries(input: {
  ownerUid: string
  policyId: string
}): Promise<BeneficiaryDto[]> {
  const db = getAdminFirestore()
  await assertPolicyOwner(db, input.policyId, input.ownerUid)

  const snap = await db
    .collection('policies')
    .doc(input.policyId)
    .collection('beneficiaries')
    .get()

  return snap.docs
    .map((doc) => {
      const data = doc.data()
      const parsed = BeneficiaryRecordSchema.safeParse({
        ...data,
        createdAt: data.createdAt?.toDate?.() ?? new Date(),
        updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
      })
      if (!parsed.success) {
        return null
      }
      return {
        id: doc.id,
        ...parsed.data,
        createdAt: parsed.data.createdAt.toISOString(),
        updatedAt: parsed.data.updatedAt.toISOString(),
      }
    })
    .filter((entry): entry is BeneficiaryDto => entry !== null)
}

export async function createBeneficiary(input: {
  ownerUid: string
  policyId: string
  body: z.infer<typeof BeneficiaryInputSchema>
}): Promise<BeneficiaryDto> {
  const db = getAdminFirestore()
  await assertPolicyOwner(db, input.policyId, input.ownerUid)

  const now = new Date()
  const record = BeneficiaryRecordSchema.parse({
    ...BeneficiaryInputSchema.parse(input.body),
    createdAt: now,
    updatedAt: now,
  })

  const docRef = await db
    .collection('policies')
    .doc(input.policyId)
    .collection('beneficiaries')
    .add({
      ...record,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    })

  return {
    id: docRef.id,
    ...record,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  }
}

export async function updateBeneficiary(input: {
  ownerUid: string
  policyId: string
  beneficiaryId: string
  body: z.infer<typeof BeneficiaryInputSchema>
}): Promise<BeneficiaryDto> {
  const db = getAdminFirestore()
  await assertPolicyOwner(db, input.policyId, input.ownerUid)

  const docRef = db
    .collection('policies')
    .doc(input.policyId)
    .collection('beneficiaries')
    .doc(input.beneficiaryId)

  const existing = await docRef.get()
  if (!existing.exists) {
    throw new Error('Beneficiary not found')
  }

  const now = new Date()
  const createdAt = existing.data()?.createdAt?.toDate?.() ?? now
  const record = BeneficiaryRecordSchema.parse({
    ...BeneficiaryInputSchema.parse(input.body),
    createdAt,
    updatedAt: now,
  })

  await docRef.set({
    ...record,
    createdAt: Timestamp.fromDate(createdAt),
    updatedAt: Timestamp.fromDate(now),
  })

  return {
    id: input.beneficiaryId,
    ...record,
    createdAt: createdAt.toISOString(),
    updatedAt: now.toISOString(),
  }
}

export async function deleteBeneficiary(input: {
  ownerUid: string
  policyId: string
  beneficiaryId: string
}): Promise<void> {
  const db = getAdminFirestore()
  await assertPolicyOwner(db, input.policyId, input.ownerUid)

  const docRef = db
    .collection('policies')
    .doc(input.policyId)
    .collection('beneficiaries')
    .doc(input.beneficiaryId)

  const existing = await docRef.get()
  if (!existing.exists) {
    throw new Error('Beneficiary not found')
  }

  await docRef.delete()
}

async function assertPolicyOwner(
  db: Firestore,
  policyId: string,
  ownerUid: string
): Promise<void> {
  const policySnap = await db.collection('policies').doc(policyId).get()
  if (!policySnap.exists) {
    throw new Error('Policy not found')
  }

  const policy = parsePolicyDocument(
    policySnap.id,
    policySnap.data() as Record<string, unknown>
  )

  if (policy.ownerUid !== ownerUid) {
    throw new Error('Unauthorized')
  }
}

export { BeneficiaryInputSchema }
