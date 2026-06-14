'use client'

import { useState } from 'react'
import {
  ArrowLeft,
  CalendarRange,
  Pencil,
  Share2,
  Shield,
  Trash2,
  UserRound,
  Wallet,
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'

import { useAuth } from '@/components/auth/auth-provider'
import { DeletePolicyDialog } from '@/components/policies/delete-policy-dialog'
import { AddPolicyDocumentsPanel } from '@/components/policies/add-policy-documents-panel'
import { BeneficiariesPanel } from '@/components/policies/beneficiaries-panel'
import { PolicySharesPanel } from '@/components/policies/policy-shares-panel'
import { SharePolicyDialog } from '@/components/policies/share-policy-dialog'
import { PolicyStatusBadge } from '@/components/policies/policy-status-badge'
import { AppTopbar } from '@/components/layout/app-topbar'
import { Button } from '@/components/ui/button'
import { usePolicyLabels } from '@/hooks/use-policy-labels'
import { usePolicy } from '@/hooks/usePolicy'
import { Link, useRouter } from '@/i18n/navigation'
import { formatPolicyCurrency, formatPolicyDate } from '@/lib/i18n/format'
import { cn } from '@/lib/utils/cn'

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-32 animate-pulse rounded-[var(--radius-inner)] bg-white/50" />
      <div className="h-48 animate-pulse rounded-[var(--radius-inner)] bg-white/50" />
    </div>
  )
}

function DetailField({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className={cn('text-sm font-medium', mono && 'font-mono')}>
        {value}
      </dd>
    </div>
  )
}

function DetailTextBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-2 border-t border-border/60 pt-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </h3>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
        {value}
      </p>
    </div>
  )
}

export function PolicyDetailView() {
  const params = useParams<{ id: string }>()
  const policyId = params?.id
  const locale = useLocale()
  const router = useRouter()
  const t = useTranslations('policies')
  const tf = useTranslations('policies.fields')
  const ta = useTranslations('common.actions')
  const {
    policyType,
    paymentFrequency,
    status: statusLabel,
  } = usePolicyLabels()
  const { user } = useAuth()
  const { policy, loading, error, isOwner, isShared } = usePolicy(policyId)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [shareRefreshKey, setShareRefreshKey] = useState(0)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function handleDelete() {
    if (!policy || !user) {
      return
    }

    setDeleting(true)
    setDeleteError(null)

    try {
      const [{ db }, { deletePolicy }] = await Promise.all([
        import('@/lib/firebase/client'),
        import('@/lib/firebase/policies'),
      ])

      await deletePolicy(db, policy.id, user.uid)
      setDeleteOpen(false)
      router.push('/policies')
    } catch {
      setDeleteError(t('errors.deleteFailed'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="animate-fade-up mx-auto max-w-3xl">
      <div className="mb-4">
        <Link
          href="/policies"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" strokeWidth={1.5} />
          {t('detail.backToList')}
        </Link>
      </div>

      <AppTopbar
        title={policy?.insurerName ?? t('detail.title')}
        subtitle={
          policy
            ? t('policyNumberPrefix', { number: policy.policyNumber })
            : t('detail.subtitle')
        }
      />

      {loading ? <DetailSkeleton /> : null}

      {!loading && error ? (
        <div className="elevated-card px-6 py-12 text-center">
          <p className="text-sm font-medium text-[var(--primitive-danger)]">
            {error}
          </p>
          <Button
            asChild
            variant="secondary"
            className="mt-4 rounded-[var(--radius-pill)]"
          >
            <Link href="/policies">{t('detail.goToList')}</Link>
          </Button>
        </div>
      ) : null}

      {!loading && policy ? (
        <>
          <div className="elevated-card mb-4 space-y-5 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <PolicyStatusBadge status={policy.status} />
                  <span className="pill-badge bg-primary/10 text-primary">
                    {policyType(policy.policyType)}
                  </span>
                  {isShared ? (
                    <span className="pill-badge bg-[var(--primitive-cyan)]/10 text-[var(--primitive-cyan)]">
                      {t('sharedWithMe.badge')}
                    </span>
                  ) : null}
                </div>
                <p className="font-mono text-sm text-muted-foreground">
                  {policy.policyNumber}
                </p>
              </div>
              {isOwner ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="rounded-[var(--radius-pill)]"
                    onClick={() => setShareOpen(true)}
                  >
                    <Share2 className="size-4" strokeWidth={1.5} />
                    {t('share.action')}
                  </Button>
                  <Button
                    asChild
                    variant="secondary"
                    size="sm"
                    className="rounded-[var(--radius-pill)]"
                  >
                    <Link href={`/policies/${policy.id}/edit`}>
                      <Pencil className="size-4" strokeWidth={1.5} />
                      {ta('edit')}
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="rounded-[var(--radius-pill)] text-[var(--primitive-danger)] hover:text-[var(--primitive-danger)]"
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 className="size-4" strokeWidth={1.5} />
                    {ta('delete')}
                  </Button>
                </div>
              ) : null}
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailField label={tf('holderName')} value={policy.holderName} />
              <DetailField
                label={tf('premium')}
                value={formatPolicyCurrency(
                  policy.premium,
                  policy.currency,
                  locale
                )}
              />
              <DetailField
                label={tf('paymentFrequency')}
                value={paymentFrequency(policy.paymentFrequency)}
              />
              <DetailField
                label={t('detail.validity')}
                value={
                  policy.hasNoExpiration
                    ? t('sharedWithMe.noExpiration')
                    : `${formatPolicyDate(policy.startDate, locale)} — ${formatPolicyDate(policy.endDate, locale)}`
                }
              />
            </dl>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[var(--radius-inner)] border border-border/60 bg-muted/40 flex items-center gap-3 p-4">
                <Shield className="size-5 text-primary" strokeWidth={1.5} />
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t('detail.statusLabel')}
                  </p>
                  <p className="text-sm font-semibold">
                    {statusLabel(policy.status)}
                  </p>
                </div>
              </div>
              <div className="rounded-[var(--radius-inner)] border border-border/60 bg-muted/40 flex items-center gap-3 p-4">
                <CalendarRange
                  className="size-5 text-primary"
                  strokeWidth={1.5}
                />
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t('detail.updatedLabel')}
                  </p>
                  <p className="text-sm font-semibold">
                    {formatPolicyDate(policy.updatedAt, locale)}
                  </p>
                </div>
              </div>
              <div className="rounded-[var(--radius-inner)] border border-border/60 bg-muted/40 flex items-center gap-3 p-4">
                <Wallet className="size-5 text-primary" strokeWidth={1.5} />
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t('detail.currencyLabel')}
                  </p>
                  <p className="font-mono text-sm font-semibold">
                    {policy.currency}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="elevated-card space-y-4 p-6">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <UserRound
                className="size-4 text-muted-foreground"
                strokeWidth={1.5}
              />
              <h2 className="font-semibold">{t('detail.contractDetails')}</h2>
            </div>

            {policy.coverages ? (
              <DetailTextBlock
                label={tf('coverages')}
                value={policy.coverages}
              />
            ) : null}
            {policy.exclusions ? (
              <DetailTextBlock
                label={tf('exclusions')}
                value={policy.exclusions}
              />
            ) : null}
            {policy.waitingPeriods ? (
              <DetailTextBlock
                label={tf('waitingPeriods')}
                value={policy.waitingPeriods}
              />
            ) : null}
            {policy.notes ? (
              <DetailTextBlock label={tf('notes')} value={policy.notes} />
            ) : null}
            {policy.beneficiaries ? (
              <DetailTextBlock
                label={tf('beneficiariesNotes')}
                value={policy.beneficiaries}
              />
            ) : null}
            {policy.benefitEntries.length > 0 ? (
              <div className="space-y-2 border-t border-border/60 pt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('benefitsPage.title')}
                </h3>
                <ul className="space-y-2">
                  {policy.benefitEntries.map((benefit, index) => (
                    <li
                      key={`${benefit.name}-${index}`}
                      className="rounded-[var(--radius-inner)] border border-border/60 bg-muted/30 px-3 py-2 text-sm"
                    >
                      <p className="font-medium">{benefit.name}</p>
                      {benefit.description ? (
                        <p className="mt-1 text-muted-foreground">
                          {benefit.description}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {!policy.coverages &&
            !policy.exclusions &&
            !policy.waitingPeriods &&
            !policy.notes &&
            !policy.beneficiaries &&
            policy.benefitEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t('detail.noExtraDetails')}
              </p>
            ) : null}
          </div>

          {isOwner ? (
            <div className="mb-4">
              <AddPolicyDocumentsPanel
                policyId={policy.id}
                isExpired={policy.status === 'expired'}
              />
            </div>
          ) : null}

          {isOwner ? (
            <div className="elevated-card mb-4 space-y-4 p-6">
              <h2 className="font-semibold">{t('share.listTitle')}</h2>
              <PolicySharesPanel
                policyId={policy.id}
                refreshKey={shareRefreshKey}
              />
            </div>
          ) : null}

          <BeneficiariesPanel policyId={policy.id} isOwner={isOwner} />

          {deleteError ? (
            <p className="mt-4 text-sm text-[var(--primitive-danger)]">
              {deleteError}
            </p>
          ) : null}

          <DeletePolicyDialog
            open={deleteOpen}
            insurerName={policy.insurerName}
            policyNumber={policy.policyNumber}
            deleting={deleting}
            onConfirm={handleDelete}
            onCancel={() => {
              if (!deleting) {
                setDeleteOpen(false)
              }
            }}
          />

          {user ? (
            <SharePolicyDialog
              open={shareOpen}
              policyId={policy.id}
              ownerUid={user.uid}
              onClose={() => setShareOpen(false)}
              onCreated={() => setShareRefreshKey((key) => key + 1)}
            />
          ) : null}
        </>
      ) : null}
    </div>
  )
}
