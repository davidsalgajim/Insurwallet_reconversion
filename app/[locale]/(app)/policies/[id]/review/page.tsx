import { PolicyReviewView } from '@/components/policies/policy-review-view'

type PolicyReviewPageProps = {
  params: Promise<{ locale: string; id: string }>
}

export default async function PolicyReviewPage({
  params,
}: PolicyReviewPageProps) {
  await params

  return <PolicyReviewView />
}
