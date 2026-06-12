'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from '@/i18n/navigation'

import { AppTopbar } from '@/components/layout/app-topbar'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/auth/auth-provider'
import { cn } from '@/lib/utils/cn'

const fieldClassName =
  'h-11 w-full rounded-[var(--radius-inner)] border border-border bg-white/70 px-4 text-sm shadow-[var(--shadow-soft)] outline-none backdrop-blur-sm transition-[box-shadow,border-color] duration-200 placeholder:text-muted-foreground focus:border-primary/30 focus:shadow-[var(--shadow-float)] focus:ring-2 focus:ring-primary/20'

export default function ManualPolicyPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [insurerName, setInsurerName] = useState('')
  const [policyNumber, setPolicyNumber] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!user) {
      setError('Debes iniciar sesión para guardar una póliza.')
      return
    }

    setSubmitting(true)

    try {
      const [{ db }, { createPolicy }] = await Promise.all([
        import('@/lib/firebase/client'),
        import('@/lib/firebase/policies'),
      ])

      await createPolicy(db, {
        ownerUid: user.uid,
        insurerName: insurerName.trim(),
        policyNumber: policyNumber.trim(),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      })
      router.push('/policies')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo guardar la póliza'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="animate-fade-up mx-auto max-w-2xl">
      <AppTopbar
        title="Nueva póliza"
        subtitle="Paso 2 de 4 — datos básicos del seguro"
      />

      <div className="mb-6 flex gap-2">
        {[1, 2, 3, 4].map((step) => (
          <span
            key={step}
            className={cn(
              'flex size-8 items-center justify-center rounded-full text-xs font-semibold',
              step <= 2
                ? 'bg-[var(--primitive-ink)] text-white shadow-md'
                : 'bg-white/60 text-muted-foreground ring-1 ring-border'
            )}
          >
            {step}
          </span>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="glass-panel space-y-6 p-6">
        <div className="space-y-2">
          <label htmlFor="insurerName" className="text-sm font-medium">
            Aseguradora
          </label>
          <input
            id="insurerName"
            name="insurerName"
            type="text"
            required
            autoComplete="organization"
            value={insurerName}
            onChange={(event) => setInsurerName(event.target.value)}
            placeholder="Ej. Seguros Bolívar"
            className={fieldClassName}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="policyNumber" className="text-sm font-medium">
            Número de póliza
          </label>
          <input
            id="policyNumber"
            name="policyNumber"
            type="text"
            required
            value={policyNumber}
            onChange={(event) => setPolicyNumber(event.target.value)}
            placeholder="Ej. POL-2025-001"
            className={cn(fieldClassName, 'font-mono')}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="startDate" className="text-sm font-medium">
              Inicio de vigencia
            </label>
            <input
              id="startDate"
              name="startDate"
              type="date"
              required
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className={fieldClassName}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="endDate" className="text-sm font-medium">
              Fin de vigencia
            </label>
            <input
              id="endDate"
              name="endDate"
              type="date"
              required
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className={fieldClassName}
            />
          </div>
        </div>

        {error ? (
          <p className="text-sm text-[var(--primitive-danger)]">{error}</p>
        ) : null}

        {!authLoading && !user ? (
          <p className="text-sm text-muted-foreground">
            Inicia sesión para guardar esta póliza en tu cartera.
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            className="rounded-[var(--radius-pill)]"
            onClick={() => router.push('/policies/new')}
            disabled={submitting}
          >
            Volver
          </Button>
          <Button
            type="submit"
            variant="ink"
            className="rounded-[var(--radius-pill)]"
            disabled={submitting || authLoading || !user}
          >
            {submitting ? 'Guardando…' : 'Guardar y continuar'}
          </Button>
        </div>
      </form>
    </div>
  )
}
