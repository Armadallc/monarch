# MonarchWebsites

Monarch Websites, Apps and internal tools. This repo holds the **referral management** code: public site forms, secure referral form, document upload, and admin dashboard. Code is intended for **paste-in to Framer** (Framer hosts the site; forms and dashboard are React/TypeScript code components). The `.tsx` form files here are the **source of truth** and match what is currently in the Framer site (forms are integrated and working). Live production is [monarchcompetency.com](https://www.monarchcompetency.com) on Wix; the Framer rebuild is not live yet.

- **Forms**: Public inquiry, secure professional referral (OAuth-gated), document upload (referral code + email).
- **Dashboard**: Admin view for admissions staff (restricted to `@monarchcompetency.com`), with export for Ritten.io EMR.
- **Backend**: Supabase (PostgreSQL, Auth, Storage). See `docs/SUPABASE.md` for connection details.

## Repo layout

- `Code/Framer/` — All Framer code components (forms, dashboard, portal, AuthGateway paste copies).
- `Code/OAuth/` — AuthGateway repo variant (use `Code/Framer/AuthGateway.tsx` when pasting into Framer).
- `Code/Database/` — SQL migrations for Supabase.
- `docs/` — PROJECT.md, DATABASE.md, Supabase notes, **Referral Source Portal spec**, **planning** (timeline, preferences), **Framer connection** (MCP).

## Local project (root folder)

The repo root is set up for local editing and type-checking:

- **package.json** — React, Supabase, TypeScript (no build step; code is pasted into Framer).
- **tsconfig.json** — Includes `Code/**/*.ts(x)` for `npm run typecheck`.
- Run `npm install` then `npm run typecheck` to validate types. Components may reference Framer globals not in the repo; typecheck is best-effort.

## Setup

1. Copy component code from `Code/Framer/` into your Framer project as code components (see `docs/SYNC_TO_FRAMER.md`).
2. Configure Supabase in Framer (URL and anon key); do not commit keys. See `docs/SUPABASE.md`. Use `.env` locally (copy from `.env.example`).
3. Run database migrations in the Supabase SQL Editor when needed (see `Code/Database/`).
4. **Referral Source Portal** (not yet built): see `docs/REFERRAL_SOURCE_PORTAL.md` and `docs/PLANNING.md` for timeline, preferences, and roadmap. To connect Cursor to the Framer project for live context, see `docs/FRAMER_CONNECTION.md`.
