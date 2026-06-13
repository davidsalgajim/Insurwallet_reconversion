import { setRequestLocale } from 'next-intl/server'

import { HelpView } from '@/components/settings/help-view'

type Props = { params: Promise<{ locale: string }> }

export default async function SettingsHelpPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  return <HelpView />
}
