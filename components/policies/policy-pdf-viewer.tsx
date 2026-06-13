'use client'

import { useEffect, useRef, useState } from 'react'
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

export function PolicyPdfViewer({
  storagePath,
  fileName,
  className,
  highlights,
  activeHighlightId,
  hoveredHighlightId,
}: PolicyPdfViewerProps) {
  const t = useTranslations('policies.review')
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 })
  const [activePage, setActivePage] = useState(1)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const hasHighlights = Boolean(
    highlights && Object.keys(highlights).length > 0
  )

  useEffect(() => {
    let cancelled = false

    void (async () => {
      setLoading(true)
      setError(null)

      try {
        const [{ storage }, { ref, getDownloadURL }] = await Promise.all([
          import('@/lib/firebase/client'),
          import('firebase/storage'),
        ])

        const downloadUrl = await getDownloadURL(ref(storage, storagePath))

        if (!cancelled) {
          setUrl(downloadUrl)
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
    }
  }, [storagePath, t])

  useEffect(() => {
    if (!url || !hasHighlights || !canvasRef.current) {
      return
    }

    let cancelled = false

    void (async () => {
      try {
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/legacy/build/pdf.worker.mjs',
          import.meta.url
        ).toString()

        const loadingTask = pdfjs.getDocument(url)
        const pdf = await loadingTask.promise
        const pageNumber =
          activeHighlightId && highlights?.[activeHighlightId]
            ? highlights[activeHighlightId].page
            : hoveredHighlightId && highlights?.[hoveredHighlightId]
              ? highlights[hoveredHighlightId].page
              : 1

        const page = await pdf.getPage(pageNumber)
        const viewport = page.getViewport({ scale: 1.25 })
        const canvas = canvasRef.current
        if (!canvas || cancelled) {
          return
        }

        const context = canvas.getContext('2d')
        if (!context) {
          return
        }

        canvas.width = viewport.width
        canvas.height = viewport.height
        setPageSize({ width: viewport.width, height: viewport.height })
        setActivePage(pageNumber)

        await page.render({ canvasContext: context, viewport, canvas }).promise
      } catch {
        if (!cancelled) {
          setError(t('pdfLoadError'))
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [url, hasHighlights, highlights, activeHighlightId, hoveredHighlightId, t])

  if (loading) {
    return (
      <div className={className} aria-busy="true" aria-label={t('pdfLoading')}>
        <div className="flex h-full min-h-[360px] items-center justify-center rounded-[var(--radius-inner)] border border-border/60 bg-white/40 p-6 text-sm text-muted-foreground">
          {t('pdfLoading')}
        </div>
      </div>
    )
  }

  if (error || !url) {
    return (
      <div className={className}>
        <div className="flex h-full min-h-[360px] items-center justify-center rounded-[var(--radius-inner)] border border-dashed border-border/70 bg-white/40 p-6 text-center text-sm text-muted-foreground">
          {error ?? t('pdfLoadError')}
        </div>
      </div>
    )
  }

  if (!hasHighlights) {
    return (
      <div className={className}>
        <iframe
          title={fileName}
          src={url}
          className="h-full min-h-[360px] w-full rounded-[var(--radius-inner)] border border-border/60 bg-white"
        />
      </div>
    )
  }

  const visibleIds = new Set(
    [activeHighlightId, hoveredHighlightId].filter(
      (id): id is string => typeof id === 'string' && Boolean(id)
    )
  )

  return (
    <div className={cn(className, 'relative overflow-auto')}>
      <div
        className="relative mx-auto w-fit rounded-[var(--radius-inner)] border border-border/60 bg-white"
        style={{
          width: pageSize.width || undefined,
          height: pageSize.height || undefined,
          minHeight: 360,
        }}
      >
        <canvas
          ref={canvasRef}
          className="block max-w-full"
          aria-label={fileName}
        />
        {pageSize.width > 0
          ? Object.entries(highlights ?? {}).map(([fieldId, bbox]) => {
              if (bbox.page !== activePage) {
                return null
              }
              const isActive = visibleIds.has(fieldId)
              if (!isActive) {
                return null
              }

              return (
                <div
                  key={fieldId}
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
      <p className="mt-2 text-center text-xs text-muted-foreground">
        {t('bboxPageHint', { page: activePage })}
      </p>
    </div>
  )
}
