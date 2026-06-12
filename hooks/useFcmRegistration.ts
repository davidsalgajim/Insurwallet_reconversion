'use client'

import { useEffect } from 'react'

type UseFcmRegistrationOptions = {
  uid: string | undefined
  enabled?: boolean
}

export function useFcmRegistration({
  uid,
  enabled = true,
}: UseFcmRegistrationOptions) {
  useEffect(() => {
    if (!uid || !enabled) {
      return
    }

    if (!process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim()) {
      return
    }

    let cancelled = false

    void (async () => {
      try {
        if (!('serviceWorker' in navigator)) {
          return
        }

        const registration = await navigator.serviceWorker.register(
          '/firebase-messaging-sw.js',
          { scope: '/' }
        )

        const messagingModule = await import('firebase/messaging')
        const { getClientMessaging } = await import('@/lib/firebase/messaging')
        const messaging = await getClientMessaging()

        if (!messaging || cancelled) {
          return
        }

        const permission = await Notification.requestPermission()

        if (permission !== 'granted' || cancelled) {
          return
        }

        const token = await messagingModule.getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: registration,
        })

        if (!token || cancelled) {
          return
        }

        await fetch('/api/notifications/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
      } catch {
        // Push is optional — ignore registration failures.
      }
    })()

    return () => {
      cancelled = true
    }
  }, [uid, enabled])
}
