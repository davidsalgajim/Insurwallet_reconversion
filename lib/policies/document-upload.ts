import type { Firestore } from 'firebase/firestore'
import type { FirebaseStorage } from 'firebase/storage'

import {
  registerUploadedDocument,
  type RegisterUploadedDocumentInput,
} from '@/lib/firebase/documents'
import { uploadPolicyPdf } from '@/lib/firebase/storage'
import { resolveUploadErrorKey } from '@/lib/policies/upload-errors'
import type { DocumentRole } from '@/lib/schemas/document'
import {
  validatePolicyUploadFile,
  type PolicyUploadMimeType,
} from '@/lib/schemas/upload'

export type DocumentUploadItem = {
  localId: string
  file: File
  documentRole?: DocumentRole
}

export type UploadedDocumentRecord = {
  docId: string
  fileName: string
  storagePath: string
  fileSize: number
  mimeType: PolicyUploadMimeType
  documentRole?: DocumentRole
  jobId?: string
}

export type UploadDocumentsToPolicyInput = {
  db: Firestore
  storage: FirebaseStorage
  ownerUid: string
  policyId: string
  documents: DocumentUploadItem[]
  onFileProgress?: (localId: string, progress: number) => void
  /** When true (default), enqueue processing jobs via POST /api/jobs after upload. */
  enqueueJobs?: boolean
}

export type UploadDocumentsToPolicyResult =
  | { ok: true; uploaded: UploadedDocumentRecord[] }
  | { ok: false; localId: string; fileName: string; errorKey: string }

async function enqueueDocumentProcessingJob(input: {
  policyId: string
  docId: string
  storagePath: string
}): Promise<string | null> {
  const response = await fetch('/api/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    let detail = 'Failed to create processing job'
    try {
      const body = (await response.json()) as { error?: string }
      if (body.error) {
        detail = body.error
      }
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(detail)
  }

  try {
    const body = (await response.json()) as { jobId?: string }
    return body.jobId ?? null
  } catch {
    return null
  }
}

export async function uploadDocumentsToPolicy(
  input: UploadDocumentsToPolicyInput
): Promise<UploadDocumentsToPolicyResult> {
  const uploaded: UploadedDocumentRecord[] = []
  const shouldEnqueueJobs = input.enqueueJobs !== false

  for (const item of input.documents) {
    const validation = await validatePolicyUploadFile(item.file)
    if (!validation.ok) {
      return {
        ok: false,
        localId: item.localId,
        fileName: item.file.name,
        errorKey: validation.errorKey,
      }
    }

    const docId = crypto.randomUUID()

    try {
      const { storagePath } = await uploadPolicyPdf({
        storage: input.storage,
        file: validation.file,
        docId,
        input: {
          ownerUid: input.ownerUid,
          policyId: input.policyId,
          fileName: validation.file.name,
          fileSize: validation.file.size,
          mimeType: validation.mimeType,
        },
        onProgress: ({ progress }) =>
          input.onFileProgress?.(item.localId, progress),
      })

      const registerInput: RegisterUploadedDocumentInput = {
        policyId: input.policyId,
        docId,
        fileName: validation.file.name,
        storagePath,
        fileSize: validation.file.size,
        mimeType: validation.mimeType,
        documentRole: item.documentRole,
      }

      await registerUploadedDocument(input.db, registerInput)

      uploaded.push({
        docId,
        fileName: validation.file.name,
        storagePath,
        fileSize: validation.file.size,
        mimeType: validation.mimeType,
        documentRole: item.documentRole,
      })

      if (shouldEnqueueJobs) {
        let jobId: string | undefined
        try {
          jobId =
            (await enqueueDocumentProcessingJob({
              policyId: input.policyId,
              docId,
              storagePath,
            })) ?? undefined
        } catch (enqueueError) {
          if (process.env.NODE_ENV === 'development') {
            console.warn(
              '[document-upload] Job enqueue failed — use Storage trigger in prod or POST /api/jobs with Admin creds',
              enqueueError
            )
          }
        }

        const lastUploaded = uploaded[uploaded.length - 1]
        if (lastUploaded) {
          lastUploaded.jobId = jobId
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[document-upload] Upload failed', error)
      }

      return {
        ok: false,
        localId: item.localId,
        fileName: item.file.name,
        errorKey: resolveUploadErrorKey(error),
      }
    }
  }

  return { ok: true, uploaded }
}
