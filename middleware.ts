import createMiddleware from 'next-intl/middleware'
import { type NextRequest, NextResponse } from 'next/server'

import { routing } from './i18n/routing'
import { SESSION_COOKIE_NAME } from './lib/firebase/session-cookie'

const intlMiddleware = createMiddleware(routing)

const APP_SEGMENTS = new Set([
  'dashboard',
  'policies',
  'mariana',
  'alerts',
  'settings',
])

const AUTH_SEGMENTS = new Set(['login', 'register', 'forgot-password'])

function getPathInfo(pathname: string) {
  const segments = pathname.split('/').filter(Boolean)
  const locale = segments[0] ?? ''
  const segment = segments[1] ?? ''

  return { locale, segment }
}

function isLocale(value: string): value is (typeof routing.locales)[number] {
  return routing.locales.includes(value as (typeof routing.locales)[number])
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const { locale, segment } = getPathInfo(pathname)

  if (isLocale(locale)) {
    const hasSession = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value)
    const isAppRoute = APP_SEGMENTS.has(segment)
    const isAuthRoute = AUTH_SEGMENTS.has(segment)

    if (isAppRoute && !hasSession) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = `/${locale}/login`
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (isAuthRoute && hasSession) {
      const dashboardUrl = request.nextUrl.clone()
      dashboardUrl.pathname = `/${locale}/dashboard`
      dashboardUrl.search = ''
      return NextResponse.redirect(dashboardUrl)
    }
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
