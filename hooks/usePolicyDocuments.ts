'use client'

import { useEffect, useState } from 'react'

import type { PolicyFileDocument } from '@/lib/firebase/documents'

type PolicyDocumentsState = {
  documents: PolicyFileDocument[]
  loading: boolean
  error: string | null
}

export function usePolicyDocuments(policyId: string | undefined) {
  const [state, setState] = useState<PolicyDocumentsState>({
    documents: [],
    loading: Boolean(policyId),
    error: null,
  })

  useEffect(() => {
    if (!policyId) {
      return
    }

    let cancelled = false

    void (async () => {
      setState((current) => ({ ...current, loading: true, error: null }))

      try {
        const [{ db }, { listPolicyDocuments }] = await Promise.all([
          import('@/lib/firebase/client'),
          import('@/lib/firebase/documents'),
        ])

        const documents = await listPolicyDocuments(db, policyId)

        if (!cancelled) {
          setState({ documents, loading: false, error: null })
        }
      } catch {
        if (!cancelled) {
          setState({
            documents: [],
            loading: false,
            error: 'load_failed',
          })
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [policyId])

  if (!policyId) {
    return { documents: [], loading: false, error: null }
  }

  return state
}
