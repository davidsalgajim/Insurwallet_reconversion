const ALLOWED_REDIRECT_PATTERN = /^\/[a-zA-Z0-9/_\-%.~?=&#]*$/

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

  const decoded = decodeURIComponent(value)

  if (
    ALLOWED_REDIRECT_PATTERN.test(decoded) &&
    !decoded.startsWith('//') &&
    !decoded.toLowerCase().includes('javascript:')
  ) {
    return decoded
  }

  return fallback
}
