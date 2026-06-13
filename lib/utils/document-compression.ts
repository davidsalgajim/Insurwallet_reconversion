import {
  JPEG_MIME_TYPE,
  MAX_UPLOAD_BYTES,
  PDF_MIME_TYPE,
  PNG_MIME_TYPE,
  type PolicyUploadMimeType,
  WEBP_MIME_TYPE,
} from '@/lib/schemas/upload'

export type CompressionResult =
  | {
      ok: true
      file: File
      mimeType: PolicyUploadMimeType
      compressed: boolean
    }
  | { ok: false; errorKey: string }

const IMAGE_MIME_TYPES = new Set<string>([
  JPEG_MIME_TYPE,
  PNG_MIME_TYPE,
  WEBP_MIME_TYPE,
])

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality)
  })
}

async function compressImageFile(
  file: File,
  targetBytes: number
): Promise<CompressionResult> {
  if (typeof document === 'undefined') {
    return { ok: false, errorKey: 'errors.compressionFailed' }
  }

  const bitmap = await createImageBitmap(file)
  let scale = 1
  let quality = 0.85
  let lastBlob: Blob | null = null

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return { ok: false, errorKey: 'errors.compressionFailed' }
    }
    ctx.drawImage(bitmap, 0, 0, width, height)

    lastBlob = await canvasToBlob(canvas, JPEG_MIME_TYPE, quality)
    if (!lastBlob) {
      return { ok: false, errorKey: 'errors.compressionFailed' }
    }

    if (lastBlob.size <= targetBytes) {
      const baseName = file.name.replace(/\.[^.]+$/, '') || 'document'
      return {
        ok: true,
        file: new File([lastBlob], `${baseName}.jpg`, {
          type: JPEG_MIME_TYPE,
        }),
        mimeType: JPEG_MIME_TYPE,
        compressed: true,
      }
    }

    if (quality > 0.45) {
      quality -= 0.1
    } else {
      scale *= 0.85
      quality = 0.75
    }
  }

  if (lastBlob && lastBlob.size <= targetBytes * 1.05) {
    const baseName = file.name.replace(/\.[^.]+$/, '') || 'document'
    return {
      ok: true,
      file: new File([lastBlob], `${baseName}.jpg`, { type: JPEG_MIME_TYPE }),
      mimeType: JPEG_MIME_TYPE,
      compressed: true,
    }
  }

  return { ok: false, errorKey: 'errors.compressionTooLarge' }
}

async function compressPdfFile(
  file: File,
  targetBytes: number
): Promise<CompressionResult> {
  if (typeof document === 'undefined') {
    return { ok: false, errorKey: 'errors.compressionFailed' }
  }

  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/legacy/build/pdf.worker.mjs',
    import.meta.url
  ).toString()

  const buffer = await file.arrayBuffer()
  const pdf = await pdfjs.getDocument({ data: buffer }).promise
  const { PDFDocument } = await import('pdf-lib')

  let scale = 1.4
  let quality = 0.72

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const output = await PDFDocument.create()

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
      const page = await pdf.getPage(pageNum)
      const viewport = page.getViewport({ scale })
      const canvas = document.createElement('canvas')
      canvas.width = Math.floor(viewport.width)
      canvas.height = Math.floor(viewport.height)
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        return { ok: false, errorKey: 'errors.compressionFailed' }
      }

      await page.render({ canvasContext: ctx, viewport, canvas }).promise
      const blob = await canvasToBlob(canvas, JPEG_MIME_TYPE, quality)
      if (!blob) {
        return { ok: false, errorKey: 'errors.compressionFailed' }
      }

      const jpegBytes = new Uint8Array(await blob.arrayBuffer())
      const embedded = await output.embedJpg(jpegBytes)
      const pdfPage = output.addPage([embedded.width, embedded.height])
      pdfPage.drawImage(embedded, {
        x: 0,
        y: 0,
        width: embedded.width,
        height: embedded.height,
      })
    }

    const bytes = await output.save()
    if (bytes.byteLength <= targetBytes) {
      return {
        ok: true,
        file: new File([Uint8Array.from(bytes)], file.name, {
          type: PDF_MIME_TYPE,
        }),
        mimeType: PDF_MIME_TYPE,
        compressed: true,
      }
    }

    scale *= 0.85
    quality = Math.max(0.4, quality - 0.08)
  }

  return { ok: false, errorKey: 'errors.compressionTooLarge' }
}

export async function compressPolicyUploadFile(
  file: File,
  mimeType: PolicyUploadMimeType,
  targetBytes: number = MAX_UPLOAD_BYTES
): Promise<CompressionResult> {
  if (file.size <= targetBytes) {
    return { ok: true, file, mimeType, compressed: false }
  }

  if (IMAGE_MIME_TYPES.has(mimeType)) {
    return compressImageFile(file, targetBytes)
  }

  if (mimeType === PDF_MIME_TYPE) {
    return compressPdfFile(file, targetBytes)
  }

  return { ok: false, errorKey: 'errors.compressionFailed' }
}

export async function preparePolicyUploadFile(
  file: File,
  mimeType: PolicyUploadMimeType
): Promise<CompressionResult> {
  return compressPolicyUploadFile(file, mimeType, MAX_UPLOAD_BYTES)
}
