# InsurWallet Reconversión

Migración de InsurWallet (iOS nativa) a una web app moderna para LATAM.

**Estado actual (jun 2026):** F0 ~90% · F1 ~85% · F5 parcial (E2E, PWA, Sentry stub, production checklist). Auth, CRUD pólizas, dashboard, App Check (monitor), reglas testeadas en CI. Pendiente: pipeline IA (F2), deploy staging, App Check Enforce en consola.

Documentación de producto y diseño: [`PRODUCT.md`](PRODUCT.md), [`DESIGN.md`](DESIGN.md). Plan de tareas: [`tasks/tasks-plan-reconversion-insurwallet.md`](tasks/tasks-plan-reconversion-insurwallet.md).

## Stack

| Capa                | Tecnología                                                                  |
| ------------------- | --------------------------------------------------------------------------- |
| Frontend            | Next.js 16, React 19, TypeScript strict, Tailwind CSS v4, shadcn/ui (base)  |
| Auth / DB / Storage | Firebase (Auth, Firestore, Storage, Functions, FCM, App Check reCAPTCHA v3) |
| i18n                | next-intl (ES base, EN/PT — cobertura parcial en app)                       |
| Validación          | Zod                                                                         |
| Tests TS            | Vitest                                                                      |
| Tests reglas        | Firebase emulators + `@firebase/rules-unit-testing`                         |
| Backend planificado | Cloud Functions (Node), Cloud Run (worker Python, MarIAna)                  |
| Documentos (F2)     | OpenDataLoader PDF, Surya OCR, MarkItDown, Claude API                       |
| Pagos (F4)          | Mercado Pago (Colombia); Wompi deprecated                                   |

## Fases

| Fase | Descripción                                                 | Estado      |
| ---- | ----------------------------------------------------------- | ----------- |
| F0   | Setup, Firebase, design system, CI, i18n, App Check         | ~90%        |
| F1   | Auth, Firestore schema, CRUD pólizas, dashboard, upload PDF | ~85%        |
| F2   | Pipeline de documentos + UI de revisión                     | No iniciado |
| F3   | MarIAna multi-agente, compartir pólizas                     | Stub UI     |
| F4   | Pagos, notificaciones, GDPR                                 | No iniciado |
| F5   | Hardening, E2E, beta                                        | No iniciado |

## Implementado

- **Marketing:** landing `/[locale]` rediseño editorial claro (body blanco, nav sticky, secciones features/services/testimonial) con hero navy enmarcado y preview de dashboard
- **Auth:** login, registro, forgot-password, verify-email — email/password + Google; session cookie + middleware; UI navy + glass card; bloqueo staging vía `NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION`
- **Env cliente:** `lib/env.ts` lee `NEXT_PUBLIC_*` con acceso estático (Next.js inline en bundle); evita fallbacks demo en staging
- **App Check:** reCAPTCHA v3 en cliente (`lib/firebase/app-check.ts`); omitido con emuladores; modo Monitor en Firestore/Storage
- **App:** dashboard (KPIs y vencimientos desde Firestore), lista/detalle/edición/borrado de pólizas, wizard manual + upload PDF (`/policies/new/upload` → Storage + documento en Firestore)
- **Estados de póliza:** `computePolicyStatus` (active/expiring/expired) + scheduled Function diaria `refreshPolicyStatuses`
- **Shell:** icon rail desktop + nav inferior móvil, topbar, dot-grid background
- **Firebase:** `firestore.rules` + `storage.rules` con tests; emuladores configurados; proyecto staging `insurwallet-staging`
- **CI:** lint, typecheck, unit tests, **rules tests (emulators)**, build (`.github/workflows/ci.yml`)
- **E2E:** Playwright smoke + flujos con emuladores (`e2e/`, `npm run test:e2e:emulators`)
- **PWA:** manifest + service worker shell (`public/sw.js`)
- **Observability:** Sentry stub (no-op sin DSN)
- **Notificaciones (prefs):** canal email/push/ambos + tipos de aviso en Configuración; API `GET/PUT /api/notifications/prefs`; registro FCM si push activo — envío real email/push en F4 (ver [`docs/notifications.md`](docs/notifications.md))

## Pendiente (próximos hitos)

- Deploy staging (checklist: [`docs/PRODUCTION-CHECKLIST.md`](docs/PRODUCTION-CHECKLIST.md))
- POC OpenDataLoader / worker Cloud Run (F2 — ver tarea 1.7 stub en tasks)
- Pipeline IA post-upload, pantalla de revisión split-view
- MarIAna backend completo, pagos
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
worker/                # Pipeline documentos (F2 — pendiente)
mariana/               # Orquestador chat (F3)
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

### Notificaciones (email / push)

- **Configuración:** App → Configuración → Notificaciones — canal (solo email, solo push, ambos) y tipos de aviso.
- **Push:** opcional; requiere `NEXT_PUBLIC_FIREBASE_VAPID_KEY` en `.env.local` (Firebase Console → Cloud Messaging → Web Push).
- **Persistencia:** `users/{uid}.notificationChannels` + `notificationPrefs` en Firestore.
- **Envío real:** programado para F4 (Resend + FCM Admin en `sendExpiryReminders`). Detalle en [`docs/notifications.md`](docs/notifications.md).

### Scripts

| Script                                           | Descripción                                |
| ------------------------------------------------ | ------------------------------------------ |
| `npm run dev`                                    | Servidor de desarrollo                     |
| `npm run build`                                  | Build de producción                        |
| `npm run lint`                                   | ESLint                                     |
| `npm run typecheck`                              | TypeScript                                 |
| `npm run test`                                   | Vitest (unit)                              |
| `npm run test:rules`                             | Tests Firestore rules (requiere emulador)  |
| `npm run test:storage-rules`                     | Tests Storage rules (requiere emulador)    |
| `npm run emulators`                              | Emuladores Firebase                        |
| `npm run emulators:exec -- "npm run test:rules"` | Tests de reglas en emulador efímero        |
| `npm run test:e2e`                               | Playwright smoke                           |
| `npm run test:e2e:emulators`                     | Playwright + emuladores (flujos completos) |

Variables de entorno validadas en `lib/env.ts` (Zod). En desarrollo faltan claves Firebase → fallbacks demo; en producción falla rápido si faltan.

## Origen

Reconversión basada en [insurwallet_final](https://github.com/davidsalgajim/insurwallet_final) (iOS).
