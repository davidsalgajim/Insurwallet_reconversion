import { createHash } from 'node:crypto'

import { NextResponse } from 'next/server'

import { requireSession } from '@/lib/api/require-session'
import { readUserDocument } from '@/lib/firebase/user-doc-server'
import {
  ConsentPostBodySchema,
  resolveCloudAIOutcome,
  UserConsentsSchema,
} from '@/lib/schemas/consents'
import {
  persistCloudAIConsent,
  persistCookieConsent,
} from '@/lib/server/consent-persist'

export const runtime = 'nodejs'

function hashClientIp(request: Request): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip =
    forwarded?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip')
  if (!ip) {
    return undefined
  }

  return createHash('sha256').update(ip).digest('hex').slice(0, 16)
}

export async function GET() {
  const session = await requireSession()

  if (!session?.uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userData = await readUserDocument(session.uid)
  const consents = UserConsentsSchema.safeParse(userData?.consents)

  return NextResponse.json({
    consents: consents.success ? consents.data : {},
  })
}

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

  const parsed = ConsentPostBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid consent payload' },
      { status: 400 }
    )
  }

  const ipHash = hashClientIp(request)

  if (parsed.data.cookies) {
    await persistCookieConsent(session.uid)
  }

  const cloudOutcome = resolveCloudAIOutcome(parsed.data)
  if (cloudOutcome) {
    await persistCloudAIConsent({
      uid: session.uid,
      outcome: cloudOutcome,
      source: parsed.data.source ?? 'settings',
      ipHash,
    })
  }

  const userData = await readUserDocument(session.uid)
  const consents = UserConsentsSchema.safeParse(userData?.consents)

  return NextResponse.json({
    status: 'ok',
    consents: consents.success ? consents.data : {},
  })
}
