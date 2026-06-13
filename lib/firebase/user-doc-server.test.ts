import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

const getAdminFirestore = vi.fn()
const usesDevIdTokenSession = vi.fn()

vi.mock('@/lib/firebase/config', () => ({
  firebaseConfig: { projectId: 'insurwallet-staging' },
  useFirebaseEmulators: false,
}))

vi.mock('@/lib/firebase/admin', () => ({
  getAdminFirestore: () => getAdminFirestore(),
}))

vi.mock('@/lib/firebase/session-server', () => ({
  usesDevIdTokenSession: () => usesDevIdTokenSession(),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) =>
      name === '__session' ? { value: 'dev-id-token' } : undefined,
  })),
}))

import {
  appendUserArrayField,
  mergeUserDocument,
  readUserDocument,
} from '@/lib/firebase/user-doc-server'

describe('user-doc-server', () => {
  beforeEach(() => {
    getAdminFirestore.mockReset()
    usesDevIdTokenSession.mockReset()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('reads user documents via Admin SDK when credentials are available', async () => {
    usesDevIdTokenSession.mockReturnValue(false)

    const get = vi.fn().mockResolvedValue({
      data: () => ({ notificationPrefs: { expiry: true } }),
    })
    getAdminFirestore.mockReturnValue({
      collection: () => ({
        doc: () => ({ get }),
      }),
    })

    await expect(readUserDocument('user-123')).resolves.toEqual({
      notificationPrefs: { expiry: true },
    })
  })

  it('reads user documents via Firestore REST in dev fallback mode', async () => {
    usesDevIdTokenSession.mockReturnValue(true)

    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          fields: {
            consents: {
              mapValue: {
                fields: {
                  cookies: { timestampValue: '2026-06-12T12:00:00.000Z' },
                },
              },
            },
          },
        }),
        { status: 200 }
      )
    )

    const data = await readUserDocument('user-123')

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/documents/users/user-123'),
      expect.objectContaining({
        headers: { Authorization: 'Bearer dev-id-token' },
      })
    )
    expect(data?.consents).toEqual({
      cookies: new Date('2026-06-12T12:00:00.000Z'),
    })
  })

  it('merges user documents via Firestore REST in dev fallback mode', async () => {
    usesDevIdTokenSession.mockReturnValue(true)

    vi.mocked(fetch).mockResolvedValue(new Response('', { status: 200 }))

    await mergeUserDocument('user-123', {
      notificationPrefs: { expiry: true },
      updatedAt: new Date('2026-06-12T12:00:00.000Z'),
    })

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(
        '/documents/users/user-123?updateMask.fieldPaths=notificationPrefs.expiry&updateMask.fieldPaths=updatedAt'
      ),
      expect.objectContaining({
        method: 'PATCH',
        headers: expect.objectContaining({
          Authorization: 'Bearer dev-id-token',
        }),
      })
    )
  })

  it('appends unique values to array fields', async () => {
    usesDevIdTokenSession.mockReturnValue(false)

    const set = vi.fn().mockResolvedValue(undefined)
    const get = vi
      .fn()
      .mockResolvedValueOnce({
        data: () => ({ fcmTokens: ['existing-token'] }),
      })
      .mockResolvedValueOnce({
        data: () => ({ fcmTokens: ['existing-token', 'new-token'] }),
      })

    getAdminFirestore.mockReturnValue({
      collection: () => ({
        doc: () => ({ get, set }),
      }),
    })

    await appendUserArrayField('user-123', 'fcmTokens', 'new-token')

    expect(set).toHaveBeenCalledWith(
      {
        fcmTokens: ['existing-token', 'new-token'],
        updatedAt: expect.any(Date),
      },
      { merge: true }
    )
  })
})
