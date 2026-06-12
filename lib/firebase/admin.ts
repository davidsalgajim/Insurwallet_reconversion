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

const AUTH_EMULATOR_HOST = '127.0.0.1:9099'

function isAuthEmulatorEnabled(): boolean {
  return process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true'
}

function configureAuthEmulator(): void {
  if (!isAuthEmulatorEnabled()) {
    return
  }

  process.env.FIREBASE_AUTH_EMULATOR_HOST ??= AUTH_EMULATOR_HOST
}

function resolveProjectId(): string {
  return (
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
    process.env.GCLOUD_PROJECT ??
    'insurwallet-staging'
  )
}

function resolveAdminApp(): App {
  const existing = getApps()[0]
  if (existing) {
    return existing
  }

  configureAuthEmulator()

  const projectId = resolveProjectId()
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT

  if (serviceAccountJson) {
    const serviceAccount = JSON.parse(serviceAccountJson) as ServiceAccount & {
      project_id?: string
    }

    return initializeApp({
      credential: cert(serviceAccount),
      projectId:
        serviceAccount.projectId ?? serviceAccount.project_id ?? projectId,
    })
  }

  if (isAuthEmulatorEnabled()) {
    return initializeApp({ projectId })
  }

  return initializeApp({
    credential: applicationDefault(),
    projectId,
  })
}

let adminAuth: Auth | null = null
let adminFirestore: Firestore | null = null

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
