import { routing } from '@/i18n/routing'

const ALLOWED_REDIRECT_PATTERN = /^\/[a-zA-Z0-9/_\-%.~?=&#]*$/

/**
 * Strips a leading locale segment so next-intl navigation does not double-prefix
 * (e.g. `/es/dashboard` → `/dashboard` when locale is `es`).
 */
export function stripLocalePrefix(path: string): string {
  for (const locale of routing.locales) {
    const prefix = `/${locale}`
    if (path === prefix) {
      return '/'
    }
    if (path.startsWith(`${prefix}/`)) {
      return path.slice(prefix.length) || '/'
    }
  }

  return path
}

/**
 * Validates a redirect path to prevent open-redirect attacks.
 * Only allows relative paths starting with '/' that contain safe characters.
 * Rejects absolute URLs, protocol-relative URLs, and paths with encoded protocols.
 */
export function safeRedirect(
  value: string | undefined,
  fallback: string = '/dashboard'
): string {
  if (!value) {
    return fallback
  }

  const decoded = stripLocalePrefix(decodeURIComponent(value))

  if (
    ALLOWED_REDIRECT_PATTERN.test(decoded) &&
    !decoded.startsWith('//') &&
    !decoded.toLowerCase().includes('javascript:')
  ) {
    return decoded
  }

  return fallback
}
