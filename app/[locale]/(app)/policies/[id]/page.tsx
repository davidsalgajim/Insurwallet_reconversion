import { PolicyDetailView } from '@/components/policies/policy-detail-view'

type PolicyDetailPageProps = {
  params: Promise<{ locale: string; id: string }>
}

export default async function PolicyDetailPage({
  params,
}: PolicyDetailPageProps) {
  await params

  return <PolicyDetailView />
}
