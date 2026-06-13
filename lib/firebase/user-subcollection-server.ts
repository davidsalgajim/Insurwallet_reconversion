import {
  appCheckDevHint,
  getAppCheckTokenForRest,
} from '@/lib/firebase/app-check-server'
import { getAdminFirestore } from '@/lib/firebase/admin'
import { firebaseConfig } from '@/lib/firebase/config'
import { assertIdTokenForFirestoreRest } from '@/lib/firebase/session-token'
import { usesDevIdTokenSession } from '@/lib/firebase/session-server'
import { getSessionIdToken } from '@/lib/firebase/user-doc-server'

type FirestoreValue =
  | { nullValue: null }
  | { booleanValue: boolean }
  | { integerValue: string }
  | { doubleValue: number }
  | { stringValue: string }
  | { timestampValue: string }
  | { arrayValue: { values?: FirestoreValue[] } }
  | { mapValue: { fields?: Record<string, FirestoreValue> } }

export type SubcollectionDoc = {
  id: string
  data: Record<string, unknown>
}

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

function decodeDocument(document: {
  name?: string
  fields?: Record<string, FirestoreValue>
}): SubcollectionDoc {
  const id = document.name?.split('/').pop() ?? ''
  const data: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(document.fields ?? {})) {
    data[key] = decodeValue(value)
  }

  return { id, data }
}

function getRestBaseUrl(): string {
  return `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`
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

function buildRestFields(
  data: Record<string, unknown>
): Record<string, FirestoreValue> {
  const fields: Record<string, FirestoreValue> = {}

  for (const [key, value] of Object.entries(data)) {
    fields[key] = encodeValue(value)
  }

  return fields
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

async function readSubcollectionRest(
  uid: string,
  collection: string,
  idToken: string
): Promise<SubcollectionDoc[]> {
  const response = await fetch(
    `${getRestBaseUrl()}/users/${uid}/${collection}`,
    { headers: await buildFirestoreRestHeaders(idToken) }
  )

  if (!response.ok) {
    const body = await response.text()
    const hint =
      response.status === 403 && body.includes('PERMISSION_DENIED')
        ? ` ${appCheckDevHint()}`
        : ''
    throw new Error(
      `Firestore list failed (${response.status}): ${body}${hint}`
    )
  }

  const payload = (await response.json()) as {
    documents?: Array<{
      name?: string
      fields?: Record<string, FirestoreValue>
    }>
  }

  return (payload.documents ?? []).map((document) => decodeDocument(document))
}

async function writeSubcollectionDocRest(
  uid: string,
  collection: string,
  idToken: string,
  data: Record<string, unknown>,
  documentId?: string
): Promise<string> {
  const fieldPaths = collectFieldPaths(data)
  const query = fieldPaths
    .map((path) => `updateMask.fieldPaths=${encodeURIComponent(path)}`)
    .join('&')

  const docId = documentId ?? crypto.randomUUID().replace(/-/g, '').slice(0, 20)
  const response = await fetch(
    `${getRestBaseUrl()}/users/${uid}/${collection}/${docId}?${query}`,
    {
      method: 'PATCH',
      headers: {
        ...(await buildFirestoreRestHeaders(idToken)),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields: buildRestFields(data) }),
    }
  )

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Firestore write failed (${response.status}): ${body}`)
  }

  return docId
}

async function deleteSubcollectionDocRest(
  uid: string,
  collection: string,
  documentId: string,
  idToken: string
): Promise<void> {
  const response = await fetch(
    `${getRestBaseUrl()}/users/${uid}/${collection}/${documentId}`,
    {
      method: 'DELETE',
      headers: await buildFirestoreRestHeaders(idToken),
    }
  )

  if (!response.ok && response.status !== 404) {
    const body = await response.text()
    throw new Error(`Firestore delete failed (${response.status}): ${body}`)
  }
}

export async function readUserSubcollection(
  uid: string,
  collection: string
): Promise<SubcollectionDoc[]> {
  if (usesDevIdTokenSession()) {
    const idToken = await getSessionIdToken()
    if (!idToken) {
      throw new Error('Missing session token')
    }
    return readSubcollectionRest(uid, collection, idToken)
  }

  const snap = await getAdminFirestore()
    .collection('users')
    .doc(uid)
    .collection(collection)
    .get()

  return snap.docs.map((doc) => ({
    id: doc.id,
    data: doc.data() as Record<string, unknown>,
  }))
}

export async function writeUserSubcollectionDoc(
  uid: string,
  collection: string,
  data: Record<string, unknown>,
  options?: {
    documentId?: string
    useAdminTimestamps?: boolean
    adminRecord?: Record<string, unknown>
  }
): Promise<string> {
  if (usesDevIdTokenSession()) {
    const idToken = await getSessionIdToken()
    if (!idToken) {
      throw new Error('Missing session token')
    }
    return writeSubcollectionDocRest(
      uid,
      collection,
      idToken,
      data,
      options?.documentId
    )
  }

  const db = getAdminFirestore()
  const docRef = options?.documentId
    ? db
        .collection('users')
        .doc(uid)
        .collection(collection)
        .doc(options.documentId)
    : db.collection('users').doc(uid).collection(collection).doc()

  await docRef.set(options?.adminRecord ?? data, { merge: true })
  return docRef.id
}

export async function deleteUserSubcollectionDoc(
  uid: string,
  collection: string,
  documentId: string
): Promise<void> {
  if (usesDevIdTokenSession()) {
    const idToken = await getSessionIdToken()
    if (!idToken) {
      throw new Error('Missing session token')
    }
    await deleteSubcollectionDocRest(uid, collection, documentId, idToken)
    return
  }

  await getAdminFirestore()
    .collection('users')
    .doc(uid)
    .collection(collection)
    .doc(documentId)
    .delete()
}
