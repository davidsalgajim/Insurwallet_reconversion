import { NextResponse } from 'next/server'

import { requireSession } from '@/lib/api/require-session'

export const runtime = 'nodejs'

/**
 * GDPR data export skeleton (5.10).
 * Mirrors `functions/src/account/export-user-data.ts` — wire to Cloud Function when deployed.
 */
export async function POST() {
  const session = await requireSession()

  if (!session?.uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json(
    {
      status: 'stub',
      message:
        'La exportación completa estará disponible pronto. Recibirás un enlace de descarga por correo.',
      uid: session.uid,
      requestedAt: new Date().toISOString(),
    },
    { status: 202 }
  )
}
