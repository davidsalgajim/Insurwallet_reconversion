import { NextResponse } from 'next/server'

import { requireSession } from '@/lib/api/require-session'
import { buildUserDataExport } from '@/lib/server/account-export'

export const runtime = 'nodejs'

export async function POST() {
  const session = await requireSession()

  if (!session?.uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const payload = await buildUserDataExport(session.uid)
    const body = JSON.stringify(payload, null, 2)
    const filename = `insurwallet-export-${session.uid}-${Date.now()}.json`

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
