import { setRequestLocale } from 'next-intl/server'

import { AlertsContent } from '@/components/alerts/alerts-content'

type Props = { params: Promise<{ locale: string }> }

export default async function AlertsPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  return <AlertsContent />
}
