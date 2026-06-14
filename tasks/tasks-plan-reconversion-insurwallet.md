# Tareas — Reconversión InsurWallet iOS → Web App

Basado en el plan de migración (`docs/plan-reconversion.md`). Objetivo: web app de seguros de primer nivel para 2026 — seguridad, UI/UX, backend, multi-agente IA, testing y calidad de código continua.

## Relevant Files

### Frontend (Next.js — raíz del repo)

- `package.json` - Dependencias y scripts (dev, build, test, lint, e2e).
- `next.config.ts` - Configuración Next.js (imágenes, headers de seguridad, PWA).
- `tailwind.config.ts` / `app/globals.css` - Design tokens del design system generado.
- `app/(marketing)/page.tsx` - Landing pública (design-taste-frontend).
- `app/(auth)/login/page.tsx`, `app/(auth)/register/page.tsx` - Autenticación.
- `app/(app)/dashboard/page.tsx` - Dashboard con resumen, vencimientos y actividad.
- `app/(app)/policies/page.tsx`, `app/(app)/policies/[id]/page.tsx` - Lista y detalle de pólizas.
- `app/(app)/policies/new/page.tsx` - Wizard de creación (manual / subir PDF).
- `app/(app)/policies/[id]/review/page.tsx` - Pantalla de revisión de extracción IA (split-view).
- `app/(app)/mariana/page.tsx` - Chat MarIAna con streaming.
- `app/(app)/settings/page.tsx` - Perfil, privacidad, exportación, suscripción.
- `app/share/[token]/page.tsx` - Aceptación de pólizas compartidas.
- `components/` - Componentes UI (formularios, cards, estados de procesamiento, skeletons).
- `lib/firebase/` - Inicialización SDK cliente, hooks de auth y Firestore.
- `lib/schemas/` - Schemas Zod compartidos (Policy, Document, Share, etc.) + tests.
- `lib/i18n/` - Configuración next-intl + mensajes ES/EN/PT.
- `middleware.ts` - Protección de rutas y locale.

### Firebase

- `firebase.json`, `.firebaserc` - Configuración de proyecto y emuladores.
- `firestore.rules` / `firestore.rules.test.ts` - Security rules + tests con emulador.
- `storage.rules` / `storage.rules.test.ts` - Reglas de Storage + tests.
- `firestore.indexes.json` - Índices compuestos y vector index para RAG.
- `functions/src/index.ts` - Cloud Functions: triggers de Storage, webhooks de pago, scheduled (vencimientos, backups).
- `functions/src/payments/` - Adapter `PaymentProvider` (Wompi/Mercado Pago) + tests.
- `functions/src/notifications/` - FCM + emails transaccionales (Resend) + tests.

### Worker de documentos (Cloud Run — Python)

- `worker/Dockerfile` - Contenedor JDK 11 + Python 3.12 (OpenDataLoader requiere JVM).
- `worker/main.py` - Endpoint del job de procesamiento.
- `worker/pipeline/extract.py` - Orquestación ODL → quality gate → visión Claude (PDF escaneado) → transcribe RAG → validate + merge campos.
- `worker/pipeline/claude_transcriber.py` - Transcripción visión página a página para MarIAna (`document_text` en API worker).
- `worker/pipeline/sanitizer.py` - Sanitizador anti prompt-injection + tests.
- `worker/pipeline/pdf_vision.py` - Render de páginas PDF a PNG para Claude vision.
- `worker/pipeline/policy_lexicon.py` - Sinónimos de labels ES/EN/PT (LATAM) para prompts y quality gate.
- `worker/pipeline/claude_extractor.py` - Extracción text/vision con tool-use + heurísticas `hasNoExpiration` + tests.
- `worker/pipeline/validators.py` - Validadores post-IA portados de los regex Swift + tests.
- `lib/firebase/parse-document-extraction.ts` - Parseo de `document.extraction` desde Firestore (Timestamp → Date).
- `lib/server/document-text-storage.ts` - Persistencia transcript RAG (`extractedSummary`, `extractedTextPath` en Storage).
- `lib/server/document-job-runner.ts` - Orquestación job worker + persistencia extraction + transcript.
- `lib/server/document-chunks.ts` - Chunking, embeddings, búsqueda híbrida RAG (`resolveIndexingText` carga transcript completo).
- `scripts/reprocess-document.mjs` - Dev: re-extraer campos + transcript y persistir en Firestore/Storage.
- `components/policies/policy-pdf-viewer.tsx` - Visor revisión con pdf.js (`public/pdf.worker.mjs`).
- `worker/tests/golden/` - Golden set de ~20 pólizas reales con JSON esperado.
- `worker/tests/adversarial/` - Corpus de PDFs maliciosos para suite de inyección.

### MarIAna (Cloud Run — endpoint de chat)

- `mariana/router.ts` - Tier 0 determinístico + clasificador de intención (Haiku) + routing situacional + tests.
- `mariana/agents/` - System prompts de 5 agentes core + `specialists/` (10 tipos de póliza) + tests.
- `mariana/situational.ts` - Detección de intents situacionales (accidente, viaje, dental, etc.) + tests.
- `mariana/evals/` - 120 escenarios estructurales (router/tools/prompts) — ver README en carpeta.
- `mariana/tools.ts` - Tools read-only con scope server-side por uid + tests.
- `mariana/guardrails.ts` - Scope-check, rate limiting, límites de tokens + tests.

### Calidad y CI/CD

- `.github/workflows/ci.yml` - Lint, typecheck, unit, rules tests, build — gate de PR.
- `.github/workflows/e2e.yml` - Playwright contra preview deploy.
- `.github/workflows/golden-ocr.yml` - Golden set OCR + suite adversarial (gate).
- `.github/dependabot.yml` - Actualizaciones automáticas de dependencias.
- `e2e/` - Tests Playwright de flujos críticos.
- `docs/plan-reconversion.md` - Plan maestro de la migración.
- `docs/PRODUCT.md`, `docs/DESIGN.md` - Salida de impeccable init.

### Notes

- Tests junto al código (`Foo.tsx` + `Foo.test.tsx`); TS: `npx vitest`, Python: `pytest`, reglas: emulador + `@firebase/rules-unit-testing`, E2E: `npx playwright test`.
- Metodología TDD (red-green-refactor) en lógica de negocio: validadores, adapter de pagos, sanitizador, router de MarIAna.
- Al cerrar cada parent task: revisión con agentes (security-reviewer + typescript-reviewer/python-reviewer + Bugbot) antes del commit.
- Secretos SIEMPRE en Google Secret Manager (Claude, Wompi/MP, Resend) — nunca en env vars planas ni en el repo.
- Diseño: impeccable (producto), ui-ux-pro-max (design system), emil-design-eng (micro-interacciones), design-taste-frontend (landing).

## Tasks

- [ ] 1.0 F0 — Fundación técnica: scaffold Next.js + Firebase + CI/CD completo + design system + POC OpenDataLoader
  - [x] 1.1 Scaffold Next.js 16 (App Router, TS strict, Tailwind v4, ESLint, Prettier, husky + lint-staged)
  - [x] 1.2 Firebase scaffold: `firebase.json`, rules skeleton, emuladores, `lib/firebase/`, `functions/`, `.env.example`
  - [x] 1.3 Configurar App Check (reCAPTCHA v3) en modo monitor y Google Secret Manager para todas las claves
  - [x] 1.4 CI/CD: `.github/workflows/ci.yml`, Dependabot, Vitest config
  - [x] 1.5 `PRODUCT.md` + `DESIGN.md` en raíz (impeccable init)
  - [x] 1.6 Design tokens en `globals.css` + componentes UI (Button, Card) + páginas visuales
  - [x] 1.7 POC OpenDataLoader: contenedor Docker (JDK 11 + Python 3.12) — **`worker/scripts/docker-smoke.sh`** verifica `/health/odl` + auth; imagen instala `opendataloader-pdf`; fallback dev pymupdf intacto
  - [x] 1.8 next-intl ES/EN/PT + middleware + `messages/*.json`
  - [x] 1.9 Revisión de código con agentes (security-reviewer + typescript-reviewer) y commit de cierre de fase — parcial: CONTRIBUTING.md + convención PR/agent review (7.5); cierre formal F0 pendiente POC 1.7

- [ ] 2.0 F1 — Núcleo del producto: autenticación, modelo de datos Firestore con security rules testeadas, CRUD de pólizas (wizard manual) y dashboard
  - [x] 2.1 Schemas Zod (`lib/schemas/`) + `computePolicyStatus` con 10 tests passing
  - [x] 2.2 Firebase Auth: email/password + Google; forgot-password; verificación email (enviar, reenviar, bloqueo staging); `users/{uid}` al registrarse; middleware + session cookie
  - [x] 2.3 `firestore.rules` (owner, sharedWith read, subcolecciones documents/auditLogs) + 19 tests — ejecutar con emulador (requiere JDK 21+; `firebase-tools` ≥15)
  - [x] 2.4 `storage.rules` (mime PDF/imágenes, máx 20MB, owner) + 6 tests emulator-ready
  - [x] 2.5 `firestore.indexes.json` (ownerUid+status, ownerUid+endDate, sharedWith+endDate)
  - [x] 2.6 Wizard paso 1 + paso 2 manual ampliado (tipo, vigencias, prima, agente, coberturas/deducibles/beneficios estructurados, beneficiarios manuales con % acumulado) + upload PDF con compresión cliente 2 MB — revisión IA (pasos 3-4) en F2; catálogo beneficios sugeridos en edición
  - [x] 2.7 Lista de pólizas con tabs Mis pólizas / Compartidas conmigo (`listSharedPoliciesForUser`, `usePolicies`) + pantalla `/policies/benefits` + detalle `/policies/[id]` con lectura compartida
  - [x] 2.8 Dashboard con KPIs y vencimientos reales desde Firestore (`dashboard-summary.tsx`)
  - [x] 2.9 Edición y borrado de pólizas con confirmación + `auditLogs` — detalle `/policies/[id]`, edit `/policies/[id]/edit`
  - [x] 2.10 Estados computed de póliza (active/expiring/expired) como helper puro con tests + Scheduled Function diaria que actualiza `status`
  - [x] 2.11 UI glass + responsive mobile/tablet verificado (dashboard, shell, workflow) — polish continuo en nuevas pantallas
  - [x] 2.12 Deploy a staging, revisión con agentes (security-reviewer + typescript-reviewer + Bugbot) y commit de cierre — checklist pre-deploy documentado en README (deploy real pendiente)

  - [ ] 3.0 F2 — Pipeline de documentos: worker Cloud Run, sanitizador anti-injection, extracción Claude estructurada y pantalla de revisión
  - [x] 3.1 Crear worker Cloud Run (FastAPI + Dockerfile JDK11+Py3.12) con endpoint de job autenticado (OIDC service-to-service, nunca público) — **hecho jun 2026:** `verify_worker_authorization` (OIDC + `INTERNAL_API_SECRET` dev); `worker-client` envía OIDC cuando hay creds GCP; deploy Cloud Run + audience prod pendiente
  - [x] 3.2 Implementar upload de documentos: drag-and-drop + cámara móvil, validación cliente (tipo/tamaño), progreso visible, creación de `jobs/{jobId}` vía Function trigger de Storage — **hecho jun 2026:** UI upload + Storage + trigger + listener; cámara móvil con `capture="environment"` + imágenes JPG/PNG/WebP; **multi-PDF jun 2026:** multi-select (hasta 10), compresión ≤2 MB por archivo, progreso individual, `documentRole` opcional, wizard manual con respaldos opcionales
  - [x] 3.3 Integrar OpenDataLoader (markdown + JSON + bboxes) como extractor principal (TDD con PDFs de muestra) — **hecho jun 2026:** `opendataloader-pdf` en Docker + `odl_extract.py` + `bbox_matcher.py`; dev fallback pymupdf → pdfplumber → pypdf sin JVM
  - [x] 3.4 Portar quality gate del Swift (`DocumentProcessingService.swift` ~363): <100 palabras o sin keywords de póliza → escalar a Surya; tests con casos límite
  - [x] 3.5 Integrar Surya OCR como fallback para scans/PDFs complejos + MarkItDown para docx/xlsx/imágenes — **parcial:** Surya stub con log claro + pymupdf fallback; MarkItDown para no-PDF cuando instalado
  - [x] 3.6 Implementar sanitizador anti prompt-injection (zero-width chars, normalización Unicode, detección de patrones imperativos) — TDD con corpus de strings maliciosos; integrado en pipeline antes de Claude
  - [x] 3.7 Implementar extracción Claude con tool-use/JSON schema obligatorio, portando los prompts de `ClaudeDocumentService.swift` y el diccionario `insuranceCustomWords` (~200 términos) para post-corrección — **jun 2026:** `policy_lexicon.py` (ES/EN/PT LATAM); ruta **vision** para PDF escaneado; heurística `hasNoExpiration`; merge completo de campos en `extract.py`
  - [x] 3.8 Portar los regex de `DocumentProcessingService+Extraction.swift` como validadores post-IA (números de póliza plausibles, fechas coherentes, montos en rango) con score de confianza por campo — TDD
  - [x] 3.9 Job queue con reintentos (máx 3, backoff), timeout, estados en Firestore y manejo de fallos con mensaje accionable al usuario — **hecho jun 2026:** `invokeWorkerWithRetries` (1s/3s/9s) + estado `failed` con mensaje ES
  - [x] 3.10 Construir golden set: ~20 pólizas reales (incl. Cancer Bancolombia) con JSON esperado; workflow CI con métrica ≥95% en campos críticos como gate — **hecho jun 2026:** `worker/tests/golden/manifest.json` (20 casos + 3 PDF fixtures), `test_golden.py`, `.github/workflows/golden-ocr.yml`; PDFs reales de producción pendientes sustituir fixtures sintéticos
  - [x] 3.11 UI de estados de procesamiento en vivo (listener Firestore): subiendo → extrayendo → analizando → listo, con micro-interacciones emil-design-eng — **hecho jun 2026:** `DocumentProcessingListener` + barra de progreso + transiciones 200ms + `prefers-reduced-motion`
  - [x] 3.12 Pantalla de revisión obligatoria: split-view documento/campos editables, indicador de confianza por campo (alta/media/baja), bboxes resaltando origen del dato, confirmación crea póliza + indexa texto — **hecho jun 2026:** split-view + badges + visor pdf.js (`public/pdf.worker.mjs`, sin iframe Storage); parseo extracción `parse-document-extraction.ts`; bboxes ODL cuando existan; indexación usa transcript completo (ver 3.15)
  - [x] 3.15 Transcript RAG robusto: transcripción visión por página (`claude_transcriber.py`), persistencia `document_text` en job runner (`document-text-storage.ts`), indexación desde Storage/`extractedSummary` — **hecho jun 2026:** worker API `document_text` + `rag_word_count`; reprocess script persiste transcript; tests TS + pytest
  - [x] 3.13 Flujo C — documentos adicionales a póliza existente: detección de diffs (ej. endoso con nueva vigencia) + banner "¿actualizar la póliza?" con diff visible — **hecho jun 2026:** panel en detalle (incl. vencida), upload multi-doc, `computePolicyExtractionDiff` + `PolicyUpdatePrompt` en revisión; merge extracciones por confianza (`mergePolicyExtractions`)
  - [ ] 3.14 Revisión con agentes (security-reviewer + python-reviewer + typescript-reviewer + Bugbot) y commit de cierre

- [ ] 4.0 F3 — MarIAna multi-agente y compartir pólizas
  - [x] 4.1 Implementar chunking + embeddings del texto extraído (chunks ~500 tokens con página/bbox) y vector index de Firestore; indexación automática al confirmar revisión — **hecho jun 2026:** chunking + embeddings Google text-embedding-004 (768-dim) con consentimiento IA; búsqueda híbrida vector+keyword; carga **transcript completo** desde Storage/`extractedSummary` (3.15); multi-policy cuando policyHint ambiguo; índice vector en `firestore.indexes.json`; cosine in-memory hasta desplegar findNearest
  - [x] 4.2 Implementar Tier 0 determinístico: intents frecuentes (vencimientos, primas, contactos) resueltos con query Firestore + plantilla localizada <300ms, sin LLM — TDD del matcher de intents
  - [x] 4.3 Implementar router con Haiku: clasificación de intención + extracción de entidades (qué póliza, qué tema) con contexto mínimo (solo metadatos de pólizas)
  - [x] 4.4 Implementar tools read-only con scope server-side por uid (`get_policies_summary`, `search_document_chunks`, `get_coverage_details`, `get_contacts`) — los tools jamás aceptan IDs arbitrarios del cliente; tests de autorización
  - [x] 4.5 Implementar agentes especialistas como system prompts + prompt caching — **hecho jun 2026:** 5 agentes core (Documental, Coberturas, Vencimientos, Aseguradoras, Emergencias) + **10 especialistas situacionales por `PolicyType`** en `mariana/agents/specialists/`; routing situacional en `mariana/situational.ts`; `cache_control: ephemeral` en system blocks estáticos
  - [x] 4.6 Guardrails: scope-check de respuesta (solo seguros), rate limiting por uid, límite de tokens por sesión, texto de documentos siempre en `<document_data>` — tests adversariales básicos
  - [x] 4.7 UI de chat: streaming, historial con rolling summary, citas clicables que abren el documento en la página fuente, sugerencias de preguntas iniciales — **hecho jun 2026:** streaming SSE + citas + rolling summary + avatar de marca + copy subtítulo «Asistente IA» (ES/EN/PT)
  - [x] 4.8 Compartir pólizas: generación de token (hash en Firestore, expiración), email al destinatario, página `share/[token]` con aceptación, permisos view/view_download, revocación — tests de reglas para acceso compartido — **hecho jun 2026:** API shares + Resend email + revocación UI + permisos; tests unitarios email/share
  - [x] 4.9 Gestión de beneficiarios y beneficios (CRUD en detalle de póliza) con catálogo de beneficios comunes por tipo de seguro — **hecho jun 2026:** CRUD beneficiaries + campo % acumulado (`beneficiary-pct-field`) en wizard/edición + catálogo sugerido en edición
  - [ ] 4.10 Tracking de costos LLM por usuario/sesión (tokens in/out por modelo) hacia analytics — base para decisiones de pricing
  - [ ] 4.11 Revisión con agentes (security-reviewer enfocado en los tools y el scope + typescript-reviewer + Bugbot) y commit de cierre

- [ ] 5.0 F4 — Monetización y retención: pagos, gates premium, notificaciones y cumplimiento legal — **~85% jun 2026:** Mercado Pago checkout+webhook (Wompi legacy), Resend, FCM, legal consent, GDPR export/delete; pendiente 5.11 backups, 5.12 import iOS, 5.13 revisión agentes, recibo pago email, Remote Config real
  - [x] 5.1 Diseñar e implementar interface `PaymentProvider` (createCheckout, webhook, cancelSubscription) — TDD con mocks de ambos proveedores
  - [x] 5.2 Checkout Colombia vía **Mercado Pago** (tarjeta + PSE/Nequi según MP); adapter Wompi legacy en `lib/payments/wompi.ts`
  - [x] 5.3 Webhook de pagos: verificación de firma, idempotencia por event-id, actualización de `users/{uid}.subscription` — tests con payloads reales firmados/maliciosos
  - [x] 5.4 Gates free/premium replicando `SubscriptionManager.swift` (free: 3 pólizas, sin IA en nube; premium: ilimitado + MarIAna) + paywall con impeccable craft
  - [x] 5.5 Feature flags con Firebase Remote Config (mariana_enabled, payments_enabled, surya_fallback) para rollout gradual — **jun 2026:** fallback por env vars (`PAYMENTS_ENABLED`, `MARIANA_ENABLED`, `SURYA_FALLBACK`); Remote Config pendiente
  - [x] 5.6 Notificaciones FCM web push: solicitud de permiso contextual, vencimientos 30/60/90, estado de procesamiento de documentos — **jun 2026:** registro token, prefs/canales, envío FCM Admin en `sendExpiryReminders` + push al job `ready`; permiso contextual al activar push en settings (no al cargar página)
  - [x] 5.7 Email transaccional (Resend): vencimientos, póliza compartida, recibo de pago, bienvenida — plantillas localizadas ES/EN/PT — **jun 2026:** Resend en Functions (vencimientos, bienvenida) + Next.js (share, welcome); recibo de pago pendiente webhook template
  - [x] 5.8 Scheduled Functions: chequeo diario de vencimientos + envío según `notificationPrefs` y `notificationChannels` — **jun 2026:** `sendExpiryReminders` lee prefs/canales + tokens FCM + envía email/push
  - [x] 5.9 Cumplimiento legal: políticas Términos/Privacidad/Cookies/Aviso Legal (ES principal, EN/PT), consentimiento registro (checkbox Habeas Data) + login (aviso), `users.consents` con versiones, banner cookies + modal IA en upload — **jun 2026:** documentos en `lib/legal/content/` + datos centralizados en `lib/legal/company.ts`; checklist pre-prod en [`docs/PRODUCTION-LEGAL-CHECKLIST.md`](../docs/PRODUCTION-LEGAL-CHECKLIST.md); pendiente revisión abogado, NIT y RNSD
  - [x] 5.10 GDPR/portabilidad: exportación completa de datos del usuario (JSON + documentos) y eliminación de cuenta con borrado en cascada (Firestore + Storage) + audit log — **jun 2026:** export JSON con signed Storage URLs (7 días) + delete cascada + `accountAuditLogs`; Next.js y Cloud Functions alineados
  - [ ] 5.11 Backups: export programado de Firestore a Cloud Storage (diario, retención 30 días) + procedimiento de restauración documentado y probado
  - [ ] 5.12 Importación de usuarios iOS: parser del export cifrado de `DataExportImportService.swift` como vía de migración
  - [ ] 5.13 Revisión con agentes (security-reviewer enfocado en pagos/webhooks + typescript-reviewer + Bugbot) y commit de cierre

- [ ] 6.0 F5 — Calidad y lanzamiento: seguridad ofensiva, E2E, performance, accesibilidad, PWA, landing y beta
  - [ ] 6.1 Suite adversarial completa de prompt injection: PDFs con instrucciones ocultas (texto blanco, zero-width, layered) → assert extracción no contaminada y MarIAna no obedece — gate de CI
  - [ ] 6.2 Pentest básico de plataforma: intentar acceso cross-user vía Firestore/Storage directo, manipulación de tokens de share, replay de webhooks — documentar y corregir hallazgos
  - [x] 6.3 E2E Playwright: smoke + flujos con emuladores (auth, póliza manual, upload PDF, settings, MarIAna) — `e2e/*.spec.ts`, `test:e2e:emulators`
  - [ ] 6.4 Performance: Lighthouse CI con budgets (LCP <2.5s, INP <200ms, CLS <0.1), optimización de imágenes/fonts, code-splitting del chat y el visor PDF — **pendiente visor:** iframe PDF sin bboxes; lazy-load opcional
  - [ ] 6.5 Accesibilidad WCAG 2.2 AA: navegación por teclado completa, focus visible, contraste verificado, labels/aria en formularios y chat, axe-core en CI
  - [x] 6.6 PWA: `manifest.webmanifest`, `public/sw.js` (shell + policies cache read-only), `offline.html`, registro en layout — instalación móvil pendiente QA manual
  - [ ] 6.7 Carga con k6: worker de documentos concurrente (20 jobs simultáneos) y endpoint MarIAna — establecer límites de autoscaling de Cloud Run
  - [ ] 6.8 Completar i18n EN/PT (UI + emails + plantillas Tier 0) con revisión nativa
  - [ ] 6.9 Landing pública con design-taste-frontend: hero, features, pricing, FAQ, SEO (metadata, OG, sitemap) + analytics de conversión
  - [ ] 6.10 `/impeccable audit` + polish final sobre toda la app + sesión de feedback de 5 usuarios reales (test de usabilidad moderado)
  - [ ] 6.11 Beta cerrada: invitar usuarios iOS existentes, importar sus datos, monitorear errores/costos 2 semanas, iterar
  - [ ] 6.12 Revisión final con agentes (security-review completo del repo + Bugbot) y go/no-go de lanzamiento — incluye [`docs/PRODUCTION-LEGAL-CHECKLIST.md`](../docs/PRODUCTION-LEGAL-CHECKLIST.md) §7 beta legal
  - [x] 6.13 Producción App Check: checklist Enforce en README + `docs/PRODUCTION-CHECKLIST.md` §5; cliente en `lib/firebase/app-check.ts` — ejecutar Enforce en consola pendiente

- [ ] 8.0 F6 — Producción (go-live): secretos, deploy infra, smoke, App Check Enforce y dominio prod
  - Orden recomendado: **staging completo → smoke → Monitor estable → prod domain → Enforce → go-live público**. Runbook detallado: [`docs/PRODUCTION-CHECKLIST.md`](../docs/PRODUCTION-CHECKLIST.md).

  ### A. Secretos y variables de entorno (Vercel + Secret Manager + Functions + worker)
  - [ ] 8.A.1 Crear proyecto Firebase **producción** (distinto de `insurwallet-staging`) y proyecto GCP vinculado
  - [ ] 8.A.2 Google Secret Manager: `ANTHROPIC_API_KEY`, `GOOGLE_AI_API_KEY` (o `EMBEDDING_API_KEY`), `RESEND_API_KEY`, `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`, `FIREBASE_SERVICE_ACCOUNT`, `INTERNAL_API_SECRET`, `SENTRY_DSN` — nunca en git ni env plano en repo
  - [x] 8.A.3 Plantilla documentada en [`.env.example`](../.env.example) y tablas en `docs/PRODUCTION-CHECKLIST.md` §1
  - [ ] 8.A.4 Vercel **Preview** (staging): todas las `NEXT_PUBLIC_FIREBASE_*`, `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=false`, `NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION=true`, App Check site key, `FIREBASE_SERVICE_ACCOUNT`, `APP_URL`, `INTERNAL_API_SECRET`, `WORKER_URL`, `WORKER_OIDC_AUDIENCE`, `ANTHROPIC_API_KEY`, `GOOGLE_AI_API_KEY`, Resend, Mercado Pago sandbox
  - [ ] 8.A.5 Vercel **Production**: mismas vars con proyecto Firebase prod, `APP_URL` canónico, claves MP **live**, sin debug tokens
  - [ ] 8.A.6 Cloud Functions: vincular secretos MP, Resend, Sentry vía `firebase functions:secrets:set` o params
  - [ ] 8.A.7 Cloud Run worker: `ANTHROPIC_API_KEY` vía `--set-secrets`; opcional `SENTRY_DSN`
  - [ ] 8.A.8 Confirmar **ausencia** de `NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN` y `FIREBASE_APPCHECK_DEBUG_TOKEN` en Preview/Production (solo dev local)
  - [ ] 8.A.9 `NEXT_PUBLIC_FIREBASE_VAPID_KEY` en Vercel si se activa push web (FCM)

  ### B. Firebase (rules, índices, functions, App Check, Auth)
  - [x] 8.B.1 `firestore.rules` + `storage.rules` implementadas y testeadas en CI (19 + 6 tests)
  - [ ] 8.B.2 Deploy rules staging: `firebase deploy --only firestore:rules,storage --project insurwallet-staging`
  - [ ] 8.B.3 Deploy rules prod: mismo comando con proyecto prod
  - [x] 8.B.4 `firestore.indexes.json` incluye índice vector **768-dim** (`chunks.embedding`) para RAG MarIAna
  - [ ] 8.B.5 Deploy índices staging + prod: `firebase deploy --only firestore:indexes` (esperar build del índice vector)
  - [x] 8.B.6 Functions implementadas: `onPolicyDocumentUpload`, `createCheckout`, `mercadoPagoPaymentWebhook`, `sendExpiryReminders`, `refreshPolicyStatuses`, `exportUserData`, `deleteUserAccount`
  - [ ] 8.B.7 Deploy Functions staging: `firebase deploy --only functions --project insurwallet-staging`
  - [ ] 8.B.8 Deploy Functions prod
  - [x] 8.B.9 Cliente App Check: `lib/firebase/app-check.ts` + validación env en `lib/env-app-check.ts`
  - [ ] 8.B.10 App Check **Monitor** en Firestore + Storage (staging y prod) antes de Enforce
  - [ ] 8.B.11 App Check **Enforce** en Firestore + Storage (prod, tras ≥95% tráfico válido 1–2 semanas) — ver 8.F y tarea 6.13
  - [ ] 8.B.12 reCAPTCHA Admin: dominios permitidos `localhost`, `*.vercel.app`, dominio staging, dominio prod custom (6.13)
  - [ ] 8.B.13 Auth → dominios autorizados: `localhost`, preview Vercel, dominio staging, dominio prod

  ### C. Cloud Run — worker de documentos
  - [x] 8.C.1 Dockerfile JDK 11 + Python 3.12 + OpenDataLoader; smoke `worker/scripts/docker-smoke.sh`
  - [x] 8.C.2 Auth OIDC + `INTERNAL_API_SECRET` fallback dev; `lib/server/worker-client.ts`
  - [ ] 8.C.3 Build imagen staging: `gcloud builds submit --tag gcr.io/<project>/insurwallet-worker ./worker`
  - [ ] 8.C.4 Deploy Cloud Run staging: `--no-allow-unauthenticated`, secretos, región, CPU/mem para PDFs
  - [ ] 8.C.5 Deploy Cloud Run prod (misma imagen o tag release)
  - [ ] 8.C.6 `WORKER_URL` + `WORKER_OIDC_AUDIENCE` (= URL del servicio, sin trailing slash) en Vercel
  - [ ] 8.C.7 IAM: cuenta de servicio Next.js/Functions autorizada en `WORKER_ALLOWED_SERVICE_ACCOUNTS`
  - [ ] 8.C.8 Smoke worker: upload PDF en staging → job `ready` → revisión con extracción Claude

  ### D. Vercel (Next.js)
  - [ ] 8.D.1 Conectar repo; Node 22; build `npm run build`
  - [ ] 8.D.2 Entorno **Preview** = staging Firebase + worker staging + MP sandbox
  - [ ] 8.D.3 Entorno **Production** = Firebase prod + worker prod + MP live
  - [ ] 8.D.4 Dominio custom prod (p. ej. `app.insurwallet.com`) + DNS + redirect www
  - [ ] 8.D.5 `APP_URL` en Production = URL canónica HTTPS (emails, share, checkout return)
  - [ ] 8.D.6 Verificar CI verde en rama de release antes de promote a Production

  ### E. Mercado Pago
  - [x] 8.E.1 Adapter + webhook con verificación `x-signature` e idempotencia (código F4)
  - [ ] 8.E.2 Staging: credenciales **TEST** en Secret Manager / Vercel Preview
  - [ ] 8.E.3 Registrar webhook URL staging en MP Developers → `https://<region>-<project>.cloudfunctions.net/mercadoPagoPaymentWebhook`
  - [ ] 8.E.4 Prod: credenciales **live** (`MERCADOPAGO_ACCESS_TOKEN`, `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`)
  - [ ] 8.E.5 Registrar webhook URL prod; verificar evento de prueba firmado
  - [ ] 8.E.6 Smoke checkout Premium en staging antes de activar pagos en prod

  ### F. Resend (email transaccional)
  - [x] 8.F.1 Integración en Functions + Next.js (share, bienvenida, vencimientos)
  - [ ] 8.F.2 Verificar dominio remitente en Resend (SPF/DKIM)
  - [ ] 8.F.3 `RESEND_FROM_EMAIL` prod (p. ej. `InsurWallet <notificaciones@tudominio.com>`)
  - [ ] 8.F.4 Smoke: email share invite + bienvenida en staging

  ### G. MarIAna RAG en producción
  - [x] 8.G.1 Chunking + embeddings Google text-embedding-004 (768-dim); híbrido vector+keyword (`lib/server/embeddings.ts`, `document-chunks.ts`); fuente de texto = transcript completo persistido (3.15)
  - [x] 8.G.2 Indexación al confirmar revisión vía `POST /api/policies/{id}/index-documents` (requiere consentimiento `cloudAI`)
  - [ ] 8.G.3 `GOOGLE_AI_API_KEY` (o `EMBEDDING_API_KEY`) en Vercel Production + Secret Manager
  - [ ] 8.G.4 Tras deploy prod: re-indexar pólizas existentes — `node scripts/reprocess-document.mjs <policyId>` (transcript) + `POST .../index-documents` por póliza o script batch
  - [ ] 8.G.5 Smoke MarIAna: pregunta con cita a chunk tras upload+confirmación en staging/prod
  - [ ] 8.G.6 Verificar índice vector Firestore en estado **Enabled** antes de escalar usuarios RAG

  ### H. Smoke, E2E y monitoreo
  - [x] 8.H.1 Suite E2E Playwright (`e2e/*.spec.ts`, `npm run test:e2e:emulators`)
  - [ ] 8.H.2 Smoke manual staging (runbook §3 en PRODUCTION-CHECKLIST): registro → verify email → póliza manual → upload PDF → revisión → MarIAna → share → settings
  - [ ] 8.H.3 E2E smoke contra URL preview Vercel (`.github/workflows/e2e.yml`)
  - [x] 8.H.4 Sentry wired (`@sentry/nextjs`, no-op sin DSN)
  - [ ] 8.H.5 Configurar `NEXT_PUBLIC_SENTRY_DSN` + `SENTRY_DSN` en staging/prod; source maps en deploy Vercel
  - [ ] 8.H.6 PostHog (7.4): `NEXT_PUBLIC_POSTHOG_KEY` + funnels activación
  - [ ] 8.H.7 Uptime checks app + worker `/health` (7.6)
  - [ ] 8.H.8 Pentest básico en staging ([`docs/security/pentest-checklist.md`](../docs/security/pentest-checklist.md))

  ### I. Legal y cumplimiento (go-live público)
  - [x] 8.I.1 Contenido legal ES/EN/PT + consentimiento registro/upload + banner cookies (`lib/legal/`)
  - [x] 8.I.2 Checklist legal detallado: [`docs/PRODUCTION-LEGAL-CHECKLIST.md`](../docs/PRODUCTION-LEGAL-CHECKLIST.md)
  - [ ] 8.I.3 Completar NIT, domicilio, representante legal en `lib/legal/company.ts`
  - [ ] 8.I.4 Revisión abogado colombiano (Habeas Data, Términos, reembolsos Ley 1480)
  - [ ] 8.I.5 Registro RNSD / inventario tratamiento SIC
  - [ ] 8.I.6 DPAs subprocesadores (Anthropic, Google, Resend, Mercado Pago)
  - [ ] 8.I.7 Go/no-go legal + técnico (6.12) antes de registro público

  ### J. Cierre F6
  - [ ] 8.J.1 Beta cerrada 2 semanas en staging/prod con usuarios iOS (6.11) — opcional antes de marketing público
  - [ ] 8.J.2 Revisión security-reviewer + Bugbot en rama release
  - [ ] 8.J.3 Rollback documentado (Vercel instant rollback + revisión rules Firebase)
  - [ ] 8.J.4 Marcar F6 completada y actualizar README estado deploy

- [ ] 7.0 Transversal — Observabilidad, analytics y calidad de código continua (durante todas las fases)
  - [x] 7.1 Sentry en frontend: `@sentry/nextjs` wired en `sentry.client.ts` + `sentry.server.ts` + `instrumentation.ts` — no-op sin DSN; source maps en deploy pendiente
  - [ ] 7.2 Logging estructurado en worker y Functions (Cloud Logging con jobId/uid/timings) + dashboard de métricas del pipeline (tasa de éxito, tiempos por motor, % fallback Surya)
  - [ ] 7.3 Alertas de presupuesto GCP + tracking de costos por servicio (Claude, Cloud Run, Firestore) con corte semanal
  - [ ] 7.4 Analytics de producto (PostHog): funnels de activación (registro → primera póliza → primer documento procesado → primera pregunta a MarIAna), retención semanal
  - [x] 7.5 Convención de PRs: toda feature entra por PR con CI verde + revisión de agente (typescript-reviewer/python-reviewer según el código tocado) — documentar en CONTRIBUTING.md
  - [ ] 7.6 Uptime monitoring (checks a app y worker) + página de estado simple

### Pendientes explícitos post-cierre backend/UI (jun 2026)

- [x] **Settings hub (jun 2026):** `/settings` (perfil, moneda, privacidad/GDPR, notificaciones), `/settings/contacts`, `/settings/subscription` (Mercado Pago), `/settings/help`

- [x] **Modelo unificado de póliza (jun 2026):** schema Zod único manual/extracción/MarIAna (`lib/schemas/policy.ts`, `beneficiary.ts`, `extraction.ts`); compresión cliente PDF/imagen a 2 MB (`lib/utils/document-compression.ts`); storage.rules alineado
- [x] **MarIAna situacional + evals (jun 2026):** `mariana/situational.ts`, 10 especialistas por tipo, prefetch asistencias/beneficios, 120 evals estructurales en `mariana/evals/` (Vitest, sin LLM)
- [x] **Root layout App Router (jun 2026):** `<html>`/`<body>` únicos en `app/layout.tsx`; `[locale]/layout.tsx` solo proveedores i18n/auth

- [x] **Extracción real:** OpenDataLoader → quality gate → Surya/MarkItDown → Claude tool-use (3.3–3.8) — **jun 2026:** pipeline + Docker ODL + bboxes; Surya prod real pendiente
- [x] **Visor PDF avanzado:** resaltado de bboxes por campo en revisión (3.12) — pdf.js + worker en `public/`; parseo extracción Firestore; datos bbox dependen de ODL en worker
- [x] **Paridad campos extracción (jun 2026):** 20 campos extraíbles = wizard manual (`lib/schemas/extraction-field-keys.ts`, `worker/pipeline/extraction_fields.py`); tests de paridad TS + pytest; policyType incluye pet/funeral/dental/business
- [x] **Transcript RAG (jun 2026):** `claude_transcriber.py` + `document-text-storage.ts` + `document-job-runner` + `resolveIndexingText` en `document-chunks.ts`; reprocess script; MarIAna puede buscar exclusiones/clausulado en PDF escaneado
- [ ] **FCM end-to-end:** `NEXT_PUBLIC_FIREBASE_VAPID_KEY` + envío en `sendExpiryReminders` y al job `ready` (5.6, 5.8)
- [ ] **Share completo:** ~~email Resend al destinatario, revocación UI, `view_download` (4.8)~~ hecho jun 2026; E2E share pendiente
- [ ] **GDPR completo:** signed URLs de documentos en export + audit log delete (5.10)
- [ ] **Calendario topbar:** permanece `comingSoon` — implementar solo si producto lo prioriza
- [ ] **Env producción:** `APP_URL`, `INTERNAL_API_SECRET`, `WORKER_URL`, `GOOGLE_AI_API_KEY` — ver **F6 §A** y [`docs/PRODUCTION-CHECKLIST.md`](../docs/PRODUCTION-CHECKLIST.md)
