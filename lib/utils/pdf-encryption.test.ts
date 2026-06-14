import { afterEach, describe, expect, it, vi } from 'vitest'

const { loadMock } = vi.hoisted(() => ({
  loadMock: vi.fn(),
}))

vi.mock('pdf-lib', () => ({
  PDFDocument: {
    load: loadMock,
  },
}))

import { isPdfEncrypted } from './pdf-encryption'

function makePdfFile(name: string, content = '%PDF-1.4\n'): File {
  return new File([content], name, { type: 'application/pdf' })
}

describe('isPdfEncrypted', () => {
  afterEach(() => {
    loadMock.mockReset()
  })

  it('returns false for non-PDF files', async () => {
    const image = new File([new Uint8Array([0xff, 0xd8])], 'scan.jpg', {
      type: 'image/jpeg',
    })

    expect(await isPdfEncrypted(image)).toBe(false)
    expect(loadMock).not.toHaveBeenCalled()
  })

  it('returns false for unencrypted PDFs', async () => {
    loadMock.mockResolvedValue({})

    expect(await isPdfEncrypted(makePdfFile('open.pdf'))).toBe(false)
    expect(loadMock).toHaveBeenCalledOnce()
  })

  it('returns true when pdf-lib reports encryption', async () => {
    loadMock
      .mockRejectedValueOnce(new Error('PDF document is encrypted'))
      .mockRejectedValueOnce(new Error('Incorrect password'))

    expect(await isPdfEncrypted(makePdfFile('locked.pdf'))).toBe(true)
    expect(loadMock).toHaveBeenCalledTimes(2)
  })

  it('returns false for owner-password PDFs that load with ignoreEncryption', async () => {
    loadMock
      .mockRejectedValueOnce(
        new Error(
          'Input document to `PDFDocument.load` is encrypted. You can use `PDFDocument.load(..., { ignoreEncryption: true })` if you wish to load the document anyways.'
        )
      )
      .mockResolvedValueOnce({})

    expect(await isPdfEncrypted(makePdfFile('read-only.pdf'))).toBe(false)
    expect(loadMock).toHaveBeenCalledTimes(2)
    expect(loadMock.mock.calls[1]?.[1]).toEqual({ ignoreEncryption: true })
  })

  it('returns false for unrelated pdf-lib parse errors', async () => {
    loadMock.mockRejectedValue(new Error('Invalid PDF structure'))

    expect(await isPdfEncrypted(makePdfFile('broken.pdf'))).toBe(false)
  })
})
