'use client'

export type AccountActionResponse = {
  status: string
  message: string
  uid?: string
  requestedAt?: string
}

export async function requestDataExport(): Promise<void> {
  const response = await fetch('/api/account/export', { method: 'POST' })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string
    } | null
    throw new Error(body?.error ?? 'Export request failed')
  }

  const blob = await response.blob()
  const disposition = response.headers.get('Content-Disposition')
  const filenameMatch = disposition?.match(/filename="([^"]+)"/)
  const filename = filenameMatch?.[1] ?? `insurwallet-export-${Date.now()}.json`
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function requestAccountDeletion(): Promise<void> {
  const response = await fetch('/api/account/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ confirm: true }),
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string
    } | null
    throw new Error(body?.error ?? 'Delete request failed')
  }

  const [{ auth }, { signOut }] = await Promise.all([
    import('@/lib/firebase/client'),
    import('firebase/auth'),
  ])

  await signOut(auth)
}
