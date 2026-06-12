'use client'

import type { PaymentFrequency, PolicyType } from '@/lib/schemas/policy'
import { cn } from '@/lib/utils/cn'

import { policyFieldClassName, toDateInputValue } from './policy-form-styles'

export const POLICY_TYPE_OPTIONS: { value: PolicyType; label: string }[] = [
  { value: 'life', label: 'Vida' },
  { value: 'health', label: 'Salud' },
  { value: 'auto', label: 'Auto' },
  { value: 'home', label: 'Hogar' },
  { value: 'travel', label: 'Viaje' },
  { value: 'other', label: 'Otro' },
]

export const PAYMENT_FREQUENCY_OPTIONS: {
  value: PaymentFrequency
  label: string
}[] = [
  { value: 'monthly', label: 'Mensual' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'semi_annual', label: 'Semestral' },
  { value: 'annual', label: 'Anual' },
  { value: 'single', label: 'Pago único' },
]

export type PolicyBasicFieldsValues = {
  insurerName: string
  policyNumber: string
  policyType: PolicyType
  holderName: string
  startDate: string
  endDate: string
  premium: string
  currency: string
  paymentFrequency: PaymentFrequency
  coverages: string
  exclusions: string
  waitingPeriods: string
  notes: string
}

type PolicyBasicFieldsProps = {
  values: PolicyBasicFieldsValues
  onChange: <K extends keyof PolicyBasicFieldsValues>(
    field: K,
    value: PolicyBasicFieldsValues[K]
  ) => void
  showExtendedFields?: boolean
}

export function PolicyBasicFields({
  values,
  onChange,
  showExtendedFields = false,
}: PolicyBasicFieldsProps) {
  return (
    <>
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
          value={values.insurerName}
          onChange={(event) => onChange('insurerName', event.target.value)}
          placeholder="Ej. Seguros Bolívar"
          className={policyFieldClassName}
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
          value={values.policyNumber}
          onChange={(event) => onChange('policyNumber', event.target.value)}
          placeholder="Ej. POL-2025-001"
          className={cn(policyFieldClassName, 'font-mono')}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="policyType" className="text-sm font-medium">
            Tipo de seguro
          </label>
          <select
            id="policyType"
            name="policyType"
            value={values.policyType}
            onChange={(event) =>
              onChange('policyType', event.target.value as PolicyType)
            }
            className={policyFieldClassName}
          >
            {POLICY_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="holderName" className="text-sm font-medium">
            Tomador
          </label>
          <input
            id="holderName"
            name="holderName"
            type="text"
            required
            value={values.holderName}
            onChange={(event) => onChange('holderName', event.target.value)}
            placeholder="Nombre del tomador"
            className={policyFieldClassName}
          />
        </div>
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
            value={values.startDate}
            onChange={(event) => onChange('startDate', event.target.value)}
            className={policyFieldClassName}
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
            value={values.endDate}
            onChange={(event) => onChange('endDate', event.target.value)}
            className={policyFieldClassName}
          />
        </div>
      </div>

      {showExtendedFields ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="premium" className="text-sm font-medium">
                Prima
              </label>
              <input
                id="premium"
                name="premium"
                type="number"
                min="0"
                step="0.01"
                value={values.premium}
                onChange={(event) => onChange('premium', event.target.value)}
                placeholder="0"
                className={policyFieldClassName}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="currency" className="text-sm font-medium">
                Moneda
              </label>
              <input
                id="currency"
                name="currency"
                type="text"
                maxLength={3}
                value={values.currency}
                onChange={(event) =>
                  onChange('currency', event.target.value.toUpperCase())
                }
                placeholder="COP"
                className={cn(policyFieldClassName, 'font-mono uppercase')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="paymentFrequency" className="text-sm font-medium">
              Frecuencia de pago
            </label>
            <select
              id="paymentFrequency"
              name="paymentFrequency"
              value={values.paymentFrequency}
              onChange={(event) =>
                onChange(
                  'paymentFrequency',
                  event.target.value as PaymentFrequency
                )
              }
              className={policyFieldClassName}
            >
              {PAYMENT_FREQUENCY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="coverages" className="text-sm font-medium">
              Coberturas
            </label>
            <textarea
              id="coverages"
              name="coverages"
              rows={3}
              value={values.coverages}
              onChange={(event) => onChange('coverages', event.target.value)}
              placeholder="Resumen de coberturas principales"
              className={cn(policyFieldClassName, 'min-h-[88px] resize-y py-3')}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="exclusions" className="text-sm font-medium">
              Exclusiones
            </label>
            <textarea
              id="exclusions"
              name="exclusions"
              rows={3}
              value={values.exclusions}
              onChange={(event) => onChange('exclusions', event.target.value)}
              placeholder="Exclusiones relevantes"
              className={cn(policyFieldClassName, 'min-h-[88px] resize-y py-3')}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="waitingPeriods" className="text-sm font-medium">
              Periodos de carencia
            </label>
            <textarea
              id="waitingPeriods"
              name="waitingPeriods"
              rows={2}
              value={values.waitingPeriods}
              onChange={(event) =>
                onChange('waitingPeriods', event.target.value)
              }
              placeholder="Carencias aplicables"
              className={cn(policyFieldClassName, 'min-h-[72px] resize-y py-3')}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="notes" className="text-sm font-medium">
              Notas
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              value={values.notes}
              onChange={(event) => onChange('notes', event.target.value)}
              placeholder="Observaciones adicionales"
              className={cn(policyFieldClassName, 'min-h-[88px] resize-y py-3')}
            />
          </div>
        </>
      ) : null}
    </>
  )
}

export function policyDocumentToFormValues(
  policy: import('@/lib/firebase/policies').PolicyDocument
): PolicyBasicFieldsValues {
  return {
    insurerName: policy.insurerName,
    policyNumber: policy.policyNumber,
    policyType: policy.policyType,
    holderName: policy.holderName,
    startDate: toDateInputValue(policy.startDate),
    endDate: toDateInputValue(policy.endDate),
    premium: String(policy.premium),
    currency: policy.currency,
    paymentFrequency: policy.paymentFrequency,
    coverages: policy.coverages ?? '',
    exclusions: policy.exclusions ?? '',
    waitingPeriods: policy.waitingPeriods ?? '',
    notes: policy.notes ?? '',
  }
}
