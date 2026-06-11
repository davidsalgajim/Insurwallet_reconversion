# Design System — InsurWallet Reconversión

**Date:** 2026-06-10  
**Status:** Approved direction (continuidad iOS + liquid glass)  
**Phase:** F0

## Goal

Establecer la base de diseño antes de scaffold Next.js: tokens, personalidad, reglas de glass, y orquestación de skills para que cada feature use el skill correcto.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Visual direction | Continuidad iOS | Usuarios existentes reconocen la marca; `Theme.swift` ya validado |
| Default mode | Light en app | Legibilidad en formularios largos y revisión de documentos |
| Dark usage | Marketing + auth | Navy mesh del iOS hero |
| Glass | Superficies flotantes | Nav, chat, overlays — no en datos densos |
| Typography | Plus Jakarta Sans + Geist Mono | Trust sin Inter-slop; mono para datos de póliza |
| Palette source | iOS primitives | `#407AFF`, `#00D1C7`, semánticos portados |
| Anti-palette | Fintech gold/purple | Rechazado explícitamente del output ui-ux-pro-max genérico |

## Approaches Considered

### A — Continuidad iOS + glass (selected)

Port directo de colores y radius; light app; glass en capas flotantes. **Pros:** coherencia marca, menos debate. **Cons:** hay que adaptar mesh/glass a CSS con cuidado de performance.

### B — Insurance Platform light (ui-ux-pro-max)

`#0369A1` + verde seguridad. **Pros:** convención sector seguros. **Cons:** rompe continuidad con app iOS publicada.

### C — Dark premium everywhere

Navy default en toda la app. **Pros:** dramático, cerca del mesh iOS. **Cons:** peor para formularios y lectura prolongada de clausulados.

## Token Architecture

```
primitives (hex/oklch from iOS)
    ↓
semantic (background, foreground, primary, accent, destructive…)
    ↓
component (button-bg, glass-surface, badge-active, mariana-chip…)
```

Files to create in F0 implementation (after plan approval):

- `src/styles/tokens.css` — primitives + semantic
- `src/styles/glass.css` — glass utilities
- `tailwind.config.ts` — theme extension
- `components.json` — shadcn with custom radius/colors

## Skill Orchestration

| Task type | Primary skill | Secondary |
|-----------|---------------|-----------|
| App screens (dashboard, wizard, chat) | impeccable (craft/polish) | emil-design-eng for motion |
| Design tokens / Tailwind theme | ckm-design-system | ui-ux-pro-max checklist |
| Marketing landing | design-taste-frontend | impeccable brand register |
| UX audit before ship | impeccable audit | ui-ux-pro-max accessibility |
| Component states review | emil-design-eng | — |

## Key Screens (F1–F2)

1. Dashboard — bento grid, status badges, expiry alerts
2. Policy wizard — stepped, Zod validation, solid cards
3. Document upload — drag-drop, pipeline steps, glass overlay
4. Review split-view — bbox highlights, confidence per field
5. MarIAna — glass panel, cyan accent, streaming messages

## Success Criteria

- [ ] PRODUCT.md and DESIGN.md at repo root
- [ ] Cursor rule for design skill routing
- [ ] Tokens implementables in Tailwind without raw hex in components
- [ ] WCAG AA contrast on body text verified
- [ ] Glass limited to ≤5 surface types documented above

## Open Questions

- Logo SVG export from iOS assets (pending)
- Dark mode toggle in app settings (F5 polish, not F0)
