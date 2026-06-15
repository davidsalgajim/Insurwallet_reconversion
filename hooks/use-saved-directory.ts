'use client'

import { useCallback, useEffect, useState } from 'react'

import {
  filterAdvisorContacts,
  type SavedAdvisorContact,
  type SavedGlobalBeneficiary,
} from '@/lib/policies/saved-directory'

type LoadState = 'idle' | 'loading' | 'ready' | 'error'

export function useSavedAdvisors() {
  const [contacts, setContacts] = useState<SavedAdvisorContact[]>([])
  const [state, setState] = useState<LoadState>('idle')

  const load = useCallback(async () => {
    setState('loading')
    try {
      const response = await fetch('/api/user/contacts')
      if (!response.ok) {
        throw new Error('load failed')
      }
      const payload = (await response.json()) as {
        contacts: SavedAdvisorContact[]
      }
      setContacts(filterAdvisorContacts(payload.contacts))
      setState('ready')
    } catch {
      setState('error')
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  return {
    advisors: contacts,
    loading: state === 'loading' || state === 'idle',
    error: state === 'error',
    reload: load,
  }
}

export function useSavedBeneficiaries() {
  const [beneficiaries, setBeneficiaries] = useState<SavedGlobalBeneficiary[]>(
    []
  )
  const [state, setState] = useState<LoadState>('idle')

  const load = useCallback(async () => {
    setState('loading')
    try {
      const response = await fetch('/api/user/beneficiaries')
      if (!response.ok) {
        throw new Error('load failed')
      }
      const payload = (await response.json()) as {
        beneficiaries: SavedGlobalBeneficiary[]
      }
      setBeneficiaries(payload.beneficiaries)
      setState('ready')
    } catch {
      setState('error')
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  return {
    beneficiaries,
    loading: state === 'loading' || state === 'idle',
    error: state === 'error',
    reload: load,
  }
}
