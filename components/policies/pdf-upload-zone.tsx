'use client'

import { Camera, FileText, Upload, X } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import {
  MAX_UPLOAD_BYTES,
  POLICY_CAMERA_ACCEPT,
  POLICY_UPLOAD_ACCEPT,
} from '@/lib/schemas/upload'

type PdfUploadZoneProps = {
  disabled?: boolean
  selectedFile: File | null
  onFileSelect: (file: File | null) => void
  errorMessage?: string | null
}

export function PdfUploadZone({
  disabled = false,
  selectedFile,
  onFileSelect,
  errorMessage,
}: PdfUploadZoneProps) {
  const t = useTranslations('policies.upload')
  const inputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0] ?? null
      onFileSelect(file)
    },
    [onFileSelect]
  )

  const maxSizeMb = Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-label={t('dropzoneAria')}
        onKeyDown={(event) => {
          if (disabled) return
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragEnter={(event) => {
          event.preventDefault()
          if (!disabled) setIsDragging(true)
        }}
        onDragOver={(event) => {
          event.preventDefault()
          if (!disabled) setIsDragging(true)
        }}
        onDragLeave={(event) => {
          event.preventDefault()
          setIsDragging(false)
        }}
        onDrop={(event) => {
          event.preventDefault()
          setIsDragging(false)
          if (disabled) return
          handleFiles(event.dataTransfer.files)
        }}
        onClick={() => {
          if (!disabled) inputRef.current?.click()
        }}
        className={cn(
          'glass-panel flex min-h-[220px] cursor-pointer flex-col items-center justify-center border-2 border-dashed p-8 text-center motion-safe:transition-[border-color,transform,box-shadow] motion-safe:duration-200 motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)]',
          isDragging
            ? 'border-primary/50 shadow-[var(--shadow-float)] motion-safe:-translate-y-px'
            : 'border-border/80 hover:border-primary/30 hover:shadow-[var(--shadow-soft)]',
          disabled && 'pointer-events-none opacity-60',
          selectedFile && 'min-h-[160px]'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={POLICY_UPLOAD_ACCEPT}
          className="sr-only"
          disabled={disabled}
          onChange={(event) => handleFiles(event.target.files)}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept={POLICY_CAMERA_ACCEPT}
          capture="environment"
          className="sr-only"
          disabled={disabled}
          onChange={(event) => {
            handleFiles(event.target.files)
            if (cameraInputRef.current) {
              cameraInputRef.current.value = ''
            }
          }}
        />

        {selectedFile ? (
          <div className="flex w-full max-w-md flex-col items-center gap-3">
            <div className="icon-circle size-14 stat-icon-primary border-0">
              <FileText className="size-6" strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {selectedFile.name}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            {!disabled ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="rounded-[var(--radius-pill)]"
                onClick={(event) => {
                  event.stopPropagation()
                  onFileSelect(null)
                  if (inputRef.current) inputRef.current.value = ''
                  if (cameraInputRef.current) cameraInputRef.current.value = ''
                }}
              >
                <X className="size-3.5" strokeWidth={1.5} />
                {t('removeFile')}
              </Button>
            ) : null}
          </div>
        ) : (
          <>
            <div className="icon-circle mb-4 size-14 stat-icon-primary border-0">
              <Upload className="size-6" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-semibold">{t('dropzoneTitle')}</p>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {t('dropzoneHint', { maxSize: maxSizeMb })}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="rounded-[var(--radius-pill)]"
                tabIndex={-1}
              >
                {t('browseFiles')}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="rounded-[var(--radius-pill)] md:hidden"
                tabIndex={-1}
                onClick={(event) => {
                  event.stopPropagation()
                  if (!disabled) cameraInputRef.current?.click()
                }}
              >
                <Camera className="size-3.5" strokeWidth={1.5} />
                {t('takePhoto')}
              </Button>
            </div>
          </>
        )}
      </div>

      {errorMessage ? (
        <p className="text-sm text-[var(--primitive-danger)]" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  )
}
