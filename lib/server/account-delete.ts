import type { Firestore } from 'firebase-admin/firestore'
import { FieldValue } from 'firebase-admin/firestore'

import {
  getAdminAuth,
  getAdminFirestore,
  getAdminStorage,
} from '@/lib/firebase/admin'

const BATCH_LIMIT = 400

async function deletePolicySubcollections(
  db: Firestore,
  policyId: string
): Promise<void> {
  for (const subcollection of ['documents', 'auditLogs'] as const) {
    while (true) {
      const snapshot = await db
        .collection('policies')
        .doc(policyId)
        .collection(subcollection)
        .limit(BATCH_LIMIT)
        .get()

      if (snapshot.empty) {
        break
      }

      const batch = db.batch()
      snapshot.docs.forEach((docSnap) => batch.delete(docSnap.ref))
      await batch.commit()
    }
  }
}

async function deleteStoragePrefix(prefix: string): Promise<number> {
  const bucket = getAdminStorage().bucket()
  const [files] = await bucket.getFiles({ prefix })
  await Promise.all(files.map((file) => file.delete().catch(() => undefined)))
  return files.length
}

export async function deleteUserAccountData(uid: string): Promise<{
  policiesDeleted: number
  storageObjectsDeleted: number
}> {
  const db = getAdminFirestore()
  const policiesSnap = await db
    .collection('policies')
    .where('ownerUid', '==', uid)
    .get()

  let storageObjectsDeleted = 0

  for (const policyDoc of policiesSnap.docs) {
    const documentsSnap = await db
      .collection('policies')
      .doc(policyDoc.id)
      .collection('documents')
      .get()

    for (const document of documentsSnap.docs) {
      const storagePath = document.data().storagePath as string | undefined

      if (storagePath) {
        try {
          await getAdminStorage().bucket().file(storagePath).delete()
          storageObjectsDeleted += 1
        } catch {
          // Object may already be gone.
        }
      }
    }

    await deletePolicySubcollections(db, policyDoc.id)
    await policyDoc.ref.delete()
  }

  const ownedShares = await db
    .collection('shares')
    .where('ownerUid', '==', uid)
    .get()

  if (!ownedShares.empty) {
    const batch = db.batch()
    ownedShares.docs.forEach((docSnap) => batch.delete(docSnap.ref))
    await batch.commit()
  }

  while (true) {
    const snapshot = await db
      .collection('chats')
      .doc(uid)
      .collection('messages')
      .limit(BATCH_LIMIT)
      .get()

    if (snapshot.empty) {
      break
    }

    const batch = db.batch()
    snapshot.docs.forEach((docSnap) => batch.delete(docSnap.ref))
    await batch.commit()
  }

  await db
    .collection('chats')
    .doc(uid)
    .delete()
    .catch(() => undefined)
  await db
    .collection('users')
    .doc(uid)
    .delete()
    .catch(() => undefined)

  storageObjectsDeleted += await deleteStoragePrefix(`users/${uid}/`)

  await db.collection('accountAuditLogs').add({
    action: 'account_deleted',
    uid,
    policiesDeleted: policiesSnap.size,
    storageObjectsDeleted,
    performedBy: uid,
    createdAt: FieldValue.serverTimestamp(),
  })

  await getAdminAuth().deleteUser(uid)

  return {
    policiesDeleted: policiesSnap.size,
    storageObjectsDeleted,
  }
}
