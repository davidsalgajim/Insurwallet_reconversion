'use client'

import { useState } from 'react'
import {
  ArrowLeft,
  CalendarRange,
  Pencil,
  Shield,
  Trash2,
  UserRound,
  Wallet,
} from 'lucide-react'
import { useParams } from 'next/navigation'

import { useAuth } from '@/components/auth/auth-provider'
import { DeletePolicyDialog } from '@/components/policies/delete-policy-dialog'
import {
  PAYMENT_FREQUENCY_OPTIONS,
  POLICY_TYPE_OPTIONS,
} from '@/components/policies/policy-basic-fields'
import {
  formatPolicyCurrency,
  formatPolicyDate,
} from '@/components/policies/policy-form-styles'
import { PolicyStatusBadge } from '@/components/policies/policy-status-badge'
import { AppTopbar } from '@/components/layout/app-topbar'
import { Button } from '@/components/ui/button'
import { usePolicy } from '@/hooks/usePolicy'
import { Link, useRouter } from '@/i18n/navigation'
import { cn } from '@/lib/utils/cn'

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-32 animate-pulse rounded-[var(--radius-inner)] bg-white/50" />
      <div className="h-48 animate-pulse rounded-[var(--radius-inner)] bg-white/50" />
    </div>
  )
}

function DetailField({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className={cn('text-sm font-medium', mono && 'font-mono')}>
        {value}
      </dd>
    </div>
  )
}

function DetailTextBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-2 border-t border-border/60 pt-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </h3>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
        {value}
      </p>
    </div>
  )
}

export function PolicyDetailView() {
  const params = useParams<{ id: string }>()
  const policyId = params?.id
  const router = useRouter()
  const { user } = useAuth()
  const { policy, loading, error, isOwner } = usePolicy(policyId)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const policyTypeLabel =
    POLICY_TYPE_OPTIONS.find((option) => option.value === policy?.policyType)
      ?.label ?? policy?.policyType

  const paymentFrequencyLabel =
    PAYMENT_FREQUENCY_OPTIONS.find(
      (option) => option.value === policy?.paymentFrequency
    )?.label ?? policy?.paymentFrequency

  async function handleDelete() {
    if (!policy || !user) {
      return
    }

    setDeleting(true)
    setDeleteError(null)

    try {
      const [{ db }, { deletePolicy }] = await Promise.all([
        import('@/lib/firebase/client'),
        import('@/lib/firebase/policies'),
      ])

      await deletePolicy(db, policy.id, user.uid)
      setDeleteOpen(false)
      router.push('/policies')
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : 'No se pudo eliminar la póliza'
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="animate-fade-up mx-auto max-w-3xl">
      <div className="mb-4">
        <Link
          href="/policies"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" strokeWidth={1.5} />
          Volver a pólizas
        </Link>
      </div>

      <AppTopbar
        title={policy?.insurerName ?? 'Detalle de póliza'}
        subtitle={
          policy
            ? `Póliza ${policy.policyNumber}`
            : 'Consulta la información de tu seguro'
        }
      />

      {loading ? <DetailSkeleton /> : null}

      {!loading && error ? (
        <div className="glass-panel px-6 py-12 text-center">
          <p className="text-sm font-medium text-[var(--primitive-danger)]">
            {error}
          </p>
          <Button
            asChild
            variant="secondary"
            className="mt-4 rounded-[var(--radius-pill)]"
          >
            <Link href="/policies">Ir a mis pólizas</Link>
          </Button>
        </div>
      ) : null}

      {!loading && policy ? (
        <>
          <div className="glass-panel mb-4 space-y-5 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <PolicyStatusBadge status={policy.status} />
                  <span className="pill-badge bg-primary/10 text-primary">
                    {policyTypeLabel}
                  </span>
                </div>
                <p className="font-mono text-sm text-muted-foreground">
                  {policy.policyNumber}
                </p>
              </div>
              {isOwner ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    asChild
                    variant="secondary"
                    size="sm"
                    className="rounded-[var(--radius-pill)]"
                  >
                    <Link href={`/policies/${policy.id}/edit`}>
                      <Pencil className="size-4" strokeWidth={1.5} />
                      Editar
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="rounded-[var(--radius-pill)] text-[var(--primitive-danger)] hover:text-[var(--primitive-danger)]"
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 className="size-4" strokeWidth={1.5} />
                    Eliminar
                  </Button>
                </div>
              ) : null}
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailField label="Tomador" value={policy.holderName} />
              <DetailField
                label="Prima"
                value={formatPolicyCurrency(policy.premium, policy.currency)}
              />
              <DetailField
                label="Frecuencia de pago"
                value={paymentFrequencyLabel ?? '—'}
              />
              <DetailField
                label="Vigencia"
                value={`${formatPolicyDate(policy.startDate)} — ${formatPolicyDate(policy.endDate)}`}
              />
            </dl>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="glass-panel flex items-center gap-3 p-4">
                <Shield className="size-5 text-primary" strokeWidth={1.5} />
                <div>
                  <p className="text-xs text-muted-foreground">Estado</p>
                  <p className="text-sm font-semibold capitalize">
                    {policy.status === 'active'
                      ? 'Activa'
                      : policy.status === 'expiring'
                        ? 'Por vencer'
                        : 'Vencida'}
                  </p>
                </div>
              </div>
              <div className="glass-panel flex items-center gap-3 p-4">
                <CalendarRange
                  className="size-5 text-primary"
                  strokeWidth={1.5}
                />
                <div>
                  <p className="text-xs text-muted-foreground">Actualizada</p>
                  <p className="text-sm font-semibold">
                    {formatPolicyDate(policy.updatedAt)}
                  </p>
                </div>
              </div>
              <div className="glass-panel flex items-center gap-3 p-4">
                <Wallet className="size-5 text-primary" strokeWidth={1.5} />
                <div>
                  <p className="text-xs text-muted-foreground">Moneda</p>
                  <p className="font-mono text-sm font-semibold">
                    {policy.currency}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel space-y-4 p-6">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <UserRound
                className="size-4 text-muted-foreground"
                strokeWidth={1.5}
              />
              <h2 className="font-semibold">Detalles del contrato</h2>
            </div>

            {policy.coverages ? (
              <DetailTextBlock label="Coberturas" value={policy.coverages} />
            ) : null}
            {policy.exclusions ? (
              <DetailTextBlock label="Exclusiones" value={policy.exclusions} />
            ) : null}
            {policy.waitingPeriods ? (
              <DetailTextBlock
                label="Periodos de carencia"
                value={policy.waitingPeriods}
              />
            ) : null}
            {policy.notes ? (
              <DetailTextBlock label="Notas" value={policy.notes} />
            ) : null}
            {!policy.coverages &&
            !policy.exclusions &&
            !policy.waitingPeriods &&
            !policy.notes ? (
              <p className="text-sm text-muted-foreground">
                Aún no hay coberturas ni notas registradas para esta póliza.
              </p>
            ) : null}
          </div>

          {deleteError ? (
            <p className="mt-4 text-sm text-[var(--primitive-danger)]">
              {deleteError}
            </p>
          ) : null}

          <DeletePolicyDialog
            open={deleteOpen}
            insurerName={policy.insurerName}
            policyNumber={policy.policyNumber}
            deleting={deleting}
            onConfirm={handleDelete}
            onCancel={() => {
              if (!deleting) {
                setDeleteOpen(false)
              }
            }}
          />
        </>
      ) : null}
    </div>
  )
}
