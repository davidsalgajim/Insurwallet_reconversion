'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'

import { useDashboardPolicies } from '@/components/dashboard/dashboard-summary'
import {
  WorkflowBoard,
  type WorkflowStep,
  type WorkflowStepId,
} from '@/components/dashboard/workflow-board'
import { isDraftPolicy } from '@/lib/utils/draft-policy'
import { computePolicyStatus } from '@/lib/utils/policy-status'
import { cn } from '@/lib/utils/cn'

type JourneyWorkflowSectionProps = {
  title: string
  description: string
  steps: WorkflowStep[]
  defaultActiveIndex?: number
}

const STEP_LINKS: Partial<Record<WorkflowStepId, string>> = {
  upload: '/policies/new/upload',
  review: '/policies/new/upload',
  track: '/alerts',
  ask: '/mariana',
}

export function JourneyWorkflowSection({
  title,
  description,
  steps,
  defaultActiveIndex = 1,
}: JourneyWorkflowSectionProps) {
  const t = useTranslations('dashboard')
  const { policies } = useDashboardPolicies()
  const [activeTab, setActiveTab] = useState(0)

  const now = useMemo(() => new Date(), [])

  const { activeCount, pendingCount } = useMemo(() => {
    let active = 0
    let pending = 0

    for (const policy of policies) {
      if (isDraftPolicy(policy)) {
        pending += 1
        continue
      }

      const status = computePolicyStatus(policy.startDate, policy.endDate, now)

      if (status === 'active' || status === 'expiring') {
        active += 1
      }
    }

    return { activeCount: active, pendingCount: pending }
  }, [policies, now])

  const filterTabs = [
    { id: 'all', label: t('filterAll'), count: policies.length },
    { id: 'active', label: t('filterActive'), count: activeCount },
    { id: 'pending', label: t('filterPending'), count: pendingCount },
  ] as const

  const enrichedSteps = useMemo(() => {
    return steps.map((step) => {
      switch (step.id) {
        case 'upload':
          return {
            ...step,
            meta: t('journeyMetaCount', { count: policies.length }),
          }
        case 'review':
          return {
            ...step,
            meta: t('journeyMetaDrafts', { count: pendingCount }),
          }
        case 'track':
          return {
            ...step,
            meta: t('journeyMetaActive', { count: activeCount }),
          }
        case 'ask':
          return { ...step, meta: t('journeyMeta.ask') }
        default:
          return step
      }
    })
  }, [activeCount, pendingCount, policies.length, steps, t])

  const filteredSteps = useMemo(() => {
    if (activeTab === 0) {
      return enrichedSteps
    }

    if (activeTab === 1) {
      return enrichedSteps.filter(
        (step) => step.id === 'track' || step.id === 'ask'
      )
    }

    return enrichedSteps.filter(
      (step) => step.id === 'upload' || step.id === 'review'
    )
  }, [activeTab, enrichedSteps])

  const boardDefaultIndex = useMemo(() => {
    if (activeTab === 1) {
      return Math.max(
        0,
        filteredSteps.findIndex((step) => step.id === 'track')
      )
    }

    if (activeTab === 2) {
      return Math.max(
        0,
        filteredSteps.findIndex((step) => step.id === 'review')
      )
    }

    return Math.min(defaultActiveIndex, Math.max(filteredSteps.length - 1, 0))
  }, [activeTab, defaultActiveIndex, filteredSteps])

  const boardKey = `${activeTab}-${boardDefaultIndex}`

  return (
    <section
      className="glass-panel mb-6 p-4 sm:p-5 md:p-6"
      aria-labelledby="workflow-heading"
    >
      <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2
            id="workflow-heading"
            className="font-display text-base font-semibold tracking-tight sm:text-lg"
          >
            {title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <div
          className="flex max-w-full gap-1 overflow-x-auto rounded-[var(--radius-pill)] bg-white/50 p-1 ring-1 ring-border [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label={t('filterAria')}
        >
          {filterTabs.map((tab, index) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === index}
              onClick={() => setActiveTab(index)}
              className={cn(
                'shrink-0 rounded-[var(--radius-pill)] px-3 py-1.5 text-xs font-semibold transition-[background-color,color,box-shadow] duration-200 sm:px-4',
                activeTab === index
                  ? 'bg-[var(--primitive-ink)] text-white shadow-md'
                  : 'font-medium text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
              <span className="ml-1.5 opacity-70">({tab.count})</span>
            </button>
          ))}
        </div>
      </div>

      <WorkflowBoard
        key={boardKey}
        steps={filteredSteps}
        defaultActiveIndex={boardDefaultIndex}
        stepLinks={STEP_LINKS}
      />
    </section>
  )
}
