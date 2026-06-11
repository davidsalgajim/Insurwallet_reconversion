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

export default async function LoginPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('auth')
  const tc = await getTranslations('common')

  return (
    <Card className="glass-surface-dark border-white/10 bg-card/60 text-white shadow-2xl">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
          IW
        </div>
        <CardTitle className="text-2xl text-white">
          {t('welcomeBack')}
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
              className="h-11 w-full rounded-[var(--radius-button)] border border-white/15 bg-white/5 px-4 text-sm text-white outline-none ring-ring focus-visible:ring-2"
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
              autoComplete="current-password"
              className="h-11 w-full rounded-[var(--radius-button)] border border-white/15 bg-white/5 px-4 text-sm text-white outline-none ring-ring focus-visible:ring-2"
            />
          </div>
          <Button type="submit" className="w-full" size="lg">
            {tc('login')}
          </Button>
        </form>
        <Button
          variant="secondary"
          className="w-full border-white/15 bg-white/5 text-white hover:bg-white/10"
          size="lg"
        >
          {t('continueWithGoogle')}
        </Button>
        <p className="text-center text-sm text-white/50">
          ¿No tienes cuenta?{' '}
          <Link
            href="/register"
            className="font-medium text-accent hover:underline"
          >
            {tc('register')}
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
