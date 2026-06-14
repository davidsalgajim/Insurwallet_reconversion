import createMiddleware from 'next-intl/middleware'
import { type NextRequest, NextResponse } from 'next/server'

import { routing } from './i18n/routing'
import { claimsNeedEmailVerification } from './lib/firebase/session-claims'
import { stripLocalePrefix } from './lib/utils/safe-redirect'
import { SESSION_COOKIE_NAME } from './lib/firebase/session-config'
import { verifySessionCookieEdge } from './lib/firebase/verify-session-edge'

const intlMiddleware = createMiddleware(routing)

const APP_SEGMENTS = new Set([
  'dashboard',
  'policies',
  'mariana',
  'alerts',
  'settings',
])

const AUTH_SEGMENTS = new Set([
  'login',
  'register',
  'forgot-password',
  'verify-email',
])

const REQUIRE_EMAIL_VERIFICATION =
  process.env.NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION === 'true'

function getPathInfo(pathname: string) {
  const segments = pathname.split('/').filter(Boolean)
  const locale = segments[0] ?? ''
  const segment = segments[1] ?? ''

  return { locale, segment }
}

function isLocale(value: string): value is (typeof routing.locales)[number] {
  return routing.locales.includes(value as (typeof routing.locales)[number])
}

function redirectToLogin(
  request: NextRequest,
  locale: string,
  pathname: string,
  clearSession = false
) {
  const loginUrl = request.nextUrl.clone()
  loginUrl.pathname = `/${locale}/login`
  loginUrl.searchParams.set('redirect', stripLocalePrefix(pathname))

  const response = NextResponse.redirect(loginUrl)

  if (clearSession) {
    response.cookies.set(SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    })
  }

  return response
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const { locale, segment } = getPathInfo(pathname)

  if (isLocale(locale)) {
    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value
    const isAppRoute = APP_SEGMENTS.has(segment)
    const isAuthRoute = AUTH_SEGMENTS.has(segment)

    let hasValidSession = false
    let sessionClaims = null

    if (sessionToken) {
      sessionClaims = await verifySessionCookieEdge(sessionToken)
      hasValidSession = sessionClaims !== null

      if (!hasValidSession && isAppRoute) {
        return redirectToLogin(request, locale, pathname, true)
      }
    }

    const needsEmailVerification =
      REQUIRE_EMAIL_VERIFICATION && claimsNeedEmailVerification(sessionClaims)

    if (isAppRoute && !hasValidSession) {
      return redirectToLogin(request, locale, pathname)
    }

    if (isAppRoute && hasValidSession && needsEmailVerification) {
      const verifyUrl = request.nextUrl.clone()
      verifyUrl.pathname = `/${locale}/verify-email`
      verifyUrl.searchParams.set('redirect', stripLocalePrefix(pathname))
      return NextResponse.redirect(verifyUrl)
    }

    if (isAuthRoute && hasValidSession) {
      if (segment === 'verify-email') {
        if (!needsEmailVerification) {
          const dashboardUrl = request.nextUrl.clone()
          dashboardUrl.pathname = `/${locale}/dashboard`
          dashboardUrl.search = ''
          return NextResponse.redirect(dashboardUrl)
        }
      } else if (needsEmailVerification) {
        const verifyUrl = request.nextUrl.clone()
        verifyUrl.pathname = `/${locale}/verify-email`
        verifyUrl.search = ''
        return NextResponse.redirect(verifyUrl)
      } else {
        const dashboardUrl = request.nextUrl.clone()
        dashboardUrl.pathname = `/${locale}/dashboard`
        dashboardUrl.search = ''
        return NextResponse.redirect(dashboardUrl)
      }
    }
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
