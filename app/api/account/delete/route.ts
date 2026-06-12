import { NextResponse } from 'next/server'
import { z } from 'zod'

import { requireSession } from '@/lib/api/require-session'
import { deleteUserAccountData } from '@/lib/server/account-delete'

export const runtime = 'nodejs'

const deleteRequestSchema = z.object({
  confirm: z.literal(true),
})

export async function POST(request: Request) {
  const session = await requireSession()

  if (!session?.uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = deleteRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Explicit confirmation required (confirm: true)' },
      { status: 400 }
    )
  }

  try {
    const result = await deleteUserAccountData(session.uid)

    const response = NextResponse.json({
      status: 'deleted',
      message: 'Account and associated data were deleted.',
      ...result,
    })

    response.cookies.set('__session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    })

    return response
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Account deletion failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
