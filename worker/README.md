# InsurWallet Document Worker

Python pipeline for PDF/document processing on Cloud Run (F2).

## Local setup

Requires Python 3.12+.

```powershell
cd worker
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
```

Copy env (never commit real keys). Prefer loading from the repo root `.env.local`:

```powershell
$env:ANTHROPIC_API_KEY="sk-ant-..."
$env:FIREBASE_STORAGE_BUCKET="your-project.firebasestorage.app"
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\service-account.json"
$env:INTERNAL_API_SECRET="local-dev-worker-secret-min-16"   # same value in Next.js .env.local
```

**GCS vs fixtures:** the worker downloads from Storage first (`FIREBASE_STORAGE_BUCKET` + service account). `worker/fixtures/{filename}` is used only when GCS is unavailable or the object is missing — useful for offline pytest, not as a substitute for the user's upload in dev.

## Run worker locally

```powershell
cd worker
.\.venv\Scripts\Activate.ps1
uvicorn main:app --reload --port 8080
```

Health check: `GET http://localhost:8080/health`

## Run tests

```powershell
cd worker
pytest
```

TypeScript tests for job runner / worker client run from the repo root:

```powershell
npm run test
```

## Pipeline (F2)

| Step            | Module                                           | Notes                                                                                    |
| --------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Download        | `pipeline/storage_loader.py`                     | GCS first; `worker/fixtures/` fallback on failure                                        |
| Extract PDF     | `pipeline/text_extractors.py`                    | OpenDataLoader CLI if installed (JDK), else **pymupdf → pdfplumber → pypdf**             |
| Quality gate    | `pipeline/quality_gate.py`                       | &lt;100 words, no policy keywords, or **image placeholders** (`![image N]`) → low signal |
| Vision fallback | `pipeline/pdf_vision.py` + `claude_extractor.py` | Scanned PDFs: render pages → **Claude vision** + tool-use                                |
| Surya           | `pipeline/text_extractors.py`                    | **Stub** — logs warning, reuses pymupdf/pdfplumber                                       |
| Office/images   | `pipeline/text_extractors.py`                    | MarkItDown when installed                                                                |
| Sanitize        | `pipeline/sanitizer.py`                          | Zero-width strip + imperative pattern flags                                              |
| Lexicon         | `pipeline/policy_lexicon.py`                     | Labels ES/EN/PT (LATAM) in prompts + quality gate keywords                               |
| Claude          | `pipeline/claude_extractor.py`                   | Text or vision; multilingual prompts; `hasNoExpiration` heuristics                       |
| RAG transcribe  | `pipeline/claude_transcriber.py`                 | Vision page transcription for MarIAna (`document_text` / `rag_word_count` in API)        |
| Validate        | `pipeline/validators.py`                         | Post-IA regex + confidence; duplicate start/end date → open-ended                        |
| Merge API       | `pipeline/extract.py`                            | Full Claude fields + validated scalars (not only 7 critical fields)                      |

### Extractable policy fields (parity with `PolicySchema`)

All user-editable policy fields except app/system metadata. Canonical lists:

- TypeScript: `lib/schemas/extraction-field-keys.ts`
- Python: `worker/pipeline/extraction_fields.py`
- CI: `lib/schemas/extraction-field-keys.test.ts`, `worker/tests/test_extraction_field_parity.py`

| Field                | Type       | Notes                                                                   |
| -------------------- | ---------- | ----------------------------------------------------------------------- |
| `insurerName`        | string     | Aseguradora / carrier                                                   |
| `policyNumber`       | string     | Nº póliza / certificado                                                 |
| `policyType`         | enum       | life, health, auto, home, travel, pet, funeral, dental, business, other |
| `holderName`         | string     | Tomador / asegurado (natural person)                                    |
| `startDate`          | YYYY-MM-DD | Inicio vigencia                                                         |
| `endDate`            | YYYY-MM-DD | Fin vigencia (omit if open-ended)                                       |
| `hasNoExpiration`    | boolean    | Sin fecha fin (vida deudor, etc.)                                       |
| `premium`            | number     | Prima sin símbolos de moneda                                            |
| `currency`           | ISO 4217   | COP, MXN, BRL, USD, …                                                   |
| `paymentFrequency`   | enum       | monthly, quarterly, semi_annual, annual, single                         |
| `coverages`          | string     | Resumen texto de amparos                                                |
| `beneficiaries`      | string     | Resumen texto de beneficiarios                                          |
| `exclusions`         | string     | Exclusiones                                                             |
| `waitingPeriods`     | string     | Periodos de carencia                                                    |
| `notes`              | string     | Observaciones / NIT beneficiario                                        |
| `agent`              | object     | name, phone, email (asesor / SAC)                                       |
| `coverageEntries`    | array      | `{ name, amount }` coberturas estructuradas                             |
| `deductibleEntries`  | array      | `{ incidentType, amount, isPercentage }`                                |
| `beneficiaryEntries` | array      | `{ name, pct, notes? }` — banco en seguro deudor                        |
| `benefitEntries`     | array      | `{ name, description?, category?, contactInfo?, quantity? }`            |

**Never extracted from PDFs:** `ownerUid`, `sharedWith`, `status`, `createdAt`, `updatedAt`.

**Reprocess stale extractions (dev):** see flow above — then `POST /api/policies/{id}/index-documents` to rebuild chunks.

**Client parsing:** `lib/firebase/parse-document-extraction.ts` normalizes Firestore `Timestamp` dates in stored extraction; new writes use ISO date strings (`YYYY-MM-DD`) in extraction fields.

### Scanned PDFs (seguro deudor, etc.)

When ODL returns only image placeholders, `is_low_signal_text()` triggers the vision path (`pipeline: ['vision','claude','transcribe']`). Prompts include regional rules (tomador ≠ banco beneficiario, NIT en notas, monedas COP/MXN/BRL, etc.).

### Worker API (`POST /jobs/process`)

Response fields relevant to RAG:

| Field            | Description                                                      |
| ---------------- | ---------------------------------------------------------------- |
| `document_text`  | Full transcript for indexing (vision pages or sanitized extract) |
| `rag_word_count` | Word count of `document_text`                                    |
| `extraction`     | Structured policy fields (20-field schema)                       |
| `pipeline_steps` | e.g. `['vision','claude','transcribe']` on scanned PDFs          |

### Expiration fields

If the model echoes `startDate` as `endDate`, post-processing sets `hasNoExpiration: true` and drops `endDate` (common on vida deudores sin fecha fin).

## Next.js integration

Set in root `.env.local` (server-only):

```
WORKER_URL=http://localhost:8080
INTERNAL_API_SECRET=local-dev-worker-secret-min-16
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
ANTHROPIC_API_KEY=sk-ant-...   # worker process; never NEXT_PUBLIC_
FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
```

Flow: Storage upload → `jobs/{jobId}` → `document-job-runner` POSTs to worker → extraction on `policies/{id}/documents/{docId}.extraction` → **full transcript** in `extractedSummary` / `extractedTextPath` (Storage when &gt;10KB) → review UI merges documents (`mergePolicyExtractions`) and renders PDF via pdf.js.

**RAG text:** worker returns `document_text` (vision transcription on scanned PDFs, else sanitized extract). `lib/server/document-text-storage.ts` persists it; `indexPolicyDocumentsForRag` loads full text from Storage before chunking.

**Reprocess stale extractions (dev):** `node scripts/reprocess-document.mjs <policyId>` persists fields + RAG transcript, or `POST /api/jobs/{jobId}/process?force=true`.

## OpenDataLoader (production)

Production Docker image includes **JDK 11** and **`opendataloader-pdf`** (pip). The pipeline prefers ODL markdown+JSON+bboxes; without JVM/ODL it falls back to **pymupdf → pdfplumber → pypdf**.

### Docker smoke test (task 1.7)

Requires Docker and curl (Git Bash or WSL on Windows):

```bash
bash worker/scripts/docker-smoke.sh
```

Optional env:

```bash
WORKER_SMOKE_PORT=18080 WORKER_SMOKE_SECRET=smoke-test-secret-min-16-chars bash worker/scripts/docker-smoke.sh
```

The script verifies:

- `GET /health`
- `GET /health/odl` — JDK + OpenDataLoader available in the image
- `POST /jobs/process` returns **401** without auth
- `POST /jobs/process` with `INTERNAL_API_SECRET` Bearer (pipeline may fail without fixture/API key)

### Worker authentication (task 3.1)

| Mode       | Env                                                                 | Caller                                      |
| ---------- | ------------------------------------------------------------------- | ------------------------------------------- |
| Local dev  | `INTERNAL_API_SECRET`                                               | Next.js `worker-client` sends shared secret |
| Production | `WORKER_OIDC_AUDIENCE` + optional `WORKER_ALLOWED_SERVICE_ACCOUNTS` | Google OIDC ID token (service account)      |
| Smoke only | `WORKER_AUTH_DISABLED=true`                                         | Unauthenticated (do not use in prod)        |

Set `WORKER_OIDC_AUDIENCE` to the Cloud Run service URL. Next.js uses `google-auth-library` when `GOOGLE_APPLICATION_CREDENTIALS` or `GCLOUD_PROJECT` is set; for **localhost** it prefers `INTERNAL_API_SECRET` even if GCP creds exist.

## Golden set (task 3.10)

```powershell
cd worker
pytest tests/test_golden.py -v
pytest tests/test_expiration_heuristics.py tests/test_policy_lexicon.py -v
```

CI gate: `.github/workflows/golden-ocr.yml` — critical fields ≥95% on `worker/tests/golden/manifest.json` (20 sample policies + PDF keyword fixtures).

Fixture PDF for manual vision tests: `worker/fixtures/Alfa deudores.pdf` (Seguros Alfa GRD-482, scanned).

## Job creation

Production: Storage finalize trigger creates `jobs/{jobId}`.

Local fallback: `POST /api/jobs` with session cookie after upload.
