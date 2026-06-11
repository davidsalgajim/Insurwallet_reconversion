import { CalendarClock, FileText, Wallet } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from '@/i18n/navigation'

type Props = { params: Promise<{ locale: string }> }

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('dashboard')
  const tc = await getTranslations('common')

  const stats = [
    { label: t('activePolicies'), value: '0', icon: FileText },
    { label: t('expiringSoon'), value: '0', icon: CalendarClock },
    { label: t('totalPremium'), value: '—', icon: Wallet },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t('greeting')}
        </h1>
        <p className="mt-1 text-muted-foreground">{tc('tagline')}</p>
      </div>

      <section aria-labelledby="summary-heading">
        <h2
          id="summary-heading"
          className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground"
        >
          {t('summary')}
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <Card key={stat.label} className="glass-surface border-white/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className="size-4 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="font-mono text-3xl font-semibold">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t('upcoming')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
            <FileText
              className="size-7 text-muted-foreground"
              strokeWidth={1.5}
            />
          </div>
          <div className="max-w-sm space-y-1">
            <p className="font-semibold">{t('emptyTitle')}</p>
            <p className="text-sm text-muted-foreground">{t('emptyDesc')}</p>
          </div>
          <Button asChild>
            <Link href="/policies/new">{t('addPolicy')}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
