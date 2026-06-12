'use client'

import {
  getMessaging,
  getToken,
  isSupported,
  type Messaging,
} from 'firebase/messaging'

import { app } from '@/lib/firebase/client'

let messagingInstance: Messaging | null = null

export async function getClientMessaging(): Promise<Messaging | null> {
  if (typeof window === 'undefined') {
    return null
  }

  const supported = await isSupported()

  if (!supported) {
    return null
  }

  if (!messagingInstance) {
    messagingInstance = getMessaging(app)
  }

  return messagingInstance
}

export async function requestFcmToken(): Promise<string | null> {
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim()

  if (!vapidKey) {
    return null
  }

  const messaging = await getClientMessaging()

  if (!messaging) {
    return null
  }

  const permission = await Notification.requestPermission()

  if (permission !== 'granted') {
    return null
  }

  return getToken(messaging, { vapidKey })
}
