const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
}

export function formatPolicyDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, DATE_OPTIONS).format(date)
}

export function formatPolicyCurrency(
  amount: number,
  currency: string,
  locale: string
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}
