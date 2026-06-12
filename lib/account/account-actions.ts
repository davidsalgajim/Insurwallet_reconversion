'use client'

export type AccountActionResponse = {
  status: string
  message: string
  uid?: string
  requestedAt?: string
}

export async function requestDataExport(): Promise<AccountActionResponse> {
  const response = await fetch('/api/account/export', { method: 'POST' })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string
    } | null
    throw new Error(body?.error ?? 'Export request failed')
  }

  return response.json() as Promise<AccountActionResponse>
}

export async function requestAccountDeletion(): Promise<AccountActionResponse> {
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

  return response.json() as Promise<AccountActionResponse>
}
