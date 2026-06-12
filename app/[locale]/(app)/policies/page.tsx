import { AppTopbar } from '@/components/layout/app-topbar'
import { PoliciesList } from '@/components/policies/policies-list'

type PoliciesPageProps = {
  params: Promise<{ locale: string }>
}

export default async function PoliciesPage({ params }: PoliciesPageProps) {
  await params

  return (
    <div className="animate-fade-up">
      <AppTopbar
        title="Pólizas"
        subtitle="Gestiona y revisa tus seguros en un solo lugar."
      />
      <section className="glass-panel" aria-label="Lista de pólizas">
        <PoliciesList />
      </section>
    </div>
  )
}
