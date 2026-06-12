'use client'

import { Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { FormEvent, useState } from 'react'

import { usePathname, useRouter } from '@/i18n/navigation'

export function PolicySearchInput() {
  const t = useTranslations('common.topbar')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const urlQuery =
    pathname === '/policies' ? (searchParams.get('search') ?? '') : ''
  const [query, setQuery] = useState(urlQuery)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmed = query.trim()

    if (trimmed) {
      router.push(`/policies?search=${encodeURIComponent(trimmed)}`)
      return
    }

    if (pathname === '/policies') {
      router.push('/policies')
    }
  }

  return (
    <form
      key={urlQuery}
      className="relative min-w-0 w-full sm:flex-1 sm:min-w-[200px] md:min-w-[240px] lg:min-w-[280px]"
      onSubmit={handleSubmit}
      role="search"
    >
      <label htmlFor="app-topbar-search" className="sr-only">
        {t('searchAria')}
      </label>
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        strokeWidth={1.5}
        aria-hidden
      />
      <input
        id="app-topbar-search"
        type="search"
        defaultValue={urlQuery}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t('searchPlaceholder')}
        className="h-10 w-full rounded-[var(--radius-pill)] border border-border bg-white/70 pl-10 pr-4 text-sm shadow-[var(--shadow-soft)] outline-none backdrop-blur-sm transition-[box-shadow,border-color] duration-200 placeholder:text-muted-foreground focus:border-primary/30 focus:shadow-[var(--shadow-float)] focus:ring-2 focus:ring-primary/20 sm:h-11"
      />
    </form>
  )
}
