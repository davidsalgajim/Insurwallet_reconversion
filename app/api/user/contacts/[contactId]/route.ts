import { NextResponse } from 'next/server'

import { requireSession } from '@/lib/api/require-session'
import {
  InsuranceContactInputSchema,
  deleteInsuranceContact,
  updateInsuranceContact,
} from '@/lib/server/user-directory'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{ contactId: string }>
}

export async function PUT(request: Request, context: RouteContext) {
  const session = await requireSession()
  if (!session?.uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { contactId } = await context.params
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = InsuranceContactInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  try {
    const contact = await updateInsuranceContact({
      uid: session.uid,
      contactId,
      body: parsed.data,
    })
    return NextResponse.json({ contact })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Update failed'
    const status = message === 'Contact not found' ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireSession()
  if (!session?.uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { contactId } = await context.params

  try {
    await deleteInsuranceContact({ uid: session.uid, contactId })
    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Delete failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
