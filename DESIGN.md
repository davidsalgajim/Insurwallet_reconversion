# InsurWallet — Design System

> Formato compatible con Google Stitch / impeccable. Fuente de verdad visual para la reconversión web.

## Design Read

**Reading this as:** CRM-style product UI (dashboard bento + journey widgets + sidebar) para dueños de pólizas LATAM, con lenguaje premium tipo Customer Journey CRM Dashboard (Dribbble #24659454), continuidad iOS, light mode en app y navy en marketing.

**Referencia visual:** [Customer Journey CRM Dashboard](https://dribbble.com/shots/24659454-Customer-Journey-CRM-Dashboard) — sidebar sólida, topbar con búsqueda, KPI cards elevadas, bento grid, journey steps, densidad profesional sin clutter.

## Atmosphere

| Dial             | Value | Rationale                                                               |
| ---------------- | ----- | ----------------------------------------------------------------------- |
| Design Variance  | 7     | Bento asimétrico en dashboard; hero marketing con mockup de producto    |
| Motion Intensity | 5     | Hover en cards, fade-up en dashboard; sin animaciones teatrales         |
| Visual Density   | 6     | CRM: más información por pantalla, jerarquía clara, sin sensación vacía |

**Mood:** Calm authority + enterprise polish — sidebar blanca, shell con dot-grid, cards elevadas, acentos semánticos.

## Color Strategy

**Committed restrained** — azul iOS como acento único; cyan solo para IA/MarIAna; semánticos para estados.

### Primitives (from iOS `Theme.swift`)

| Token                     | Hex       | OKLCH (approx)      | Role                              |
| ------------------------- | --------- | ------------------- | --------------------------------- |
| `--primitive-navy`        | `#0F1729` | oklch(18% 0.03 265) | Marketing hero, auth backdrop     |
| `--primitive-deep-blue`   | `#1A2447` | oklch(24% 0.06 265) | Gradient stops                    |
| `--primitive-accent`      | `#407AFF` | oklch(62% 0.19 264) | Primary actions, links, selection |
| `--primitive-accent-cyan` | `#00D1C7` | oklch(78% 0.12 185) | MarIAna, IA features only         |
| `--primitive-success`     | `#33C773` | oklch(72% 0.17 155) | Active policies, confirmations    |
| `--primitive-warning`     | `#FFB833` | oklch(82% 0.15 80)  | Expiring soon                     |
| `--primitive-danger`      | `#F55252` | oklch(65% 0.20 25)  | Expired, errors, destructive      |

### Semantic (light mode — app default)

| Token                  | Value                          | Usage                                 |
| ---------------------- | ------------------------------ | ------------------------------------- |
| `--background`         | `oklch(98% 0.005 250)`         | App shell — cool off-white, NOT cream |
| `--foreground`         | `oklch(22% 0.03 265)`          | Body text                             |
| `--card`               | `oklch(100% 0 0)`              | Cards sólidos en formularios/tablas   |
| `--card-foreground`    | `var(--foreground)`            |                                       |
| `--muted`              | `oklch(96% 0.008 250)`         | Secondary surfaces                    |
| `--muted-foreground`   | `oklch(48% 0.02 250)`          | Helper text — ≥4.5:1 on muted         |
| `--border`             | `oklch(90% 0.01 250)`          | Dividers                              |
| `--primary`            | `var(--primitive-accent)`      | CTAs                                  |
| `--primary-foreground` | `#FFFFFF`                      |                                       |
| `--accent`             | `var(--primitive-accent-cyan)` | MarIAna badge, IA chips               |
| `--accent-foreground`  | `oklch(22% 0.03 265)`          |                                       |
| `--destructive`        | `var(--primitive-danger)`      |                                       |
| `--ring`               | `var(--primitive-accent)`      | Focus rings 2px                       |

### Dark mode (marketing / auth / optional user toggle)

| Token          | Value                       |
| -------------- | --------------------------- | -------------- |
| `--background` | `var(--primitive-navy)`     |
| `--foreground` | `oklch(96% 0.01 250)`       |
| `--card`       | `oklch(22% 0.04 265 / 0.6)` | Glass-friendly |
| `--muted`      | `oklch(28% 0.04 265)`       |

### Banned

- Purple/pink AI gradients
- Gold+fintech dark template (ui-ux-pro-max fintech/crypto palette)
- Cream/sand body backgrounds
- Gradient text (`background-clip: text`)
- Side-stripe colored borders on cards

## Typography

| Role                     | Family                | Weight  | Notes                                             |
| ------------------------ | --------------------- | ------- | ------------------------------------------------- |
| Sans (UI)                | **Plus Jakarta Sans** | 400–700 | Headings + body; cercano a SF Pro en legibilidad  |
| Mono (data)              | **Geist Mono**        | 400–500 | Números de póliza, fechas, primas, estados de job |
| Display (marketing only) | Plus Jakarta Sans     | 600–700 | Hero ≤ clamp(2.5rem, 5vw, 4rem)                   |

```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
```

- Base: 16px, line-height 1.5
- `text-wrap: balance` on h1–h3
- Max prose width: 65ch

## Spacing & Radius

Ported from iOS:

| Token              | Value                                               |
| ------------------ | --------------------------------------------------- |
| `--radius-card`    | `20px`                                              |
| `--radius-sm`      | `14px`                                              |
| `--radius-button`  | `12px`                                              |
| `--screen-padding` | `20px` (mobile), `24px` (tablet+), `32px` (desktop) |

Spacing scale: 4px base — 4, 8, 12, 16, 20, 24, 32, 40, 48, 64.

## Liquid Glass (Web)

Aplicar solo donde hay contenido detrás que justifique blur:

```css
.glass-surface {
  background: oklch(100% 0 0 / 0.72);
  backdrop-filter: blur(20px) saturate(1.2);
  border: 1px solid oklch(100% 0 0 / 0.35);
  box-shadow:
    inset 0 1px 0 oklch(100% 0 0 / 0.5),
    0 4px 24px oklch(22% 0.03 265 / 0.08);
}
```

**Use glass on:** top nav (app), MarIAna chat panel, floating action areas, auth card on navy hero, processing status overlay.

**Do NOT use glass on:** data tables, dense forms, policy detail fields, review wizard inputs.

Dark glass variant: `oklch(22% 0.04 265 / 0.55)` background with same inner highlight.

## Components

### Buttons

- Primary: `--primary` solid, white text, `border-radius: var(--radius-button)`
- Secondary: outline `--border`, hover `--muted`
- Ghost: for tertiary actions
- **States required:** default, hover, focus-visible (ring), active (scale 0.97), disabled, loading
- MarIAna CTA: accent cyan outline or subtle cyan tint background

### Cards

- **Solid card** (`--card` + shadow-sm): policy list items, form sections
- **Glass card**: dashboard summary widgets, MarIAna entry point
- No nested cards
- Status badges: capsule, uppercase caption, semantic colors (from iOS `StatusBadge`)

### Policy Type Icons

Gradient rounded square per type (port from iOS `PolicyTypeIcon`):

- Life, health, auto, home, travel, other — each with distinct hue, white icon

### Forms & Wizard

- Label above input; error below field
- Confidence indicator on extracted fields: high (green dot), medium (amber), low (red) + editable
- Split-view on review screen: document left (with bbox highlights), fields right

### Navigation

- **Mobile:** bottom nav ≤ 5 items (Dashboard, Pólizas, MarIAna, Alertas, Perfil)
- **Desktop:** sidebar collapsible + top bar with glass
- Breadcrumbs on wizard and policy detail

### Loading

- Skeleton loaders matching layout — never bare spinner in content area
- Document pipeline: stepped progress (`subiendo → extrayendo → analizando → listo`)

### Empty States

- Illustration-free; composed icon + headline + single CTA
- Teach the next action ("Sube tu primera póliza")

## Layout

- **App shell:** sidebar fija 260px (sólida, no glass) + área principal con `app-shell-bg` (dot grid sutil)
- **Topbar:** título + búsqueda + CTA nueva póliza + notificaciones + avatar (sticky, blur)
- **Dashboard:** fila de 4 KPI cards → bento 7/5 (vencimientos | MarIAna + journey)
- App max-width: contenido fluido en shell; no centrar en 1280px con márgenes vacíos
- Marketing landing: hero asimétrico + `DashboardPreview` component (mockup CRM real)

## CRM Dashboard Patterns (obligatorio en app)

- KPI cards con icono en badge con gradiente tonal (`stat-icon-*`)
- Sidebar con sección "Menú", CTA primario arriba, promo MarIAna abajo
- Empty states con icono grande + copy + un solo CTA — nunca pantalla vacía sin estructura
- Búsqueda visible en desktop topbar
- Journey widget de 4 pasos (upload → review → track → ask)
- **Prohibido:** dashboard de 3 cards iguales en fila como único contenido

## Motion

- Duration: 150–250ms UI; 300ms max for panel slides
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-quart)
- Stagger list items on dashboard load (max 40ms between items)
- `@media (prefers-reduced-motion: reduce)`: crossfade or instant
- Emil Kowalski rules: no `transition: all`; popovers scale from trigger origin

## Surfaces Map

| Surface              | Register | Mode           | Glass                 |
| -------------------- | -------- | -------------- | --------------------- |
| Landing `/`          | brand    | dark navy hero | hero CTA card         |
| Auth `/login`        | brand    | dark           | auth card             |
| Dashboard `/app`     | product  | light          | nav + summary widgets |
| Policy list/detail   | product  | light          | no                    |
| Upload/review wizard | product  | light          | status overlay only   |
| MarIAna chat         | product  | light          | panel + input bar     |
| Settings/profile     | product  | light          | no                    |

## shadcn/ui Customization

- Radius: `--radius: 0.75rem` base, card `1.25rem`
- Override default zinc palette with semantic tokens above
- Never ship shadcn defaults unmodified

## Tailwind Integration

Map CSS variables in `globals.css` → `tailwind.config` theme extension.
Three-layer tokens per ckm-design-system: primitive → semantic → component.
