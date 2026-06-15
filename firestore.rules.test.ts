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
  storagePath: `users/${OWNER_UID}/policies/policy-1/docs/doc-1/policy.pdf`,
  mimeType: 'application/pdf',
  fileSize: 1024,
  processing: { state: 'pending' },
}

const auditLogFixture = {
  action: 'share',
  actorUid: OWNER_UID,
  createdAt: new Date().toISOString(),
}

const jobFixture = {
  ownerUid: OWNER_UID,
  policyId: 'policy-1',
  docId: 'doc-1',
  storagePath: `users/${OWNER_UID}/policies/policy-1/docs/doc-1/policy.pdf`,
  state: 'queued',
  processingState: 'pending',
  attempts: 0,
  pipeline: ['odl'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const shareFixture = {
  policyId: 'policy-1',
  ownerUid: OWNER_UID,
  recipientEmail: 'shared@example.com',
  permission: 'view',
  tokenHash: 'abc123hash',
  expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
  status: 'pending',
  createdAt: new Date().toISOString(),
}

const chatMessageFixture = {
  role: 'user',
  content: '¿Cuándo vence mi póliza?',
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

    it('denies client writes to subscription field', async () => {
      await seedUser(OWNER_UID, {
        subscription: { plan: 'free', status: 'active' },
      })

      const ownerDb = dbFor(OWNER_UID)
      await assertFails(
        updateDoc(doc(ownerDb, 'users', OWNER_UID), {
          subscription: { plan: 'premium', status: 'active' },
        })
      )
    })

    it('allows client updates to non-subscription fields', async () => {
      await seedUser(OWNER_UID, {
        subscription: { plan: 'free', status: 'active' },
      })

      const ownerDb = dbFor(OWNER_UID)
      await assertSucceeds(
        updateDoc(doc(ownerDb, 'users', OWNER_UID), {
          displayName: 'Updated Name',
        })
      )
    })

    it('allows owner to read user auditLogs but not write them', async () => {
      await seedUser(OWNER_UID)

      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore()
        await setDoc(doc(adminDb, 'users', OWNER_UID, 'auditLogs', 'log-1'), {
          action: 'consent.cloudAI',
          outcome: 'accepted',
          at: new Date().toISOString(),
          version: '2026-06-01',
          source: 'settings',
        })
      })

      const ownerDb = dbFor(OWNER_UID)
      await assertSucceeds(
        getDoc(doc(ownerDb, 'users', OWNER_UID, 'auditLogs', 'log-1'))
      )
      await assertFails(
        setDoc(doc(ownerDb, 'users', OWNER_UID, 'auditLogs', 'log-2'), {
          action: 'consent.cloudAI',
          outcome: 'declined',
          at: new Date().toISOString(),
          version: '2026-06-01',
          source: 'settings',
        })
      )
    })

    it('allows owner CRUD on contacts subcollection', async () => {
      await seedUser(OWNER_UID)
      const ownerDb = dbFor(OWNER_UID)
      const contactRef = doc(ownerDb, 'users', OWNER_UID, 'contacts', 'c-1')

      await assertSucceeds(
        setDoc(contactRef, {
          type: 'agent',
          name: 'Ana Pérez',
          phone: '+57 300',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      )
      await assertSucceeds(getDoc(contactRef))
      await assertSucceeds(updateDoc(contactRef, { phone: '+57 301' }))
      await assertSucceeds(deleteDoc(contactRef))
    })

    it('denies other users from contacts subcollection', async () => {
      await seedUser(OWNER_UID)

      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore()
        await setDoc(doc(adminDb, 'users', OWNER_UID, 'contacts', 'c-1'), {
          type: 'agent',
          name: 'Ana Pérez',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      })

      const attackerDb = dbFor(ATTACKER_UID)
      await assertFails(
        getDoc(doc(attackerDb, 'users', OWNER_UID, 'contacts', 'c-1'))
      )
      await assertFails(
        setDoc(doc(attackerDb, 'users', OWNER_UID, 'contacts', 'c-2'), {
          type: 'agent',
          name: 'Hijack',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      )
    })

    it('allows owner CRUD on global beneficiaries subcollection', async () => {
      await seedUser(OWNER_UID)
      const ownerDb = dbFor(OWNER_UID)
      const beneficiaryRef = doc(
        ownerDb,
        'users',
        OWNER_UID,
        'beneficiaries',
        'b-1'
      )

      await assertSucceeds(
        setDoc(beneficiaryRef, {
          name: 'María García',
          idType: 'cc',
          idNumber: '123',
          relationship: 'Cónyuge',
          pct: 50,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      )
      await assertSucceeds(getDoc(beneficiaryRef))
      await assertSucceeds(updateDoc(beneficiaryRef, { pct: 60 }))
      await assertSucceeds(deleteDoc(beneficiaryRef))
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

    it('denies policy owner from changing ownerUid on update', async () => {
      await seedPolicy()

      const ownerDb = dbFor(OWNER_UID)
      await assertFails(
        updateDoc(doc(ownerDb, 'policies', 'policy-1'), {
          ownerUid: ATTACKER_UID,
        })
      )
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

    it('denies documents with invalid storagePath or mimeType', async () => {
      await seedPolicy()

      const ownerDb = dbFor(OWNER_UID)

      await assertFails(
        setDoc(doc(ownerDb, 'policies', 'policy-1', 'documents', 'doc-1'), {
          ...documentFixture,
          storagePath: `users/${ATTACKER_UID}/policies/policy-1/docs/doc-1/policy.pdf`,
        })
      )

      await assertFails(
        setDoc(doc(ownerDb, 'policies', 'policy-1', 'documents', 'doc-2'), {
          ...documentFixture,
          storagePath: `users/${OWNER_UID}/policies/policy-1/docs/doc-1/policy.pdf`,
        })
      )

      await assertFails(
        setDoc(doc(ownerDb, 'policies', 'policy-1', 'documents', 'doc-3'), {
          ...documentFixture,
          mimeType: 'text/plain',
        })
      )

      await assertSucceeds(
        setDoc(doc(ownerDb, 'policies', 'policy-1', 'documents', 'doc-4'), {
          ...documentFixture,
          mimeType: 'image/png',
          fileName: 'scan.png',
          storagePath: `users/${OWNER_UID}/policies/policy-1/docs/doc-4/scan.png`,
        })
      )
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
    it('allows owner create and read on auditLogs but not update or delete', async () => {
      await seedPolicy()

      const ownerDb = dbFor(OWNER_UID)
      const logRef = doc(ownerDb, 'policies', 'policy-1', 'auditLogs', 'log-1')

      await assertSucceeds(setDoc(logRef, auditLogFixture))
      await assertSucceeds(getDoc(logRef))
      await assertFails(updateDoc(logRef, { action: 'export' }))
      await assertFails(deleteDoc(logRef))
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

  describe('jobs/{jobId}', () => {
    async function seedJob(
      jobId = 'job-1',
      overrides: Partial<typeof jobFixture> = {}
    ) {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore()
        await setDoc(doc(adminDb, 'jobs', jobId), {
          ...jobFixture,
          ...overrides,
        })
      })
    }

    it('allows owner to read their job', async () => {
      await seedJob()

      const ownerDb = dbFor(OWNER_UID)
      await assertSucceeds(getDoc(doc(ownerDb, 'jobs', 'job-1')))
    })

    it('denies other users from reading jobs', async () => {
      await seedJob()

      const attackerDb = dbFor(ATTACKER_UID)
      await assertFails(getDoc(doc(attackerDb, 'jobs', 'job-1')))
    })

    it('denies anonymous read of jobs', async () => {
      await seedJob()

      const anonDb = dbFor()
      await assertFails(getDoc(doc(anonDb, 'jobs', 'job-1')))
    })

    it('denies client writes to jobs (Admin SDK only)', async () => {
      await seedJob()

      const ownerDb = dbFor(OWNER_UID)
      await assertFails(
        setDoc(doc(ownerDb, 'jobs', 'job-2'), {
          ...jobFixture,
          docId: 'doc-2',
        })
      )
      await assertFails(
        updateDoc(doc(ownerDb, 'jobs', 'job-1'), { state: 'completed' })
      )
      await assertFails(deleteDoc(doc(ownerDb, 'jobs', 'job-1')))
    })
  })

  describe('chats/{uid}/messages', () => {
    it('allows owners to read and append chat messages', async () => {
      const ownerDb = dbFor(OWNER_UID)
      const messageRef = doc(ownerDb, 'chats', OWNER_UID, 'messages', 'msg-1')

      await assertSucceeds(setDoc(messageRef, chatMessageFixture))
      await assertSucceeds(getDoc(messageRef))
    })

    it('denies other users from reading or writing chat messages', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore()
        await setDoc(
          doc(adminDb, 'chats', OWNER_UID, 'messages', 'msg-1'),
          chatMessageFixture
        )
      })

      const attackerDb = dbFor(ATTACKER_UID)
      const messageRef = doc(
        attackerDb,
        'chats',
        OWNER_UID,
        'messages',
        'msg-1'
      )

      await assertFails(getDoc(messageRef))
      await assertFails(
        setDoc(
          doc(attackerDb, 'chats', OWNER_UID, 'messages', 'msg-2'),
          chatMessageFixture
        )
      )
    })

    it('denies updating or deleting chat messages', async () => {
      const ownerDb = dbFor(OWNER_UID)
      const messageRef = doc(ownerDb, 'chats', OWNER_UID, 'messages', 'msg-1')

      await assertSucceeds(setDoc(messageRef, chatMessageFixture))
      await assertFails(updateDoc(messageRef, { content: 'tampered' }))
      await assertFails(deleteDoc(messageRef))
    })
  })

  describe('shares/{tokenHash}', () => {
    it('allows owners to create shares with matching ownerUid', async () => {
      const ownerDb = dbFor(OWNER_UID)
      await assertSucceeds(
        setDoc(doc(ownerDb, 'shares', shareFixture.tokenHash), shareFixture)
      )
    })

    it('denies creating shares for another ownerUid', async () => {
      const ownerDb = dbFor(OWNER_UID)
      await assertFails(
        setDoc(doc(ownerDb, 'shares', 'spoofed-hash'), {
          ...shareFixture,
          ownerUid: ATTACKER_UID,
        })
      )
    })

    it('allows owners to read, update, and delete their shares', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore()
        await setDoc(
          doc(adminDb, 'shares', shareFixture.tokenHash),
          shareFixture
        )
      })

      const ownerDb = dbFor(OWNER_UID)
      const shareRef = doc(ownerDb, 'shares', shareFixture.tokenHash)

      await assertSucceeds(getDoc(shareRef))
      await assertSucceeds(updateDoc(shareRef, { status: 'revoked' }))
      await assertSucceeds(deleteDoc(shareRef))
    })

    it('allows recipients to read and accept pending shares', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore()
        await setDoc(
          doc(adminDb, 'shares', shareFixture.tokenHash),
          shareFixture
        )
      })

      const recipientDb = testEnv
        .authenticatedContext(SHARED_UID, { email: 'shared@example.com' })
        .firestore()
      const shareRef = doc(recipientDb, 'shares', shareFixture.tokenHash)

      await assertSucceeds(getDoc(shareRef))
      await assertSucceeds(
        updateDoc(shareRef, {
          status: 'accepted',
          recipientUid: SHARED_UID,
        })
      )
    })

    it('denies attackers and anonymous users from shares', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore()
        await setDoc(
          doc(adminDb, 'shares', shareFixture.tokenHash),
          shareFixture
        )
      })

      const attackerDb = dbFor(ATTACKER_UID)
      const anonDb = dbFor()
      const shareRef = doc(attackerDb, 'shares', shareFixture.tokenHash)

      await assertFails(getDoc(shareRef))
      await assertFails(getDoc(doc(anonDb, 'shares', shareFixture.tokenHash)))
      await assertFails(
        setDoc(doc(attackerDb, 'shares', 'other-hash'), shareFixture)
      )
    })
  })

  describe('unmatched collections', () => {
    it('denies all access to unmatched collections', async () => {
      const ownerDb = dbFor(OWNER_UID)

      await assertFails(
        setDoc(doc(ownerDb, 'unknown', 'doc-1'), { value: true })
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
