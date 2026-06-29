# Monarch theme (canonical)

## Source of truth

| File | Purpose |
|------|---------|
| `dashboard-theme.css` | Full theme: CSS variables (`:root` / `.dark`), app shell, form controls |
| `monarch-theme-inject.css` | Subset injected into Framer dashboard/portal (tokens + controls) |
| `designTokens.ts` | Legacy `COLORS` / `RADIUS` / `FONT` maps → `var(--token, fallback)` |
| `brandFallbacks.ts` | Hex fallbacks when CSS vars are not loaded |
| `designSystemStyles.ts` | Shared `BUTTON_PRIMARY`, `INPUT_BASE`, frost glass, etc. |
| `themeRuntime.ts` | Light/dark/system mode + `useMonarchThemeBootstrap()` |

`Code/DesignSystem.ts` re-exports this package for repo imports (forms, OAuth, playground).

## Playground

```ts
import "../../../theme/dashboard-theme.css"
import { initMonarchThemeMode } from "../../../theme"
```

`playgroundDesign.ts` is a thin alias of `@design` → `Code/theme`.

## Framer (dashboard + portal)

Framer cannot resolve cross-file imports. Theme blocks in `ReferralDashboard.tsx` and `ReferralSourcePortal.tsx` are **generated** between:

```
// @monarch-theme:inline:start
…
// @monarch-theme:inline:end
```

After editing theme files, run:

```bash
npx tsx Code/theme/sync-framer-theme.ts
```

Then paste updated Framer components into Framer.

## Changing colors

1. Edit token values in `dashboard-theme.css` (`:root` and `.dark`).
2. Copy the inject subset: `monarch-theme-inject.css` should stay in sync (tokens + checkbox/input rules only).
3. Adjust `brandFallbacks.ts` only when offline/fallback hex should change.
4. Run `npx tsx Code/theme/sync-framer-theme.ts`.
5. Re-paste Framer dashboard + portal code components.
