import { NextResponse } from 'next/server'

import { requireSession } from '@/lib/api/require-session'
import { acceptShareWithPolicyAccess } from '@/lib/server/shares'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ token: string }> }

export async function POST(_request: Request, context: RouteContext) {
  const session = await requireSession()

  if (!session?.uid || !session.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { token } = await context.params

  try {
    const result = await acceptShareWithPolicyAccess({
      token,
      recipientUid: session.uid,
      recipientEmail: session.email,
    })

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Accept failed'

    if (message === 'Share not found' || message === 'Policy not found') {
      return NextResponse.json({ error: message }, { status: 404 })
    }

    if (
      message === 'Recipient email mismatch' ||
      message === 'Share is not pending'
    ) {
      return NextResponse.json({ error: message }, { status: 403 })
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
