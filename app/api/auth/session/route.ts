import { NextResponse } from 'next/server'
import { z } from 'zod'

import {
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from '@/lib/firebase/session-config'
import { createFirebaseSessionCookie } from '@/lib/firebase/session-server'

export const runtime = 'nodejs'

const sessionRequestSchema = z.object({
  idToken: z.string().min(1),
})

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = sessionRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'idToken is required' }, { status: 400 })
  }

  try {
    const sessionCookie = await createFirebaseSessionCookie(parsed.data.idToken)
    const response = NextResponse.json({ status: 'ok' })

    response.cookies.set(
      SESSION_COOKIE_NAME,
      sessionCookie,
      sessionCookieOptions()
    )

    return response
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[session] Failed to create session cookie:', error)
    }

    return NextResponse.json({ error: 'Invalid ID token' }, { status: 401 })
  }
}
