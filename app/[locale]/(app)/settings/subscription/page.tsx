import { Suspense } from 'react'
import { setRequestLocale } from 'next-intl/server'

import { SubscriptionView } from '@/components/subscription/subscription-view'

type Props = { params: Promise<{ locale: string }> }

export default async function SubscriptionPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <Suspense fallback={null}>
      <SubscriptionView />
    </Suspense>
  )
}
