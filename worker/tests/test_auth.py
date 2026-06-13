"""Tests for worker service-to-service auth."""

from __future__ import annotations

import os
from unittest.mock import patch

import pytest
from fastapi import HTTPException

from pipeline.auth import verify_worker_authorization


def test_verify_worker_authorization_accepts_shared_secret(monkeypatch):
    monkeypatch.setenv("INTERNAL_API_SECRET", "dev-secret-min-16-chars")
    monkeypatch.delenv("WORKER_AUTH_DISABLED", raising=False)

    verify_worker_authorization(authorization="Bearer dev-secret-min-16-chars")


def test_verify_worker_authorization_rejects_missing_token(monkeypatch):
    monkeypatch.setenv("INTERNAL_API_SECRET", "dev-secret-min-16-chars")
    monkeypatch.delenv("WORKER_AUTH_DISABLED", raising=False)

    with pytest.raises(HTTPException) as exc:
        verify_worker_authorization(authorization=None)

    assert exc.value.status_code == 401


def test_verify_worker_authorization_rejects_wrong_secret(monkeypatch):
    monkeypatch.setenv("INTERNAL_API_SECRET", "dev-secret-min-16-chars")
    monkeypatch.delenv("WORKER_AUTH_DISABLED", raising=False)

    with pytest.raises(HTTPException) as exc:
        verify_worker_authorization(authorization="Bearer wrong-secret-value")

    assert exc.value.status_code == 401


def test_verify_worker_authorization_disabled(monkeypatch):
    monkeypatch.setenv("WORKER_AUTH_DISABLED", "true")
    verify_worker_authorization(authorization=None)


@patch("google.oauth2.id_token.verify_oauth2_token")
def test_verify_worker_authorization_accepts_oidc(mock_verify, monkeypatch):
    monkeypatch.delenv("INTERNAL_API_SECRET", raising=False)
    monkeypatch.setenv("WORKER_OIDC_AUDIENCE", "https://worker.example.run.app")
    monkeypatch.setenv(
        "WORKER_ALLOWED_SERVICE_ACCOUNTS",
        "nextjs@project.iam.gserviceaccount.com",
    )
    mock_verify.return_value = {"email": "nextjs@project.iam.gserviceaccount.com"}

    verify_worker_authorization(authorization="Bearer fake.jwt.token")

    mock_verify.assert_called_once()
