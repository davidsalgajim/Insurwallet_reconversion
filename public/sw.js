/* InsurWallet PWA shell — cache-first static assets, network-first app routes. */

const CACHE_VERSION = 'insurwallet-shell-v1'
const SHELL_CACHE = `${CACHE_VERSION}-shell`
const POLICIES_CACHE = `${CACHE_VERSION}-policies`

const SHELL_ASSETS = [
  '/offline.html',
  '/manifest.webmanifest',
  '/brand/insurwallet-logo.png',
]

const POLICY_ROUTE_PATTERN = /\/(es|en|pt)\/policies\/?$/

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter(
            (key) =>
              key.startsWith('insurwallet-shell-') &&
              key !== SHELL_CACHE &&
              key !== POLICIES_CACHE
          )
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') {
    return
  }

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) {
    return
  }

  if (POLICY_ROUTE_PATTERN.test(url.pathname)) {
    event.respondWith(networkFirstPolicies(request))
    return
  }

  if (isShellAsset(url.pathname)) {
    event.respondWith(cacheFirst(request))
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigate(request))
  }
})

function isShellAsset(pathname) {
  return (
    SHELL_ASSETS.includes(pathname) ||
    pathname.startsWith('/brand/') ||
    pathname.endsWith('.webmanifest')
  )
}

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) {
    return cached
  }

  const response = await fetch(request)
  if (response.ok) {
    const cache = await caches.open(SHELL_CACHE)
    void cache.put(request, response.clone())
  }
  return response
}

async function networkFirstNavigate(request) {
  try {
    const response = await fetch(request)
    return response
  } catch {
    const offline = await caches.match('/offline.html')
    if (offline) {
      return offline
    }
    return new Response('Offline', { status: 503, statusText: 'Offline' })
  }
}

async function networkFirstPolicies(request) {
  const cache = await caches.open(POLICIES_CACHE)

  try {
    const response = await fetch(request)
    if (response.ok) {
      void cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await cache.match(request)
    if (cached) {
      return cached
    }

    const offline = await caches.match('/offline.html')
    if (offline) {
      return offline
    }

    return new Response('Offline', { status: 503, statusText: 'Offline' })
  }
}
