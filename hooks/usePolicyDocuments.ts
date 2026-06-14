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

    let unsubscribe: (() => void) | undefined

    void import('@/lib/firebase/client').then(({ db }) => {
      void import('@/lib/firebase/documents').then(
        ({ subscribePolicyDocuments }) => {
          setState((current) => ({ ...current, loading: true, error: null }))

          unsubscribe = subscribePolicyDocuments(
            db,
            policyId,
            (documents) => {
              setState({ documents, loading: false, error: null })
            },
            () => {
              setState({
                documents: [],
                loading: false,
                error: 'load_failed',
              })
            }
          )
        }
      )
    })

    return () => {
      unsubscribe?.()
    }
  }, [policyId])

  if (!policyId) {
    return { documents: [], loading: false, error: null }
  }

  return state
}
