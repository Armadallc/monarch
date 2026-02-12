# MonarchWebsites

Monarch Websites, Apps and internal tools. This repo holds the **referral management** code: public site forms, secure referral form, document upload, and admin dashboard. Code is intended for **paste-in to Framer** (Framer hosts the site; forms and dashboard are React/TypeScript code components).

- **Forms**: Public inquiry, secure professional referral (OAuth-gated), document upload (referral code + email).
- **Dashboard**: Admin view for admissions staff (restricted to `@monarchcompetency.com`), with export for Ritten.io EMR.
- **Backend**: Supabase (PostgreSQL, Auth, Storage). See `docs/SUPABASE.md` for connection details.

## Repo layout

- `Code/Forms/` — ReferralForm, ReferralDashboard, DocumentUploadForm, PublicInquiryForm (TSX for Framer).
- `Code/OAuth/` — AuthGateway component.
- `Code/Database/` — SQL migrations for Supabase.
- `docs/` — PROJECT.md, DATABASE.md, Supabase notes, reference docs.

## Setup

1. Copy component code from `Code/Forms/` and `Code/OAuth/` into your Framer project as code components.
2. Configure Supabase in Framer (URL and anon key); do not commit keys. See `docs/SUPABASE.md`. Use `.env` locally (copy from `.env.example`).
3. Run database migrations in the Supabase SQL Editor when needed (see `Code/Database/`).
