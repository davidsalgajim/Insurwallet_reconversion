"""InsurWallet document worker — Cloud Run FastAPI entrypoint."""

from __future__ import annotations

from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field

from pipeline.extract import extract_document

app = FastAPI(
    title="InsurWallet Document Worker",
    version="0.1.0",
    description="PDF/document processing pipeline (F2 scaffold)",
)


class HealthResponse(BaseModel):
    status: str = "ok"


class ProcessJobRequest(BaseModel):
    job_id: str = Field(min_length=1)
    storage_path: str = Field(min_length=1)
    mime_type: str = Field(default="application/pdf")


class ProcessJobResponse(BaseModel):
    job_id: str
    status: str
    message: str
    word_count: int = 0
    pipeline_method: str = "odl"
    has_suspicious_content: bool = False


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse()


@app.post("/jobs/process", response_model=ProcessJobResponse)
def process_job(request: ProcessJobRequest) -> ProcessJobResponse:
    """Process a document job (stub — OIDC auth added in 3.1)."""
    # TODO 3.1: verify Cloud Run OIDC / service-to-service token before processing.
    try:
        result = extract_document(
            request.storage_path,
            mime_type=request.mime_type,
        )
    except Exception as exc:  # noqa: BLE001 — stub maps to 500 until structured errors land in 3.9
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Document extraction failed",
        ) from exc

    return ProcessJobResponse(
        job_id=request.job_id,
        status="accepted",
        message="Job processed (pipeline stub — OpenDataLoader pending 3.3)",
        word_count=result.word_count,
        pipeline_method=result.method,
        has_suspicious_content=result.sanitized.has_suspicious_content,
    )
