import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Link } from '@/i18n/navigation'

type Props = { params: Promise<{ locale: string }> }

export default async function RegisterPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('auth')
  const tc = await getTranslations('common')

  return (
    <Card className="glass-surface-dark border-white/10 bg-card/60 text-white shadow-2xl">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-[var(--primitive-ink)] text-sm font-bold text-white shadow-lg">
          IW
        </div>
        <CardTitle className="text-2xl text-white">
          {t('createAccount')}
        </CardTitle>
        <CardDescription className="text-white/60">
          {tc('tagline')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium text-white/80"
            >
              {t('email')}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="h-11 w-full rounded-[var(--radius-pill)] border border-white/15 bg-white/5 px-4 text-sm text-white outline-none ring-ring focus-visible:ring-2"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-white/80"
            >
              {t('password')}
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              className="h-11 w-full rounded-[var(--radius-pill)] border border-white/15 bg-white/5 px-4 text-sm text-white outline-none ring-ring focus-visible:ring-2"
            />
          </div>
          <Button type="submit" className="w-full" size="lg">
            {tc('register')}
          </Button>
        </form>
        <p className="text-center text-sm text-white/50">
          ¿Ya tienes cuenta?{' '}
          <Link
            href="/login"
            className="font-medium text-accent hover:underline"
          >
            {tc('login')}
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
