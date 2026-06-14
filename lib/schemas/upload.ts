import { z } from 'zod'

export const PDF_MIME_TYPE = 'application/pdf' as const
export const JPEG_MIME_TYPE = 'image/jpeg' as const
export const PNG_MIME_TYPE = 'image/png' as const
export const WEBP_MIME_TYPE = 'image/webp' as const

export const POLICY_UPLOAD_MIME_TYPES = [
  PDF_MIME_TYPE,
  JPEG_MIME_TYPE,
  PNG_MIME_TYPE,
  WEBP_MIME_TYPE,
] as const

export type PolicyUploadMimeType = (typeof POLICY_UPLOAD_MIME_TYPES)[number]

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024

/** Max files per multi-document upload batch */
export const MAX_UPLOAD_FILES = 10

/** Max size accepted before client-side compression is attempted */
export const MAX_PRE_COMPRESS_BYTES = 20 * 1024 * 1024

const PDF_MAGIC = '%PDF'

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'] as const

function resolveUploadMimeType(file: File): PolicyUploadMimeType | null {
  if (file.type === PDF_MIME_TYPE || file.name.toLowerCase().endsWith('.pdf')) {
    return PDF_MIME_TYPE
  }

  if (file.type === JPEG_MIME_TYPE || /\.jpe?g$/i.test(file.name)) {
    return JPEG_MIME_TYPE
  }

  if (file.type === PNG_MIME_TYPE || file.name.toLowerCase().endsWith('.png')) {
    return PNG_MIME_TYPE
  }

  if (
    file.type === WEBP_MIME_TYPE ||
    file.name.toLowerCase().endsWith('.webp')
  ) {
    return WEBP_MIME_TYPE
  }

  return null
}

export const PolicyUploadFileSchema = z
  .instanceof(File)
  .refine((file) => file.size > 0, { message: 'errors.emptyFile' })
  .refine((file) => file.size <= MAX_UPLOAD_BYTES, {
    message: 'errors.tooLarge',
  })
  .refine((file) => resolveUploadMimeType(file) !== null, {
    message: 'errors.invalidType',
  })

export const PolicyUploadSourceFileSchema = z
  .instanceof(File)
  .refine((file) => file.size > 0, { message: 'errors.emptyFile' })
  .refine((file) => file.size <= MAX_PRE_COMPRESS_BYTES, {
    message: 'errors.sourceTooLarge',
  })
  .refine((file) => resolveUploadMimeType(file) !== null, {
    message: 'errors.invalidType',
  })

export type PolicyUploadFile = z.infer<typeof PolicyUploadFileSchema>

/** @deprecated Use PolicyUploadFileSchema */
export const PdfUploadFileSchema = PolicyUploadFileSchema
/** @deprecated Use PolicyUploadFile */
export type PdfUploadFile = PolicyUploadFile

export async function validatePdfMagicBytes(file: File): Promise<boolean> {
  const header = await file.slice(0, 5).text()
  return header.startsWith(PDF_MAGIC)
}

export async function validatePolicyUploadFile(
  file: File
): Promise<
  | { ok: true; file: PolicyUploadFile; mimeType: PolicyUploadMimeType }
  | { ok: false; errorKey: string }
> {
  const sourceParsed = PolicyUploadSourceFileSchema.safeParse(file)
  if (!sourceParsed.success) {
    const issue = sourceParsed.error.issues[0]
    return {
      ok: false,
      errorKey: issue?.message ?? 'errors.invalidType',
    }
  }

  const mimeType = resolveUploadMimeType(sourceParsed.data)
  if (!mimeType) {
    return { ok: false, errorKey: 'errors.invalidType' }
  }

  if (mimeType === PDF_MIME_TYPE) {
    const { isPdfEncrypted } = await import('@/lib/utils/pdf-encryption')
    if (await isPdfEncrypted(sourceParsed.data)) {
      return { ok: false, errorKey: 'errors.protectedPdf' }
    }
  }

  const { preparePolicyUploadFile } =
    await import('@/lib/utils/document-compression')
  const prepared = await preparePolicyUploadFile(sourceParsed.data, mimeType)
  if (!prepared.ok) {
    return { ok: false, errorKey: prepared.errorKey }
  }

  const parsed = PolicyUploadFileSchema.safeParse(prepared.file)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      errorKey: issue?.message ?? 'errors.tooLarge',
    }
  }

  if (prepared.mimeType === PDF_MIME_TYPE) {
    const hasPdfHeader = await validatePdfMagicBytes(parsed.data)
    if (!hasPdfHeader) {
      return { ok: false, errorKey: 'errors.invalidPdf' }
    }
  }

  return { ok: true, file: parsed.data, mimeType: prepared.mimeType }
}

/** @deprecated Use validatePolicyUploadFile */
export async function validatePdfUploadFile(
  file: File
): Promise<
  { ok: true; file: PdfUploadFile } | { ok: false; errorKey: string }
> {
  const result = await validatePolicyUploadFile(file)
  if (!result.ok) {
    return result
  }

  if (result.mimeType !== PDF_MIME_TYPE) {
    return { ok: false, errorKey: 'errors.invalidType' }
  }

  return { ok: true, file: result.file }
}

export const PolicyDocumentUploadInputSchema = z.object({
  ownerUid: z.string().min(1),
  policyId: z.string().min(1),
  fileName: z.string().min(1),
  fileSize: z.number().int().positive().max(MAX_UPLOAD_BYTES),
  mimeType: z.enum(POLICY_UPLOAD_MIME_TYPES),
})

export type PolicyDocumentUploadInput = z.infer<
  typeof PolicyDocumentUploadInputSchema
>

export function buildPolicyDocumentStoragePath(
  ownerUid: string,
  policyId: string,
  docId: string,
  fileName: string
): string {
  const safeName =
    fileName.replace(/[^\w.\-() ]+/g, '_').trim() || 'document.pdf'
  return `users/${ownerUid}/policies/${policyId}/docs/${docId}/${safeName}`
}

export const POLICY_UPLOAD_ACCEPT =
  'application/pdf,.pdf,image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp'

export const POLICY_CAMERA_ACCEPT = 'image/jpeg,image/png,image/webp'

export function isImageUploadMimeType(
  mimeType: PolicyUploadMimeType
): mimeType is
  | typeof JPEG_MIME_TYPE
  | typeof PNG_MIME_TYPE
  | typeof WEBP_MIME_TYPE {
  return mimeType !== PDF_MIME_TYPE
}

export { IMAGE_EXTENSIONS }

export type MultiFileValidationItem =
  | { ok: true; file: PolicyUploadFile; mimeType: PolicyUploadMimeType }
  | { ok: false; fileName: string; errorKey: string }

export type MultiFileValidationResult =
  | {
      ok: true
      items: Array<{ file: PolicyUploadFile; mimeType: PolicyUploadMimeType }>
    }
  | { ok: false; items: MultiFileValidationItem[] }

export async function validatePolicyUploadFiles(
  files: File[]
): Promise<MultiFileValidationResult> {
  if (files.length === 0) {
    return {
      ok: false,
      items: [{ ok: false, fileName: '', errorKey: 'errors.emptyFile' }],
    }
  }

  if (files.length > MAX_UPLOAD_FILES) {
    return {
      ok: false,
      items: [
        {
          ok: false,
          fileName: files[0]?.name ?? '',
          errorKey: 'errors.tooManyFiles',
        },
      ],
    }
  }

  const items: MultiFileValidationItem[] = []
  const valid: Array<{
    file: PolicyUploadFile
    mimeType: PolicyUploadMimeType
  }> = []

  for (const file of files) {
    const result = await validatePolicyUploadFile(file)
    if (result.ok) {
      valid.push({ file: result.file, mimeType: result.mimeType })
      items.push({ ok: true, file: result.file, mimeType: result.mimeType })
    } else {
      items.push({ ok: false, fileName: file.name, errorKey: result.errorKey })
    }
  }

  const failed = items.filter((item) => !item.ok)
  if (failed.length > 0) {
    return { ok: false, items }
  }

  return { ok: true, items: valid }
}
