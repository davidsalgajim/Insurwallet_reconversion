'use client'

import { Camera, FileText, Upload, X } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'

import { ProtectedPdfWarning } from '@/components/policies/protected-pdf-warning'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import type { DocumentRole } from '@/lib/schemas/document'
import {
  MAX_UPLOAD_BYTES,
  MAX_UPLOAD_FILES,
  POLICY_CAMERA_ACCEPT,
  POLICY_UPLOAD_ACCEPT,
  validatePolicyUploadFile,
} from '@/lib/schemas/upload'
import { resolveUploadErrorKey } from '@/lib/policies/upload-errors'

export type SelectedUploadFile = {
  id: string
  file: File
  documentRole?: DocumentRole
}

type PdfUploadZoneProps = {
  disabled?: boolean
  selectedFiles: SelectedUploadFile[]
  onFilesChange: (files: SelectedUploadFile[]) => void
  errorMessage?: string | null
  showRoleSelector?: boolean
}

const DOCUMENT_ROLES: DocumentRole[] = [
  'cover',
  'conditions',
  'endorsement',
  'renewal',
  'other',
]

export function PdfUploadZone({
  disabled = false,
  selectedFiles,
  onFilesChange,
  errorMessage,
  showRoleSelector = false,
}: PdfUploadZoneProps) {
  const t = useTranslations('policies.upload')
  const inputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const appendFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return

      const incoming: SelectedUploadFile[] = []
      const rejectionMessages: string[] = []
      let remainingSlots = MAX_UPLOAD_FILES - selectedFiles.length

      for (const file of Array.from(files)) {
        if (remainingSlots <= 0) {
          rejectionMessages.push(t('errors.tooManyFiles'))
          break
        }

        try {
          const result = await validatePolicyUploadFile(file)
          if (!result.ok) {
            rejectionMessages.push(`${file.name}: ${t(result.errorKey)}`)
            continue
          }

          incoming.push({
            id: crypto.randomUUID(),
            file: result.file,
          })
          remainingSlots -= 1
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('[pdf-upload-zone] validation failed', error)
          }
          rejectionMessages.push(
            `${file.name}: ${t(resolveUploadErrorKey(error))}`
          )
        }
      }

      if (incoming.length > 0) {
        onFilesChange(
          [...selectedFiles, ...incoming].slice(0, MAX_UPLOAD_FILES)
        )
      }

      setLocalError(rejectionMessages[0] ?? null)
    },
    [onFilesChange, selectedFiles, t]
  )

  const removeFile = useCallback(
    (id: string) => {
      setLocalError(null)
      onFilesChange(selectedFiles.filter((item) => item.id !== id))
    },
    [onFilesChange, selectedFiles]
  )

  const updateRole = useCallback(
    (id: string, documentRole: DocumentRole) => {
      onFilesChange(
        selectedFiles.map((item) =>
          item.id === id ? { ...item, documentRole } : item
        )
      )
    },
    [onFilesChange, selectedFiles]
  )

  const maxSizeMb = Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))
  const atLimit = selectedFiles.length >= MAX_UPLOAD_FILES

  return (
    <div className="space-y-3">
      <ProtectedPdfWarning />

      <div
        tabIndex={disabled || atLimit ? -1 : 0}
        aria-disabled={disabled || atLimit}
        aria-label={t('dropzoneAria')}
        onKeyDown={(event) => {
          if (disabled || atLimit) return
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragEnter={(event) => {
          event.preventDefault()
          if (!disabled && !atLimit) setIsDragging(true)
        }}
        onDragOver={(event) => {
          event.preventDefault()
          if (!disabled && !atLimit) setIsDragging(true)
        }}
        onDragLeave={(event) => {
          event.preventDefault()
          setIsDragging(false)
        }}
        onDrop={(event) => {
          event.preventDefault()
          setIsDragging(false)
          if (disabled || atLimit) return
          appendFiles(event.dataTransfer.files)
        }}
        onClick={() => {
          if (!disabled && !atLimit) inputRef.current?.click()
        }}
        className={cn(
          'glass-panel flex min-h-[180px] cursor-pointer flex-col items-center justify-center border-2 border-dashed p-6 text-center motion-safe:transition-[border-color,transform,box-shadow] motion-safe:duration-200 motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)]',
          isDragging
            ? 'border-primary/50 shadow-[var(--shadow-float)] motion-safe:-translate-y-px'
            : 'border-border/80 hover:border-primary/30 hover:shadow-[var(--shadow-soft)]',
          (disabled || atLimit) && 'pointer-events-none opacity-60'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={POLICY_UPLOAD_ACCEPT}
          multiple
          className="sr-only"
          disabled={disabled || atLimit}
          onChange={(event) => {
            appendFiles(event.target.files)
            if (inputRef.current) inputRef.current.value = ''
          }}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept={POLICY_CAMERA_ACCEPT}
          capture="environment"
          className="sr-only"
          disabled={disabled || atLimit}
          onChange={(event) => {
            appendFiles(event.target.files)
            if (cameraInputRef.current) cameraInputRef.current.value = ''
          }}
        />

        <div className="icon-circle mb-3 size-12 stat-icon-primary border-0">
          <Upload className="size-5" strokeWidth={1.5} />
        </div>
        <p className="text-sm font-semibold">{t('dropzoneTitleMulti')}</p>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {t('dropzoneHintMulti', {
            maxSize: maxSizeMb,
            maxFiles: MAX_UPLOAD_FILES,
          })}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="rounded-[var(--radius-pill)]"
            tabIndex={-1}
            onClick={(event) => {
              event.stopPropagation()
              if (!disabled && !atLimit) inputRef.current?.click()
            }}
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
              if (!disabled && !atLimit) cameraInputRef.current?.click()
            }}
          >
            <Camera className="size-3.5" strokeWidth={1.5} />
            {t('takePhoto')}
          </Button>
        </div>
      </div>

      {selectedFiles.length > 0 ? (
        <ul className="space-y-2" aria-label={t('fileListAria')}>
          {selectedFiles.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-2 rounded-[var(--radius-inner)] border border-border/70 bg-white/50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-2">
                <FileText
                  className="size-4 shrink-0 text-primary"
                  strokeWidth={1.5}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {item.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {showRoleSelector ? (
                  <select
                    aria-label={t('documentRoleLabel')}
                    className="h-8 rounded-[var(--radius-pill)] border border-border/70 bg-white/80 px-2 text-xs"
                    value={item.documentRole ?? ''}
                    disabled={disabled}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) => {
                      const value = event.target.value as DocumentRole | ''
                      updateRole(item.id, value || 'other')
                    }}
                  >
                    <option value="">{t('documentRoleAuto')}</option>
                    {DOCUMENT_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {t(`documentRoles.${role}`)}
                      </option>
                    ))}
                  </select>
                ) : null}

                {!disabled ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="rounded-[var(--radius-pill)]"
                    onClick={() => removeFile(item.id)}
                  >
                    <X className="size-3.5" strokeWidth={1.5} />
                    {t('removeFile')}
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {errorMessage || localError ? (
        <p className="text-sm text-[var(--primitive-danger)]" role="alert">
          {errorMessage ?? localError}
        </p>
      ) : null}
    </div>
  )
}
