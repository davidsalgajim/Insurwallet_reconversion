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
- `worker/pipeline/extract.py` - Orquestación OpenDataLoader → quality gate → Surya → MarkItDown + tests.
- `worker/pipeline/sanitizer.py` - Sanitizador anti prompt-injection + tests.
- `worker/pipeline/claude_extractor.py` - Extracción estructurada con tool-use + prompts portados del Swift + tests.
- `worker/pipeline/validators.py` - Validadores post-IA portados de los regex Swift + tests.
- `worker/tests/golden/` - Golden set de ~20 pólizas reales con JSON esperado.
- `worker/tests/adversarial/` - Corpus de PDFs maliciosos para suite de inyección.

### MarIAna (Cloud Run — endpoint de chat)

- `mariana/router.ts` - Tier 0 determinístico + clasificador de intención (Haiku) + tests.
- `mariana/agents/` - System prompts y tools de los 5 especialistas + tests.
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
  - [ ] 1.7 POC OpenDataLoader: contenedor Docker (JDK 11 + Python 3.12) procesando el PDF Cancer Bancolombia del repo iOS — validar calidad de markdown/bboxes y tiempos (riesgo #1 del plan). **Inicio F2:** `worker/` con sanitizer + pytest; Docker/OpenDataLoader pendiente (3.3).
  - [x] 1.8 next-intl ES/EN/PT + middleware + `messages/*.json`
  - [x] 1.9 Revisión de código con agentes (security-reviewer + typescript-reviewer) y commit de cierre de fase — parcial: CONTRIBUTING.md + convención PR/agent review (7.5); cierre formal F0 pendiente POC 1.7

- [ ] 2.0 F1 — Núcleo del producto: autenticación, modelo de datos Firestore con security rules testeadas, CRUD de pólizas (wizard manual) y dashboard
  - [x] 2.1 Schemas Zod (`lib/schemas/`) + `computePolicyStatus` con 10 tests passing
  - [x] 2.2 Firebase Auth: email/password + Google; forgot-password; verificación email (enviar, reenviar, bloqueo staging); `users/{uid}` al registrarse; middleware + session cookie
  - [x] 2.3 `firestore.rules` (owner, sharedWith read, subcolecciones documents/auditLogs) + 19 tests — ejecutar con emulador (requiere JDK 21+; `firebase-tools` ≥15)
  - [x] 2.4 `storage.rules` (mime PDF/imágenes, máx 20MB, owner) + 6 tests emulator-ready
  - [x] 2.5 `firestore.indexes.json` (ownerUid+status, ownerUid+endDate, sharedWith+endDate)
  - [x] 2.6 Wizard paso 1 + paso 2 manual + upload PDF (`/policies/new/upload`, Storage, validación Zod, estados) — revisión IA (pasos 3-4) pendientes F2
  - [x] 2.7 Lista de pólizas conectada a Firestore (`usePolicies`, `PoliciesList`) + detalle `/policies/[id]` (`PolicyDetailView`, edit/delete)
  - [x] 2.8 Dashboard con KPIs y vencimientos reales desde Firestore (`dashboard-summary.tsx`)
  - [x] 2.9 Edición y borrado de pólizas con confirmación + `auditLogs` — detalle `/policies/[id]`, edit `/policies/[id]/edit`
  - [x] 2.10 Estados computed de póliza (active/expiring/expired) como helper puro con tests + Scheduled Function diaria que actualiza `status`
  - [x] 2.11 UI glass + responsive mobile/tablet verificado (dashboard, shell, workflow) — polish continuo en nuevas pantallas
  - [x] 2.12 Deploy a staging, revisión con agentes (security-reviewer + typescript-reviewer + Bugbot) y commit de cierre — checklist pre-deploy documentado en README (deploy real pendiente)

- [ ] 3.0 F2 — Pipeline de documentos: worker Cloud Run, sanitizador anti-injection, extracción Claude estructurada y pantalla de revisión
  - [x] 3.1 Crear worker Cloud Run (FastAPI + Dockerfile JDK11+Py3.12) con endpoint de job autenticado (OIDC service-to-service, nunca público) — **parcial:** Dockerfile, `main.py`, `/jobs/process` stub; **hecho jun 2026:** `document-job-runner` + `/api/jobs/[jobId]/process` + dispatch interno desde `on-storage-upload`; OIDC worker↔Cloud Run pendiente
  - [x] 3.2 Implementar upload de documentos: drag-and-drop + cámara móvil, validación cliente (tipo/tamaño), progreso visible, creación de `jobs/{jobId}` vía Function trigger de Storage — **parcial:** UI upload + Storage + trigger + listener dispara procesamiento; cámara móvil pendiente
  - [ ] 3.3 Integrar OpenDataLoader (markdown + JSON + bboxes) como extractor principal (TDD con PDFs de muestra)
  - [ ] 3.4 Portar quality gate del Swift (`DocumentProcessingService.swift` ~363): <100 palabras o sin keywords de póliza → escalar a Surya; tests con casos límite
  - [ ] 3.5 Integrar Surya OCR como fallback para scans/PDFs complejos + MarkItDown para docx/xlsx/imágenes
  - [x] 3.6 Implementar sanitizador anti prompt-injection (zero-width chars, normalización Unicode, detección de patrones imperativos) — TDD con corpus de strings maliciosos; los hallazgos se marcan y registran, no se borran silenciosamente — **`worker/pipeline/sanitizer.py` + pytest; integración pipeline pendiente**
  - [ ] 3.7 Implementar extracción Claude con tool-use/JSON schema obligatorio, portando los prompts de `ClaudeDocumentService.swift` y el diccionario `insuranceCustomWords` (~200 términos) para post-corrección
  - [ ] 3.8 Portar los regex de `DocumentProcessingService+Extraction.swift` como validadores post-IA (números de póliza plausibles, fechas coherentes, montos en rango) con score de confianza por campo — TDD
  - [ ] 3.9 Job queue con reintentos (máx 3, backoff), timeout, estados en Firestore y manejo de fallos con mensaje accionable al usuario — **parcial jun 2026:** estados `pending→extracting→analyzing→ready` + runner; reintentos/backoff pendientes
  - [ ] 3.10 Construir golden set: ~20 pólizas reales (incl. Cancer Bancolombia) con JSON esperado; workflow CI con métrica ≥95% en campos críticos como gate
  - [x] 3.11 UI de estados de procesamiento en vivo (listener Firestore): subiendo → extrayendo → analizando → listo, con micro-interacciones emil-design-eng — **parcial:** `DocumentProcessingListener` + integración en upload; polish emil pendiente
  - [x] 3.12 Pantalla de revisión obligatoria: split-view documento/campos editables, indicador de confianza por campo (alta/media/baja), bboxes resaltando origen del dato, confirmación crea póliza + indexa texto — **parcial jun 2026:** split-view + badges + visor PDF (`PolicyPdfViewer`); **pendiente:** bboxes resaltados, confianza desde extracción Firestore (hoy stub), indexación de texto al confirmar
  - [ ] 3.13 Flujo C — documentos adicionales a póliza existente: detección de diffs (ej. endoso con nueva vigencia) + banner "¿actualizar la póliza?" con diff visible
  - [ ] 3.14 Revisión con agentes (security-reviewer + python-reviewer + typescript-reviewer + Bugbot) y commit de cierre

- [ ] 4.0 F3 — MarIAna multi-agente y compartir pólizas
  - [ ] 4.1 Implementar chunking + embeddings del texto extraído (chunks ~500 tokens con página/bbox) y vector index de Firestore; indexación automática al confirmar revisión
  - [x] 4.2 Implementar Tier 0 determinístico: intents frecuentes (vencimientos, primas, contactos) resueltos con query Firestore + plantilla localizada <300ms, sin LLM — TDD del matcher de intents
  - [x] 4.3 Implementar router con Haiku: clasificación de intención + extracción de entidades (qué póliza, qué tema) con contexto mínimo (solo metadatos de pólizas)
  - [x] 4.4 Implementar tools read-only con scope server-side por uid (`get_policies_summary`, `search_document_chunks`, `get_coverage_details`, `get_contacts`) — los tools jamás aceptan IDs arbitrarios del cliente; tests de autorización
  - [ ] 4.5 Implementar los 5 agentes especialistas (Documental con citas a documento+página, Coberturas, Vencimientos, Aseguradoras, Emergencias con bypass por keywords) como system prompts + prompt caching
  - [x] 4.6 Guardrails: scope-check de respuesta (solo seguros), rate limiting por uid, límite de tokens por sesión, texto de documentos siempre en `<document_data>` — tests adversariales básicos
  - [ ] 4.7 UI de chat: streaming, historial con rolling summary, citas clicables que abren el documento en la página fuente, sugerencias de preguntas iniciales
  - [ ] 4.8 Compartir pólizas: generación de token (hash en Firestore, expiración), email al destinatario, página `share/[token]` con aceptación, permisos view/view_download, revocación — tests de reglas para acceso compartido — **parcial jun 2026:** `SharePolicyDialog`, preview server-side, `POST /api/shares/[token]/accept` + `sharedWith`; **pendiente:** email al destinatario (Resend), revocación UI, permiso `view_download`, tests E2E
  - [ ] 4.9 Gestión de beneficiarios y beneficios (CRUD en detalle de póliza) con catálogo de beneficios comunes por tipo de seguro
  - [ ] 4.10 Tracking de costos LLM por usuario/sesión (tokens in/out por modelo) hacia analytics — base para decisiones de pricing
  - [ ] 4.11 Revisión con agentes (security-reviewer enfocado en los tools y el scope + typescript-reviewer + Bugbot) y commit de cierre

- [ ] 5.0 F4 — Monetización y retención: pagos, gates premium, notificaciones y cumplimiento legal
  - [x] 5.1 Diseñar e implementar interface `PaymentProvider` (createCheckout, webhook, cancelSubscription) — TDD con mocks de ambos proveedores
  - [ ] 5.2 Implementar primera integración (Wompi para Colombia: tarjeta + Nequi/PSE) con checkout y página de resultado
  - [x] 5.3 Webhook de pagos: verificación de firma, idempotencia por event-id, actualización de `users/{uid}.subscription` — tests con payloads reales firmados/maliciosos
  - [x] 5.4 Gates free/premium replicando `SubscriptionManager.swift` (free: 3 pólizas, sin IA en nube; premium: ilimitado + MarIAna) + paywall con impeccable craft
  - [ ] 5.5 Feature flags con Firebase Remote Config (mariana_enabled, payments_enabled, surya_fallback) para rollout gradual
  - [ ] 5.6 Notificaciones FCM web push: solicitud de permiso contextual, vencimientos 30/60/90, estado de procesamiento de documentos — **parcial jun 2026:** registro token (`/api/notifications/register`), prefs + **canales email/push/ambos** en settings (`notificationChannels`), SW dinámico `/firebase-messaging-sw.js`, FCM solo si canal push activo; **pendiente:** envío FCM real, permiso contextual (no al cargar settings), push al completar job
  - [ ] 5.7 Email transaccional (Resend): vencimientos, póliza compartida, recibo de pago, bienvenida — plantillas localizadas ES/EN/PT — **parcial jun 2026:** canal email selectable en UI/schema; **pendiente:** Resend + plantillas + envío en Functions
  - [ ] 5.8 Scheduled Functions: chequeo diario de vencimientos + envío según `notificationPrefs` y `notificationChannels` — **parcial jun 2026:** `sendExpiryReminders` escanea candidatos; **pendiente:** leer prefs/canales + tokens FCM + enviar email/push
  - [ ] 5.9 Cumplimiento legal: páginas Términos/Privacidad, consentimiento de cookies, consentimiento explícito para IA en nube, registro Habeas Data (Ley 1581 Colombia)
  - [ ] 5.10 GDPR/portabilidad: exportación completa de datos del usuario (JSON + documentos) y eliminación de cuenta con borrado en cascada (Firestore + Storage) + audit log — **parcial jun 2026:** export JSON descargable + delete cascada vía `/api/account/*`; **pendiente:** URLs firmadas de binarios en export, audit log de borrado, alinear Cloud Functions `exportUserData`/`deleteUserAccount` con implementación Next.js
  - [ ] 5.11 Backups: export programado de Firestore a Cloud Storage (diario, retención 30 días) + procedimiento de restauración documentado y probado
  - [ ] 5.12 Importación de usuarios iOS: parser del export cifrado de `DataExportImportService.swift` como vía de migración
  - [ ] 5.13 Revisión con agentes (security-reviewer enfocado en pagos/webhooks + typescript-reviewer + Bugbot) y commit de cierre

- [ ] 6.0 F5 — Calidad y lanzamiento: seguridad ofensiva, E2E, performance, accesibilidad, PWA, landing y beta
  - [ ] 6.1 Suite adversarial completa de prompt injection: PDFs con instrucciones ocultas (texto blanco, zero-width, layered) → assert extracción no contaminada y MarIAna no obedece — gate de CI
  - [ ] 6.2 Pentest básico de plataforma: intentar acceso cross-user vía Firestore/Storage directo, manipulación de tokens de share, replay de webhooks — documentar y corregir hallazgos
  - [x] 6.3 E2E Playwright skeleton: `e2e/playwright.config.ts`, `auth-policy.spec.ts` (smoke login/register/redirect), `.github/workflows/e2e.yml` (continue-on-error); flujos críticos completos pendientes
  - [ ] 6.4 Performance: Lighthouse CI con budgets (LCP <2.5s, INP <200ms, CLS <0.1), optimización de imágenes/fonts, code-splitting del chat y el visor PDF — **pendiente visor:** iframe PDF sin bboxes; lazy-load opcional
  - [ ] 6.5 Accesibilidad WCAG 2.2 AA: navegación por teclado completa, focus visible, contraste verificado, labels/aria en formularios y chat, axe-core en CI
  - [ ] 6.6 PWA: manifest, service worker (shell + lista de pólizas en caché read-only), instalable en móvil, probado en iOS Safari y Android Chrome
  - [ ] 6.7 Carga con k6: worker de documentos concurrente (20 jobs simultáneos) y endpoint MarIAna — establecer límites de autoscaling de Cloud Run
  - [ ] 6.8 Completar i18n EN/PT (UI + emails + plantillas Tier 0) con revisión nativa
  - [ ] 6.9 Landing pública con design-taste-frontend: hero, features, pricing, FAQ, SEO (metadata, OG, sitemap) + analytics de conversión
  - [ ] 6.10 `/impeccable audit` + polish final sobre toda la app + sesión de feedback de 5 usuarios reales (test de usabilidad moderado)
  - [ ] 6.11 Beta cerrada: invitar usuarios iOS existentes, importar sus datos, monitorear errores/costos 2 semanas, iterar
  - [ ] 6.12 Revisión final con agentes (security-review completo del repo + Bugbot) y go/no-go de lanzamiento
  - [ ] 6.13 Producción App Check: registrar dominio custom (p. ej. `app.insurwallet.com`) en [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin) → **Allowed domains** (reCAPTCHA v3). Staging: `localhost` + dominio preview Vercel; prod: dominio custom antes de pasar App Check a **Enforce**.

- [ ] 7.0 Transversal — Observabilidad, analytics y calidad de código continua (durante todas las fases)
  - [ ] 7.1 Sentry en frontend, Functions y worker (source maps, release tracking, alertas a email/Slack) — desde F1
  - [ ] 7.2 Logging estructurado en worker y Functions (Cloud Logging con jobId/uid/timings) + dashboard de métricas del pipeline (tasa de éxito, tiempos por motor, % fallback Surya)
  - [ ] 7.3 Alertas de presupuesto GCP + tracking de costos por servicio (Claude, Cloud Run, Firestore) con corte semanal
  - [ ] 7.4 Analytics de producto (PostHog): funnels de activación (registro → primera póliza → primer documento procesado → primera pregunta a MarIAna), retención semanal
  - [x] 7.5 Convención de PRs: toda feature entra por PR con CI verde + revisión de agente (typescript-reviewer/python-reviewer según el código tocado) — documentar en CONTRIBUTING.md
  - [ ] 7.6 Uptime monitoring (checks a app y worker) + página de estado simple

### Pendientes explícitos post-cierre backend/UI (jun 2026)

- [ ] **Extracción real:** OpenDataLoader → quality gate → Surya/MarkItDown → Claude tool-use (3.3–3.8); hoy `document-job-runner` usa stub + worker opcional
- [ ] **Visor PDF avanzado:** resaltado de bboxes por campo en revisión (3.12)
- [ ] **FCM end-to-end:** `NEXT_PUBLIC_FIREBASE_VAPID_KEY` + envío en `sendExpiryReminders` y al job `ready` (5.6, 5.8)
- [ ] **Share completo:** email Resend al destinatario, revocación UI, `view_download` (4.8)
- [ ] **GDPR completo:** signed URLs de documentos en export + audit log delete (5.10)
- [ ] **Calendario topbar:** permanece `comingSoon` — implementar solo si producto lo prioriza
- [ ] **Env producción:** `APP_URL`, `INTERNAL_API_SECRET`, `WORKER_URL` en Secret Manager para dispatch automático post-upload
