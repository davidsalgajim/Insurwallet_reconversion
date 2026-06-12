import { routing } from './routing'

export const localeLabels = {
  es: 'ES',
  en: 'EN',
  pt: 'PT',
} as const

export type AppLocale = (typeof routing.locales)[number]

export const appLocales = routing.locales
