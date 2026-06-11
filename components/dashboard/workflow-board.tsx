'use client'

import {
  CalendarClock,
  FileSearch,
  MessageSquareText,
  Upload,
  type LucideIcon,
} from 'lucide-react'
import { useCallback, useId, useState } from 'react'
import { WorkflowColumn } from '@/components/dashboard/workflow-column'
import { cn } from '@/lib/utils/cn'

export type WorkflowStepId = 'upload' | 'review' | 'track' | 'ask'

export type WorkflowStep = {
  id: WorkflowStepId
  columnTitle: string
  title: string
  meta?: string
}

const STEP_ICONS: Record<WorkflowStepId, LucideIcon> = {
  upload: Upload,
  review: FileSearch,
  track: CalendarClock,
  ask: MessageSquareText,
}

type WorkflowBoardProps = {
  steps: WorkflowStep[]
  defaultActiveIndex?: number
  className?: string
}

const CONNECTOR_PATH =
  'M 100 24 C 180 8, 220 40, 300 24 S 420 8, 500 24 S 620 40, 700 24'

const NODE_POSITIONS = [100, 300, 500, 700]

export function WorkflowBoard({
  steps,
  defaultActiveIndex = 0,
  className,
}: WorkflowBoardProps) {
  const [activeIndex, setActiveIndex] = useState(defaultActiveIndex)
  const gradientId = useId()

  const handleSelect = useCallback((index: number) => {
    setActiveIndex(index)
  }, [])

  const progress = steps.length <= 1 ? 1 : activeIndex / (steps.length - 1)

  return (
    <div className={cn('relative', className)}>
      {/* Desktop / tablet landscape: curved connectors */}
      <svg
        className="pointer-events-none absolute left-0 right-0 top-[4.5rem] hidden h-12 w-full md:block xl:top-[4.5rem]"
        viewBox="0 0 800 48"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(64, 122, 255, 0.5)" />
            <stop offset="100%" stopColor="rgba(64, 122, 255, 0.15)" />
          </linearGradient>
        </defs>
        <path
          d={CONNECTOR_PATH}
          fill="none"
          stroke="rgba(16, 20, 26, 0.08)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d={CONNECTOR_PATH}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="2"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - progress}
          className="workflow-connector-flow"
        />
        {NODE_POSITIONS.slice(0, steps.length).map((cx, i) => (
          <circle
            key={cx}
            cx={cx}
            cy={24}
            r={i === activeIndex ? 4.5 : 3}
            fill={
              i <= activeIndex
                ? 'var(--primitive-accent)'
                : 'rgba(16, 20, 26, 0.12)'
            }
            stroke="#fff"
            strokeWidth="2"
            className="transition-[r,fill] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
          />
        ))}
      </svg>

      {/* Mobile: vertical timeline connector */}
      <div
        className="absolute bottom-4 left-[1.35rem] top-8 w-px md:hidden"
        aria-hidden
      >
        <div className="h-full w-full bg-border" />
        <div
          className="workflow-timeline-progress absolute left-0 top-0 w-full bg-primary"
          style={{
            height: `${(activeIndex / Math.max(steps.length - 1, 1)) * 100}%`,
          }}
        />
      </div>

      <div className="grid gap-4 pl-0 max-md:pl-10 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
        {steps.map((step, index) => (
          <WorkflowColumn
            key={step.id}
            title={step.columnTitle}
            tasks={[
              {
                id: step.id,
                title: step.title,
                meta: step.meta,
                icon: STEP_ICONS[step.id],
                active: index === activeIndex,
              },
            ]}
            onTaskSelect={() => handleSelect(index)}
            className="max-md:min-w-0"
          />
        ))}
      </div>
    </div>
  )
}
