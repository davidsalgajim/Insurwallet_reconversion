import { setRequestLocale } from 'next-intl/server'

import { ContactsView } from '@/components/settings/contacts-view'

type Props = { params: Promise<{ locale: string }> }

export default async function SettingsContactsPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  return <ContactsView />
}
