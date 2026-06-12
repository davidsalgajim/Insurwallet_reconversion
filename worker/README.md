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

## Run tests

```powershell
cd worker
pytest
```

TypeScript tests for job schemas and Firestore helpers run from the repo root:

```powershell
npm run test
```

## Pipeline modules (F2)

| Module                  | Status                                                        |
| ----------------------- | ------------------------------------------------------------- |
| `pipeline/sanitizer.py` | Implemented — zero-width strip + imperative pattern detection |
| `pipeline/extract.py`   | Stub — orchestration contract + sanitizer hook                |
| `main.py`               | Stub — FastAPI `/health` + `/jobs/process` (OIDC pending)     |
| `Dockerfile`            | JDK 11 + Python 3.12 base image                               |

## Job creation

Production path: Storage finalize trigger (`functions/src/on-storage-upload.ts`) creates `jobs/{jobId}` via Admin SDK when a PDF lands in Storage.

Local fallback (Functions emulator off): `POST /api/jobs` with session cookie enqueues the same job shape.

## Next steps

1. OpenDataLoader POC in Docker (JDK 11 + Python 3.12)
2. Wire Storage trigger → Cloud Run worker (OIDC)
3. Worker consumes jobs: extract → sanitize → Claude
4. Review UI: confirm extraction → create policy
