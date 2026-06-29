# Framer code components (single source of truth)

All active site code components for paste into Framer live here. **`Code/Framer/` was removed** — do not recreate it; edit files in this folder only.

## Paste into Framer (production)

| File | Framer page / use |
|------|-------------------|
| `AuthGateway.tsx` | `/login` (partners), `/admin` (staff) |
| `ReferralForm.tsx` | `/submit-referrals` |
| `ReferralSourcePortal.tsx` | `/portal` |
| `ReferralDashboard.tsx` | `/dashboard` |
| `DocumentUploadForm.tsx` | `/submit-referrals/documents` |
| `PublicInquiryForm.tsx` | Public inquiry (e.g. `/referrals`, homepage) |
| `ReferralSharePage.tsx` | `/r` — ROI signing via `?token=` (see dashboard `SHARE_LINK_BASE`; **not** `/r/:token`) |

Most of these **inline the design system** at the top (no `import` from `DesignSystem`) so Framer publish succeeds. Theme tokens live in **`Code/theme/`** — after edits run `npx tsx Code/theme/sync-framer-theme.ts` and re-paste dashboard/portal into Framer. See `Code/theme/README.md`.

`PublicInquiryForm.tsx` and `AuthGateway.tsx` / `DocumentUploadForm.tsx` in this folder are the paste-ready versions.

## Reference only (not pasted as standalone components)

| File | Purpose |
|------|---------|
| `reference/useMonarchViewport.tsx` | Sync target for inlined viewport hook in portal & dashboard |
| `reference/MonarchHamburgerNav.tsx` | Sync target for inlined nav in dashboard |

Framer bundles each code component in isolation — sibling imports fail on publish. Shared logic is **copied inline** into the large components; keep `reference/` in sync when you change breakpoints or nav behavior.

## Other components

- `NavBurger.tsx`, `PDFViewer.tsx`, `ResourcePDFList.tsx`, `ReflectiveTextV2.tsx` — site UI helpers
- `Workshop/` — experiments (excluded from `tsc` via `tsconfig.json`)

## Also in repo

- `Code/theme/` — canonical theme CSS + tokens; `Code/DesignSystem.ts` re-exports for repo imports
- `Code/OAuth/AuthGateway.tsx` — repo copy with `../DesignSystem` import; **paste from `Code/Framer/AuthGateway.tsx`** into Framer

See `docs/SYNC_TO_FRAMER.md` for paste workflow.

**Go-live:** Marketing pages on Framer (no PHI URLs) can ship before the clinical app — see `docs/PRODUCTION_STRATEGY_FRAMER_VERCEL.md` § Track A. Portal/dashboard/forms move to `app.monarchcompetency.com` on Vercel later.
