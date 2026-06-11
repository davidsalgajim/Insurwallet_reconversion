import type { LucideIcon } from 'lucide-react'
import { WorkflowColumn } from '@/components/dashboard/workflow-column'
import { cn } from '@/lib/utils/cn'

export type WorkflowStep = {
  id: string
  columnTitle: string
  title: string
  meta?: string
  icon?: LucideIcon
  active?: boolean
}

type WorkflowBoardProps = {
  steps: WorkflowStep[]
  className?: string
}

export function WorkflowBoard({ steps, className }: WorkflowBoardProps) {
  const columns = steps.map((step) => ({
    title: step.columnTitle,
    tasks: [
      {
        id: step.id,
        title: step.title,
        meta: step.meta,
        icon: step.icon,
        active: step.active,
      },
    ],
  }))

  return (
    <div className={cn('relative', className)}>
      <svg
        className="pointer-events-none absolute left-0 right-0 top-[4.5rem] hidden h-12 w-full xl:block"
        viewBox="0 0 800 48"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M 100 24 C 180 8, 220 40, 300 24 S 420 8, 500 24 S 620 40, 700 24"
          fill="none"
          stroke="rgba(16, 20, 26, 0.08)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M 100 24 C 180 8, 220 40, 300 24"
          fill="none"
          stroke="rgba(64, 122, 255, 0.35)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {[100, 300, 500, 700].map((cx) => (
          <circle
            key={cx}
            cx={cx}
            cy={24}
            r="3"
            fill="rgba(16, 20, 26, 0.12)"
            stroke="#fff"
            strokeWidth="2"
          />
        ))}
      </svg>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {columns.map((col) => (
          <WorkflowColumn key={col.title} title={col.title} tasks={col.tasks} />
        ))}
      </div>
    </div>
  )
}
