export const SESSION_COOKIE_NAME = '__session'

const MAX_AGE_SECONDS = 60 * 60 * 24 * 5

export function setSessionCookie(token: string): void {
  if (typeof document === 'undefined') {
    return
  }

  document.cookie = `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=${MAX_AGE_SECONDS}; SameSite=Lax`
}

export function clearSessionCookie(): void {
  if (typeof document === 'undefined') {
    return
  }

  document.cookie = `${SESSION_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`
}
