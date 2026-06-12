import { doc, setDoc, Timestamp, type Firestore } from 'firebase/firestore'

import { PolicyDocumentSchema } from '@/lib/schemas/document'
import { PDF_MIME_TYPE } from '@/lib/schemas/upload'
import { createPolicy, type PolicyDocument } from '@/lib/firebase/policies'

export type CreateDraftPolicyForUploadInput = {
  ownerUid: string
}

export type RegisterUploadedDocumentInput = {
  policyId: string
  docId: string
  fileName: string
  storagePath: string
  fileSize: number
}

export async function createDraftPolicyForUpload(
  db: Firestore,
  input: CreateDraftPolicyForUploadInput
): Promise<PolicyDocument> {
  const now = new Date()
  const draftSuffix = now.getTime().toString(36).toUpperCase()

  return createPolicy(db, {
    ownerUid: input.ownerUid,
    insurerName: 'Por confirmar',
    policyNumber: `DRAFT-${draftSuffix}`,
    startDate: now,
    endDate: now,
    notes: 'Borrador desde upload PDF — datos pendientes de revisión humana.',
  })
}

export function documentToFirestoreData(
  input: RegisterUploadedDocumentInput,
  now: Date = new Date()
): Record<string, unknown> {
  const payload = PolicyDocumentSchema.parse({
    fileName: input.fileName,
    category: 'cover',
    storagePath: input.storagePath,
    fileSize: input.fileSize,
    mimeType: PDF_MIME_TYPE,
    processing: { state: 'pending' },
    createdAt: now,
  })

  return {
    ...payload,
    createdAt: Timestamp.fromDate(payload.createdAt),
  }
}

export async function registerUploadedDocument(
  db: Firestore,
  input: RegisterUploadedDocumentInput
): Promise<void> {
  const docRef = doc(db, 'policies', input.policyId, 'documents', input.docId)

  await setDoc(docRef, documentToFirestoreData(input))
}
