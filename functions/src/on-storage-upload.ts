import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore'
import { logger } from 'firebase-functions/v2'
import { onObjectFinalized } from 'firebase-functions/v2/storage'

const POLICY_DOCUMENT_PATH =
  /^users\/([^/]+)\/policies\/([^/]+)\/docs\/([^/]+)\/[^/]+$/

const PDF_MIME = 'application/pdf'

type ParsedPolicyDocumentPath = {
  ownerUid: string
  policyId: string
  docId: string
}

function parsePolicyDocumentPath(
  filePath: string
): ParsedPolicyDocumentPath | null {
  const match = POLICY_DOCUMENT_PATH.exec(filePath)
  if (!match) {
    return null
  }

  const [, ownerUid, policyId, docId] = match
  if (!ownerUid || !policyId || !docId) {
    return null
  }

  return { ownerUid, policyId, docId }
}

/**
 * Storage finalize trigger: enqueue document processing job and link it on the
 * policy document's processing metadata.
 */
export const onPolicyDocumentUpload = onObjectFinalized(async (event) => {
  const filePath = event.data.name
  const contentType = event.data.contentType ?? ''

  if (!filePath) {
    return
  }

  if (contentType !== PDF_MIME) {
    logger.debug('Skipping non-PDF upload', { filePath, contentType })
    return
  }

  const parsed = parsePolicyDocumentPath(filePath)
  if (!parsed) {
    logger.warn('Ignored upload — path outside policy document layout', {
      filePath,
    })
    return
  }

  const metadata = event.data.metadata ?? {}
  if (metadata.ownerUid && metadata.ownerUid !== parsed.ownerUid) {
    logger.error('Storage metadata ownerUid mismatch', {
      filePath,
      pathOwnerUid: parsed.ownerUid,
      metadataOwnerUid: metadata.ownerUid,
    })
    return
  }

  const db = getFirestore()
  const jobRef = db.collection('jobs').doc()
  const documentRef = db
    .collection('policies')
    .doc(parsed.policyId)
    .collection('documents')
    .doc(parsed.docId)

  const now = Timestamp.now()
  const jobData = {
    ownerUid: parsed.ownerUid,
    policyId: parsed.policyId,
    docId: parsed.docId,
    storagePath: filePath,
    state: 'queued',
    processingState: 'pending',
    attempts: 0,
    pipeline: ['odl'],
    createdAt: now,
    updatedAt: now,
  }

  await db.runTransaction(async (transaction) => {
    transaction.set(jobRef, jobData)
    transaction.set(
      documentRef,
      {
        processing: {
          state: 'pending',
          jobId: jobRef.id,
        },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )
  })

  logger.info('Created document processing job', {
    jobId: jobRef.id,
    policyId: parsed.policyId,
    docId: parsed.docId,
    ownerUid: parsed.ownerUid,
  })

  // TODO 3.1: POST to Cloud Run worker with OIDC when WORKER_URL is configured.
})
