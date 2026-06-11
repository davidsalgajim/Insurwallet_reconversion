import { BellRing } from 'lucide-react'
import { setRequestLocale } from 'next-intl/server'
import { AppTopbar } from '@/components/layout/app-topbar'

type Props = { params: Promise<{ locale: string }> }

export default async function AlertsPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <div className="animate-fade-up">
      <AppTopbar
        title="Alertas"
        subtitle="Vencimientos, renovaciones y actividad relevante de tu cartera."
      />
      <section className="glass-panel">
        <div className="flex flex-col items-center gap-4 px-6 py-20 text-center">
          <div className="icon-circle size-16 bg-white/80 text-muted-foreground">
            <BellRing className="size-7" strokeWidth={1.5} />
          </div>
          <p className="text-lg font-semibold tracking-tight">
            Sin alertas por ahora
          </p>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            Te avisaremos cuando una póliza esté por vencer o haya actividad
            importante.
          </p>
        </div>
      </section>
    </div>
  )
}
