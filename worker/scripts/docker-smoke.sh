#!/usr/bin/env bash
# OpenDataLoader / worker Docker smoke test (task 1.7 POC)
# Requires: Docker, curl
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
IMAGE="insurwallet-worker:smoke"
PORT="${WORKER_SMOKE_PORT:-18080}"
SMOKE_SECRET="${WORKER_SMOKE_SECRET:-smoke-test-secret-min-16-chars}"

echo "==> Building worker image from ${ROOT}/worker"
docker build -t "${IMAGE}" -f "${ROOT}/worker/Dockerfile" "${ROOT}/worker"

echo "==> Starting container on port ${PORT}"
cid="$(docker run -d --rm \
  -e INTERNAL_API_SECRET="${SMOKE_SECRET}" \
  -p "${PORT}:8080" \
  "${IMAGE}")"
trap 'docker stop "${cid}" >/dev/null 2>&1 || true' EXIT

for _ in $(seq 1 30); do
  if curl -sf "http://127.0.0.1:${PORT}/health" >/dev/null; then
    break
  fi
  sleep 1
done

echo "==> GET /health"
curl -sf "http://127.0.0.1:${PORT}/health" | tee /dev/stderr
echo

echo "==> GET /health/odl (JDK + OpenDataLoader)"
odl_health="$(curl -sf "http://127.0.0.1:${PORT}/health/odl")"
echo "${odl_health}" | tee /dev/stderr
echo

if ! echo "${odl_health}" | grep -q '"jdk_available":true'; then
  echo "ERROR: JDK not available in container" >&2
  exit 1
fi

if ! echo "${odl_health}" | grep -q '"opendataloader_available":true'; then
  echo "ERROR: OpenDataLoader not available in container" >&2
  exit 1
fi

echo "==> POST /jobs/process without auth (expect 401)"
status="$(curl -s -o /dev/null -w "%{http_code}" -X POST "http://127.0.0.1:${PORT}/jobs/process" \
  -H 'Content-Type: application/json' \
  -d '{"job_id":"smoke-unauth","storage_path":"users/demo/policies/p1/docs/d1.pdf"}')"
if [[ "${status}" != "401" ]]; then
  echo "ERROR: expected 401 without Bearer token, got ${status}" >&2
  exit 1
fi
echo "Unauthorized as expected (${status})"

echo "==> POST /jobs/process with shared secret (pipeline may fail without API key/fixture)"
set +e
curl -sf -X POST "http://127.0.0.1:${PORT}/jobs/process" \
  -H "Authorization: Bearer ${SMOKE_SECRET}" \
  -H 'Content-Type: application/json' \
  -d '{"job_id":"smoke-1","storage_path":"users/demo/policies/p1/docs/d1.pdf","mime_type":"application/pdf"}' \
  | tee /dev/stderr
pipeline_status=$?
set -e
if [[ "${pipeline_status}" -ne 0 ]]; then
  echo "NOTE: Full pipeline did not complete (missing fixture/API key is OK for smoke)." >&2
fi

echo "==> Smoke OK"
