'use client'

import { useState } from 'react'
import {
  WorkflowBoard,
  type WorkflowStep,
} from '@/components/dashboard/workflow-board'
import { cn } from '@/lib/utils/cn'

type JourneyWorkflowSectionProps = {
  title: string
  description: string
  steps: WorkflowStep[]
  defaultActiveIndex?: number
}

const FILTER_TABS = ['Todas', 'Activas', 'Pendientes'] as const

export function JourneyWorkflowSection({
  title,
  description,
  steps,
  defaultActiveIndex = 1,
}: JourneyWorkflowSectionProps) {
  const [activeTab, setActiveTab] = useState(0)

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
          aria-label="Filtrar recorrido"
        >
          {FILTER_TABS.map((tab, i) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === i}
              onClick={() => setActiveTab(i)}
              className={cn(
                'shrink-0 rounded-[var(--radius-pill)] px-3 py-1.5 text-xs font-semibold transition-[background-color,color,box-shadow] duration-200 sm:px-4',
                activeTab === i
                  ? 'bg-[var(--primitive-ink)] text-white shadow-md'
                  : 'font-medium text-muted-foreground hover:text-foreground'
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <WorkflowBoard steps={steps} defaultActiveIndex={defaultActiveIndex} />
    </section>
  )
}
