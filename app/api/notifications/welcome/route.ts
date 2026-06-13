import { NextResponse } from 'next/server'
import { z } from 'zod'

import { requireSession } from '@/lib/api/require-session'
import {
  mergeUserDocument,
  readUserDocument,
} from '@/lib/firebase/user-doc-server'
import { getServerEnv, hasResendApiKey } from '@/lib/server/env-server'
import { sendWelcomeEmail } from '@/lib/server/welcome-email'

export const runtime = 'nodejs'

const welcomeSchema = z.object({
  locale: z.enum(['es', 'en', 'pt']).default('es'),
})

export async function POST(request: Request) {
  const session = await requireSession()

  if (!session?.uid || !session.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown = {}
  try {
    body = await request.json()
  } catch {
    // empty body is fine
  }

  const parsed = welcomeSchema.safeParse(body)
  const locale = parsed.success ? parsed.data.locale : 'es'

  const userData = await readUserDocument(session.uid)

  if (userData?.welcomeEmailSentAt) {
    return NextResponse.json({ status: 'already_sent' })
  }

  const { RESEND_API_KEY, RESEND_FROM_EMAIL } = getServerEnv()
  let emailSent = false

  if (hasResendApiKey() && RESEND_API_KEY && RESEND_FROM_EMAIL) {
    const result = await sendWelcomeEmail(
      {
        recipientEmail: session.email,
        displayName: String(userData?.displayName ?? session.name ?? 'Usuario'),
        locale,
      },
      RESEND_API_KEY,
      RESEND_FROM_EMAIL
    )
    emailSent = Boolean(result)
  }

  await mergeUserDocument(session.uid, {
    welcomeEmailSentAt: new Date(),
  })

  return NextResponse.json({
    status: emailSent ? 'sent' : 'skipped',
    emailSent,
  })
}
