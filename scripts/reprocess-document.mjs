/**
 * Dev/admin: re-run worker extraction and persist full fields to Firestore.
 * Usage: node scripts/reprocess-document.mjs <policyId> [docId]
 */
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const policyId = process.argv[2]
const docIdArg = process.argv[3]

if (!policyId) {
  console.error('Usage: node scripts/reprocess-document.mjs <policyId> [docId]')
  process.exit(1)
}

if (getApps().length === 0) {
  const credPath =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ??
    resolve(process.cwd(), 'service-account.json')
  initializeApp({
    credential: cert(JSON.parse(readFileSync(credPath, 'utf8'))),
  })
}

function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
    for (const line of raw.split('\n')) {
      const match = line.match(/^\s*([^#][^=]+)=(.*)$/)
      if (!match) continue
      const key = match[1].trim()
      const value = match[2].trim()
      if (!process.env[key]) {
        process.env[key] = value
      }
    }
  } catch {
    // optional
  }
}

loadEnvLocal()

function stripUndefined(value) {
  if (value === undefined) return undefined
  if (value === null || typeof value !== 'object') return value
  if (Array.isArray(value)) {
    return value.map(stripUndefined).filter((v) => v !== undefined)
  }
  const out = {}
  for (const [key, entry] of Object.entries(value)) {
    const next = stripUndefined(entry)
    if (next !== undefined) {
      out[key] = next
    }
  }
  return out
}

async function runWorkerExtraction(storagePath, mimeType) {
  const workerDir = resolve(process.cwd(), 'worker')
  const py = [
    'from pipeline.extract import extract_document_safe',
    'import json',
    `r = extract_document_safe(${JSON.stringify(storagePath)}, mime_type=${JSON.stringify(mimeType)})`,
    'print(json.dumps({',
    '  "extraction": r.extraction,',
    '  "document_text": r.rag_text,',
    '  "rag_word_count": r.rag_word_count,',
    '}, default=str))',
  ].join('\n')

  const { spawnSync } = await import('node:child_process')
  const result = spawnSync(
    resolve(workerDir, '.venv/Scripts/python.exe'),
    ['-c', py],
    {
      cwd: workerDir,
      env: { ...process.env },
      encoding: 'utf8',
      timeout: 120_000,
    }
  )

  if (result.status !== 0) {
    console.error(result.stderr || result.stdout)
    throw new Error('Python extraction failed')
  }

  const jsonLine = result.stdout
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('{'))
    .at(-1)

  if (!jsonLine) {
    console.error(result.stdout)
    throw new Error('Python extraction returned no JSON payload')
  }

  return JSON.parse(jsonLine)
}

const EXTRACTED_SUMMARY_MAX_CHARS = 10_000

function buildExtractedTextStoragePath(pdfStoragePath) {
  const lastSlash = pdfStoragePath.lastIndexOf('/')
  if (lastSlash <= 0) {
    throw new Error('Invalid policy document storage path')
  }
  const docDir = pdfStoragePath.slice(0, lastSlash)
  return `${docDir}/extracted/document.txt`
}

async function persistDocumentText(pdfStoragePath, text) {
  const normalized = text.replace(/\r\n/g, '\n').trim()
  if (!normalized) {
    return null
  }

  const ragWordCount = normalized.split(/\s+/).filter(Boolean).length
  const extractedSummary = normalized.slice(0, EXTRACTED_SUMMARY_MAX_CHARS)

  if (normalized.length <= EXTRACTED_SUMMARY_MAX_CHARS) {
    return { extractedSummary, ragWordCount }
  }

  const { getStorage } = await import('firebase-admin/storage')
  const bucketName =
    process.env.FIREBASE_STORAGE_BUCKET?.trim() ??
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim()

  if (!bucketName) {
    throw new Error('FIREBASE_STORAGE_BUCKET is not configured')
  }

  const extractedTextPath = buildExtractedTextStoragePath(pdfStoragePath)
  const bucket = getStorage().bucket(bucketName)
  await bucket.file(extractedTextPath).save(normalized, {
    contentType: 'text/plain; charset=utf-8',
    metadata: {
      cacheControl: 'private, max-age=3600',
    },
  })

  return { extractedSummary, extractedTextPath, ragWordCount }
}

const db = getFirestore()

const docsSnap = docIdArg
  ? await db
      .collection('policies')
      .doc(policyId)
      .collection('documents')
      .doc(docIdArg)
      .get()
      .then((snap) => ({ docs: snap.exists ? [snap] : [] }))
  : await db
      .collection('policies')
      .doc(policyId)
      .collection('documents')
      .get()

const docSnap = docsSnap.docs[0]
if (!docSnap?.exists) {
  console.error('Document not found')
  process.exit(1)
}

const docData = docSnap.data()
const storagePath = String(docData.storagePath)
const docId = docSnap.id

console.log('Reprocessing', { policyId, docId, storagePath })

const workerPayload = await runWorkerExtraction(
  storagePath,
  docData.mimeType ?? 'application/pdf'
)
const extraction = workerPayload.extraction ?? workerPayload
const documentText =
  typeof workerPayload.document_text === 'string'
    ? workerPayload.document_text
    : ''

if (!extraction?.fields) {
  console.error('Worker returned no extraction fields')
  process.exit(1)
}

console.log('Worker fields:', Object.keys(extraction.fields))
if (documentText) {
  console.log('RAG transcript words:', workerPayload.rag_word_count ?? 'n/a')
}

const documentTextPayload = documentText
  ? await persistDocumentText(storagePath, documentText)
  : null

const policyRef = db.collection('policies').doc(policyId)
const docRef = policyRef.collection('documents').doc(docId)

const fields = stripUndefined({ ...extraction.fields })
if (typeof fields.startDate === 'string') {
  fields.startDate = fields.startDate.slice(0, 10)
}
if (typeof fields.endDate === 'string') {
  fields.endDate = fields.endDate.slice(0, 10)
}
if (fields.hasNoExpiration) {
  delete fields.endDate
}

const policySnap = await policyRef.get()
const policy = policySnap.data() ?? {}

const mergedPolicy = {
  ...policy,
  insurerName: fields.insurerName ?? policy.insurerName,
  policyNumber: fields.policyNumber ?? policy.policyNumber,
  policyType: fields.policyType ?? policy.policyType,
  holderName: fields.holderName ?? policy.holderName,
  currency: fields.currency ?? policy.currency,
  paymentFrequency: fields.paymentFrequency ?? policy.paymentFrequency,
  premium: fields.premium ?? policy.premium ?? 0,
  coverages: fields.coverages ?? policy.coverages,
  beneficiaries: fields.beneficiaries ?? policy.beneficiaries,
  exclusions: fields.exclusions ?? policy.exclusions,
  waitingPeriods: fields.waitingPeriods ?? policy.waitingPeriods,
  notes: fields.notes ?? policy.notes,
  hasNoExpiration: fields.hasNoExpiration ?? policy.hasNoExpiration ?? false,
  coverageEntries: fields.coverageEntries ?? policy.coverageEntries ?? [],
  deductibleEntries: fields.deductibleEntries ?? policy.deductibleEntries ?? [],
  beneficiaryEntries:
    fields.beneficiaryEntries ?? policy.beneficiaryEntries ?? [],
  benefitEntries: fields.benefitEntries ?? policy.benefitEntries ?? [],
  agent: fields.agent
    ? {
        name: fields.agent.name ?? policy.agent?.name ?? 'Por definir',
        phone: fields.agent.phone ?? policy.agent?.phone ?? '+570000000000',
        email:
          fields.agent.email ?? policy.agent?.email ?? 'pendiente@example.com',
      }
    : policy.agent,
}

if (fields.startDate) {
  mergedPolicy.startDate = Timestamp.fromDate(new Date(`${fields.startDate}T00:00:00.000Z`))
}
if (fields.endDate && !fields.hasNoExpiration) {
  mergedPolicy.endDate = Timestamp.fromDate(new Date(`${fields.endDate}T00:00:00.000Z`))
} else if (fields.hasNoExpiration && fields.startDate) {
  mergedPolicy.endDate = Timestamp.fromDate(
    new Date(`${fields.startDate}T00:00:00.000Z`)
  )
}

mergedPolicy.updatedAt = FieldValue.serverTimestamp()

const policyPayload = stripUndefined(mergedPolicy)

await db.runTransaction(async (tx) => {
  tx.set(policyRef, policyPayload, { merge: true })
  tx.set(
    docRef,
    {
      extraction: {
        fields,
        confidence: extraction.confidence ?? {},
        method: extraction.method ?? 'odl',
        extractedAt: Timestamp.now(),
      },
      ...(documentTextPayload
        ? {
            extractedSummary: documentTextPayload.extractedSummary,
            ...(documentTextPayload.extractedTextPath
              ? { extractedTextPath: documentTextPayload.extractedTextPath }
              : {}),
            ragWordCount: documentTextPayload.ragWordCount,
          }
        : {}),
      processing: {
        state: 'ready',
        method: extraction.method ?? 'odl',
      },
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  )
})

console.log('Updated policy + document extraction')
if (documentTextPayload) {
  console.log('Persisted RAG text:', {
    ragWordCount: documentTextPayload.ragWordCount,
    extractedTextPath: documentTextPayload.extractedTextPath ?? '(inline summary)',
  })
}
console.log('Merged policy snapshot:', {
  insurerName: mergedPolicy.insurerName,
  policyNumber: mergedPolicy.policyNumber,
  policyType: mergedPolicy.policyType,
  holderName: mergedPolicy.holderName,
  paymentFrequency: mergedPolicy.paymentFrequency,
  hasNoExpiration: mergedPolicy.hasNoExpiration,
  beneficiaryEntries: mergedPolicy.beneficiaryEntries?.length,
})
