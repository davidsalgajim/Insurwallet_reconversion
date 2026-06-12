/**
 * Firebase Storage Security Rules tests.
 *
 * Run with emulators:
 *   npm run emulators:exec -- "npm run test:storage-rules"
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { ref, uploadBytes, deleteObject, getBytes } from 'firebase/storage'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'

const PROJECT_ID = 'insurwallet-storage-rules-test'
const RUN_RULES_TESTS = Boolean(process.env.FIREBASE_STORAGE_EMULATOR_HOST)

const TWENTY_MB = 20 * 1024 * 1024
const TWENTY_MB_PLUS_ONE = TWENTY_MB + 1

function storagePath(uid: string, suffix = 'policies/p1/docs/doc1') {
  return `users/${uid}/${suffix}`
}

describe.runIf(RUN_RULES_TESTS)('storage.rules', () => {
  let testEnv: RulesTestEnvironment

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      storage: {
        rules: readFileSync(resolve(process.cwd(), 'storage.rules'), 'utf8'),
      },
    })
  })

  afterAll(async () => {
    await testEnv.cleanup()
  })

  beforeEach(async () => {
    await testEnv.clearStorage()
  })

  it('allows owner to upload allowed mime types under 20MB', async () => {
    const owner = testEnv.authenticatedContext('owner-a')
    const storage = owner.storage()

    for (const contentType of [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
    ]) {
      const fileRef = ref(storage, storagePath('owner-a', `docs/file-${contentType}`))
      await assertSucceeds(
        uploadBytes(fileRef, new Uint8Array(1024), { contentType })
      )
    }
  })

  it('denies uploads with disallowed mime types', async () => {
    const owner = testEnv.authenticatedContext('owner-a')
    const storage = owner.storage()
    const fileRef = ref(storage, storagePath('owner-a', 'docs/evil.exe'))

    await assertFails(
      uploadBytes(fileRef, new Uint8Array(512), {
        contentType: 'application/x-msdownload',
      })
    )
  })

  it('denies uploads larger than 20MB', async () => {
    const owner = testEnv.authenticatedContext('owner-a')
    const storage = owner.storage()
    const fileRef = ref(storage, storagePath('owner-a', 'docs/large.pdf'))

    await assertFails(
      uploadBytes(fileRef, new Uint8Array(TWENTY_MB_PLUS_ONE), {
        contentType: 'application/pdf',
      })
    )
  })

  it('allows owner to read and delete their files', async () => {
    const owner = testEnv.authenticatedContext('owner-a')
    const storage = owner.storage()
    const fileRef = ref(storage, storagePath('owner-a'))

    await assertSucceeds(
      uploadBytes(fileRef, new Uint8Array(256), {
        contentType: 'application/pdf',
      })
    )
    await assertSucceeds(getBytes(fileRef))
    await assertSucceeds(deleteObject(fileRef))
  })

  it('denies non-owners from reading or writing another user path', async () => {
    const owner = testEnv.authenticatedContext('owner-a')
    const attacker = testEnv.authenticatedContext('attacker-b')
    const ownerStorage = owner.storage()
    const attackerStorage = attacker.storage()
    const fileRef = ref(ownerStorage, storagePath('owner-a'))

    await assertSucceeds(
      uploadBytes(fileRef, new Uint8Array(256), {
        contentType: 'application/pdf',
      })
    )

    const attackerReadRef = ref(attackerStorage, storagePath('owner-a'))
    await assertFails(getBytes(attackerReadRef))

    const attackerWriteRef = ref(
      attackerStorage,
      storagePath('owner-a', 'policies/p1/docs/injected')
    )
    await assertFails(
      uploadBytes(attackerWriteRef, new Uint8Array(128), {
        contentType: 'application/pdf',
      })
    )
  })

  it('denies unauthenticated access', async () => {
    const anon = testEnv.unauthenticatedContext()
    const storage = anon.storage()
    const fileRef = ref(storage, storagePath('owner-a'))

    await assertFails(getBytes(fileRef))
    await assertFails(
      uploadBytes(fileRef, new Uint8Array(128), {
        contentType: 'application/pdf',
      })
    )
  })
})
