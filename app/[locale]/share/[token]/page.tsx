import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'

import { ShareAcceptPanel } from '@/components/share/share-accept-panel'
import { getSharePreview } from '@/lib/server/shares'

type Props = {
  params: Promise<{ locale: string; token: string }>
}

export default async function ShareAcceptPage({ params }: Props) {
  const { locale, token } = await params
  setRequestLocale(locale)

  const preview = await getSharePreview(token)

  if (!preview) {
    notFound()
  }

  return <ShareAcceptPanel token={token} preview={preview} />
}
