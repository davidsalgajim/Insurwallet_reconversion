import { NextResponse } from 'next/server'

import { getApiSession } from '@/lib/firebase/api-auth'
import {
  BeneficiaryInputSchema,
  deleteBeneficiary,
  updateBeneficiary,
} from '@/lib/server/beneficiaries'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{ id: string; beneficiaryId: string }>
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getApiSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: policyId, beneficiaryId } = await context.params
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = BeneficiaryInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  try {
    const beneficiary = await updateBeneficiary({
      ownerUid: session.uid,
      policyId,
      beneficiaryId,
      body: parsed.data,
    })
    return NextResponse.json({ beneficiary })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Update failed'
    const status =
      message === 'Unauthorized'
        ? 403
        : message === 'Policy not found' || message === 'Beneficiary not found'
          ? 404
          : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getApiSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: policyId, beneficiaryId } = await context.params

  try {
    await deleteBeneficiary({
      ownerUid: session.uid,
      policyId,
      beneficiaryId,
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Delete failed'
    const status =
      message === 'Unauthorized'
        ? 403
        : message === 'Policy not found' || message === 'Beneficiary not found'
          ? 404
          : 500
    return NextResponse.json({ error: message }, { status })
  }
}
