import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  Timestamp,
  type Firestore,
} from 'firebase/firestore'

import { createPolicy, type PolicyDocument } from '@/lib/firebase/policies'
import {
  documentRoleToCategory,
  PolicyDocumentSchema,
  type DocumentRole,
} from '@/lib/schemas/document'
import { parseDocumentExtraction } from '@/lib/firebase/parse-document-extraction'
import type { PolicyExtraction } from '@/lib/schemas/extraction'
import type { PolicyUploadMimeType } from '@/lib/schemas/upload'

export type CreateDraftPolicyForUploadInput = {
  ownerUid: string
}

export type RegisterUploadedDocumentInput = {
  policyId: string
  docId: string
  fileName: string
  storagePath: string
  fileSize: number
  mimeType: PolicyUploadMimeType
  documentRole?: DocumentRole
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
  const parsed = PolicyDocumentSchema.safeParse({
    fileName: input.fileName,
    category: input.documentRole
      ? documentRoleToCategory(input.documentRole)
      : 'cover',
    ...(input.documentRole ? { documentRole: input.documentRole } : {}),
    storagePath: input.storagePath,
    fileSize: input.fileSize,
    mimeType: input.mimeType,
    processing: { state: 'pending' },
    createdAt: now,
  })

  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    throw new Error(
      `Invalid document metadata${issue?.message ? `: ${issue.message}` : ''}`
    )
  }

  const payload = parsed.data

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

export type PolicyFileDocument = {
  id: string
  fileName: string
  storagePath: string
  fileSize: number
  documentRole?: DocumentRole
  extraction?: PolicyExtraction
}

function mapPolicyDocumentSnapshot(docSnap: {
  id: string
  data: () => Record<string, unknown>
}): PolicyFileDocument {
  const data = docSnap.data()
  return {
    id: docSnap.id,
    fileName: String(data.fileName),
    storagePath: String(data.storagePath),
    fileSize: Number(data.fileSize ?? 0),
    documentRole:
      typeof data.documentRole === 'string'
        ? (data.documentRole as DocumentRole)
        : undefined,
    extraction: parseDocumentExtraction(data),
  }
}

export function subscribePolicyDocuments(
  db: Firestore,
  policyId: string,
  onDocuments: (documents: PolicyFileDocument[]) => void,
  onError?: (error: Error) => void
): () => void {
  return onSnapshot(
    collection(db, 'policies', policyId, 'documents'),
    (snapshot) => {
      onDocuments(
        snapshot.docs.map((docSnap) => mapPolicyDocumentSnapshot(docSnap))
      )
    },
    (error) => {
      onError?.(error)
    }
  )
}

export async function listPolicyDocuments(
  db: Firestore,
  policyId: string
): Promise<PolicyFileDocument[]> {
  const snapshot = await getDocs(
    collection(db, 'policies', policyId, 'documents')
  )

  return snapshot.docs.map((docSnap) => mapPolicyDocumentSnapshot(docSnap))
}
