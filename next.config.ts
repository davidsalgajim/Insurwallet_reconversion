import type { NextConfig } from 'next'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const packageJson = JSON.parse(
  readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')
) as { version?: string }

const appVersion =
  process.env.NEXT_PUBLIC_APP_VERSION ?? packageJson.version ?? '0.0.0'
const isDev = process.env.NODE_ENV === 'development'
const isProd = process.env.NODE_ENV === 'production'

function buildContentSecurityPolicy(): string {
  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    ...(isDev ? ["'unsafe-eval'"] : []),
    'https://www.gstatic.com',
    'https://www.google.com',
    'https://apis.google.com',
    'https://*.firebaseapp.com',
  ]

  const connectSrc = [
    "'self'",
    'https://*.googleapis.com',
    'https://*.firebaseio.com',
    'wss://*.firebaseio.com',
    'https://*.firebaseapp.com',
    'https://www.google.com',
    'https://www.gstatic.com',
    'https://accounts.google.com',
    'https://*.ingest.sentry.io',
    'https://*.ingest.us.sentry.io',
    ...(isDev
      ? [
          'http://127.0.0.1:*',
          'http://localhost:*',
          'ws://127.0.0.1:*',
          'ws://localhost:*',
        ]
      : []),
  ]

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc.join(' ')}`,
    "worker-src 'self' blob:",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https://*.googleusercontent.com https://www.gstatic.com https://www.google.com",
    "font-src 'self' data:",
    `connect-src ${connectSrc.join(' ')}`,
    "frame-src 'self' https://www.google.com https://recaptcha.google.com https://accounts.google.com https://apis.google.com https://*.firebaseapp.com",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    ...(isProd ? ['upgrade-insecure-requests'] : []),
  ]

  return directives.join('; ')
}

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  ...(isProd
    ? [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload',
        },
      ]
    : []),
  { key: 'Content-Security-Policy', value: buildContentSecurityPolicy() },
]

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: appVersion,
  },
  images: { formats: ['image/avif', 'image/webp'] },
  async headers() {
    return [
      {
        source: '/manifest.webmanifest',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default withNextIntl(nextConfig)
