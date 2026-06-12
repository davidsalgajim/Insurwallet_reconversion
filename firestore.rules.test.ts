/**
 * Firestore Security Rules tests.
 *
 * Run with emulators:
 *   npm run emulators:exec -- "npm run test:rules"
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'

const PROJECT_ID = 'insurwallet-rules-test'
const FIRESTORE_HOST = '127.0.0.1'
const FIRESTORE_PORT = 8080
const RUN_RULES_TESTS = Boolean(process.env.FIRESTORE_EMULATOR_HOST)

const OWNER_UID = 'owner-uid'
const SHARED_UID = 'shared-uid'
const ATTACKER_UID = 'attacker-uid'
const OTHER_USER_UID = 'other-user-uid'

const policyFixture = {
  ownerUid: OWNER_UID,
  policyNumber: 'POL-001',
  insurerName: 'Seguros Demo',
  sharedWith: [SHARED_UID],
  status: 'active',
}

const documentFixture = {
  fileName: 'policy.pdf',
  category: 'cover',
  storagePath: `users/${OWNER_UID}/policies/policy-1/docs/doc-1.pdf`,
}

const auditLogFixture = {
  action: 'share',
  actorUid: OWNER_UID,
  createdAt: new Date().toISOString(),
}

let testEnv: RulesTestEnvironment

function dbFor(uid?: string) {
  if (uid) {
    return testEnv.authenticatedContext(uid).firestore()
  }

  return testEnv.unauthenticatedContext().firestore()
}

async function seedPolicy(
  policyId = 'policy-1',
  overrides: Partial<typeof policyFixture> = {}
) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const adminDb = context.firestore()
    await setDoc(doc(adminDb, 'policies', policyId), {
      ...policyFixture,
      ...overrides,
    })
  })
}

async function seedUser(userId: string, data: Record<string, unknown> = {}) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const adminDb = context.firestore()
    await setDoc(doc(adminDb, 'users', userId), {
      email: `${userId}@example.com`,
      displayName: userId,
      ...data,
    })
  })
}

describe.runIf(RUN_RULES_TESTS)('firestore.rules', () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: readFileSync(resolve(__dirname, 'firestore.rules'), 'utf8'),
        host: FIRESTORE_HOST,
        port: FIRESTORE_PORT,
      },
    })
  })

  afterAll(async () => {
    await testEnv.cleanup()
  })

  beforeEach(async () => {
    await testEnv.clearFirestore()
  })

  describe('users/{userId}', () => {
    it('allows users to read and write their own user document', async () => {
      await seedUser(OWNER_UID)

      const ownerDb = dbFor(OWNER_UID)
      await assertSucceeds(
        updateDoc(doc(ownerDb, 'users', OWNER_UID), { displayName: 'Owner' })
      )
      await assertSucceeds(getDoc(doc(ownerDb, 'users', OWNER_UID)))
    })

    it('denies users from reading or writing other users documents', async () => {
      await seedUser(OTHER_USER_UID)

      const ownerDb = dbFor(OWNER_UID)
      await assertFails(getDoc(doc(ownerDb, 'users', OTHER_USER_UID)))
      await assertFails(
        setDoc(doc(ownerDb, 'users', OTHER_USER_UID), { displayName: 'Hijack' })
      )
    })

    it('denies anonymous access to user documents', async () => {
      await seedUser(OWNER_UID)

      const anonDb = dbFor()
      await assertFails(getDoc(doc(anonDb, 'users', OWNER_UID)))
      await assertFails(
        setDoc(doc(anonDb, 'users', OWNER_UID), { displayName: 'Anon' })
      )
    })
  })

  describe('policies/{policyId}', () => {
    it('allows policy owner to create a policy with matching ownerUid', async () => {
      const ownerDb = dbFor(OWNER_UID)
      await assertSucceeds(
        setDoc(doc(ownerDb, 'policies', 'policy-new'), {
          ...policyFixture,
          sharedWith: [],
        })
      )
    })

    it('denies creating a policy with a different ownerUid', async () => {
      const ownerDb = dbFor(OWNER_UID)
      await assertFails(
        setDoc(doc(ownerDb, 'policies', 'policy-spoofed'), {
          ...policyFixture,
          ownerUid: ATTACKER_UID,
        })
      )
    })

    it('allows policy owner to read, update, and delete their policies', async () => {
      await seedPolicy()

      const ownerDb = dbFor(OWNER_UID)
      await assertSucceeds(getDoc(doc(ownerDb, 'policies', 'policy-1')))
      await assertSucceeds(
        updateDoc(doc(ownerDb, 'policies', 'policy-1'), { status: 'expiring' })
      )
      await assertSucceeds(deleteDoc(doc(ownerDb, 'policies', 'policy-1')))
    })

    it('allows shared users to read policies where their uid is in sharedWith', async () => {
      await seedPolicy()

      const sharedDb = dbFor(SHARED_UID)
      await assertSucceeds(getDoc(doc(sharedDb, 'policies', 'policy-1')))
    })

    it('denies shared users from writing policies', async () => {
      await seedPolicy()

      const sharedDb = dbFor(SHARED_UID)
      await assertFails(
        updateDoc(doc(sharedDb, 'policies', 'policy-1'), { status: 'expired' })
      )
      await assertFails(deleteDoc(doc(sharedDb, 'policies', 'policy-1')))
      await assertFails(
        setDoc(doc(sharedDb, 'policies', 'policy-2'), {
          ...policyFixture,
          ownerUid: OWNER_UID,
        })
      )
    })

    it('denies attackers from accessing policies they are not shared on', async () => {
      await seedPolicy()

      const attackerDb = dbFor(ATTACKER_UID)
      await assertFails(getDoc(doc(attackerDb, 'policies', 'policy-1')))
      await assertFails(
        updateDoc(doc(attackerDb, 'policies', 'policy-1'), {
          status: 'expired',
        })
      )
      await assertFails(deleteDoc(doc(attackerDb, 'policies', 'policy-1')))
    })

    it('denies anonymous access to policies', async () => {
      await seedPolicy()

      const anonDb = dbFor()
      await assertFails(getDoc(doc(anonDb, 'policies', 'policy-1')))
      await assertFails(
        setDoc(doc(anonDb, 'policies', 'policy-anon'), policyFixture)
      )
    })

    it('denies read when uid is not in sharedWith', async () => {
      await seedPolicy('policy-2', { sharedWith: [] })

      const sharedDb = dbFor(SHARED_UID)
      await assertFails(getDoc(doc(sharedDb, 'policies', 'policy-2')))
    })
  })

  describe('policies/{policyId}/documents', () => {
    it('allows owner CRUD on documents subcollection', async () => {
      await seedPolicy()

      const ownerDb = dbFor(OWNER_UID)
      const docRef = doc(ownerDb, 'policies', 'policy-1', 'documents', 'doc-1')

      await assertSucceeds(setDoc(docRef, documentFixture))
      await assertSucceeds(getDoc(docRef))
      await assertSucceeds(
        updateDoc(docRef, { fileName: 'updated-policy.pdf' })
      )
      await assertSucceeds(deleteDoc(docRef))
    })

    it('allows shared users to read documents but not write', async () => {
      await seedPolicy()
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore()
        await setDoc(
          doc(adminDb, 'policies', 'policy-1', 'documents', 'doc-1'),
          documentFixture
        )
      })

      const sharedDb = dbFor(SHARED_UID)
      const docRef = doc(sharedDb, 'policies', 'policy-1', 'documents', 'doc-1')

      await assertSucceeds(getDoc(docRef))
      await assertFails(
        setDoc(
          doc(sharedDb, 'policies', 'policy-1', 'documents', 'doc-2'),
          documentFixture
        )
      )
      await assertFails(updateDoc(docRef, { fileName: 'tampered.pdf' }))
      await assertFails(deleteDoc(docRef))
    })

    it('denies attackers and anonymous users from documents', async () => {
      await seedPolicy()
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore()
        await setDoc(
          doc(adminDb, 'policies', 'policy-1', 'documents', 'doc-1'),
          documentFixture
        )
      })

      const attackerDb = dbFor(ATTACKER_UID)
      const anonDb = dbFor()
      const attackerRef = doc(
        attackerDb,
        'policies',
        'policy-1',
        'documents',
        'doc-1'
      )
      const anonRef = doc(anonDb, 'policies', 'policy-1', 'documents', 'doc-1')

      await assertFails(getDoc(attackerRef))
      await assertFails(getDoc(anonRef))
      await assertFails(
        setDoc(
          doc(attackerDb, 'policies', 'policy-1', 'documents', 'doc-2'),
          documentFixture
        )
      )
    })
  })

  describe('policies/{policyId}/auditLogs', () => {
    it('allows owner CRUD on auditLogs subcollection', async () => {
      await seedPolicy()

      const ownerDb = dbFor(OWNER_UID)
      const logRef = doc(ownerDb, 'policies', 'policy-1', 'auditLogs', 'log-1')

      await assertSucceeds(setDoc(logRef, auditLogFixture))
      await assertSucceeds(getDoc(logRef))
      await assertSucceeds(updateDoc(logRef, { action: 'export' }))
      await assertSucceeds(deleteDoc(logRef))
    })

    it('allows shared users to read auditLogs but not write', async () => {
      await seedPolicy()
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore()
        await setDoc(
          doc(adminDb, 'policies', 'policy-1', 'auditLogs', 'log-1'),
          auditLogFixture
        )
      })

      const sharedDb = dbFor(SHARED_UID)
      const logRef = doc(sharedDb, 'policies', 'policy-1', 'auditLogs', 'log-1')

      await assertSucceeds(getDoc(logRef))
      await assertFails(
        setDoc(
          doc(sharedDb, 'policies', 'policy-1', 'auditLogs', 'log-2'),
          auditLogFixture
        )
      )
      await assertFails(updateDoc(logRef, { action: 'delete' }))
      await assertFails(deleteDoc(logRef))
    })

    it('denies attackers from auditLogs', async () => {
      await seedPolicy()
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore()
        await setDoc(
          doc(adminDb, 'policies', 'policy-1', 'auditLogs', 'log-1'),
          auditLogFixture
        )
      })

      const attackerDb = dbFor(ATTACKER_UID)
      const logRef = doc(
        attackerDb,
        'policies',
        'policy-1',
        'auditLogs',
        'log-1'
      )

      await assertFails(getDoc(logRef))
      await assertFails(
        setDoc(
          doc(attackerDb, 'policies', 'policy-1', 'auditLogs', 'log-2'),
          auditLogFixture
        )
      )
    })
  })

  describe('unmatched collections', () => {
    it('denies all access to unmatched collections', async () => {
      const ownerDb = dbFor(OWNER_UID)
      const attackerDb = dbFor(ATTACKER_UID)
      const anonDb = dbFor()

      await assertFails(
        setDoc(doc(ownerDb, 'shares', 'share-1'), { policyId: 'policy-1' })
      )
      await assertFails(getDoc(doc(attackerDb, 'jobs', 'job-1')))
      await assertFails(
        setDoc(doc(anonDb, 'jobs', 'job-1'), { state: 'pending' })
      )
    })

    it('denies access to other policy subcollections not explicitly allowed', async () => {
      await seedPolicy()

      const ownerDb = dbFor(OWNER_UID)
      await assertFails(
        setDoc(doc(ownerDb, 'policies', 'policy-1', 'benefits', 'benefit-1'), {
          name: 'Dental',
        })
      )
    })
  })
})
