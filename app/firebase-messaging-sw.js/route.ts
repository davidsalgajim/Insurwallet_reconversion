import { NextResponse } from 'next/server'

import { env } from '@/lib/env'

export const runtime = 'nodejs'

export function GET() {
  const body = `
importScripts('https://www.gstatic.com/firebasejs/11.3.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.3.0/firebase-messaging-compat.js');
firebase.initializeApp({
  apiKey: ${JSON.stringify(env.NEXT_PUBLIC_FIREBASE_API_KEY)},
  authDomain: ${JSON.stringify(env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN)},
  projectId: ${JSON.stringify(env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)},
  storageBucket: ${JSON.stringify(env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET)},
  messagingSenderId: ${JSON.stringify(env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID)},
  appId: ${JSON.stringify(env.NEXT_PUBLIC_FIREBASE_APP_ID)},
});
firebase.messaging();
`.trim()

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Service-Worker-Allowed': '/',
    },
  })
}
