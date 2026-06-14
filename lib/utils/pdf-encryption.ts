import { PDF_MIME_TYPE } from '@/lib/schemas/upload'

function isPdfFile(file: File): boolean {
  return file.type === PDF_MIME_TYPE || file.name.toLowerCase().endsWith('.pdf')
}

/**
 * Returns true when the PDF requires a password / encryption dictionary.
 * Non-PDF files always return false.
 */
export async function isPdfEncrypted(file: File): Promise<boolean> {
  if (!isPdfFile(file)) {
    return false
  }

  const bytes = await file.arrayBuffer()

  try {
    const { PDFDocument } = await import('pdf-lib')
    await PDFDocument.load(bytes, { ignoreEncryption: false })
    return false
  } catch (error) {
    if (!(error instanceof Error && /encrypt/i.test(error.message))) {
      return false
    }

    // Owner-password / permissions-only PDFs (common on policy documents) fail
    // without ignoreEncryption but open without a user password.
    try {
      const { PDFDocument } = await import('pdf-lib')
      await PDFDocument.load(bytes, { ignoreEncryption: true })
      return false
    } catch {
      return true
    }
  }
}
