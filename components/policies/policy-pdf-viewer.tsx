'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

type PolicyPdfViewerProps = {
  storagePath: string
  fileName: string
  className?: string
}

export function PolicyPdfViewer({
  storagePath,
  fileName,
  className,
}: PolicyPdfViewerProps) {
  const t = useTranslations('policies.review')
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

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
