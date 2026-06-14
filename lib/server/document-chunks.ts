import { Timestamp } from 'firebase-admin/firestore'

import { getAdminFirestore } from '@/lib/firebase/admin'
import { DocumentChunkSchema, type DocumentChunk } from '@/lib/schemas/chunk'
import { resolveDocumentRagText } from '@/lib/server/document-text-storage'
import { embedTexts, isEmbeddingsConfigured } from '@/lib/server/embeddings'

const TARGET_CHARS = 2_000
const OVERLAP_CHARS = 200
const MIN_FULL_TEXT_CHARS = 200

export function buildPolicyRagSupplement(
  policy: Record<string, unknown>
): string {
  const parts = [
    typeof policy.coverages === 'string' ? policy.coverages : '',
    typeof policy.exclusions === 'string' ? policy.exclusions : '',
    typeof policy.waitingPeriods === 'string' ? policy.waitingPeriods : '',
    typeof policy.notes === 'string' ? policy.notes : '',
  ].filter(Boolean)

  return parts.join('\n\n').trim()
}

export function buildPolicySyntheticRagText(
  policy: Record<string, unknown>
): string {
  return [
    typeof policy.insurerName === 'string' ? policy.insurerName : '',
    typeof policy.policyNumber === 'string' ? policy.policyNumber : '',
    typeof policy.coverages === 'string' ? policy.coverages : '',
    typeof policy.exclusions === 'string' ? policy.exclusions : '',
    typeof policy.waitingPeriods === 'string' ? policy.waitingPeriods : '',
    typeof policy.notes === 'string' ? policy.notes : '',
  ]
    .filter(Boolean)
    .join('\n\n')
    .trim()
}

export async function resolveIndexingText(input: {
  document: Record<string, unknown>
  policy: Record<string, unknown>
}): Promise<string> {
  const docText = await resolveDocumentRagText({
    extractedSummary:
      typeof input.document.extractedSummary === 'string'
        ? input.document.extractedSummary
        : undefined,
    extractedTextPath:
      typeof input.document.extractedTextPath === 'string'
        ? input.document.extractedTextPath
        : undefined,
  })

  if (docText.length >= MIN_FULL_TEXT_CHARS) {
    return docText
  }

  const supplement = buildPolicyRagSupplement(input.policy)
  return [docText, supplement].filter(Boolean).join('\n\n').trim()
}

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
  generateEmbeddings?: boolean
}): Promise<number> {
  const db = getAdminFirestore()
  const chunks = chunkText(input.text, input.docId, input.fileName)
  const shouldEmbed =
    input.generateEmbeddings === true && isEmbeddingsConfigured()
  const embeddings = shouldEmbed
    ? await embedTexts(chunks.map((chunk) => chunk.text))
    : []

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
    const embedding = embeddings[index] ?? undefined
    const parsed = DocumentChunkSchema.parse({
      ...chunk,
      ...(embedding ? { embedding } : {}),
      indexedAt: now,
    })
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

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) {
    return 0
  }

  let dot = 0
  let normA = 0
  let normB = 0

  for (let index = 0; index < a.length; index += 1) {
    dot += a[index]! * b[index]!
    normA += a[index]! * a[index]!
    normB += b[index]! * b[index]!
  }

  if (normA === 0 || normB === 0) {
    return 0
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

export function combineChunkScores(
  termScore: number,
  vectorScore: number
): number {
  if (vectorScore <= 0) {
    return termScore
  }

  return Math.max(termScore, termScore * 0.35 + vectorScore * 0.65)
}

async function assertPolicyReadable(
  uid: string,
  policyId: string
): Promise<boolean> {
  const db = getAdminFirestore()
  const policySnap = await db.collection('policies').doc(policyId).get()
  if (!policySnap.exists) {
    return false
  }

  const data = policySnap.data() ?? {}
  if (data.ownerUid === uid) {
    return true
  }

  const sharedWith = Array.isArray(data.sharedWith) ? data.sharedWith : []
  return sharedWith.includes(uid)
}

async function searchPolicyDocumentChunks(input: {
  policyId: string
  docId?: string
  query: string
  queryEmbedding?: number[]
}): Promise<ChunkSearchResult[]> {
  const db = getAdminFirestore()
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

      const termScore = scoreChunkMatch(parsed.data.text, input.query)
      const vectorScore =
        input.queryEmbedding &&
        parsed.data.embedding &&
        parsed.data.embedding.length === input.queryEmbedding.length
          ? cosineSimilarity(input.queryEmbedding, parsed.data.embedding)
          : 0
      const score = combineChunkScores(termScore, vectorScore)
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

  return results
}

export async function searchDocumentChunks(input: {
  uid: string
  policyId?: string
  policyIds?: string[]
  docId?: string
  query: string
  limit?: number
  queryEmbedding?: number[]
}): Promise<ChunkSearchResult[]> {
  const limit = input.limit ?? 5
  const requestedIds =
    input.policyIds ?? (input.policyId ? [input.policyId] : [])

  if (requestedIds.length === 0) {
    return []
  }

  const results: ChunkSearchResult[] = []

  for (const policyId of requestedIds) {
    const allowed = await assertPolicyReadable(input.uid, policyId)
    if (!allowed) {
      continue
    }

    const policyResults = await searchPolicyDocumentChunks({
      policyId,
      docId: input.docId,
      query: input.query,
      queryEmbedding: input.queryEmbedding,
    })
    results.push(...policyResults)
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit)
}

export async function indexPolicyDocumentsForRag(
  policyId: string,
  options?: { generateEmbeddings?: boolean }
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
    const text = await resolveIndexingText({
      document: data,
      policy,
    })

    if (!text) {
      continue
    }

    const count = await indexDocumentChunks({
      policyId,
      docId: docSnap.id,
      text,
      fileName: typeof data.fileName === 'string' ? data.fileName : undefined,
      generateEmbeddings: options?.generateEmbeddings,
    })

    if (count > 0) {
      indexedDocuments += 1
      indexedChunks += count
    }
  }

  if (indexedDocuments === 0) {
    const syntheticText = buildPolicySyntheticRagText(policy)

    if (syntheticText.trim()) {
      const count = await indexDocumentChunks({
        policyId,
        docId: 'policy-summary',
        text: syntheticText,
        fileName: 'policy-summary.txt',
        generateEmbeddings: options?.generateEmbeddings,
      })
      indexedDocuments = 1
      indexedChunks = count
    }
  }

  return { indexedDocuments, indexedChunks }
}
