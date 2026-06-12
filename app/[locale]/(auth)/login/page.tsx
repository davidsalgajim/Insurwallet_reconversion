import { setRequestLocale } from 'next-intl/server'

import { LoginForm } from '@/components/auth/login-form'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ redirect?: string }>
}

export default async function LoginPage({ params, searchParams }: Props) {
  const { locale } = await params
  const { redirect } = await searchParams

  setRequestLocale(locale)

  return <LoginForm redirectTo={redirect} />
}
