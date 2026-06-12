import { setRequestLocale } from 'next-intl/server'

import { RegisterForm } from '@/components/auth/register-form'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ redirect?: string }>
}

export default async function RegisterPage({ params, searchParams }: Props) {
  const { locale } = await params
  const { redirect } = await searchParams

  setRequestLocale(locale)

  return <RegisterForm redirectTo={redirect} />
}
