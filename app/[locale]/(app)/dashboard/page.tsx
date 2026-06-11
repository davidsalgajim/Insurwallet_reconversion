import {
  ArrowRight,
  CalendarClock,
  FileSearch,
  FileText,
  MessageSquareText,
  Shield,
  Upload,
  Wallet,
} from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { JourneyVisual } from '@/components/dashboard/journey-visual'
import { StatCard } from '@/components/dashboard/stat-card'
import { WorkflowBoard } from '@/components/dashboard/workflow-board'
import { AppTopbar } from '@/components/layout/app-topbar'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'

type Props = { params: Promise<{ locale: string }> }

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('dashboard')
  const tc = await getTranslations('common')

  return (
    <div className="animate-fade-up">
      <AppTopbar title={t('greeting')} subtitle={tc('tagline')} />

      <div className="glass-panel mb-6 inline-flex items-center gap-1 p-1.5">
        {['01', '02', '03', '04'].map((id, i) => (
          <span
            key={id}
            className="flex size-9 items-center justify-center rounded-full bg-white/80 text-[10px] font-semibold tracking-wide text-muted-foreground ring-1 ring-border"
            style={{ marginLeft: i > 0 ? '-4px' : 0 }}
          >
            {id}
          </span>
        ))}
        <span className="ml-2 pr-2 text-xs font-medium text-muted-foreground">
          Cartera de seguros
        </span>
      </div>

      <section
        aria-labelledby="summary-heading"
        className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <h2 id="summary-heading" className="sr-only">
          {t('summary')}
        </h2>
        <StatCard
          label={t('activePolicies')}
          value="0"
          icon={Shield}
          tone="success"
          hint={t('summary')}
        />
        <StatCard
          label={t('expiringSoon')}
          value="0"
          icon={CalendarClock}
          tone="warning"
          hint="90 días"
        />
        <StatCard
          label={t('totalPremium')}
          value="—"
          icon={Wallet}
          tone="primary"
          hint="COP / mes"
        />
        <StatCard
          label="Consultas MarIAna"
          value="0"
          icon={MessageSquareText}
          tone="accent"
          hint="Este mes"
        />
      </section>

      <section
        className="glass-panel mb-6 p-5 sm:p-6"
        aria-labelledby="workflow-heading"
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2
              id="workflow-heading"
              className="text-lg font-semibold tracking-tight"
            >
              {t('journeyTitle')}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('journeyDesc')}
            </p>
          </div>
          <div className="flex gap-1 rounded-[var(--radius-pill)] bg-white/50 p-1 ring-1 ring-border">
            {['Todas', 'Activas', 'Pendientes'].map((tab, i) => (
              <button
                key={tab}
                type="button"
                className={
                  i === 0
                    ? 'rounded-[var(--radius-pill)] bg-[var(--primitive-ink)] px-4 py-1.5 text-xs font-semibold text-white shadow-md'
                    : 'rounded-[var(--radius-pill)] px-4 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground'
                }
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <WorkflowBoard
          steps={[
            {
              id: 'upload',
              columnTitle: 'Carga',
              title: t('journey.upload'),
              meta: 'PDF · imagen',
              icon: Upload,
            },
            {
              id: 'review',
              columnTitle: 'Revisión',
              title: t('journey.review'),
              meta: 'Datos extraídos',
              icon: FileSearch,
              active: true,
            },
            {
              id: 'track',
              columnTitle: 'Seguimiento',
              title: t('journey.track'),
              meta: 'Vencimientos',
              icon: CalendarClock,
            },
            {
              id: 'ask',
              columnTitle: 'MarIAna',
              title: t('journey.ask'),
              meta: 'Consultas IA',
              icon: MessageSquareText,
            },
          ]}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-12">
        <section
          className="glass-panel lg:col-span-7"
          aria-labelledby="upcoming-heading"
        >
          <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
            <h2 id="upcoming-heading" className="font-semibold text-foreground">
              {t('upcoming')}
            </h2>
            <span className="pill-badge bg-[var(--primitive-accent-soft)]/20 text-primary">
              30 · 60 · 90 días
            </span>
          </div>
          <div className="flex flex-col items-center gap-5 px-6 py-12 text-center">
            <div className="icon-circle size-16 stat-icon-primary border-0">
              <FileText className="size-7" strokeWidth={1.5} />
            </div>
            <div className="max-w-sm space-y-2">
              <p className="text-lg font-semibold">{t('emptyTitle')}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t('emptyDesc')}
              </p>
            </div>
            <Button
              asChild
              size="lg"
              variant="ink"
              className="rounded-[var(--radius-pill)]"
            >
              <Link href="/policies/new">
                {t('addPolicy')}
                <ArrowRight className="size-4" strokeWidth={1.5} />
              </Link>
            </Button>
          </div>
        </section>

        <aside className="flex flex-col gap-6 lg:col-span-5">
          <div className="glass-panel overflow-hidden">
            <div className="border-b border-border/60 bg-gradient-to-r from-accent/8 via-primary/4 to-transparent px-6 py-4">
              <div className="flex items-center gap-2.5">
                <span className="icon-circle size-9 stat-icon-accent border-0">
                  <MessageSquareText className="size-4" strokeWidth={1.5} />
                </span>
                <h2 className="font-semibold">MarIAna</h2>
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Asistente de seguros con citas a tus documentos
              </p>
            </div>
            <div className="space-y-2.5 px-5 py-5">
              {[
                '¿Estoy cubierto para un viaje?',
                '¿Cuándo vence mi póliza de auto?',
                '¿A quién llamo en emergencia?',
              ].map((q) => (
                <Link
                  key={q}
                  href="/mariana"
                  className="glass-panel group flex items-center justify-between px-4 py-3 text-sm text-foreground hover:-translate-y-px"
                >
                  {q}
                  <ArrowRight
                    className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                    strokeWidth={1.5}
                  />
                </Link>
              ))}
            </div>
          </div>

          <JourneyVisual
            title="Cobertura activa"
            subtitle="Visualiza el estado de tu cartera cuando agregues pólizas"
          />
        </aside>
      </div>
    </div>
  )
}
