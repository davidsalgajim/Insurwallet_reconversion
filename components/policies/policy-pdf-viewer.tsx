'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

import type { FieldBbox } from '@/lib/schemas/extraction'
import { cn } from '@/lib/utils/cn'

type PolicyPdfViewerProps = {
  storagePath: string
  fileName: string
  className?: string
  highlights?: Record<string, FieldBbox>
  activeHighlightId?: string | null
  hoveredHighlightId?: string | null
}

type RenderedPage = {
  pageNumber: number
  width: number
  height: number
  canvas: HTMLCanvasElement
}

async function loadPdfBytes(storagePath: string): Promise<Uint8Array> {
  const [{ storage }, { ref, getBytes }] = await Promise.all([
    import('@/lib/firebase/client'),
    import('firebase/storage'),
  ])

  const bytes = await getBytes(ref(storage, storagePath))
  return new Uint8Array(bytes)
}

export function PolicyPdfViewer({
  storagePath,
  fileName,
  className,
  highlights,
  activeHighlightId,
  hoveredHighlightId,
}: PolicyPdfViewerProps) {
  const t = useTranslations('policies.review')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [pages, setPages] = useState<RenderedPage[]>([])

  const hasHighlights = Boolean(
    highlights && Object.keys(highlights).length > 0
  )

  useEffect(() => {
    let cancelled = false
    const renderedCanvases: HTMLCanvasElement[] = []

    void (async () => {
      setLoading(true)
      setError(null)
      setPages([])

      try {
        const pdfBytes = await loadPdfBytes(storagePath)
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs'

        const pdf = await pdfjs.getDocument({ data: pdfBytes }).promise
        const nextPages: RenderedPage[] = []

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          const page = await pdf.getPage(pageNumber)
          const viewport = page.getViewport({ scale: 1.25 })
          const canvas = document.createElement('canvas')
          const context = canvas.getContext('2d')

          if (!context) {
            continue
          }

          canvas.width = viewport.width
          canvas.height = viewport.height
          await page.render({ canvasContext: context, viewport, canvas })
            .promise

          renderedCanvases.push(canvas)
          nextPages.push({
            pageNumber,
            width: viewport.width,
            height: viewport.height,
            canvas,
          })
        }

        if (!cancelled) {
          setPages(nextPages)
        }
      } catch {
        if (!cancelled) {
          setError(t('pdfLoadError'))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
      for (const canvas of renderedCanvases) {
        canvas.width = 0
        canvas.height = 0
      }
    }
  }, [storagePath, t])

  const visibleHighlightIds = new Set(
    [activeHighlightId, hoveredHighlightId].filter(
      (id): id is string => typeof id === 'string' && Boolean(id)
    )
  )

  if (loading) {
    return (
      <div className={className} aria-busy="true" aria-label={t('pdfLoading')}>
        <div className="flex h-full min-h-[360px] items-center justify-center rounded-[var(--radius-inner)] border border-border/60 bg-white/40 p-6 text-sm text-muted-foreground">
          {t('pdfLoading')}
        </div>
      </div>
    )
  }

  if (error || pages.length === 0) {
    return (
      <div className={className}>
        <div className="flex h-full min-h-[360px] items-center justify-center rounded-[var(--radius-inner)] border border-dashed border-border/70 bg-white/40 p-6 text-center text-sm text-muted-foreground">
          {error ?? t('pdfLoadError')}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(className, 'overflow-auto rounded-[var(--radius-inner)]')}
      aria-label={fileName}
    >
      <div className="space-y-4 p-1">
        {pages.map((page) => (
          <div
            key={page.pageNumber}
            className="relative mx-auto w-fit rounded-[var(--radius-inner)] border border-border/60 bg-white shadow-sm"
            style={{ width: page.width, minHeight: page.height }}
          >
            <div
              ref={(node) => {
                if (node && node.childElementCount === 0) {
                  node.appendChild(page.canvas)
                }
              }}
              className="block"
            />
            {hasHighlights
              ? Object.entries(highlights ?? {}).map(([fieldId, bbox]) => {
                  if (
                    bbox.page !== page.pageNumber ||
                    !visibleHighlightIds.has(fieldId)
                  ) {
                    return null
                  }

                  return (
                    <div
                      key={`${page.pageNumber}-${fieldId}`}
                      aria-hidden
                      className={cn(
                        'pointer-events-none absolute rounded-[2px] ring-2 transition-opacity',
                        fieldId === activeHighlightId
                          ? 'bg-primary/20 ring-primary'
                          : 'bg-accent/15 ring-accent/80'
                      )}
                      style={{
                        left: `${bbox.left * 100}%`,
                        top: `${bbox.top * 100}%`,
                        width: `${bbox.width * 100}%`,
                        height: `${bbox.height * 100}%`,
                      }}
                    />
                  )
                })
              : null}
          </div>
        ))}
      </div>
    </div>
  )
}
