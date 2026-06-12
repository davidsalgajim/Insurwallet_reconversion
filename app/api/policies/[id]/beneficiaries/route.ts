import { NextResponse } from 'next/server'

import { getApiSession } from '@/lib/firebase/api-auth'
import {
  BeneficiaryInputSchema,
  createBeneficiary,
  listBeneficiaries,
} from '@/lib/server/beneficiaries'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  const session = await getApiSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: policyId } = await context.params

  try {
    const beneficiaries = await listBeneficiaries({
      ownerUid: session.uid,
      policyId,
    })
    return NextResponse.json({ beneficiaries })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'List failed'
    const status =
      message === 'Unauthorized'
        ? 403
        : message === 'Policy not found'
          ? 404
          : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: Request, context: RouteContext) {
  const session = await getApiSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: policyId } = await context.params
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
    const beneficiary = await createBeneficiary({
      ownerUid: session.uid,
      policyId,
      body: parsed.data,
    })
    return NextResponse.json({ beneficiary }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Create failed'
    const status =
      message === 'Unauthorized'
        ? 403
        : message === 'Policy not found'
          ? 404
          : 500
    return NextResponse.json({ error: message }, { status })
  }
}
