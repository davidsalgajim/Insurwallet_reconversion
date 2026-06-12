'use client'

import { useEffect } from 'react'

/**
 * Registers the PWA shell service worker (offline manifest + policies list cache).
 * FCM uses a separate worker at `/firebase-messaging-sw.js`.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      process.env.NODE_ENV === 'development'
    ) {
      return
    }

    void navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .catch((error: unknown) => {
        console.warn('[pwa] Service worker registration failed', error)
      })
  }, [])

  return null
}
