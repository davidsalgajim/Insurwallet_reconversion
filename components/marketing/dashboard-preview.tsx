import {
  CalendarClock,
  FileText,
  MessageSquareText,
  Plus,
  Search,
  Shield,
  Upload,
} from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { AppLogo } from '@/components/brand/app-logo'

export async function DashboardPreview() {
  const t = await getTranslations('landing')
  const tCommon = await getTranslations('common')

  const stats = [
    {
      label: t('previewStatActive'),
      value: '—',
      icon: Shield,
      tone: 'stat-icon-success',
    },
    {
      label: t('previewStatExpiring'),
      value: '—',
      icon: CalendarClock,
      tone: 'stat-icon-warning',
    },
    {
      label: t('previewStatPremium'),
      value: '—',
      icon: FileText,
      tone: 'stat-icon-primary',
    },
    {
      label: tCommon('mariana'),
      value: '—',
      icon: MessageSquareText,
      tone: 'stat-icon-accent',
    },
  ] as const

  const columns = [
    { title: t('previewColUpload'), action: t('previewActionUpload') },
    {
      title: t('previewColReview'),
      action: t('previewActionReview'),
      active: true,
    },
    { title: t('previewColMariana'), action: t('previewActionAsk') },
  ] as const

  return (
    <div className="relative">
      <div className="glass-canvas overflow-hidden p-1 shadow-2xl">
        <div className="rounded-[28px] bg-[#e8eaee] p-3 sm:p-4">
          <div className="mb-3 flex gap-3">
            <div className="glass-panel flex w-12 shrink-0 flex-col items-center gap-2 py-3">
              <AppLogo size={32} className="rounded-lg" />
              {[Shield, FileText, MessageSquareText].map((Icon, i) => (
                <span
                  key={i}
                  className={`icon-circle size-8 ${i === 0 ? 'icon-circle-active' : ''}`}
                >
                  <Icon className="size-3.5" strokeWidth={1.75} />
                </span>
              ))}
              <span className="icon-circle icon-circle-active mt-auto size-8">
                <Plus className="size-3.5" />
              </span>
            </div>

            <div className="glass-canvas min-w-0 flex-1 rounded-[24px] p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-[#10141a]">
                  {t('previewPortfolio')}
                </p>
                <div className="flex items-center gap-1.5">
                  <div className="hidden h-7 w-24 items-center gap-1.5 rounded-full border border-white/60 bg-white/70 px-2 sm:flex">
                    <Search className="size-2.5 text-[#5c6470]" />
                    <span className="text-[9px] text-[#5c6470]">
                      {t('previewSearch')}
                    </span>
                  </div>
                  <span className="icon-circle size-7">
                    <Upload className="size-3" />
                  </span>
                  <span className="size-7 rounded-full bg-gradient-to-br from-[#83a2db] to-[#407aff]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="glass-panel p-2.5">
                    <span
                      className={`icon-circle mb-2 size-7 border-0 ${stat.tone}`}
                    >
                      <stat.icon className="size-3" />
                    </span>
                    <p className="text-[9px] text-[#5c6470]">{stat.label}</p>
                    <p className="font-mono text-sm font-semibold text-[#10141a]">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-2.5 grid gap-2 sm:grid-cols-3">
                {columns.map((col) => (
                  <div key={col.title} className="glass-panel p-2">
                    <p className="text-[8px] font-semibold uppercase tracking-wider text-[#5c6470]">
                      {col.title}
                    </p>
                    <div
                      className={`mt-1.5 rounded-xl px-2 py-1.5 text-[9px] font-medium ${
                        'active' in col && col.active
                          ? 'bg-[#10141a] text-white'
                          : 'bg-white/50 text-[#5c6470]'
                      }`}
                    >
                      {col.action}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
