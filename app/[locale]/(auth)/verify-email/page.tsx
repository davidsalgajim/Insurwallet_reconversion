import { setRequestLocale } from 'next-intl/server'

import { VerifyEmailForm } from '@/components/auth/verify-email-form'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ redirect?: string }>
}

export default async function VerifyEmailPage({ params, searchParams }: Props) {
  const { locale } = await params
  const { redirect } = await searchParams

  setRequestLocale(locale)

  return <VerifyEmailForm redirectTo={redirect} />
}
