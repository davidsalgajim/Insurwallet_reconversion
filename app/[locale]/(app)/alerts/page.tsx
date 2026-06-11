import { Bell } from 'lucide-react'
import { setRequestLocale } from 'next-intl/server'
import { Card, CardContent } from '@/components/ui/card'

type Props = { params: Promise<{ locale: string }> }

export default async function AlertsPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Alertas</h1>
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <Bell className="size-10 text-muted-foreground" strokeWidth={1.5} />
          <p className="font-medium">Sin alertas por ahora</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Te avisaremos cuando una póliza esté por vencer o haya actividad
            importante.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
