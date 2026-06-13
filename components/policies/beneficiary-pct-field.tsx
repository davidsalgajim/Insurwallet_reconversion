'use client'

import { policyFieldClassName } from '@/components/policies/policy-form-styles'
import { cn } from '@/lib/utils/cn'

type BeneficiaryPctFieldProps = {
  id: string
  value: number
  onChange: (value: number) => void
  label: string
  placeholder: string
  helperText: string
  ariaLabel: string
  className?: string
}

export function BeneficiaryPctField({
  id,
  value,
  onChange,
  label,
  placeholder,
  helperText,
  ariaLabel,
  className,
}: BeneficiaryPctFieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="number"
          min={0}
          max={100}
          step={1}
          inputMode="numeric"
          value={value === 0 ? '' : value}
          onChange={(event) => {
            const raw = event.target.value
            onChange(raw === '' ? 0 : Number(raw))
          }}
          placeholder={placeholder}
          aria-label={ariaLabel}
          aria-describedby={`${id}-helper`}
          className={cn(policyFieldClassName, 'pr-10', className)}
        />
        <span
          className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-sm text-muted-foreground"
          aria-hidden="true"
        >
          %
        </span>
      </div>
      <p id={`${id}-helper`} className="text-xs text-muted-foreground">
        {helperText}
      </p>
    </div>
  )
}
