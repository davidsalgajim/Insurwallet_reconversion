function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') {
    return false
  }

  if (value instanceof Date) {
    return false
  }

  if (Array.isArray(value)) {
    return false
  }

  const prototype = Object.getPrototypeOf(value)
  return prototype === null || prototype === Object.prototype
}

/**
 * Recursively removes keys with `undefined` values.
 * Firestore rejects undefined — omit fields or use null/deleteField instead.
 */
export function stripUndefined<T>(value: T): T {
  if (value === undefined) {
    return value
  }

  if (value === null || !isPlainObject(value)) {
    if (Array.isArray(value)) {
      return value.map((item) => stripUndefined(item)) as T
    }

    return value
  }

  const result: Record<string, unknown> = {}

  for (const [key, entry] of Object.entries(value)) {
    if (entry !== undefined) {
      result[key] = stripUndefined(entry)
    }
  }

  return result as T
}
