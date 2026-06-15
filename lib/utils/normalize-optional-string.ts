/** Claude/OCR sentinel strings — treat as empty optional fields. */
export const EXTRACTION_STRING_SENTINELS = new Set([
  'none',
  'n/a',
  'na',
  'null',
  'nil',
  'sin email',
  'no email',
  'no aplica',
  'ninguno',
  'ninguna',
  'not available',
  'no disponible',
  'pendiente',
  'tbd',
  'por definir',
  'sin correo',
  'sin dato',
  'no aplica',
])

/**
 * Trim and drop IA/OCR placeholder strings.
 * Returns empty string when the value should be treated as absent.
 */
export function normalizeOptionalString(
  value: string | undefined | null
): string {
  const trimmed = value?.trim()
  if (!trimmed) {
    return ''
  }

  if (EXTRACTION_STRING_SENTINELS.has(trimmed.toLowerCase())) {
    return ''
  }

  return trimmed
}
