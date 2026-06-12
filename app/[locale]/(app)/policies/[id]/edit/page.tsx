import { PolicyEditPageClient } from '@/components/policies/policy-edit-page-client'

type PolicyEditPageProps = {
  params: Promise<{ locale: string; id: string }>
}

export default async function PolicyEditPage({ params }: PolicyEditPageProps) {
  await params

  return <PolicyEditPageClient />
}
