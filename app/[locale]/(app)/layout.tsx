import { setRequestLocale } from 'next-intl/server'
import { AppShell } from '@/components/layout/app-shell'

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function AppLayout({ children, params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  return <AppShell locale={locale}>{children}</AppShell>
}
