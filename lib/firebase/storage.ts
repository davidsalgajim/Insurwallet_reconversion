import {
  ref,
  uploadBytesResumable,
  type FirebaseStorage,
  type UploadTask,
} from 'firebase/storage'

import {
  PolicyDocumentUploadInputSchema,
  buildPolicyDocumentStoragePath,
  type PolicyDocumentUploadInput,
} from '@/lib/schemas/upload'

export type UploadProgress = {
  bytesTransferred: number
  totalBytes: number
  progress: number
}

export type UploadPolicyPdfOptions = {
  storage: FirebaseStorage
  input: PolicyDocumentUploadInput
  file: File
  docId: string
  onProgress?: (progress: UploadProgress) => void
}

export type UploadPolicyPdfResult = {
  storagePath: string
  docId: string
}

export function createPolicyPdfUploadTask(
  storage: FirebaseStorage,
  input: PolicyDocumentUploadInput,
  file: File,
  docId: string
): { task: UploadTask; storagePath: string } {
  const parsed = PolicyDocumentUploadInputSchema.parse(input)
  const storagePath = buildPolicyDocumentStoragePath(
    parsed.ownerUid,
    parsed.policyId,
    docId,
    parsed.fileName
  )
  const fileRef = ref(storage, storagePath)
  const task = uploadBytesResumable(fileRef, file, {
    contentType: parsed.mimeType,
    customMetadata: {
      ownerUid: parsed.ownerUid,
      policyId: parsed.policyId,
      docId,
    },
  })

  return { task, storagePath }
}

export function uploadPolicyPdf(
  options: UploadPolicyPdfOptions
): Promise<UploadPolicyPdfResult> {
  const { task, storagePath } = createPolicyPdfUploadTask(
    options.storage,
    options.input,
    options.file,
    options.docId
  )

  return new Promise((resolve, reject) => {
    task.on(
      'state_changed',
      (snapshot) => {
        const totalBytes = snapshot.totalBytes
        const bytesTransferred = snapshot.bytesTransferred
        options.onProgress?.({
          bytesTransferred,
          totalBytes,
          progress: totalBytes > 0 ? bytesTransferred / totalBytes : 0,
        })
      },
      (error) => reject(error),
      () => resolve({ storagePath, docId: options.docId })
    )
  })
}
