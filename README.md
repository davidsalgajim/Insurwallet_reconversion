# InsurWallet Reconversión

Migración de InsurWallet (iOS nativa) a una web app moderna para LATAM.

**Estado actual (jun 2026):** F0 ~90% · F1 ~94% · F2 ~94% (multi-PDF, `dev:worker`, timeouts job) · F3 ~94% (MarIAna modelos actuales, env aislado de Resend, RAG + share) · F4 ~85% (legal, Mercado Pago, notificaciones, GDPR) · F5 parcial (E2E, PWA, checklists). Schema Zod unificado, compresión cliente 2 MB, lista pólizas con **filtros + gráfico por tipo**, directorio guardado de asesores/beneficiarios, extracción de agente en revisión, upload→worker con fail-fast, settings hub, legal + consentimiento, reglas en CI. Pendiente: deploy staging, App Check Enforce, re-index pólizas legacy, backups/iOS import, revisión abogado/NIT.

Documentación de producto y diseño: [`PRODUCT.md`](PRODUCT.md), [`DESIGN.md`](DESIGN.md). Plan de tareas: [`tasks/tasks-plan-reconversion-insurwallet.md`](tasks/tasks-plan-reconversion-insurwallet.md).

## Stack

| Capa                | Tecnología                                                                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Frontend            | Next.js 16, React 19, TypeScript strict, Tailwind CSS v4, shadcn/ui (base)                                                                             |
| Auth / DB / Storage | Firebase (Auth, Firestore, Storage, Functions, FCM, App Check reCAPTCHA v3)                                                                            |
| i18n                | next-intl (ES base, EN/PT — cobertura parcial en app)                                                                                                  |
| Validación          | Zod                                                                                                                                                    |
| Tests TS            | Vitest                                                                                                                                                 |
| Tests reglas        | Firebase emulators + `@firebase/rules-unit-testing`                                                                                                    |
| Backend             | Cloud Functions (Node), Cloud Run worker Python; MarIAna en Next.js API                                                                                |
| Documentos (F2)     | OpenDataLoader PDF, quality gate, **Claude vision** (PDF escaneado), **transcripción RAG** (`claude_transcriber.py`), Claude tool-use, léxico ES/EN/PT |
| Pagos (F4)          | Mercado Pago (Colombia); Wompi deprecated                                                                                                              |

## Fases

| Fase | Descripción                                                 | Estado  |
| ---- | ----------------------------------------------------------- | ------- |
| F0   | Setup, Firebase, design system, CI, i18n, App Check         | ~90%    |
| F1   | Auth, Firestore schema, CRUD pólizas, dashboard, upload PDF | ~90%    |
| F2   | Pipeline de documentos + UI de revisión + transcript RAG    | ~92%    |
| F3   | MarIAna multi-agente, RAG híbrido, compartir pólizas        | ~92%    |
| F4   | Pagos (Mercado Pago), notificaciones, GDPR                  | ~85%    |
| F5   | Hardening, E2E, beta                                        | Parcial |

## Implementado

- **Marketing:** landing `/[locale]` rediseño editorial claro (body blanco, nav sticky, secciones features/services/testimonial) con hero navy enmarcado y preview de dashboard
- **Auth:** login, registro, forgot-password, verify-email — email/password + Google; session cookie + middleware; UI navy + glass card; bloqueo staging vía `NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION`; consentimiento legal en registro (checkbox) y aviso en login; re-aceptación silenciosa si cambian versiones
- **Env cliente:** `lib/env.ts` lee `NEXT_PUBLIC_*` con acceso estático (Next.js inline en bundle); evita fallbacks demo en staging
- **App Check:** reCAPTCHA v3 en cliente (`lib/firebase/app-check.ts`); omitido con emuladores; modo Monitor en Firestore/Storage
- **App:** dashboard (KPIs y vencimientos desde Firestore), lista/detalle/edición/borrado de pólizas con **filtros por tipo/estado** y **gráfico resumen** del portafolio, tabs **Mis pólizas / Compartidas conmigo**, agregador **Beneficios y asistencias** (`/policies/benefits`), wizard manual estructurado (coberturas, deducibles, beneficios, beneficiarios con %, agente) + **directorio guardado** (reutilizar asesores/beneficiarios en wizard y revisión) + upload **multi-PDF** (hasta 10 archivos, compresión ≤2 MB c/u, `documentRole` opcional) (`/policies/new/upload` → Storage + documento en Firestore)
- **Modelo de póliza unificado:** un schema Zod (`lib/schemas/policy.ts`, `beneficiary.ts`, `extraction.ts`) alimenta wizard manual, revisión post-Claude y tools read-only de MarIAna — paridad iOS en tipos, beneficiarios y campos estructurados
- **Estados de póliza:** `computePolicyStatus` (active/expiring/expired) + scheduled Function diaria `refreshPolicyStatuses`
- **Shell:** icon rail desktop + nav inferior móvil, topbar, dot-grid background
- **Firebase:** `firestore.rules` + `storage.rules` con tests; emuladores configurados; proyecto staging `insurwallet-staging`
- **CI:** lint, typecheck, unit tests, **rules tests (emulators)**, build (`.github/workflows/ci.yml`)
- **E2E:** Playwright smoke + flujos con emuladores (`e2e/`, `npm run test:e2e:emulators`)
- **PWA:** manifest + service worker shell (`public/sw.js`)
- **Observability:** Sentry stub (no-op sin DSN)
- **Configuración (settings):** `/settings` — perfil, moneda/preferencias, privacidad (export/delete cuenta), notificaciones; `/settings/contacts` — contactos de emergencia; `/settings/subscription` — plan y checkout **Mercado Pago**; `/settings/help` — ayuda
- **Legal (F4):** páginas `/legal/terms`, `/legal/privacy`, `/legal/cookies`, `/legal/notice` (ES/EN/PT); datos centralizados en `lib/legal/company.ts`; versiones en `lib/legal/versions.ts`; API `/api/consents`; checklist pre go-live en [`docs/PRODUCTION-LEGAL-CHECKLIST.md`](docs/PRODUCTION-LEGAL-CHECKLIST.md)
- **Documentos (F2):** upload → job worker (`WORKER_URL`) → pipeline texto o **visión Claude** (PDF escaneado) → extracción estructurada ES/EN/PT (incl. **agente** con heurística asesor/SAC/firma) → **transcript completo** (`document_text`) persistido en `extractedSummary` / Storage (`extracted/document.txt`) → pantalla de revisión split-view (pdf.js + confianza/bboxes + merge agente); **timeouts** de job (10 min wall-clock, aviso UI a 3 min, reintento forzado si worker caído); PDF original en Storage por usuario; extracción en `policies/{id}/documents/{docId}`
- **MarIAna (F3):** chat streaming SSE con avatar de marca, subtítulo **Asistente IA** (ES/EN/PT); modelos centralizados en `mariana/models.ts` (Haiku router + Sonnet especialista); **env Resend aislado** — `RESEND_FROM_EMAIL` inválido no bloquea el chat; Tier 0 determinístico (incl. consultas de pólizas vencidas); router situacional + 5 agentes core + **10 especialistas por tipo**; tools read-only; RAG híbrido sobre **transcript indexado**; indexación al confirmar revisión; **120 evals estructurales** — ver [`mariana/evals/README.md`](mariana/evals/README.md); pendiente cost tracking (4.10) y re-index batch pólizas legacy
- **Layout raíz:** `<html>`/`<body>` únicos en `app/layout.tsx` (locale + fuentes); `[locale]/layout.tsx` solo proveedores — evita anidación inválida en App Router
- **Notificaciones (prefs):** canal email/push/ambos + tipos de aviso en Configuración; API `GET/PUT /api/notifications/prefs`; registro FCM si push activo — envío real email/push en F4 (ver [`docs/notifications.md`](docs/notifications.md))

## Pendiente (próximos hitos)

- Deploy staging (checklists: [`docs/PRODUCTION-CHECKLIST.md`](docs/PRODUCTION-CHECKLIST.md) · legal: [`docs/PRODUCTION-LEGAL-CHECKLIST.md`](docs/PRODUCTION-LEGAL-CHECKLIST.md))
- Deploy worker Cloud Run en staging/prod + OIDC (`WORKER_OIDC_AUDIENCE`)
- Re-indexar pólizas existentes sin transcript (`node scripts/reprocess-document.mjs` + `index-documents`)
- MarIAna: cost tracking (4.10)
- Ejecutar evals estructurales en CI local: `npm run test -- mariana/evals`
- Backups Firestore, import iOS, recibo email post-pago
- App Check **Enforce** en Firebase Console (checklist documentado en 6.13)

## Firebase staging

Proyecto configurado en `.firebaserc` como `insurwallet-staging`. Copiar credenciales web desde Firebase Console → Project settings → Your apps.

> **Nota ID de proyecto:** el ID canónico es `insurwallet-staging` (doble **g**). Si el proyecto se creó con typo (`insurwallet-stagging`), usar el ID exacto de la consola en `.env.local` y `.firebaserc` — deben coincidir con el proyecto real, no con el nombre deseado.

Variables mínimas en `.env.local` (ver `.env.example`):

```bash
NEXT_PUBLIC_FIREBASE_PROJECT_ID=insurwallet-staging
NEXT_PUBLIC_USE_FIREBASE_EMULATORS=false
NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION=true   # staging
NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY=6Lc...
```

Storage bucket: preferir el valor de la consola (`*.firebasestorage.app`); el fallback dev en `lib/env.ts` usa `*.appspot.com`.

## Checklist deploy staging (2.12)

Usar antes del primer deploy a Vercel/Firebase Hosting — **no sustituye el deploy**.

### Firebase Console

- [ ] Proyecto `insurwallet-staging` (o ID real) con Auth (email, Google), Firestore, Storage habilitados
- [ ] Dominios autorizados en Auth: `localhost`, preview Vercel (`*.vercel.app`), dominio staging final
- [ ] App Check → app web → reCAPTCHA v3; site key en env de Vercel
- [ ] reCAPTCHA Admin → **Allowed domains:** `localhost`, dominio preview/staging (prod en 6.13)
- [ ] Firestore + Storage → App Check en **Monitor** (no Enforce hasta métricas estables)
- [ ] Reglas `firestore.rules` y `storage.rules` desplegadas: `firebase deploy --only firestore:rules,storage`
- [ ] Índices: `firebase deploy --only firestore:indexes`
- [ ] Functions: `refreshPolicyStatuses` desplegada si se usa status persistido

### Vercel / hosting

- [ ] Variables `NEXT_PUBLIC_*` en el panel (mismos valores que staging Firebase)
- [ ] `NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION=true`
- [ ] `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=false`
- [ ] Build: `npm run build` verde en CI
- [ ] Smoke manual: registro → verify email → login → crear póliza manual → upload PDF → detalle

### Post-deploy

- [ ] Revisión agentes (security-reviewer + typescript-reviewer)
- [ ] Marcar 2.12 completada en tasks

## Estructura del repo

```
app/[locale]/          # Rutas con locale (marketing, auth, app)
components/            # UI, auth, policies, marketing, layout, brand
hooks/                 # Custom hooks de datos
i18n/                  # routing, navigation, request (next-intl)
lib/                   # firebase/, schemas/, env.ts, utils/
messages/              # es.json, en.json, pt.json
functions/             # Cloud Functions (scheduled status, scaffold)
worker/                # Pipeline documentos Cloud Run (ver worker/README.md)
mariana/               # Orquestador chat (F3) + evals estructurales
e2e/                   # Playwright (F5)
tasks/                 # Task list de implementación
docs/                  # Plan maestro
```

## Desarrollo local

### Requisitos

- Node.js 20+ (CI usa 22)
- Firebase CLI (`npm install -g firebase-tools`)
- **Java 21+** (JDK) — emuladores Firestore/Storage y tests de reglas (`firebase-tools` ≥15)

En Windows:

```powershell
winget install Microsoft.OpenJDK.21
java -version
```

### Arranque

```bash
npm install
cp .env.example .env.local   # Windows: copy .env.example .env.local
# Editar .env.local con credenciales Firebase o usar emuladores
npm run dev
```

App en `http://localhost:3000` — rutas con prefijo de locale, p. ej. `/es`, `/es/dashboard`.

### Worker (documentos — Python 3.12)

Requisitos: **Python 3.12+**, venv en `worker/.venv` (`pip install -e ".[dev]"`), JDK 11 para OpenDataLoader en Docker/prod (local puede usar fallback pymupdf).

**Arranque recomendado** (carga `.env.local` de la raíz, resuelve credenciales y bucket):

```bash
npm run dev:worker
```

Equivalente manual:

```powershell
cd worker
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
uvicorn main:app --reload --port 8080 --host 127.0.0.1
```

En `.env.local` (raíz), mínimo para jobs locales:

- `WORKER_URL=http://localhost:8080`
- `INTERNAL_API_SECRET` (mín. 16 caracteres) — **el mismo valor** en Next.js y worker
- `ANTHROPIC_API_KEY` — obligatorio para PDFs escaneados / visión
- `FIREBASE_STORAGE_BUCKET` o `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `GOOGLE_APPLICATION_CREDENTIALS` o `FIREBASE_SERVICE_ACCOUNT` (descarga PDF desde Storage)

Sin worker activo o con secret distinto, el dispatch local falla con 401/503 y la UI muestra mensaje accionable (`npm run dev:worker`). Detalle del pipeline: [`worker/README.md`](worker/README.md).

**Reprocesar extracción + transcript RAG (dev):** `node scripts/reprocess-document.mjs <policyId> [docId]` — luego `POST /api/policies/{id}/index-documents` para reconstruir chunks MarIAna.

**Revisión PDF en UI:** el visor usa pdf.js con worker estático en `public/pdf.worker.mjs` (copiado desde `pdfjs-dist` al actualizar la dependencia).

### Variables de entorno

Plantilla completa: [`.env.example`](.env.example) (copiar a `.env.local`). Validación en `lib/env.ts` (cliente) y `lib/env-server.ts` (servidor).

| Área             | Variables clave                                                                                                                                                                                                       |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Firebase cliente | `NEXT_PUBLIC_FIREBASE_*`, emuladores, verify-email, App Check site key                                                                                                                                                |
| Dev / App Check  | `NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN` o `FIREBASE_APPCHECK_DEBUG_TOKEN` registrado en consola                                                                                                                   |
| Auth servidor    | `FIREBASE_SERVICE_ACCOUNT` o `GOOGLE_APPLICATION_CREDENTIALS` — sin ellas, **dev** guarda ID token verificado como cookie (ver tests `session-server`)                                                                |
| Worker           | `WORKER_URL`, `INTERNAL_API_SECRET` (**requerido en local**), `WORKER_REQUEST_TIMEOUT_MS` (default 90s), `GOOGLE_APPLICATION_CREDENTIALS` o `FIREBASE_SERVICE_ACCOUNT`, `WORKER_OIDC_AUDIENCE` (prod)                 |
| Claude           | `ANTHROPIC_API_KEY` en worker + MarIAna (`mariana/models.ts`) — Secret Manager en prod                                                                                                                                |
| Email (Resend)   | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (opcional; inválido → rutas email omiten envío, **no** bloquea MarIAna)                                                                                                         |
| Pagos            | `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`, `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`                                                                                                                        |
| Deploy           | [`docs/PRODUCTION-CHECKLIST.md`](docs/PRODUCTION-CHECKLIST.md) · legal: [`docs/PRODUCTION-LEGAL-CHECKLIST.md`](docs/PRODUCTION-LEGAL-CHECKLIST.md) · notificaciones: [`docs/notifications.md`](docs/notifications.md) |

### Emuladores Firebase

```bash
npm run emulators
# En .env.local: NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true
```

App Check se omite automáticamente con emuladores. Sin emuladores, el cliente inicializa reCAPTCHA v3 cuando `NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY` está definida.

### App Check (reCAPTCHA v3)

1. [Firebase Console](https://console.firebase.google.com/) → **Build → App Check** → registrar la app web → proveedor **reCAPTCHA v3**.
2. Añadir dominios permitidos (`localhost`, staging preview, producción) en la [consola de reCAPTCHA](https://www.google.com/recaptcha/admin) → **Allowed domains**.
3. En **Firestore** y **Storage** → pestaña App Check → activar en modo **Monitor**; pasar a **Enforce** cuando las métricas sean estables (prod: tras 6.13).
4. Desarrollo local contra Firebase real: **App Check → Manage debug tokens** y en `.env.local` usar `NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN=true` (token auto) o pegar el token.
5. Claves de servidor (Claude, pagos, Resend) → **Google Secret Manager** en prod/staging; la site key de reCAPTCHA es pública (`NEXT_PUBLIC_*`).

#### Checklist Enforce (producción — tarea 6.13)

Antes de pasar Firestore/Storage a **Enforce**:

- [ ] Dominio custom (p. ej. `app.insurwallet.com`) en reCAPTCHA Admin → **Allowed domains** (además de `localhost` y preview Vercel en staging).
- [ ] `NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY` configurada en Vercel Production.
- [ ] **Sin** `NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN` en preview/producción (solo dev local o emuladores).
- [ ] Monitor mode ≥1–2 semanas con ≥95% solicitudes válidas desde dominios reales.
- [ ] Cliente inicializa App Check: `lib/firebase/app-check.ts` (omitido con `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true`).
- [ ] Smoke post-Enforce: login, crear póliza, upload PDF, MarIAna — sin errores `app-check/failed`.
- [ ] Documentación completa: [`docs/PRODUCTION-CHECKLIST.md`](docs/PRODUCTION-CHECKLIST.md) §5.

### Observabilidad (Sentry)

- Opcional: `NEXT_PUBLIC_SENTRY_DSN` (cliente) y/o `SENTRY_DSN` (servidor). Sin DSN → no-op.
- Inicialización: `instrumentation.ts` (server), `components/observability/sentry-client-init.tsx` (client).
- Upgrade a `@sentry/nextjs` + source maps pendiente (tarea 7.1).

### PWA

- Manifest: `public/manifest.webmanifest` (referenciado en `app/layout.tsx`).
- Service worker shell: `public/sw.js` — caché de assets + lista de pólizas read-only; registrado en `app/[locale]/layout.tsx` (solo producción).
- Offline fallback: `public/offline.html`.
- FCM usa worker separado: `/firebase-messaging-sw.js`.

### E2E (Playwright)

```bash
npm run test:e2e                              # smoke (sin emuladores)
E2E_FIREBASE_EMULATORS=true npm run test:e2e  # auth, CRUD, upload, settings, MarIAna
```

Flujos en `e2e/`: `auth-policy.spec.ts`, `policy-flows.spec.ts`, `settings-mariana.spec.ts`. Ver [`docs/PRODUCTION-CHECKLIST.md`](docs/PRODUCTION-CHECKLIST.md) §4.

### Verificación de email

- Staging/prod: `NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION=true` — middleware bloquea rutas `(app)/*` hasta verificar.
- Local/dev: `false` — banner dismissible en layout de app; flujo verify-email disponible.
- **Dev session fallback:** sin credenciales Admin, rutas que aceptan sesión almacenan el **ID token verificado** como cookie (solo desarrollo); producción requiere service account.

### Notificaciones (email / push)

- **Configuración:** App → Configuración → Notificaciones — canal (solo email, solo push, ambos) y tipos de aviso.
- **Push:** opcional; requiere `NEXT_PUBLIC_FIREBASE_VAPID_KEY` en `.env.local` (Firebase Console → Cloud Messaging → Web Push).
- **Persistencia:** `users/{uid}.notificationChannels` + `notificationPrefs` en Firestore.
- **Envío real:** programado para F4 (Resend + FCM Admin en `sendExpiryReminders`). Detalle en [`docs/notifications.md`](docs/notifications.md).

### Scripts

| Script                                           | Descripción                                                  |
| ------------------------------------------------ | ------------------------------------------------------------ |
| `npm run dev`                                    | Servidor de desarrollo Next.js                               |
| `npm run dev:worker`                             | Worker Python local (:8080) — lee `.env.local` de la raíz    |
| `npm run build`                                  | Build de producción                                          |
| `npm run lint`                                   | ESLint                                                       |
| `npm run typecheck`                              | TypeScript                                                   |
| `npm run test`                                   | Vitest (unit)                                                |
| `npm run test:rules`                             | Tests Firestore rules (requiere emulador)                    |
| `npm run test:storage-rules`                     | Tests Storage rules (requiere emulador)                      |
| `npm run emulators`                              | Emuladores Firebase                                          |
| `npm run emulators:exec -- "npm run test:rules"` | Tests de reglas en emulador efímero                          |
| `npm run test:e2e`                               | Playwright smoke                                             |
| `npm run sync-pdf-worker`                        | Copia pdf.js worker a `public/` (tras actualizar pdfjs-dist) |

Variables de entorno validadas en `lib/env.ts` (Zod). En desarrollo faltan claves Firebase → fallbacks demo; en producción falla rápido si faltan.

## Origen

Reconversión basada en [insurwallet_final](https://github.com/davidsalgajim/insurwallet_final) (iOS).
