"""Download policy documents from Firebase/GCS Storage."""

from __future__ import annotations

import logging
import os
from pathlib import Path

logger = logging.getLogger(__name__)


class StorageDownloadError(RuntimeError):
    pass


def _download_from_gcs(storage_path: str) -> bytes:
    from google.cloud import storage  # lazy import — optional in unit tests

    bucket_name = os.environ.get("FIREBASE_STORAGE_BUCKET", "").strip()
    if not bucket_name:
        raise StorageDownloadError(
            "FIREBASE_STORAGE_BUCKET is required to download documents"
        )

    client = storage.Client()
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(storage_path)

    if not blob.exists():
        raise StorageDownloadError(f"Object not found: {storage_path}")

    return blob.download_as_bytes()


def _read_local_fixture(storage_path: str) -> bytes | None:
    """Dev fallback: worker/fixtures/{filename} when GCS is unavailable."""
    fixture_root = Path(__file__).resolve().parent.parent / "fixtures"
    file_name = Path(storage_path).name
    candidate = fixture_root / file_name

    if candidate.is_file():
        logger.info("Using local fixture %s for %s", candidate, storage_path)
        return candidate.read_bytes()

    return None


def download_document_bytes(storage_path: str) -> bytes:
    local = _read_local_fixture(storage_path)
    if local is not None:
        return local

    try:
        return _download_from_gcs(storage_path)
    except ImportError as exc:
        raise StorageDownloadError(
            "google-cloud-storage is not installed; place PDFs in worker/fixtures/"
        ) from exc
    except Exception as exc:
        local_retry = _read_local_fixture(storage_path)
        if local_retry is not None:
            return local_retry
        raise StorageDownloadError(str(exc)) from exc
