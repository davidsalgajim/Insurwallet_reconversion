# InsurWallet — Product Context

## Register

**Product** — La interfaz sirve a tareas concretas (gestionar pólizas, subir documentos, consultar MarIAna). La landing pública es **brand**, pero el registro por defecto del proyecto es product.

## Purpose

InsurWallet centraliza pólizas de seguro en un solo lugar seguro para usuarios LATAM. La web reemplaza la app iOS nativa y debe sentirse **premium, confiable y clara** — nivel CRM dashboard profesional (referencia: Customer Journey CRM, Dribbble), no template fintech genérico ni UI básica de 3 cards.

**Core value:** "Todas tus pólizas en un solo lugar, con IA que te ayuda a entenderlas y no olvidar nada."

## Target Users

- Dueños de pólizas en Colombia y LATAM (vida, salud, auto, hogar, viaje)
- Contexto de uso: revisar coberturas antes de un viaje, responder a una emergencia, renovar antes del vencimiento, compartir con familia
- Dispositivos: móvil primero (60%+), desktop para revisión de documentos y wizard de pólizas

## Primary Workflows

1. **Dashboard** — resumen de pólizas, alertas de vencimiento, acceso rápido a MarIAna
2. **CRUD de pólizas** — manual o asistido por PDF
3. **Pipeline de documentos** — upload → estados en vivo → revisión con confianza por campo; PDF escaneado vía Claude vision; transcripción página a página para RAG (exclusiones, clausulado); labels ES/EN/PT; **20 campos** extraíbles (paridad con wizard manual — ver `lib/schemas/extraction-field-keys.ts`)
4. **MarIAna** — chat multi-agente read-only con citas a chunks del transcript indexado (`search_document_chunks`)
5. **Compartir** — enlaces con permisos y expiración
6. **Perfil / privacidad** — GDPR, exportar, eliminar

## Brand Personality

**Confiable · Claro · Tranquilo**

- Confiable: datos sensibles, tono sobrio, sin hype
- Claro: jerarquía fuerte, estados visibles, sin jerga de seguros innecesaria
- Tranquilo: colores que reducen ansiedad; la IA asiste, no intimida

## Anti-References

- Fintech morado con gradientes neón
- Cream/sand/beige como fondo por defecto
- Tres cards iguales en fila como única composición
- Dashboard vacío sin sidebar, topbar, búsqueda ni bento grid
- Inter + slate-900 como look genérico de IA
- Spinners centrados en lugar de skeletons contextuales
- Modales para todo; preferir flujos inline y split-view

## Strategic Design Principles

1. **La IA propone, el usuario dispone** — nada se guarda sin revisión humana en extracción de documentos; el PDF original permanece en Storage del usuario para consulta posterior
2. **Estados siempre visibles** — procesamiento, confianza, errores y permisos compartidos
3. **Continuidad con iOS** — misma paleta azul/cyan; light mode en la app; marketing con registro editorial claro (body blanco) y hero navy enmarcado; auth mantiene navy + glass card
4. **Liquid glass con criterio** — solo en superficies flotantes (nav, paneles, chat, overlays), no en tablas ni formularios densos
5. **Accesibilidad WCAG AA mínimo** — contraste 4.5:1 en texto de cuerpo; `prefers-reduced-motion` respetado

## Accessibility

- Español como idioma base; EN/PT con next-intl (mensajes en `messages/`; cobertura parcial en app)
- Targets táctiles ≥ 44px
- Navegación por teclado completa en web
- No depender solo del color para estados (icono + texto)

## Tech Stack (UI)

- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, shadcn/ui (base)
- Tokens en CSS variables (`app/globals.css`, OKLCH donde aplique)
- Lucide para iconografía (no emojis como iconos)
- i18n: next-intl (ES/EN/PT) — shell configurado; cobertura de traducción en progreso (F1)
