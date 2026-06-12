#!/usr/bin/env bash
# OpenDataLoader / worker Docker smoke test (task 1.7 POC)
# Requires: Docker, curl
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
IMAGE="insurwallet-worker:smoke"
PORT="${WORKER_SMOKE_PORT:-18080}"

echo "==> Building worker image from ${ROOT}/worker"
docker build -t "${IMAGE}" -f "${ROOT}/worker/Dockerfile" "${ROOT}/worker"

echo "==> Starting container on port ${PORT}"
cid="$(docker run -d --rm -p "${PORT}:8080" "${IMAGE}")"
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

echo "==> POST /jobs/process (stub pipeline)"
curl -sf -X POST "http://127.0.0.1:${PORT}/jobs/process" \
  -H 'Content-Type: application/json' \
  -d '{"job_id":"smoke-1","storage_path":"users/demo/policies/p1/docs/d1.pdf","mime_type":"application/pdf"}' \
  | tee /dev/stderr
echo

echo "==> Smoke OK"
