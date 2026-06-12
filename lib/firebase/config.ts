import { env } from '@/lib/env'

export const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
  ...(env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
    ? { measurementId: env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID }
    : {}),
} as const

export const useFirebaseEmulators =
  env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === true
