import { z } from 'zod'

export const PDF_MIME_TYPE = 'application/pdf' as const
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024

const PDF_MAGIC = '%PDF'

export const PdfUploadFileSchema = z
  .instanceof(File)
  .refine((file) => file.size > 0, { message: 'errors.emptyFile' })
  .refine((file) => file.size <= MAX_UPLOAD_BYTES, {
    message: 'errors.tooLarge',
  })
  .refine(
    (file) =>
      file.type === PDF_MIME_TYPE || file.name.toLowerCase().endsWith('.pdf'),
    { message: 'errors.invalidType' }
  )

export type PdfUploadFile = z.infer<typeof PdfUploadFileSchema>

export async function validatePdfMagicBytes(file: File): Promise<boolean> {
  const header = await file.slice(0, 5).text()
  return header.startsWith(PDF_MAGIC)
}

export async function validatePdfUploadFile(
  file: File
): Promise<
  { ok: true; file: PdfUploadFile } | { ok: false; errorKey: string }
> {
  const parsed = PdfUploadFileSchema.safeParse(file)

  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      errorKey: issue?.message ?? 'errors.invalidType',
    }
  }

  const hasPdfHeader = await validatePdfMagicBytes(file)

  if (!hasPdfHeader) {
    return { ok: false, errorKey: 'errors.invalidPdf' }
  }

  return { ok: true, file: parsed.data }
}

export const PolicyDocumentUploadInputSchema = z.object({
  ownerUid: z.string().min(1),
  policyId: z.string().min(1),
  fileName: z.string().min(1),
  fileSize: z.number().int().positive().max(MAX_UPLOAD_BYTES),
  mimeType: z.literal(PDF_MIME_TYPE),
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
