import type { PreferredLanguage } from '@/lib/schemas/user'

export type LegalSection = {
  title: string
  paragraphs?: string[]
  items?: string[]
}

export type LegalDocumentContent = {
  title: string
  intro: string
  sections: LegalSection[]
  /** Shown as discrete footnote — not alarmist in main UI. */
  counselNote: string
}

export type LegalLocale = PreferredLanguage
