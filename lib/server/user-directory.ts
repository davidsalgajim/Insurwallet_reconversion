import { Timestamp } from 'firebase-admin/firestore'
import { z } from 'zod'

import {
  readUserSubcollection,
  writeUserSubcollectionDoc,
  deleteUserSubcollectionDoc,
} from '@/lib/firebase/user-subcollection-server'
import {
  GlobalBeneficiaryInputSchema,
  GlobalBeneficiaryRecordSchema,
  InsuranceContactInputSchema,
  InsuranceContactRecordSchema,
} from '@/lib/schemas/user-contacts'

export type InsuranceContactDto = z.infer<
  typeof InsuranceContactInputSchema
> & {
  id: string
  createdAt: string
  updatedAt: string
}

export type GlobalBeneficiaryDto = z.infer<
  typeof GlobalBeneficiaryInputSchema
> & {
  id: string
  createdAt: string
  updatedAt: string
}

function toContactDto(
  id: string,
  record: z.infer<typeof InsuranceContactRecordSchema>
): InsuranceContactDto {
  return {
    id,
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

function toBeneficiaryDto(
  id: string,
  record: z.infer<typeof GlobalBeneficiaryRecordSchema>
): GlobalBeneficiaryDto {
  return {
    id,
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

export async function listInsuranceContacts(
  uid: string
): Promise<InsuranceContactDto[]> {
  const docs = await readUserSubcollection(uid, 'contacts')
  return docs
    .map((doc) => {
      const parsed = InsuranceContactRecordSchema.safeParse(doc.data)
      if (!parsed.success) {
        return null
      }
      return toContactDto(doc.id, parsed.data)
    })
    .filter((entry): entry is InsuranceContactDto => entry !== null)
}

export async function createInsuranceContact(input: {
  uid: string
  body: z.infer<typeof InsuranceContactInputSchema>
}): Promise<InsuranceContactDto> {
  const now = new Date()
  const record = InsuranceContactRecordSchema.parse({
    ...InsuranceContactInputSchema.parse(input.body),
    createdAt: now,
    updatedAt: now,
  })

  const id = await writeUserSubcollectionDoc(input.uid, 'contacts', record, {
    useAdminTimestamps: true,
    adminRecord: {
      ...record,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    },
  })

  return toContactDto(id, record)
}

export async function updateInsuranceContact(input: {
  uid: string
  contactId: string
  body: z.infer<typeof InsuranceContactInputSchema>
}): Promise<InsuranceContactDto> {
  const docs = await readUserSubcollection(input.uid, 'contacts')
  const existing = docs.find((doc) => doc.id === input.contactId)
  if (!existing) {
    throw new Error('Contact not found')
  }

  const parsedExisting = InsuranceContactRecordSchema.safeParse(existing.data)
  const createdAt = parsedExisting.success
    ? parsedExisting.data.createdAt
    : new Date()

  const now = new Date()
  const record = InsuranceContactRecordSchema.parse({
    ...InsuranceContactInputSchema.parse(input.body),
    createdAt,
    updatedAt: now,
  })

  await writeUserSubcollectionDoc(input.uid, 'contacts', record, {
    documentId: input.contactId,
    useAdminTimestamps: true,
    adminRecord: {
      ...record,
      createdAt: Timestamp.fromDate(createdAt),
      updatedAt: Timestamp.fromDate(now),
    },
  })

  return toContactDto(input.contactId, record)
}

export async function deleteInsuranceContact(input: {
  uid: string
  contactId: string
}): Promise<void> {
  await deleteUserSubcollectionDoc(input.uid, 'contacts', input.contactId)
}

export async function listGlobalBeneficiaries(
  uid: string
): Promise<GlobalBeneficiaryDto[]> {
  const docs = await readUserSubcollection(uid, 'beneficiaries')
  return docs
    .map((doc) => {
      const parsed = GlobalBeneficiaryRecordSchema.safeParse(doc.data)
      if (!parsed.success) {
        return null
      }
      return toBeneficiaryDto(doc.id, parsed.data)
    })
    .filter((entry): entry is GlobalBeneficiaryDto => entry !== null)
}

export async function createGlobalBeneficiary(input: {
  uid: string
  body: z.infer<typeof GlobalBeneficiaryInputSchema>
}): Promise<GlobalBeneficiaryDto> {
  const now = new Date()
  const record = GlobalBeneficiaryRecordSchema.parse({
    ...GlobalBeneficiaryInputSchema.parse(input.body),
    createdAt: now,
    updatedAt: now,
  })

  const id = await writeUserSubcollectionDoc(
    input.uid,
    'beneficiaries',
    record,
    {
      useAdminTimestamps: true,
      adminRecord: {
        ...record,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      },
    }
  )

  return toBeneficiaryDto(id, record)
}

export async function updateGlobalBeneficiary(input: {
  uid: string
  beneficiaryId: string
  body: z.infer<typeof GlobalBeneficiaryInputSchema>
}): Promise<GlobalBeneficiaryDto> {
  const docs = await readUserSubcollection(input.uid, 'beneficiaries')
  const existing = docs.find((doc) => doc.id === input.beneficiaryId)
  if (!existing) {
    throw new Error('Beneficiary not found')
  }

  const parsedExisting = GlobalBeneficiaryRecordSchema.safeParse(existing.data)
  const createdAt = parsedExisting.success
    ? parsedExisting.data.createdAt
    : new Date()

  const now = new Date()
  const record = GlobalBeneficiaryRecordSchema.parse({
    ...GlobalBeneficiaryInputSchema.parse(input.body),
    createdAt,
    updatedAt: now,
  })

  await writeUserSubcollectionDoc(input.uid, 'beneficiaries', record, {
    documentId: input.beneficiaryId,
    useAdminTimestamps: true,
    adminRecord: {
      ...record,
      createdAt: Timestamp.fromDate(createdAt),
      updatedAt: Timestamp.fromDate(now),
    },
  })

  return toBeneficiaryDto(input.beneficiaryId, record)
}

export async function deleteGlobalBeneficiary(input: {
  uid: string
  beneficiaryId: string
}): Promise<void> {
  await deleteUserSubcollectionDoc(
    input.uid,
    'beneficiaries',
    input.beneficiaryId
  )
}

export { GlobalBeneficiaryInputSchema, InsuranceContactInputSchema }
