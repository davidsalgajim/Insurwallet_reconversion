import { NextResponse } from 'next/server'

import { requireSession } from '@/lib/api/require-session'
import {
  GlobalBeneficiaryInputSchema,
  createGlobalBeneficiary,
  listGlobalBeneficiaries,
} from '@/lib/server/user-directory'

export const runtime = 'nodejs'

export async function GET() {
  const session = await requireSession()
  if (!session?.uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const beneficiaries = await listGlobalBeneficiaries(session.uid)
    return NextResponse.json({ beneficiaries })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'List failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
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

  const parsed = GlobalBeneficiaryInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  try {
    const beneficiary = await createGlobalBeneficiary({
      uid: session.uid,
      body: parsed.data,
    })
    return NextResponse.json({ beneficiary }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Create failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
