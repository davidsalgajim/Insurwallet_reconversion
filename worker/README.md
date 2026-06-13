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

Copy env (never commit real keys):

```powershell
# worker/.env — load before uvicorn or use your shell
$env:ANTHROPIC_API_KEY="sk-ant-..."
$env:FIREBASE_STORAGE_BUCKET="your-project.firebasestorage.app"
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\service-account.json"
```

**Dev without GCS:** place PDFs in `worker/fixtures/{filename}` matching the uploaded file name; the worker uses them when download fails or bucket is unset.

## Run worker locally

```powershell
cd worker
.\.venv\Scripts\Activate.ps1
$env:ANTHROPIC_API_KEY="sk-ant-..."
$env:FIREBASE_STORAGE_BUCKET="your-bucket"
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

| Step          | Module                         | Notes                                                                        |
| ------------- | ------------------------------ | ---------------------------------------------------------------------------- |
| Download      | `pipeline/storage_loader.py`   | GCS via `FIREBASE_STORAGE_BUCKET`; `worker/fixtures/` fallback               |
| Extract PDF   | `pipeline/text_extractors.py`  | OpenDataLoader CLI if installed (JDK), else **pymupdf → pdfplumber → pypdf** |
| Quality gate  | `pipeline/quality_gate.py`     | &lt;100 words or no policy keywords → Surya fallback                         |
| Surya         | `pipeline/text_extractors.py`  | **Stub** — logs warning, reuses pymupdf/pdfplumber                           |
| Office/images | `pipeline/text_extractors.py`  | MarkItDown when installed                                                    |
| Sanitize      | `pipeline/sanitizer.py`        | Zero-width strip + imperative pattern flags                                  |
| Claude        | `pipeline/claude_extractor.py` | Anthropic tool-use / JSON schema; `ANTHROPIC_API_KEY` required               |
| Validate      | `pipeline/validators.py`       | Post-IA regex + confidence per field                                         |

## Next.js integration

Set in root `.env.local` (server-only):

```
WORKER_URL=http://localhost:8080
ANTHROPIC_API_KEY=sk-ant-...   # worker process uses this; not NEXT_PUBLIC
INTERNAL_API_SECRET=...        # optional shared secret
```

Flow: Storage upload → `jobs/{jobId}` → `document-job-runner` POSTs to worker → extraction stored on `policies/{id}/documents/{docId}.extraction` → review UI shows confidence badges.

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

Set `WORKER_OIDC_AUDIENCE` to the Cloud Run service URL. Next.js uses `google-auth-library` when `GOOGLE_APPLICATION_CREDENTIALS` or `GCLOUD_PROJECT` is set; otherwise falls back to `INTERNAL_API_SECRET`.

## Golden set (task 3.10)

```powershell
cd worker
pytest tests/test_golden.py -v
```

CI gate: `.github/workflows/golden-ocr.yml` — critical fields ≥95% on `worker/tests/golden/manifest.json` (20 sample policies + PDF keyword fixtures).

## Job creation

Production: Storage finalize trigger creates `jobs/{jobId}`.

Local fallback: `POST /api/jobs` with session cookie.
