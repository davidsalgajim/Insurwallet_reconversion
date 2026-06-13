"""Service-to-service authentication for the document worker."""

from __future__ import annotations

import os

from fastapi import Header, HTTPException, status


def _auth_disabled() -> bool:
    return os.environ.get("WORKER_AUTH_DISABLED", "").strip().lower() in (
        "1",
        "true",
        "yes",
    )


def _internal_secret() -> str:
    return os.environ.get("INTERNAL_API_SECRET", "").strip()


def _oidc_audience() -> str:
    return os.environ.get("WORKER_OIDC_AUDIENCE", "").strip()


def _allowed_service_accounts() -> set[str]:
    raw = os.environ.get("WORKER_ALLOWED_SERVICE_ACCOUNTS", "").strip()
    if not raw:
        return set()
    return {email.strip() for email in raw.split(",") if email.strip()}


def _verify_shared_secret(token: str) -> bool:
    secret = _internal_secret()
    return bool(secret) and token == secret


def _verify_oidc_token(token: str) -> dict[str, object]:
    audience = _oidc_audience()
    if not audience:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Worker OIDC audience is not configured",
        )

    try:
        from google.auth.transport import requests as google_requests
        from google.oauth2 import id_token
    except ImportError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="google-auth is required for OIDC verification",
        ) from exc

    try:
        claims = id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            audience,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid OIDC token",
        ) from exc

    allowed = _allowed_service_accounts()
    if allowed:
        email = str(claims.get("email", ""))
        if email not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Service account not authorized for worker",
            )

    return claims


def verify_worker_authorization(
    authorization: str | None = Header(default=None),
) -> None:
    """FastAPI dependency — shared secret (dev) or Google OIDC (prod)."""
    if _auth_disabled():
        return

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Bearer token",
        )

    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Bearer token",
        )

    if _verify_shared_secret(token):
        return

    _verify_oidc_token(token)
