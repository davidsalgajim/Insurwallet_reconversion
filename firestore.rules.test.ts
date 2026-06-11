/**
 * Firestore Security Rules tests.
 *
 * Run with emulators:
 *   npm run emulators:exec -- "npm run test:rules"
 *
 * Requires @firebase/rules-unit-testing (install when implementing tests).
 */

import { describe, it } from 'vitest'

describe('firestore.rules', () => {
  it.todo('allows users to read and write their own user document')
  it.todo('denies users from reading or writing other users documents')
  it.todo('allows policy owner to create a policy with matching ownerUid')
  it.todo('allows policy owner to read, update, and delete their policies')
  it.todo('denies non-owners from accessing policies')
  it.todo('denies all access to unmatched collections')
})
