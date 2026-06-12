'use client'

import { useEffect, useRef, useSyncExternalStore } from 'react'
import { Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

type DeletePolicyDialogProps = {
  open: boolean
  insurerName: string
  policyNumber: string
  deleting?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function DeletePolicyDialog({
  open,
  insurerName,
  policyNumber,
  deleting = false,
  onConfirm,
  onCancel,
}: DeletePolicyDialogProps) {
  const t = useTranslations('policies.delete')
  const ta = useTranslations('common.actions')
  const dialogRef = useRef<HTMLDialogElement>(null)
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || !mounted) {
      return
    }

    if (open && !dialog.open) {
      dialog.showModal()
      return
    }

    if (!open && dialog.open) {
      dialog.close()
    }
  }, [mounted, open])

  if (!mounted) {
    return null
  }

  return (
    <dialog
      ref={dialogRef}
      className={cn(
        'fixed inset-0 z-50 m-auto w-[min(100%-2rem,28rem)] rounded-[var(--radius-inner)] border border-border bg-white/95 p-0 shadow-[var(--shadow-float)] backdrop-blur-md',
        'open:animate-fade-up'
      )}
      onCancel={(event) => {
        event.preventDefault()
        onCancel()
      }}
      onClose={onCancel}
    >
      <div className="space-y-5 p-6">
        <div className="flex items-start gap-3">
          <span className="icon-circle size-11 shrink-0 border-0 bg-[#F55252]/12 text-[#C53030]">
            <Trash2 className="size-5" strokeWidth={1.5} />
          </span>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight">
              {t('title')}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t('description')}
            </p>
          </div>
        </div>

        <div className="glass-panel space-y-1 p-4 text-sm">
          <p className="font-semibold">{insurerName}</p>
          <p className="font-mono text-muted-foreground">{policyNumber}</p>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            className="rounded-[var(--radius-pill)]"
            onClick={onCancel}
            disabled={deleting}
          >
            {ta('cancel')}
          </Button>
          <Button
            type="button"
            variant="ink"
            className="rounded-[var(--radius-pill)] bg-[var(--primitive-danger)] hover:bg-[#C53030]"
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting ? ta('deleting') : t('confirm')}
          </Button>
        </div>
      </div>
    </dialog>
  )
}
