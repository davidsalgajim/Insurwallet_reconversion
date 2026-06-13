"""InsurWallet document worker — Cloud Run FastAPI entrypoint."""

from __future__ import annotations

import logging

from fastapi import Depends, FastAPI, HTTPException, status
from pydantic import BaseModel, Field

from pipeline.auth import verify_worker_authorization
from pipeline.claude_extractor import ClaudeExtractionError
from pipeline.extract import extract_document_safe
from pipeline.odl_extract import is_opendataloader_available as odl_runtime_available

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="InsurWallet Document Worker",
    version="0.3.0",
    description="PDF/document processing pipeline (F2)",
)


class HealthResponse(BaseModel):
    status: str = "ok"


class OdlHealthResponse(BaseModel):
    status: str
    opendataloader_available: bool
    jdk_available: bool


class ProcessJobRequest(BaseModel):
    job_id: str = Field(min_length=1)
    storage_path: str = Field(min_length=1)
    mime_type: str = Field(default="application/pdf")


class ExtractionPayload(BaseModel):
    fields: dict[str, object] = Field(default_factory=dict)
    confidence: dict[str, str] = Field(default_factory=dict)
    bboxes: dict[str, dict[str, float | int]] | None = None
    method: str = "odl"
    extractedAt: str


class ProcessJobResponse(BaseModel):
    job_id: str
    status: str
    message: str
    word_count: int = 0
    pipeline_method: str = "odl"
    pipeline_steps: list[str] = Field(default_factory=list)
    has_suspicious_content: bool = False
    extraction: ExtractionPayload | None = None


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse()


@app.get("/health/odl", response_model=OdlHealthResponse)
def health_odl() -> OdlHealthResponse:
    import shutil

    jdk = shutil.which("java") is not None
    odl = odl_runtime_available()
    status_value = "ok" if (jdk and odl) else "degraded"
    return OdlHealthResponse(
        status=status_value,
        opendataloader_available=odl,
        jdk_available=jdk,
    )


@app.post(
    "/jobs/process",
    response_model=ProcessJobResponse,
    dependencies=[Depends(verify_worker_authorization)],
)
def process_job(request: ProcessJobRequest) -> ProcessJobResponse:
    """Process a document job: extract text, sanitize, Claude structured extraction."""
    try:
        result = extract_document_safe(
            request.storage_path,
            mime_type=request.mime_type,
        )
    except ClaudeExtractionError as exc:
        logger.error("Claude extraction error job=%s: %s", request.job_id, exc)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
    except RuntimeError as exc:
        logger.error("Pipeline error job=%s: %s", request.job_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc
    except Exception as exc:  # noqa: BLE001
        logger.exception("Unexpected pipeline failure job=%s", request.job_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Document extraction failed",
        ) from exc

    extraction_data = result.extraction
    api_method = str(extraction_data.get("method", result.method))
    raw_bboxes = extraction_data.get("bboxes")

    return ProcessJobResponse(
        job_id=request.job_id,
        status="completed",
        message="Document processed successfully",
        word_count=result.word_count,
        pipeline_method=api_method,
        pipeline_steps=list(result.pipeline_steps),
        has_suspicious_content=result.sanitized.has_suspicious_content,
        extraction=ExtractionPayload(
            fields=dict(extraction_data.get("fields", {})),
            confidence=dict(extraction_data.get("confidence", {})),
            bboxes=dict(raw_bboxes) if isinstance(raw_bboxes, dict) else None,
            method=api_method,
            extractedAt=str(extraction_data.get("extractedAt", "")),
        ),
    )
