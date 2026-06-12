export const policyFieldClassName =
  'h-11 w-full rounded-[var(--radius-inner)] border border-border bg-white/70 px-4 text-sm shadow-[var(--shadow-soft)] outline-none backdrop-blur-sm transition-[box-shadow,border-color] duration-200 placeholder:text-muted-foreground focus:border-primary/30 focus:shadow-[var(--shadow-float)] focus:ring-2 focus:ring-primary/20'

export function toDateInputValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatPolicyDate(date: Date): string {
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function formatPolicyCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}
