import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
  type App,
  type ServiceAccount,
} from 'firebase-admin/app'
import { getAuth, type Auth } from 'firebase-admin/auth'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { getStorage, type Storage } from 'firebase-admin/storage'

const AUTH_EMULATOR_HOST = '127.0.0.1:9099'
const FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080'

function isAuthEmulatorEnabled(): boolean {
  return process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true'
}

function configureEmulators(): void {
  if (!isAuthEmulatorEnabled()) {
    return
  }

  process.env.FIREBASE_AUTH_EMULATOR_HOST ??= AUTH_EMULATOR_HOST
  process.env.FIRESTORE_EMULATOR_HOST ??= FIRESTORE_EMULATOR_HOST
}

function resolveProjectId(): string {
  return (
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
    process.env.GCLOUD_PROJECT ??
    'insurwallet-staging'
  )
}

function loadServiceAccountFromEnv():
  | (ServiceAccount & {
      project_id?: string
    })
  | null {
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT?.trim()
  if (inline) {
    return JSON.parse(inline) as ServiceAccount & { project_id?: string }
  }

  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()
  if (!credPath) {
    return null
  }

  const content = readFileSync(resolve(credPath), 'utf8')
  return JSON.parse(content) as ServiceAccount & { project_id?: string }
}

export function hasFirebaseAdminCredentials(): boolean {
  if (process.env.FIREBASE_SERVICE_ACCOUNT?.trim()) {
    return true
  }

  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()
  if (!credPath) {
    return false
  }

  try {
    readFileSync(resolve(credPath))
    return true
  } catch {
    return false
  }
}

function resolveAdminApp(): App {
  const existing = getApps()[0]
  if (existing) {
    return existing
  }

  configureEmulators()

  const projectId = resolveProjectId()
  const serviceAccount = loadServiceAccountFromEnv()

  if (serviceAccount) {
    return initializeApp({
      credential: cert(serviceAccount),
      projectId:
        serviceAccount.projectId ?? serviceAccount.project_id ?? projectId,
    })
  }

  if (isAuthEmulatorEnabled()) {
    return initializeApp({ projectId })
  }

  if (process.env.NODE_ENV === 'development') {
    return initializeApp({ projectId })
  }

  return initializeApp({
    credential: applicationDefault(),
    projectId,
  })
}

let adminAuth: Auth | null = null
let adminFirestore: Firestore | null = null
let adminStorage: Storage | null = null

export function getAdminAuth(): Auth {
  if (!adminAuth) {
    adminAuth = getAuth(resolveAdminApp())
  }

  return adminAuth
}

export function getAdminFirestore(): Firestore {
  if (!adminFirestore) {
    adminFirestore = getFirestore(resolveAdminApp())
  }

  return adminFirestore
}

export function getAdminStorage(): Storage {
  if (!adminStorage) {
    adminStorage = getStorage(resolveAdminApp())
  }

  return adminStorage
}
