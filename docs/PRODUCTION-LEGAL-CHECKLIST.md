# Checklist legal y cumplimiento — InsurWallet

Usar **antes del go-live** en producción. Complementa [`PRODUCTION-CHECKLIST.md`](PRODUCTION-CHECKLIST.md) (infra y deploy).

**Última revisión:** jun 2026 · **Fuente de datos legales:** [`lib/legal/company.ts`](../lib/legal/company.ts)

---

## 1. Datos de la empresa (obligatorio)

- [ ] Completar `COMPANY.nit` en `lib/legal/company.ts` (sustituir `PENDIENTE_NIT`)
- [ ] Completar `COMPANY.address` con domicilio fiscal completo
- [ ] Completar `COMPANY.legalRepresentative` (nombre y cargo)
- [ ] Verificar que correos (`legal@`, `privacidad@`, `soporte@`, `hola@`) estén operativos y monitorizados
- [ ] Revisar que aviso legal, términos y privacidad reflejen los datos finales (ES, EN, PT)

---

## 2. Revisión jurídica (Colombia + mercados)

- [ ] Revisión por **abogado colombiano**: Habeas Data (Ley 1581/2012), Términos, reembolsos (Ley 1480)
- [ ] Validar política de **reembolsos** y cancelación Premium conforme Ley 1480 de 2011
- [ ] Revisión jurídica de traducciones **EN** y **PT** por mercado objetivo (no solo traducción literal)
- [ ] Confirmar disclaimers de IA, no-aseguradora y limitación de responsabilidad

**Meta sugerida:** 2 semanas antes de go-live

---

## 3. Registro y tratamiento de datos (Colombia)

- [ ] Registro en **RNSD** (Registro Nacional de Bases de Datos) ante la SIC, si aplica al responsable
- [ ] Inventario de tratamiento (art. 14 Ley 1581) actualizado y alineado con `lib/legal/content/privacy.ts`
- [ ] Política de retención y supresión coherente con export/delete en Configuración
- [ ] Canal DPO (`privacidad@insurwallet.com`) con SLA interno documentado

**Meta sugerida:** 3 semanas antes de go-live

---

## 4. Subprocesadores y transferencias

- [ ] DPA / acuerdos de subprocesamiento firmados o términos comerciales aceptados:
  - [ ] **Anthropic** (Claude — extracción PDF, MarIAna)
  - [ ] **Google Cloud / Firebase** (Auth, Firestore, Storage, Functions, FCM)
  - [ ] **Resend** (correo transaccional)
  - [ ] **Mercado Pago** (pagos Colombia)
  - [ ] **Wompi** (solo si sigue activo como legacy)
  - [ ] **Sentry** (errores, sin PII en prod)
- [ ] Cláusulas contractuales estándar (SCC) o equivalentes para transferencias fuera de Colombia/UE
- [ ] Lista de subprocesadores publicada o referenciada en Política de Privacidad

**Meta sugerida:** 2–3 semanas antes de go-live

---

## 5. Versiones legales y re-aceptación

- [ ] Confirmar versiones en [`lib/legal/versions.ts`](../lib/legal/versions.ts): `TERMS_VERSION`, `PRIVACY_VERSION`, `COOKIES_VERSION`
- [ ] Implementar o verificar **modal de re-aceptación** si cambian sustancialmente Términos o Privacidad post-registro
- [ ] Auditar `users.consents` y registro de consentimiento IA en upload/registro
- [ ] Banner de cookies operativo y coherente con `/legal/cookies`

**Meta sugerida:** 1 semana antes de go-live (desarrollo); revisión legal en paralelo

---

## 6. Seguridad y secretos (legal + técnico)

- [ ] **App Check Enforce** en Firestore y Storage (ver [`PRODUCTION-CHECKLIST.md`](PRODUCTION-CHECKLIST.md) §5)
- [ ] Secret Manager en staging/prod: `ANTHROPIC_API_KEY`, `MERCADOPAGO_*`, `RESEND_API_KEY`, `FIREBASE_SERVICE_ACCOUNT`
- [ ] **Sentry DSN** en Secret Manager (no en repo)
- [ ] **OIDC worker** (`WORKER_OIDC_AUDIENCE`) para Cloud Run document worker
- [ ] **VAPID FCM** (`NEXT_PUBLIC_FIREBASE_VAPID_KEY`) para push con consentimiento

---

## 7. Beta y lanzamiento

- [ ] **Beta legal:** consentimiento documentado (Términos + Privacidad + IA en nube) con versión y timestamp
- [ ] Términos de beta / limitación de responsabilidad si aplica cohorte cerrada
- [ ] Procedimiento de respuesta a titulares (ARCO) probado en staging
- [ ] Go/no-go legal firmado internamente antes de abrir registro público

**Meta sugerida:** día del go-live (checklist §8 de PRODUCTION-CHECKLIST)

---

## 8. Referencias

| Recurso         | Ruta                                                       |
| --------------- | ---------------------------------------------------------- |
| Contenido legal | `lib/legal/content/*.ts`                                   |
| Datos empresa   | `lib/legal/company.ts`                                     |
| Versiones       | `lib/legal/versions.ts`                                    |
| Consentimientos | `lib/schemas/consents.ts`, `lib/server/consent-persist.ts` |
| Deploy general  | `docs/PRODUCTION-CHECKLIST.md`                             |
| Pentest         | `docs/security/pentest-checklist.md`                       |

---

## Blockers manuales (usuario)

Estos ítems **no pueden automatizarse** en código:

1. NIT y domicilio fiscal real
2. Representante legal
3. Registro RNSD / respuesta SIC
4. Firma o aceptación de DPAs con proveedores
5. Dictamen del abogado colombiano
6. Validación Ley 1480 de política de reembolsos
