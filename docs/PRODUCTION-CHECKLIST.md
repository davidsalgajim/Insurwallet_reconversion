# Production checklist — InsurWallet

Runbook paso a paso para **staging → smoke → producción → go-live**. Complementa el checklist corto en [`README.md`](../README.md), la tarea **F6** en [`tasks/tasks-plan-reconversion-insurwallet.md`](../tasks/tasks-plan-reconversion-insurwallet.md) y el cumplimiento legal en [`PRODUCTION-LEGAL-CHECKLIST.md`](PRODUCTION-LEGAL-CHECKLIST.md).

**Última revisión:** jun 2026 · **Stack:** Vercel (Next.js) + Firebase (Auth, Firestore, Storage, Functions) + Cloud Run (worker Python) + MarIAna (mismo runtime Next.js).

---

## Runbook ordenado (go-live)

Sigue este orden. No pasar a **Enforce** App Check ni dominio prod hasta que staging pase smoke.

```text
Fase 0  Preparación (proyectos GCP/Firebase prod + Secret Manager)
   ↓
Fase 1  Staging — secretos Vercel Preview + Firebase staging + worker staging
   ↓
Fase 2  Deploy infra staging (rules, índices vector 768, Functions, Cloud Run)
   ↓
Fase 3  Smoke staging (manual + E2E) — incl. upload PDF, MarIAna, MP sandbox
   ↓
Fase 4  Producción — secretos Vercel Production + Firebase prod + worker prod
   ↓
Fase 5  Dominio custom prod + APP_URL canónico + MP live + Resend dominio
   ↓
Fase 6  MarIAna RAG — GOOGLE_AI_API_KEY prod + re-index pólizas
   ↓
Fase 7  App Check Monitor 1–2 semanas (≥95% válido) → Enforce Firestore/Storage
   ↓
Fase 8  Monitoreo (Sentry, PostHog, uptime) + go/no-go legal (6.12 / F6 §I)
```

### Fase 0 — Preparación

- [ ] Proyecto Firebase **producción** creado (separado de `insurwallet-staging`)
- [ ] Proyecto GCP vinculado; facturación y alertas de presupuesto (tarea 7.3)
- [ ] Google Secret Manager: crear secretos (ver §1.2) — **nunca** commitear valores
- [ ] Cuentas de servicio: Vercel/Next.js, Firebase Admin, invocador Cloud Run worker

### Fase 1 — Secretos staging (Vercel Preview)

- [ ] Variables §1.1 + §1.2 en Vercel **Preview** (proyecto Firebase staging)
- [ ] `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=false`
- [ ] `NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION=true`
- [ ] `NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY` (reCAPTCHA v3)
- [ ] **Sin** `NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN` ni `FIREBASE_APPCHECK_DEBUG_TOKEN`
- [ ] `FIREBASE_SERVICE_ACCOUNT` (o binding Secret Manager)
- [ ] `APP_URL` = URL preview estable o dominio staging
- [ ] `INTERNAL_API_SECRET`, `WORKER_URL`, `WORKER_OIDC_AUDIENCE`
- [ ] `ANTHROPIC_API_KEY` (worker + MarIAna)
- [ ] `GOOGLE_AI_API_KEY` o `EMBEDDING_API_KEY` (MarIAna RAG — mismo valor que en local si ya probaste embeddings)
- [ ] `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (dominio verificado o sandbox Resend)
- [ ] Mercado Pago **TEST**: `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`, `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`
- [ ] Opcional: `NEXT_PUBLIC_FIREBASE_VAPID_KEY` (FCM web push)

### Fase 2 — Deploy infra staging

#### Firebase Console (staging)

- [ ] Auth: Email/password + Google; dominios autorizados (`localhost`, `*.vercel.app`, dominio staging)
- [ ] Firestore + Storage habilitados
- [ ] App Check: app web registrada (reCAPTCHA v3); Firestore + Storage en **Monitor**
- [ ] reCAPTCHA Admin → **Allowed domains:** `localhost`, preview Vercel, dominio staging
- [ ] Cloud Messaging: par Web Push → `NEXT_PUBLIC_FIREBASE_VAPID_KEY` (si aplica)

#### CLI deploy (staging)

```bash
firebase deploy --only firestore:rules,storage --project insurwallet-staging
firebase deploy --only firestore:indexes --project insurwallet-staging
cd functions && npm ci && npm run build
firebase deploy --only functions --project insurwallet-staging
```

- [ ] Índice vector `chunks.embedding` (768-dim) en estado **Building** → **Enabled** (puede tardar horas)
- [ ] Functions desplegadas: `onPolicyDocumentUpload`, `createCheckout`, `mercadoPagoPaymentWebhook`, `sendExpiryReminders`, `refreshPolicyStatuses`

#### Cloud Run worker (staging)

```bash
gcloud builds submit --tag gcr.io/<project>/insurwallet-worker ./worker
gcloud run deploy insurwallet-worker \
  --image gcr.io/<project>/insurwallet-worker \
  --region <region> \
  --no-allow-unauthenticated \
  --set-secrets ANTHROPIC_API_KEY=anthropic-api-key:latest
```

- [ ] `WORKER_URL` en Vercel Preview = URL del servicio
- [ ] `WORKER_OIDC_AUDIENCE` = misma URL (sin `/` final)
- [ ] IAM: SA de Next.js en `WORKER_ALLOWED_SERVICE_ACCOUNTS`

#### Mercado Pago (staging)

- [ ] Webhook registrado en MP Developers apuntando a `mercadoPagoPaymentWebhook` (Cloud Functions URL)
- [ ] Evento de prueba recibido y verificado (`x-signature`)

### Fase 3 — Smoke staging

Checklist manual (orden sugerido):

- [ ] Registro → verificación email → login
- [ ] Crear póliza manual → editar → dashboard KPIs
- [ ] Upload PDF → estados job en vivo → pantalla revisión → confirmar póliza
- [ ] MarIAna: pregunta sobre cobertura (con consentimiento IA + `GOOGLE_AI_API_KEY`)
- [ ] Compartir póliza → email Resend al destinatario
- [ ] Checkout Premium (MP sandbox) → webhook actualiza `subscription`
- [ ] Export GDPR + eliminar cuenta de prueba (opcional en staging)

Automatizado:

```bash
npm run test                                    # unit + rules en CI
npm run emulators:exec -- "npm run test:rules && npm run test:storage-rules"
npm run test:e2e                                # smoke local
# Contra preview Vercel: PLAYWRIGHT_BASE_URL=https://<preview> npm run test:e2e
```

- [ ] Pentest muestra en staging: [`docs/security/pentest-checklist.md`](security/pentest-checklist.md)

### Fase 4 — Producción (infra + secretos)

Repetir Fase 1–2 con proyecto Firebase **prod** y entorno Vercel **Production**:

- [ ] Todas las vars §1.1 + §1.2 en Vercel Production
- [ ] `APP_URL` = `https://app.<tudominio>.com` (canónico)
- [ ] Mercado Pago **live** (no TEST)
- [ ] Deploy rules + índices + Functions + worker prod
- [ ] Webhook MP prod registrado

### Fase 5 — Dominio y email

- [ ] Dominio custom en Vercel Production + DNS (A/CNAME)
- [ ] Auth Firebase → dominio prod en **Authorized domains**
- [ ] reCAPTCHA Admin → dominio prod en **Allowed domains** (antes de Enforce)
- [ ] Resend: dominio verificado (SPF/DKIM); `RESEND_FROM_EMAIL` prod

### Fase 6 — MarIAna RAG (Google embeddings + transcript)

Requisitos en prod:

| Variable                                  | Dónde                      | Notas                                                                   |
| ----------------------------------------- | -------------------------- | ----------------------------------------------------------------------- |
| `GOOGLE_AI_API_KEY` o `EMBEDDING_API_KEY` | Vercel Production (server) | Google Generative Language API; modelo **text-embedding-004**, 768 dims |
| Consentimiento `users.consents.cloudAI`   | Firestore                  | Modal IA en upload/registro                                             |
| Índice vector                             | Firestore                  | `firestore.indexes.json` → `chunks.embedding` 768-dim                   |
| Transcript en documento                   | Firestore + Storage        | `extractedSummary` (≤10KB) + `extractedTextPath` si mayor               |

Pasos:

- [ ] Confirmar `GOOGLE_AI_API_KEY` en Vercel Production (Secret Manager recomendado)
- [ ] Confirmar índice vector **Enabled** en consola Firestore
- [ ] Tras go-live: **re-indexar** pólizas con documentos ya confirmados:
  - Pólizas sin transcript (pre-jun 2026): `node scripts/reprocess-document.mjs <policyId>` luego `POST /api/policies/{policyId}/index-documents`
  - Pólizas con transcript ya persistido: solo `index-documents` por póliza o script batch admin
- [ ] Smoke: upload PDF escaneado → confirmar revisión → preguntar exclusiones a MarIAna → respuesta con cita a chunk del clausulado
- [ ] Sin API key: MarIAna sigue con búsqueda keyword (degradación aceptable pero peor calidad RAG)

Detalle técnico: [`mariana/README.md`](../mariana/README.md) § RAG · [`worker/README.md`](../worker/README.md) § RAG text.

### Fase 7 — App Check Enforce (solo prod, tras Monitor estable)

**No Enforce** hasta Fase 3 smoke verde y ≥95% solicitudes válidas en Monitor (1–2 semanas en dominio real).

1. [ ] Dominio custom en reCAPTCHA **Allowed domains**
2. [ ] `NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY` en Vercel Production
3. [ ] Sin debug tokens en ningún env hosted
4. [ ] Firebase Console → Firestore → App Check → **Enforce**
5. [ ] Firebase Console → Storage → App Check → **Enforce**
6. [ ] Smoke post-Enforce: login, póliza, upload, MarIAna — sin `app-check/failed`
7. [ ] Re-ejecutar pentest §1 con Enforce activo

Cliente: `lib/firebase/app-check.ts` (omitido con emuladores).

### Fase 8 — Monitoreo y go/no-go

- [ ] Sentry: `NEXT_PUBLIC_SENTRY_DSN` + `SENTRY_DSN`; verificar evento de prueba
- [ ] PostHog: `NEXT_PUBLIC_POSTHOG_KEY` (tarea 7.4)
- [ ] Uptime: health app + `WORKER_URL/health` (tarea 7.6)
- [ ] Legal: [`PRODUCTION-LEGAL-CHECKLIST.md`](PRODUCTION-LEGAL-CHECKLIST.md) completo antes de registro público
- [ ] Go/no-go técnico (6.12) + rollback plan (Vercel rollback + revisión rules)

---

## 1. Referencia de variables de entorno

### 1.1 Next.js / Vercel (cliente — `NEXT_PUBLIC_*`)

| Variable                                           | Requerida    | Notas                                         |
| -------------------------------------------------- | ------------ | --------------------------------------------- |
| `NEXT_PUBLIC_FIREBASE_API_KEY`                     | ✅           | Firebase Console → Project settings → Web app |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`                 | ✅           | `{projectId}.firebaseapp.com`                 |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`                  | ✅           | `insurwallet-staging` / proyecto prod         |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`              | ✅           | Prefer `*.firebasestorage.app`                |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`         | ✅           |                                               |
| `NEXT_PUBLIC_FIREBASE_APP_ID`                      | ✅           |                                               |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`              | Opcional     | Google Analytics                              |
| `NEXT_PUBLIC_USE_FIREBASE_EMULATORS`               | ✅           | `false` en staging/prod                       |
| `NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION`           | ✅           | `true` staging/prod                           |
| `NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY` | ✅ prod      | reCAPTCHA v3 site key (pública)               |
| `NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN`        | **Solo dev** | Nunca Preview/Production                      |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY`                   | Opcional     | Web Push (FCM)                                |
| `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`               | F4           | Pública; TEST staging / live prod             |
| `NEXT_PUBLIC_SENTRY_DSN`                           | Opcional     | Cliente Sentry                                |
| `NEXT_PUBLIC_POSTHOG_KEY`                          | Opcional     | Analytics producto                            |
| `NEXT_PUBLIC_PAYMENTS_ENABLED` / `MARIANA_ENABLED` | Opcional     | Fallback env hasta Remote Config              |

### 1.2 Next.js / Vercel (servidor)

| Variable                                                      | Requerida    | Notas                                             |
| ------------------------------------------------------------- | ------------ | ------------------------------------------------- |
| `FIREBASE_SERVICE_ACCOUNT` o `GOOGLE_APPLICATION_CREDENTIALS` | ✅ prod      | Session cookies + Admin SDK                       |
| `APP_URL`                                                     | ✅ prod      | URL canónica HTTPS                                |
| `INTERNAL_API_SECRET`                                         | ✅ prod      | Job dispatch, APIs internas                       |
| `WORKER_URL`                                                  | ✅ F2+       | Base URL Cloud Run worker                         |
| `WORKER_OIDC_AUDIENCE`                                        | ✅ prod      | = `WORKER_URL` sin trailing slash                 |
| `WORKER_ALLOWED_SERVICE_ACCOUNTS`                             | Opcional     | Emails SA autorizados (coma-separados)            |
| `ANTHROPIC_API_KEY`                                           | ✅ F2/F3     | **Secret Manager** — extracción + MarIAna         |
| `GOOGLE_AI_API_KEY` / `EMBEDDING_API_KEY`                     | ✅ RAG       | **Secret Manager** — text-embedding-004 (768-dim) |
| `RESEND_API_KEY`                                              | F4           | Email transaccional                               |
| `RESEND_FROM_EMAIL`                                           | F4           | Remitente verificado en Resend                    |
| `MERCADOPAGO_ACCESS_TOKEN`                                    | F4           | Server checkout + webhook                         |
| `MERCADOPAGO_WEBHOOK_SECRET`                                  | F4           | Verificación `x-signature`                        |
| `MERCADOPAGO_API_BASE_URL`                                    | Opcional     | Default `https://api.mercadopago.com`             |
| `SENTRY_DSN`                                                  | Opcional     | Servidor (fallback `NEXT_PUBLIC_SENTRY_DSN`)      |
| `POSTHOG_KEY`                                                 | Opcional     | Server-side PostHog                               |
| `FIREBASE_APPCHECK_DEBUG_TOKEN`                               | **Solo dev** | UUID debug App Check — no prod                    |
| `WOMPI_*` (legacy)                                            | Opcional     | Adapter deprecado                                 |

> **Regla:** Claude, Google AI, Mercado Pago, Resend y JSON de cuenta de servicio → **Google Secret Manager** en staging/prod. Referenciar desde Vercel/Firebase/Cloud Run — nunca en git.

### 1.3 Cloud Functions

| Secreto / env                | Propósito                        |
| ---------------------------- | -------------------------------- |
| Service account (runtime)    | Admin SDK                        |
| `RESEND_API_KEY`             | Email (vencimientos, bienvenida) |
| `MERCADOPAGO_ACCESS_TOKEN`   | Checkout + fetch recurso webhook |
| `MERCADOPAGO_WEBHOOK_SECRET` | Firma webhook                    |
| `SENTRY_DSN`                 | Errores Functions                |

Deploy: `firebase deploy --only functions`

### 1.4 Cloud Run — worker documentos

| Env                              | Propósito                              |
| -------------------------------- | -------------------------------------- |
| `PORT`                           | `8080` (default)                       |
| `ANTHROPIC_API_KEY`              | Extracción Claude (**Secret Manager**) |
| `GOOGLE_APPLICATION_CREDENTIALS` | GCS si aplica                          |
| `SENTRY_DSN`                     | Errores worker                         |

Imagen: `worker/Dockerfile` (JDK 11 + Python 3.12). Smoke: `worker/scripts/docker-smoke.sh`.

Pipeline prod: ODL → quality gate → **Claude vision** si PDF escaneado (`pipeline: vision, claude`) → extracción guardada en `documents/{docId}.extraction`. Local: `INTERNAL_API_SECRET` compartido Next.js + worker.

**Desarrollo local (worker + MarIAna):**

```bash
# Terminal 1 — Next.js
npm run dev

# Terminal 2 — worker Python (:8080, lee .env.local de la raíz)
npm run dev:worker
```

Mínimo en `.env.local`: `WORKER_URL=http://localhost:8080`, `INTERNAL_API_SECRET` (≥16 chars, mismo en ambos procesos), `ANTHROPIC_API_KEY`, bucket Storage y credenciales Admin/GCS. PDF escaneado requiere worker + `ANTHROPIC_API_KEY`. MarIAna usa `ANTHROPIC_API_KEY` y opcionalmente `GOOGLE_AI_API_KEY` para RAG — **no** depende de `RESEND_*`. Modelos: `mariana/models.ts` (Haiku router, Sonnet especialista).

Frontend revisión: pdf.js con `public/pdf.worker.mjs` — ejecutar `npm run sync-pdf-worker` tras actualizar `pdfjs-dist`.

### 1.5 Settings & subscription

- [ ] `/api/user/profile`, `/api/user/preferences` — requieren session cookies + Admin en prod
- [ ] `/api/user/contacts` — rules owner-only
- [ ] Subscription: vars MP + `PAYMENTS_ENABLED`; smoke checkout staging antes de prod
- [ ] Notificaciones: `NEXT_PUBLIC_FIREBASE_VAPID_KEY` — ver [`docs/notifications.md`](notifications.md)

---

## 2. CI gates (pre-deploy)

| Workflow                           | Gate                                                     |
| ---------------------------------- | -------------------------------------------------------- |
| `.github/workflows/ci.yml`         | lint, typecheck, vitest, rules tests (emuladores), build |
| `.github/workflows/e2e.yml`        | Playwright smoke en preview                              |
| `.github/workflows/golden-ocr.yml` | Golden OCR worker                                        |

```bash
npm run test
npm run emulators:exec -- "npm run test:rules && npm run test:storage-rules"
npm run test:e2e
E2E_FIREBASE_EMULATORS=true npm run test:e2e
```

---

## 3. Observabilidad

| Herramienta   | Estado (código)                       | Config producción                        |
| ------------- | ------------------------------------- | ---------------------------------------- |
| Sentry        | `@sentry/nextjs` wired, no-op sin DSN | `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_DSN`  |
| PostHog       | Pendiente 7.4                         | `NEXT_PUBLIC_POSTHOG_KEY`                |
| Cloud Logging | Functions/worker                      | Logs estructurados `jobId` / `uid` (7.2) |
| Uptime        | Pendiente 7.6                         | Checks app + worker `/health`            |

---

## 4. PWA

- [x] `public/manifest.webmanifest`, `public/sw.js`, `offline.html` (código)
- [ ] QA instalación iOS Safari + Android Chrome en staging/prod
- [ ] Offline fallback verificado tras deploy

---

## 5. Go / no-go (F5 — 6.12 / F6 §I)

- [ ] Fases 0–8 completas en staging y prod según alcance del lanzamiento
- [ ] App Check Enforce en prod
- [ ] CI verde incluyendo rules tests
- [ ] E2E rutas críticas
- [ ] Security review + Bugbot en rama release
- [ ] Legal: NIT, abogado, RNSD, DPAs — [`PRODUCTION-LEGAL-CHECKLIST.md`](PRODUCTION-LEGAL-CHECKLIST.md)
- [ ] Plan rollback: Vercel instant rollback + revisión `firestore.rules` / `storage.rules`

---

## Documentos relacionados

- [`docs/PRODUCTION-LEGAL-CHECKLIST.md`](PRODUCTION-LEGAL-CHECKLIST.md) — legal y cumplimiento
- [`docs/security/pentest-checklist.md`](security/pentest-checklist.md) — seguridad ofensiva (6.2)
- [`tasks/tasks-plan-reconversion-insurwallet.md`](../tasks/tasks-plan-reconversion-insurwallet.md) — F6 Producción
- [`mariana/README.md`](../mariana/README.md) — RAG y embeddings
- [`.env.example`](../.env.example) — plantilla de variables
