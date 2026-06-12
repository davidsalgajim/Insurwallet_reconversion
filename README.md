# InsurWallet Reconversión

Migración de InsurWallet (iOS nativa) a una web app moderna.

## Stack

- **Frontend:** Next.js 15, TypeScript, Tailwind, shadcn/ui
- **Backend:** Firebase (Auth, Firestore, Storage, Functions, FCM)
- **Documentos:** OpenDataLoader PDF, Surya OCR (fallback), MarkItDown, Claude API
- **IA:** MarIAna — orquestador multi-agente (documentos, coberturas, vencimientos, aseguradoras)
- **Pagos:** Wompi / Mercado Pago (adapter)

## Fases

| Fase | Descripción                                        |
| ---- | -------------------------------------------------- |
| F0   | Setup, Firebase, design system, POC OpenDataLoader |
| F1   | Auth, Firestore schema, CRUD pólizas, dashboard    |
| F2   | Pipeline de documentos + UI de revisión            |
| F3   | MarIAna multi-agente, compartir pólizas            |
| F4   | Pagos, notificaciones, GDPR                        |
| F5   | Hardening, E2E, beta                               |

## Desarrollo local

### Requisitos

- Node.js 20+
- Firebase CLI (`npm install -g firebase-tools`)
- **Java 21+** (JDK) — solo para emuladores de Firestore/Storage y tests de reglas (`firebase-tools` ≥15 ya no soporta Java 17)

En Windows, instalar con:

```powershell
winget install Microsoft.OpenJDK.21
```

Reinicia la terminal y verifica: `java -version`

### Tests de reglas Firestore

```bash
npm run emulators:exec -- "npm run test:rules"
npm run emulators:exec -- "npm run test:storage-rules"
```

## Origen

Reconversión basada en [insurwallet_final](https://github.com/davidsalgajim/insurwallet_final) (iOS).
