import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const policyId = process.argv[2] ?? 'Lz0iyZeGHi1aPJKadLY9'

if (getApps().length === 0) {
  const credPath =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ??
    resolve(process.cwd(), 'service-account.json')
  initializeApp({
    credential: cert(JSON.parse(readFileSync(credPath, 'utf8'))),
  })
}

const db = getFirestore()

const policySnap = await db.collection('policies').doc(policyId).get()
console.log('POLICY exists:', policySnap.exists)
if (policySnap.exists) {
  const p = policySnap.data()
  console.log({
    insurerName: p.insurerName,
    policyNumber: p.policyNumber,
    policyType: p.policyType,
    holderName: p.holderName,
    premium: p.premium,
    paymentFrequency: p.paymentFrequency,
    hasNoExpiration: p.hasNoExpiration,
    startDate: p.startDate?.toDate?.() ?? p.startDate,
    endDate: p.endDate?.toDate?.() ?? p.endDate,
    coverageEntries: p.coverageEntries?.length,
    beneficiaryEntries: p.beneficiaryEntries?.length,
    agent: p.agent,
  })
}

const docsSnap = await db
  .collection('policies')
  .doc(policyId)
  .collection('documents')
  .get()

for (const doc of docsSnap.docs) {
  const data = doc.data()
  console.log('\nDOC', doc.id)
  console.log('  fileName:', data.fileName)
  console.log('  storagePath:', data.storagePath)
  console.log('  processing:', data.processing)
  if (data.extraction?.fields) {
    console.log('  extraction field keys:', Object.keys(data.extraction.fields))
    console.log(
      '  extraction fields:',
      JSON.stringify(data.extraction.fields, null, 2)
    )
  } else {
    console.log('  no extraction')
  }
}

const jobsSnap = await db
  .collection('jobs')
  .where('policyId', '==', policyId)
  .get()

console.log('\nJOBS:', jobsSnap.size)
for (const job of jobsSnap.docs) {
  const j = job.data()
  console.log({
    id: job.id,
    docId: j.docId,
    processingState: j.processingState,
    pipeline: j.pipeline,
    updatedAt: j.updatedAt?.toDate?.() ?? j.updatedAt,
  })
}
