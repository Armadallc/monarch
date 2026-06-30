# Vercel setup — PHI app (portal, dashboard, referrals)

**Goal:** Clinical workflows on **`https://app.monarchcompetency.com`** under Vercel HIPAA BAA — not on Framer `www`.  
**Architecture:** `docs/PRODUCTION_STRATEGY_FRAMER_VERCEL.md`  
**Sign-off:** Same doc § 10B (C1–C11) + § 6 pre-live tests

This is a **multi-week track**, not same-day as Wix → Framer marketing.

---

## What lives where

| Host | Domain | Routes |
|------|--------|--------|
| **Framer** | `www.monarchcompetency.com` | Marketing only — no PHI |
| **Vercel** | `app.monarchcompetency.com` | `/login`, `/admin`, `/portal`, `/dashboard`, `/submit-referrals`, `/submit-referrals/documents`, `/r` |
| **Supabase** | API + DB + Storage + Auth | System of record for ePHI |
| **DocuSeal** | via `/r` + webhooks | ROI signing |
| **Google** | OAuth | Staff + source identity |

---

## Phase 0 — Prerequisites (before Vercel)

Complete or schedule before production PHI:

- [ ] Supabase **HIPAA** project + High Compliance settings
- [ ] BAAs: **Supabase**, **Google** (Workspace), **DocuSeal** (before live ROI)
- [ ] Policies: breach notification, incident response, data retention (`docs/REQUIRED_FORMS.md`, `docs/DATA_RETENTION_POLICY.md`)
- [ ] Privacy officer + platform continuity contacts (`docs/PLATFORM_CONTINUITY.md`)
- [ ] Marketing on Framer live with **no** PHI routes on `www`

---

## Phase 1 — Vercel account & team (day 1)

### 1.1 Create team (not personal Hobby)

1. [vercel.com](https://vercel.com) → create **Team** (e.g. `Monarch` or `Armadallc`)
2. Plan: **Pro** (~$20/mo + seats)
3. Enable **2FA** for everyone who can deploy

### 1.2 Connect GitHub

1. Vercel → Team Settings → **Git**
2. Connect `Armadallc/monarch` (or future `apps/referral-app` repo)
3. Production deploys: **`main`** only (or `release/*` after merge of `sync/jun-2026`)

### 1.3 Document owners

- [ ] Billing owner
- [ ] Deploy admins
- [ ] Record in `docs/PLATFORM_CONTINUITY.md`

**Do not enable HIPAA BAA yet** if you’re only deploying staging with synthetic data.

---

## Phase 2 — App package in repo (week 1–2)

Today’s UI lives in `Code/Framer/*.tsx` (paste components) and `Code/playground/dashboard-ui` (Vite prototype).

### 2.1 App package

**Deploy target:** `apps/referral-app/` (Vite + React Router route shell).

**UI reference / port source:** `Code/Framer/*.tsx` and `Code/playground/dashboard-ui`.

```bash
cd apps/referral-app
npm install
cp .env.example .env.local
npm run dev
```

### 2.2 Port routes from Framer

| Route | Component (repo) | Auth |
|-------|------------------|------|
| `/login` | `Code/Framer/AuthGateway.tsx` | `bucket=source` |
| `/admin` | `Code/Framer/AuthGateway.tsx` | `bucket=staff` |
| `/portal` | `Code/Framer/ReferralSourcePortal.tsx` | source session |
| `/dashboard` | `Code/Framer/ReferralDashboard.tsx` | staff `@monarchcompetency.com` |
| `/submit-referrals` | `Code/Framer/ReferralForm.tsx` | source |
| `/submit-referrals/documents` | `Code/Framer/DocumentUploadForm.tsx` | source |
| `/r` | `Code/Framer/ReferralSharePage.tsx` | token query `?token=` |

Reference: `docs/LOGIN_AND_PORTAL_CHECKLIST.md`, `docs/SYNC_TO_FRAMER.md`

### 2.3 Environment variables (client-safe only)

```env
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

**Never** put `SUPABASE_SERVICE_ROLE_KEY` in the Vite client bundle.

### 2.4 Local dev

```bash
cd Code/playground/dashboard-ui
npm install
cp ../../.env.example .env   # fill values at repo root
npm run dev
```

### 2.5 Vercel project config

- **Framework:** Vite
- **Root directory:** `apps/referral-app`
- **Build:** `npm run build`
- **Output:** `dist`
- **SPA fallback:** `vercel.json` rewrites all routes to `index.html`

Example `vercel.json` at app root:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## Phase 3 — Staging deploy (week 2–3)

**Goal:** Full app on Vercel **without** production PHI or public `app.*` DNS yet.

### 3.0 IN PROGRESS — import checkpoint (Jun 2026)

**Status:** Import started on team **Monarch** (`monarchapps`); **Deploy not clicked yet.**

**Resume URL:** Vercel → New Project → import `Armadallc/monarch`

There is **no “Production Branch” field** on the import screen. The branch is the **`main` link** next to the repo name at the top — click it and choose **`sync/jun-2026`** (app code is not on `main` yet).

| Setting | Value |
|---------|--------|
| Vercel Team | Monarch (Pro) |
| Project Name | `monarch` |
| Branch | **`sync/jun-2026`** (click `main` at top) |
| Application Preset | **Vite** (or Other — build settings below matter more) |
| Root Directory | **`apps/referral-app`** (not `./`) |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |
| Env: `VITE_SUPABASE_URL` | Production **and** Preview |
| Env: `VITE_SUPABASE_ANON_KEY` | Production **and** Preview (mark sensitive) |
| HIPAA BAA | **Off** for staging |
| Custom domain | **Later** (`app.monarchcompetency.com`) |

**After first deploy:** Project → **Settings → Git → Production Branch** → set `sync/jun-2026` until `sync/jun-2026` is merged to `main`.

**Next after green deploy:** add Vercel preview URL to Supabase Auth redirect allowlist; smoke-test `/`, `/login`, `/portal`.

### 3.1 Create staging project

1. Vercel → **New Project** → import GitHub repo
2. Branch deploys: `sync/jun-2026` or `staging`
3. Use Vercel preview URL **or** `staging-app.monarchcompetency.com`

### 3.2 Staging env vars

Set in Vercel → Project → Settings → Environment Variables (Preview + Development):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Use **staging Supabase** project **or** production with **synthetic data only** (counsel on BAA for staging with real PHI).

### 3.3 Supabase auth redirect allowlist

Supabase Dashboard → Authentication → URL configuration → **Redirect URLs**:

```
https://<your-vercel-preview>.vercel.app/**
https://staging-app.monarchcompetency.com/**
```

When production is ready, add:

```
https://app.monarchcompetency.com/**
```

See `docs/SUPABASE_AUTH_EMAIL_AND_PROVIDERS.md`

### 3.4 Edge functions (stay on Supabase)

These remain **Supabase Edge Functions**, not Vercel:

- `monarch-contact-form`
- `monarch-docuseal-webhook`
- `monarch-roi-signing-session`
- `monarch-referral-document-request-notify`

Configure secrets in Supabase Dashboard. Point DocuSeal webhooks to Supabase function URLs.

### 3.5 Staging QA

Run:

- `docs/LOGIN_AND_PORTAL_CHECKLIST.md`
- `docs/REFERRAL_PORTAL_AND_ADMISSIONS_DASHBOARD_CHECKLISTS`
- `docs/PRODUCTION_STRATEGY_FRAMER_VERCEL.md` § 6B–6C on staging

**Exit:** Staging passes functional + authZ tests.

---

## Phase 4 — HIPAA production on Vercel (before real PHI)

### 4.1 Enable BAA

1. Vercel Team → **Settings** → **Billing** → **Add-ons**
2. Enable **HIPAA BAA** (~$350/mo add-on on Pro)
3. Accept BAA; download/store executed copy

**Budget floor:** ~$370/mo (Pro + BAA + 1 seat) — see `PRODUCTION_STRATEGY` § 4

### 4.2 Production project

1. Duplicate staging project **or** promote same project with Production env
2. Production branch: `main`
3. Production env vars (same keys, production Supabase if applicable)

### 4.3 Security headers

Vercel → Project → Headers or `vercel.json`:

- `Strict-Transport-Security`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- CSP as feasible (tighten iteratively)

### 4.4 No PHI in analytics

- [ ] Disable or avoid Vercel Analytics / third-party scripts on app routes that log URLs with tokens or referral IDs

---

## Phase 5 — DNS: `app.monarchcompetency.com` (cutover day)

**Where:** Wix DNS today (same as www) — or Cloudflare when you migrate DNS.

1. Vercel → Project → **Domains** → Add `app.monarchcompetency.com`
2. Copy Vercel’s DNS record (usually **CNAME**)
3. Wix DNS → add/update `app` subdomain → Vercel target
4. **Do not** point `app` at Framer
5. Wait for TLS certificate (automatic)
6. Verify `https://app.monarchcompetency.com` loads the Vite app

| Subdomain | Points to |
|-----------|-----------|
| `www` | Framer |
| `app` | Vercel |
| MX | Google (unchanged) |

---

## Phase 6 — Supabase production config

- [ ] Auth redirect allowlist includes `https://app.monarchcompetency.com/**`
- [ ] Google OAuth redirect URIs updated for `app.*`
- [ ] RLS enabled on all PHI tables; Security Advisor critical/high resolved
- [ ] `referral-documents` bucket private; signed URLs only
- [ ] `referral_activity_log` append-only (`docs/HIPAA_AUDIT_LOGGING.md`)
- [ ] Rotate keys that lived in Framer paste files or shared channels

### DocuSeal (ROI)

- [ ] Production API key in Supabase secrets
- [ ] Template v2.2 production
- [ ] Webhook URL → `monarch-docuseal-webhook` (production toggle)
- [ ] BAA signed with DocuSeal
- [ ] Test `/r?token=…` end-to-end

---

## Phase 7 — Connect Framer marketing to app

On **Framer `www`** only after app is live and signed off:

| CTA | Update to |
|-----|-----------|
| Partner login | `https://app.monarchcompetency.com/login` |
| Staff / admin | `https://app.monarchcompetency.com/admin` (bookmark — not main nav) |
| Submit referral | `https://app.monarchcompetency.com/submit-referrals` |
| Portal | `https://app.monarchcompetency.com/portal` |

Remove “coming soon” placeholders. **Do not** embed portal/dashboard components on `www`.

---

## Phase 8 — Production go-live sign-off

Complete **all** gates in `docs/PRODUCTION_STRATEGY_FRAMER_VERCEL.md`:

| Section | What |
|---------|------|
| § 10B C1–C11 | Clinical launch checklist |
| § 6A | Legal & administrative |
| § 6B | Technical security |
| § 6C | Functional E2E |
| § 6D | Security testing minimum |

### Pilot launch

- [ ] Controlled first referrals (test sources / internal) before broad announcement
- [ ] Admissions SOP distributed (`docs/ADMISSIONS_STAFF_ONBOARDING_AND_SOP.md`)

---

## Phase 9 — Post-launch operations

| Cadence | Task |
|---------|------|
| Weekly | Dependabot; Supabase Security Advisor; confirm Framer www has no PHI routes |
| Monthly | Staff access review; vendor advisories |
| Quarterly | Risk assessment update; incident tabletop |
| Within 90 days | External penetration test on `app.*` + Supabase API |
| Annual | Pentest refresh; BAA review; training refresh |

---

## Suggested timeline

| When | Milestone |
|------|-----------|
| **Today** | Framer `www` live (`docs/WIX_TO_FRAMER_GO_LIVE_TODAY.md`) |
| **Weeks 1–2** | Vercel team + GitHub; port routes to Vite app |
| **Weeks 2–4** | Staging deploy + QA on preview URL |
| **Weeks 4–8** | BAA + `app.*` DNS + production sign-off |
| **Ongoing** | Framer content only on `www`; app deploys via GitHub → Vercel |

---

## Quick reference — env & secrets

| Secret | Where |
|--------|--------|
| `VITE_SUPABASE_*` | Vercel env (client) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Edge Functions only |
| DocuSeal API key | Supabase Edge Function secrets |
| Resend API key | Supabase Edge Function secrets |
| Google OAuth client | Supabase Auth + Google Cloud Console |

---

## Related docs

- `docs/PRODUCTION_STRATEGY_FRAMER_VERCEL.md` — architecture + sign-off sheets
- `docs/LOGIN_AND_PORTAL_CHECKLIST.md` — route placement
- `docs/SYNC_TO_FRAMER.md` — component source files (port to Vite)
- `docs/DNS_EMAIL_AUDIT_CHECKLIST.md` — when moving DNS off Wix
- `docs/DEV_SETUP_TWO_MACHINES.md` — home/work git workflow
