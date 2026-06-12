export const SESSION_COOKIE_NAME = '__session'

/** Firebase session cookie max age (5 days). */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 5

export const SESSION_MAX_AGE_MS = SESSION_MAX_AGE_SECONDS * 1000

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  }
}
