import { cookies } from 'next/headers'

import {
  appCheckDevHint,
  getAppCheckTokenForRest,
} from '@/lib/firebase/app-check-server'
import { getAdminFirestore } from '@/lib/firebase/admin'
import { firebaseConfig } from '@/lib/firebase/config'
import { SESSION_COOKIE_NAME } from '@/lib/firebase/session-config'
import { usesDevIdTokenSession } from '@/lib/firebase/session-server'
import {
  assertIdTokenForFirestoreRest,
  normalizeSessionToken,
} from '@/lib/firebase/session-token'

type FirestoreValue =
  | { nullValue: null }
  | { booleanValue: boolean }
  | { integerValue: string }
  | { doubleValue: number }
  | { stringValue: string }
  | { timestampValue: string }
  | { arrayValue: { values?: FirestoreValue[] } }
  | { mapValue: { fields?: Record<string, FirestoreValue> } }

function encodeValue(value: unknown): FirestoreValue {
  if (value === null || value === undefined) {
    return { nullValue: null }
  }

  if (typeof value === 'string') {
    return { stringValue: value }
  }

  if (typeof value === 'boolean') {
    return { booleanValue: value }
  }

  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value }
  }

  if (value instanceof Date) {
    return { timestampValue: value.toISOString() }
  }

  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map((item) => encodeValue(item)),
      },
    }
  }

  if (typeof value === 'object') {
    const fields: Record<string, FirestoreValue> = {}

    for (const [key, nested] of Object.entries(value)) {
      fields[key] = encodeValue(nested)
    }

    return { mapValue: { fields } }
  }

  throw new Error(`Unsupported Firestore value type: ${typeof value}`)
}

function decodeValue(value: FirestoreValue): unknown {
  if ('nullValue' in value) {
    return null
  }

  if ('booleanValue' in value) {
    return value.booleanValue
  }

  if ('integerValue' in value) {
    return Number(value.integerValue)
  }

  if ('doubleValue' in value) {
    return value.doubleValue
  }

  if ('stringValue' in value) {
    return value.stringValue
  }

  if ('timestampValue' in value) {
    return new Date(value.timestampValue)
  }

  if ('arrayValue' in value) {
    return (value.arrayValue.values ?? []).map((item) => decodeValue(item))
  }

  if ('mapValue' in value) {
    const result: Record<string, unknown> = {}

    for (const [key, nested] of Object.entries(value.mapValue.fields ?? {})) {
      result[key] = decodeValue(nested)
    }

    return result
  }

  return undefined
}

function getRestBaseUrl(): string {
  return `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`
}

function collectFieldPaths(
  data: Record<string, unknown>,
  prefix = ''
): string[] {
  const paths: string[] = []

  for (const [key, value] of Object.entries(data)) {
    const path = prefix ? `${prefix}.${key}` : key

    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      !(value instanceof Date)
    ) {
      paths.push(...collectFieldPaths(value as Record<string, unknown>, path))
      continue
    }

    paths.push(path)
  }

  return paths
}

function buildRestFields(
  data: Record<string, unknown>
): Record<string, FirestoreValue> {
  const fields: Record<string, FirestoreValue> = {}

  for (const [key, value] of Object.entries(data)) {
    fields[key] = encodeValue(value)
  }

  return fields
}

export async function getSessionIdToken(): Promise<string | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(SESSION_COOKIE_NAME)?.value
  return raw ? normalizeSessionToken(raw) : null
}

async function buildFirestoreRestHeaders(
  idToken: string
): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${assertIdTokenForFirestoreRest(idToken)}`,
  }

  const appCheckToken = await getAppCheckTokenForRest()
  if (appCheckToken) {
    headers['X-Firebase-AppCheck'] = appCheckToken
  }

  return headers
}

async function requireSessionIdToken(): Promise<string> {
  const idToken = await getSessionIdToken()

  if (!idToken) {
    throw new Error('Missing session token')
  }

  return idToken
}

async function readUserDocumentRest(
  uid: string,
  idToken: string
): Promise<Record<string, unknown> | undefined> {
  const response = await fetch(`${getRestBaseUrl()}/users/${uid}`, {
    headers: await buildFirestoreRestHeaders(idToken),
  })

  if (response.status === 404) {
    return undefined
  }

  if (!response.ok) {
    const body = await response.text()
    const hint =
      response.status === 403 && body.includes('PERMISSION_DENIED')
        ? ` ${appCheckDevHint()}`
        : ''
    throw new Error(
      `Firestore read failed (${response.status}): ${body}${hint}`
    )
  }

  const document = (await response.json()) as {
    fields?: Record<string, FirestoreValue>
  }
  const data: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(document.fields ?? {})) {
    data[key] = decodeValue(value)
  }

  return data
}

async function mergeUserDocumentRest(
  uid: string,
  idToken: string,
  data: Record<string, unknown>
): Promise<void> {
  const fieldPaths = collectFieldPaths(data)
  const query = fieldPaths
    .map((path) => `updateMask.fieldPaths=${encodeURIComponent(path)}`)
    .join('&')
  const response = await fetch(`${getRestBaseUrl()}/users/${uid}?${query}`, {
    method: 'PATCH',
    headers: {
      ...(await buildFirestoreRestHeaders(idToken)),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: buildRestFields(data),
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    const hint =
      response.status === 403 && body.includes('PERMISSION_DENIED')
        ? ` ${appCheckDevHint()}`
        : ''
    throw new Error(
      `Firestore write failed (${response.status}): ${body}${hint}`
    )
  }
}

export async function readUserDocument(
  uid: string
): Promise<Record<string, unknown> | undefined> {
  if (usesDevIdTokenSession()) {
    return readUserDocumentRest(uid, await requireSessionIdToken())
  }

  const snapshot = await getAdminFirestore().collection('users').doc(uid).get()
  return snapshot.data()
}

export async function mergeUserDocument(
  uid: string,
  data: Record<string, unknown>
): Promise<void> {
  if (usesDevIdTokenSession()) {
    await mergeUserDocumentRest(uid, await requireSessionIdToken(), data)
    return
  }

  await getAdminFirestore().collection('users').doc(uid).set(data, {
    merge: true,
  })
}

export async function appendUserArrayField(
  uid: string,
  field: string,
  value: string
): Promise<void> {
  const current = (await readUserDocument(uid)) ?? {}
  const existing = current[field]
  const values = Array.isArray(existing)
    ? existing.filter((item): item is string => typeof item === 'string')
    : []

  if (values.includes(value)) {
    await mergeUserDocument(uid, { updatedAt: new Date() })
    return
  }

  await mergeUserDocument(uid, {
    [field]: [...values, value],
    updatedAt: new Date(),
  })
}
