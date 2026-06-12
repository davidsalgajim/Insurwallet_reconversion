import { Timestamp } from 'firebase-admin/firestore'

import { getAdminFirestore } from '@/lib/firebase/admin'
import { DocumentChunkSchema, type DocumentChunk } from '@/lib/schemas/chunk'

const TARGET_CHARS = 2_000
const OVERLAP_CHARS = 200

export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4)
}

export function chunkText(
  text: string,
  docId: string,
  fileName?: string
): Omit<DocumentChunk, 'indexedAt'>[] {
  const normalized = text.replace(/\r\n/g, '\n').trim()
  if (!normalized) {
    return []
  }

  const chunks: Omit<DocumentChunk, 'indexedAt'>[] = []
  let offset = 0
  let page = 1

  while (offset < normalized.length) {
    let end = Math.min(offset + TARGET_CHARS, normalized.length)

    if (end < normalized.length) {
      const paragraphBreak = normalized.lastIndexOf('\n\n', end)
      const sentenceBreak = normalized.lastIndexOf('. ', end)
      const breakAt = Math.max(paragraphBreak, sentenceBreak)
      if (breakAt > offset + TARGET_CHARS / 2) {
        end = breakAt + (sentenceBreak === breakAt ? 2 : 2)
      }
    }

    const slice = normalized.slice(offset, end).trim()
    if (slice) {
      chunks.push({
        text: slice,
        page,
        tokenCount: estimateTokenCount(slice),
        docId,
        fileName,
      })
      page += 1
    }

    if (end >= normalized.length) {
      break
    }

    offset = Math.max(end - OVERLAP_CHARS, offset + 1)
  }

  return chunks
}

export async function indexDocumentChunks(input: {
  policyId: string
  docId: string
  text: string
  fileName?: string
}): Promise<number> {
  const db = getAdminFirestore()
  const chunks = chunkText(input.text, input.docId, input.fileName)
  const chunksRef = db
    .collection('policies')
    .doc(input.policyId)
    .collection('documents')
    .doc(input.docId)
    .collection('chunks')

  const existing = await chunksRef.get()
  const batch = db.batch()

  for (const doc of existing.docs) {
    batch.delete(doc.ref)
  }

  const now = new Date()
  for (const [index, chunk] of chunks.entries()) {
    const parsed = DocumentChunkSchema.parse({ ...chunk, indexedAt: now })
    batch.set(chunksRef.doc(String(index).padStart(4, '0')), {
      ...parsed,
      indexedAt: Timestamp.fromDate(parsed.indexedAt),
    })
  }

  await batch.commit()
  return chunks.length
}

export type ChunkSearchResult = DocumentChunk & {
  chunkId: string
  score: number
}

export function scoreChunkMatch(text: string, query: string): number {
  const haystack = text.toLowerCase()
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length > 2)

  if (terms.length === 0) {
    return 0
  }

  let hits = 0
  for (const term of terms) {
    if (haystack.includes(term)) {
      hits += 1
    }
  }

  return hits / terms.length
}

export async function searchDocumentChunks(input: {
  policyId: string
  docId?: string
  query: string
  limit?: number
}): Promise<ChunkSearchResult[]> {
  const db = getAdminFirestore()
  const limit = input.limit ?? 5
  const results: ChunkSearchResult[] = []

  const documentsSnap = await db
    .collection('policies')
    .doc(input.policyId)
    .collection('documents')
    .get()

  for (const docSnap of documentsSnap.docs) {
    if (input.docId && docSnap.id !== input.docId) {
      continue
    }

    const chunksSnap = await docSnap.ref.collection('chunks').get()
    for (const chunkSnap of chunksSnap.docs) {
      const data = chunkSnap.data()
      const parsed = DocumentChunkSchema.safeParse({
        ...data,
        indexedAt: data.indexedAt?.toDate?.() ?? new Date(),
      })

      if (!parsed.success) {
        continue
      }

      const score = scoreChunkMatch(parsed.data.text, input.query)
      if (score <= 0) {
        continue
      }

      results.push({
        ...parsed.data,
        chunkId: chunkSnap.id,
        score,
      })
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit)
}

export async function indexPolicyDocumentsForRag(
  policyId: string
): Promise<{ indexedDocuments: number; indexedChunks: number }> {
  const db = getAdminFirestore()
  const policySnap = await db.collection('policies').doc(policyId).get()
  if (!policySnap.exists) {
    throw new Error('Policy not found')
  }

  const policy = policySnap.data() ?? {}
  const documentsSnap = await db
    .collection('policies')
    .doc(policyId)
    .collection('documents')
    .get()

  let indexedDocuments = 0
  let indexedChunks = 0

  for (const docSnap of documentsSnap.docs) {
    const data = docSnap.data()
    const summary =
      typeof data.extractedSummary === 'string' ? data.extractedSummary : ''
    const fallbackParts = [
      summary,
      typeof policy.coverages === 'string' ? policy.coverages : '',
      typeof policy.exclusions === 'string' ? policy.exclusions : '',
      typeof policy.notes === 'string' ? policy.notes : '',
    ].filter(Boolean)

    const text = fallbackParts.join('\n\n').trim()
    if (!text) {
      continue
    }

    const count = await indexDocumentChunks({
      policyId,
      docId: docSnap.id,
      text,
      fileName: typeof data.fileName === 'string' ? data.fileName : undefined,
    })

    if (count > 0) {
      indexedDocuments += 1
      indexedChunks += count
    }
  }

  if (indexedDocuments === 0) {
    const syntheticText = [
      typeof policy.insurerName === 'string' ? policy.insurerName : '',
      typeof policy.policyNumber === 'string' ? policy.policyNumber : '',
      typeof policy.coverages === 'string' ? policy.coverages : '',
      typeof policy.exclusions === 'string' ? policy.exclusions : '',
      typeof policy.waitingPeriods === 'string' ? policy.waitingPeriods : '',
      typeof policy.notes === 'string' ? policy.notes : '',
    ]
      .filter(Boolean)
      .join('\n\n')

    if (syntheticText.trim()) {
      const count = await indexDocumentChunks({
        policyId,
        docId: 'policy-summary',
        text: syntheticText,
        fileName: 'policy-summary.txt',
      })
      indexedDocuments = 1
      indexedChunks = count
    }
  }

  return { indexedDocuments, indexedChunks }
}
