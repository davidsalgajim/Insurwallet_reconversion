'use client'

import { useParams } from 'next/navigation'

import { PolicyEditView } from '@/components/policies/policy-edit-view'
import { usePolicy } from '@/hooks/usePolicy'

export function PolicyEditPageClient() {
  const params = useParams<{ id: string }>()
  const policyId = params?.id
  const { policy, loading, error } = usePolicy(policyId)

  return <PolicyEditView policy={policy} loading={loading} error={error} />
}
