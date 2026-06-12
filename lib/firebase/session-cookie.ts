export {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from '@/lib/firebase/session-config'

/**
 * @deprecated Use createServerSession() — sets an HttpOnly cookie via POST /api/auth/session.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function setSessionCookie(_token: string): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      '[session] setSessionCookie is deprecated. Use createServerSession() instead.'
    )
  }
}

/**
 * @deprecated Use clearServerSession() — clears the HttpOnly cookie via POST /api/auth/logout.
 */
export function clearSessionCookie(): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      '[session] clearSessionCookie is deprecated. Use clearServerSession() instead.'
    )
  }
}

export async function createServerSession(idToken: string): Promise<void> {
  const response = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
    credentials: 'same-origin',
  })

  if (!response.ok) {
    throw new Error('Failed to create server session')
  }
}

export async function clearServerSession(): Promise<void> {
  const response = await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'same-origin',
  })

  if (!response.ok) {
    throw new Error('Failed to clear server session')
  }
}
