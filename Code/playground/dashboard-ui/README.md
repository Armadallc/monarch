# Dashboard UI playground

Local Vite app to iterate on **Kanban**, **sidebar**, and **messages** before pasting into Framer.

## Run

```bash
cd Code/playground/dashboard-ui
npm install
npm run dev
```

Or from repo root (after first install):

```bash
npm run dev:ui
```

Opens **http://localhost:5173** with hot reload.

## What’s in the prototype

| View | Behavior |
|------|----------|
| **Admissions (staff)** | 5-column Kanban, drag-and-drop status change with confirm dialog, collapsible sidebar, mock messages panel |
| **Referral source portal** | Read-only Kanban, summary filter chips, simplified cards |

Uses [`Code/DesignSystem.ts`](../../DesignSystem.ts) via `@design` alias — same tokens as production (inlined in Framer later).

## Next steps

1. Review layout and card density in the browser.
2. Adjust columns, badges, and sidebar in this folder only.
3. After sign-off, copy components into `Code/Framer/` and integrate per `docs/SYNC_TO_FRAMER.md`.

Spec: `docs/DASHBOARD_PORTAL_UI_UPDATES` · Visual reference: `Code/Framer/reference/Referral Dashboard & Portal UI Redesign.pdf`
