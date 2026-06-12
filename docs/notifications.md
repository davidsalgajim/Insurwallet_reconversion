# Notificaciones (InsurWallet)

Preferencias de canal y eventos para recordatorios de pólizas y actividad de cuenta.

## Dónde configurarlo

**App → Configuración → Notificaciones**

1. **Canal de entrega** (radio): Solo email · Solo push · Email y push
2. **Tipos de aviso** (interruptores): vencimiento 30/60/90 días, renovaciones, actividad de cuenta

Los cambios se guardan en Firestore (`users/{uid}`) vía `PUT /api/notifications/prefs`.

## Modelo de datos

```typescript
// users/{uid}
notificationChannels: { email: boolean; push: boolean }  // al menos uno true
notificationPrefs: {
  expiry30: boolean
  expiry60: boolean
  expiry90: boolean
  renewals: boolean
  events: boolean
}
fcmTokens: string[]  // tokens web push registrados
```

**Defaults al crear perfil:** email `true`, push `false`; eventos 30/60/renewals activos.

Schema Zod: `lib/schemas/user.ts`.

## Qué está implementado (jun 2026)

| Pieza                                                   | Estado                      |
| ------------------------------------------------------- | --------------------------- |
| UI + API de prefs/canales                               | ✅                          |
| Registro token FCM (`POST /api/notifications/register`) | ✅ (si push activo + VAPID) |
| Service worker `/firebase-messaging-sw.js`              | ✅                          |
| Scheduled `sendExpiryReminders` (escaneo candidatos)    | ✅ parcial                  |
| Envío real email (Resend)                               | ❌ F4                       |
| Envío real push (FCM Admin)                             | ❌ F4                       |
| Permiso push contextual (no al abrir settings)          | ❌ F4                       |

## Push web (FCM)

1. Firebase Console → Cloud Messaging → **Web Push certificates** → copiar clave pública VAPID.
2. `.env.local`: `NEXT_PUBLIC_FIREBASE_VAPID_KEY=...` (ver `.env.example`).
3. En settings, elegir **Solo push** o **Email y push** → el cliente pide permiso del navegador y registra el token.

Si push está desactivado en canales, no se solicita permiso ni se registra token.

## Email (planificado F4)

Cuando exista Resend + plantillas ES/EN/PT, la Function diaria leerá:

- `notificationChannels.email === true`
- el tipo de evento correspondiente en `notificationPrefs`
- el email del perfil del usuario

## Function programada

`functions/src/notifications/expiry-reminders.ts` — hoy solo registra candidatos en logs. En F4 debe:

1. Cargar prefs y canales del `ownerUid`
2. Enviar email y/o FCM según canal
3. Respetar ventanas 30/60/90 según toggles

## Referencias

- API: `app/api/notifications/prefs/route.ts`, `app/api/notifications/register/route.ts`
- UI: `components/settings/notification-prefs-panel.tsx`
- Hook FCM: `hooks/useFcmRegistration.ts`
- Tareas: `tasks/tasks-plan-reconversion-insurwallet.md` (5.6–5.8)
