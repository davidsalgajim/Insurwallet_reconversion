# Production checklist — InsurWallet

Use this document before **staging** or **production** deploy. It complements the shorter checklist in [`README.md`](../README.md) and task **6.13** (App Check Enforce).

**Last reviewed:** jun 2026 · **Target stack:** Vercel (Next.js) + Firebase (Auth, Firestore, Storage, Functions) + Cloud Run (worker Python, MarIAna).

---

## 1. Environment variables

### 1.1 Next.js / Vercel (client — `NEXT_PUBLIC_*`)

| Variable                                           | Required | Notes                                         |
| -------------------------------------------------- | -------- | --------------------------------------------- |
| `NEXT_PUBLIC_FIREBASE_API_KEY`                     | ✅       | Firebase Console → Project settings → Web app |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`                 | ✅       | `{projectId}.firebaseapp.com`                 |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`                  | ✅       | e.g. `insurwallet-staging` / prod project     |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`              | ✅       | Prefer `*.firebasestorage.app` from console   |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`         | ✅       |                                               |
| `NEXT_PUBLIC_FIREBASE_APP_ID`                      | ✅       |                                               |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`              | Optional | Google Analytics                              |
| `NEXT_PUBLIC_USE_FIREBASE_EMULATORS`               | ✅       | `false` in staging/prod                       |
| `NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION`           | ✅       | `true` staging/prod recommended               |
| `NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY` | ✅ prod  | reCAPTCHA v3 site key (public)                |
| `NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN`        | Dev only | Never in Vercel preview/prod                  |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY`                   | Optional | Web Push (FCM)                                |
| `NEXT_PUBLIC_SENTRY_DSN`                           | Optional | Client error reporting (no-op if unset)       |

### 1.2 Next.js / Vercel (server-only)

| Variable                                                       | Required | Notes                                                  |
| -------------------------------------------------------------- | -------- | ------------------------------------------------------ |
| `FIREBASE_SERVICE_ACCOUNT` or `GOOGLE_APPLICATION_CREDENTIALS` | ✅ prod  | Session cookies + Admin SDK                            |
| `APP_URL`                                                      | ✅ prod  | Canonical app URL for callbacks                        |
| `INTERNAL_API_SECRET`                                          | ✅ prod  | Job dispatch, internal APIs                            |
| `WORKER_URL`                                                   | F2+      | Cloud Run worker base URL                              |
| `SENTRY_DSN`                                                   | Optional | Server Sentry (falls back to `NEXT_PUBLIC_SENTRY_DSN`) |
| `ANTHROPIC_API_KEY`                                            | F2/F3    | **Secret Manager** in prod — not plain env             |
| `RESEND_API_KEY`                                               | F4       | Transactional email                                    |
| `MERCADOPAGO_ACCESS_TOKEN`                                     | F4       | Server checkout + webhook (Secret Manager)             |
| `MERCADOPAGO_WEBHOOK_SECRET`                                   | F4       | Webhook x-signature verification                       |
| `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`                           | F4       | Client MP checkout (public)                            |
| `MERCADOPAGO_API_BASE_URL`                                     | Optional | Default https://api.mercadopago.com                    |
| `WOMPI_*` (legacy)                                             | Optional | Deprecated adapter only                                |
| `POSTHOG_KEY`                                                  | Optional | Product analytics                                      |

> **Rule:** Claude, Mercado Pago/Wompi, Resend, and service account JSON → **Google Secret Manager** in staging/prod. Reference from Vercel/Firebase via secret bindings — never commit to git.

### 1.3 Cloud Functions (`functions/`)

| Secret / env                      | Purpose                           |
| --------------------------------- | --------------------------------- |
| Service account (default runtime) | Admin SDK                         |
| `RESEND_API_KEY`                  | Email (F4)                        |
| `MERCADOPAGO_ACCESS_TOKEN`        | Checkout + webhook resource fetch |
| `MERCADOPAGO_WEBHOOK_SECRET`      | Webhook signature (`x-signature`) |
| `WOMPI_*` (deprecated)            | Legacy Wompi adapter              |
| `SENTRY_DSN`                      | Functions errors (7.1)            |

Deploy: `firebase deploy --only functions`

### 1.4 Cloud Run — document worker (`worker/`)

| Env                              | Purpose                            |
| -------------------------------- | ---------------------------------- |
| `PORT`                           | `8080` (default)                   |
| `ANTHROPIC_API_KEY`              | Claude extraction (Secret Manager) |
| `GOOGLE_APPLICATION_CREDENTIALS` | GCS/Firestore access if needed     |
| `SENTRY_DSN`                     | Worker errors (7.1)                |

Image: build from `worker/Dockerfile` (JDK 11 + Python 3.12). Smoke test: `worker/scripts/docker-smoke.sh`.

### 1.5 Cloud Run — MarIAna (future)

Same pattern as worker: OIDC-only ingress, `ANTHROPIC_API_KEY` in Secret Manager, rate limits in `mariana/guardrails.ts`.

---

## 1.6 Settings & subscription (deploy notes)

- [ ] **Profile & prefs:** `/api/user/profile`, `/api/user/preferences` — require Admin session cookies in prod (`FIREBASE_SERVICE_ACCOUNT`).
- [ ] **Contacts:** `/api/user/contacts` — same auth; Firestore rules owner-only.
- [ ] **Subscription:** Mercado Pago vars (§1.2) + `PAYMENTS_ENABLED` / `NEXT_PUBLIC_PAYMENTS_ENABLED`; smoke checkout on staging before prod.
- [ ] **Notifications:** optional `NEXT_PUBLIC_FIREBASE_VAPID_KEY`; prefs API documented in [`docs/notifications.md`](notifications.md).
- [ ] **Help:** static routes `/settings/help` — no extra env.

---

## 2. Firebase Console

- [ ] Auth: Email/password + Google; authorized domains (`localhost`, `*.vercel.app`, custom domain)
- [ ] Firestore + Storage enabled
- [ ] App Check: web app registered (reCAPTCHA v3)
- [ ] Firestore + Storage App Check: **Monitor** → **Enforce** (see §5)
- [ ] Cloud Messaging: Web Push key pair → `NEXT_PUBLIC_FIREBASE_VAPID_KEY`
- [ ] Rules deployed: `firebase deploy --only firestore:rules,storage`
- [ ] Indexes: `firebase deploy --only firestore:indexes`
- [ ] Functions: `refreshPolicyStatuses`, Storage triggers, webhooks as applicable

---

## 3. Deploy steps

### 3.1 Vercel (Next.js app)

1. Connect repo; set **Node 22**.
2. Add all §1.1 + §1.2 variables per environment (Preview vs Production).
3. Build command: `npm run build` (default).
4. Verify CI green: lint, typecheck, unit tests, **rules tests with emulators**, build.
5. Smoke: register → verify email → login → manual policy → upload PDF → MarIAna question.

### 3.2 Firebase Functions

```bash
cd functions && npm ci && npm run build
firebase deploy --only functions --project <project-id>
```

### 3.3 Cloud Run worker

```bash
gcloud builds submit --tag gcr.io/<project>/insurwallet-worker ./worker
gcloud run deploy insurwallet-worker \
  --image gcr.io/<project>/insurwallet-worker \
  --region <region> \
  --no-allow-unauthenticated \
  --set-secrets ANTHROPIC_API_KEY=anthropic-api-key:latest
```

Set `WORKER_URL` in Vercel/Secret Manager to the service URL. Configure OIDC service-to-service auth (task 3.1).

### 3.4 Post-deploy

- [ ] App Check metrics healthy (≥95% valid requests before Enforce)
- [ ] Sentry receiving events (if DSN configured)
- [ ] Pentest checklist sample run on staging ([`docs/security/pentest-checklist.md`](security/pentest-checklist.md))
- [ ] E2E smoke on preview URL (`npm run test:e2e`)

---

## 4. CI gates

| Workflow                           | Gate                                                                      |
| ---------------------------------- | ------------------------------------------------------------------------- |
| `.github/workflows/ci.yml`         | lint, typecheck, vitest, **Firestore + Storage rules (emulators)**, build |
| `.github/workflows/e2e.yml`        | Playwright smoke (continue-on-error until preview stable)                 |
| `.github/workflows/golden-ocr.yml` | Golden OCR (F2, when enabled)                                             |

Local parity:

```bash
npm run test
npm run emulators:exec -- "npm run test:rules && npm run test:storage-rules"
npm run test:e2e                                    # smoke
E2E_FIREBASE_EMULATORS=true npm run test:e2e        # full flows (starts emulators)
```

---

## 5. App Check — Monitor → Enforce

**Staging:** `localhost`, Vercel preview hostnames in [reCAPTCHA Admin](https://www.google.com/recaptcha/admin) → **Allowed domains**.

**Production (task 6.13):**

1. Register custom domain (e.g. `app.insurwallet.com`) in reCAPTCHA **Allowed domains**.
2. Firebase Console → App Check → confirm web app sends valid tokens from prod domain.
3. Firestore → App Check → **Enforce** (after Monitor shows stable valid traffic).
4. Storage → App Check → **Enforce**.
5. Remove `NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN` from all hosted envs.
6. Re-run pentest checklist §1 with Enforce on.

Client init: `lib/firebase/app-check.ts` (skipped when `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true`).

---

## 6. Observability

| Tool          | Status           | Config                                                                           |
| ------------- | ---------------- | -------------------------------------------------------------------------------- |
| Sentry        | Stub wired       | `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_DSN` — upgrade to `@sentry/nextjs` when ready |
| PostHog       | Pending 7.4      | `NEXT_PUBLIC_POSTHOG_KEY`                                                        |
| Cloud Logging | Functions/worker | Structured logs with `jobId` / `uid`                                             |

---

## 7. PWA

- [ ] `public/manifest.webmanifest` served
- [ ] `public/sw.js` registered in app layout (production only; dev skips registration)
- [ ] Test install on iOS Safari + Android Chrome
- [ ] Offline: `/offline.html` fallback; policies list uses network-first cache

---

## 8. Go / no-go (F5 — task 6.12)

- [ ] All §2 Firebase items complete
- [ ] App Check Enforce on prod
- [ ] CI green including rules tests
- [ ] E2E critical paths pass with emulators
- [ ] Security review + Bugbot on release branch
- [ ] Rollback plan documented (Vercel instant rollback + Firebase rules revision)

---

## 9. Legal y cumplimiento (pre go-live)

Antes de abrir registro público en producción, completar [`docs/PRODUCTION-LEGAL-CHECKLIST.md`](PRODUCTION-LEGAL-CHECKLIST.md):

- Datos empresa en `lib/legal/company.ts` (NIT, domicilio, representante legal)
- Revisión abogado colombiano (Habeas Data, Términos, reembolsos Ley 1480)
- Registro RNSD / inventario tratamiento SIC
- DPAs con Anthropic, Google Cloud, Resend, Mercado Pago
- Modal re-aceptación si cambian versiones legales sustancialmente
- Beta: consentimiento documentado

---

## Related docs

- [`docs/PRODUCTION-LEGAL-CHECKLIST.md`](PRODUCTION-LEGAL-CHECKLIST.md) — legal y cumplimiento pre go-live
- [`docs/security/pentest-checklist.md`](security/pentest-checklist.md) — offensive security (6.2)
- [`tasks/tasks-plan-reconversion-insurwallet.md`](../tasks/tasks-plan-reconversion-insurwallet.md) — full task list
- [`.env.example`](../.env.example) — variable template
