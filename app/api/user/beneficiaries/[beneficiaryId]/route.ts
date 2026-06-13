import { NextResponse } from 'next/server'

import { requireSession } from '@/lib/api/require-session'
import {
  GlobalBeneficiaryInputSchema,
  deleteGlobalBeneficiary,
  updateGlobalBeneficiary,
} from '@/lib/server/user-directory'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{ beneficiaryId: string }>
}

export async function PUT(request: Request, context: RouteContext) {
  const session = await requireSession()
  if (!session?.uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { beneficiaryId } = await context.params
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
    const beneficiary = await updateGlobalBeneficiary({
      uid: session.uid,
      beneficiaryId,
      body: parsed.data,
    })
    return NextResponse.json({ beneficiary })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Update failed'
    const status = message === 'Beneficiary not found' ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireSession()
  if (!session?.uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { beneficiaryId } = await context.params

  try {
    await deleteGlobalBeneficiary({ uid: session.uid, beneficiaryId })
    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Delete failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
