import { setRequestLocale } from 'next-intl/server'

import { EmailVerificationBanner } from '@/components/auth/email-verification-banner'
import { AppShell } from '@/components/layout/app-shell'
import { AppSubnav } from '@/components/layout/app-subnav'

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function AppLayout({ children, params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <AppShell locale={locale}>
      <AppSubnav locale={locale} />
      <EmailVerificationBanner />
      {children}
    </AppShell>
  )
}
