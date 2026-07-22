# Monarch Mental Health — Framer + Vercel migration checklist

**Domain:** `monarchmentalhealth.org` (canonical) · `monarchmentalhealth.com` (Dan — for sale / redirect TBD)  
**Pattern:** Same split as Competency — **Framer `www`** (marketing) + **`app.*` on Vercel** (PHI when ready)  
**Parent docs:** [`PRODUCTION_STRATEGY_FRAMER_VERCEL.md`](PRODUCTION_STRATEGY_FRAMER_VERCEL.md), [`DNS_AND_EMAIL_REFERENCE.md`](DNS_AND_EMAIL_REFERENCE.md), [`DNS_EMAIL_AUDIT_CHECKLIST.md`](DNS_EMAIL_AUDIT_CHECKLIST.md)

Use Competency’s completed steps as the template; this doc tracks **Mental Health–specific** gates only.

---

## Decisions to lock first (G4)

| # | Decision | Choice | Date |
|---|----------|--------|------|
| D1 | Canonical domain | ☑ `.org` (assumed) ☐ `.com` | |
| D2 | App subdomain | ☐ `app.monarchmentalhealth.org` ☐ shared `app.monarchcompetency.com` with program filter ☐ other: ______ | |
| D3 | Google Workspace | ☐ Secondary domain on existing tenant ☐ separate org | |
| D4 | Referral / portal scope at launch | ☐ MH-only referrals ☐ cross-program with Competency app ☐ marketing-only first | |
| D5 | `monarchmentalhealth.com` | ☐ redirect to `.org` ☐ leave on Dan ☐ other | |

---

## Track A — Marketing (Framer → `www.monarchmentalhealth.org`)

*No PHI on this domain until counsel approves otherwise.*

### A1. Framer site

| # | Task | Done |
|---|------|:----:|
| A1.1 | Framer project exists (or MH pages in shared site — document which) | ☐ |
| A1.2 | Pages: Home, About, Program/Services, Resources, Contact, legal | ☐ |
| A1.3 | **No** `/portal`, `/dashboard`, `/submit-referrals`, `/admin`, `/login`, `/r`, document upload on published MH www | ☐ |
| A1.4 | **No** Supabase keys or DocuSeal secrets in Framer MH pages | ☐ |
| A1.5 | Nav/footer CTAs → placeholder or `app.*` when live — not production PHI forms on www | ☐ |
| A1.6 | Contact → `hello@monarchmentalhealth.org` (phone + mailto until Resend) | ☐ |
| A1.7 | Mobile/tablet breakpoint pass (same issues as Competency www audit) | ☐ |
| A1.8 | Custom domain connected in Framer | ☐ |
| A1.9 | Publish + smoke test on staging URL | ☐ |

### A2. DNS (Wix today → Cloudflare later)

| # | Task | Done |
|---|------|:----:|
| A2.1 | Export/screenshot **all** Wix DNS for `monarchmentalhealth.org` | ☐ |
| A2.2 | `www` CNAME → `sites.framer.app` (currently `cdn1.wixdns.net` — **Wix still live**) | ☐ blocked until A1.8 |
| A2.3 | Apex `@` → redirect to `www` | ☐ |
| A2.4 | **MX → Google** unchanged | ☑ verified in Wix |
| A2.5 | SPF: single TXT `v=spf1 include:_spf.google.com ~all` (remove duplicate `_spfm`) | ☑ |
| A2.6 | DKIM: `google._domainkey` TXT + **Start authentication** in Google Admin | ☐ **next** |
| A2.7 | DMARC: `_dmarc` TXT `p=none` + rua mailbox | ☐ |
| A2.8 | Mail test: send from `@monarchmentalhealth.org` → spf=pass, dkim=pass | ☐ |
| A2.9 | Fill [`DNS_EMAIL_AUDIT_CHECKLIST.md`](DNS_EMAIL_AUDIT_CHECKLIST.md) sections A–G for MH | ☐ |

### A3. Marketing sign-off (adapt § 10A)

| # | Gate | Done |
|---|------|:----:|
| A3.1 | M1 — no PHI routes on MH www | ☐ |
| A3.2 | M2 — no secrets in Framer | ☐ |
| A3.3 | M5 — privacy / terms linked | ☐ |
| A3.4 | M6 — DNS + TLS verified | ☐ |
| A3.5 | M7 — editors documented | ☐ |

---

## Track B — Clinical app (Vercel — if separate from Competency app)

*Skip rows that use shared `app.monarchcompetency.com` with program scoping instead.*

| # | Task | Done |
|---|------|:----:|
| B1 | Route plan: which MH flows live on which host | ☐ |
| B2 | `app.monarchmentalhealth.org` DNS → Vercel (or CNAME to shared app) | ☐ |
| B3 | Supabase: MH program row + RLS / staff memberships | ☐ |
| B4 | Google Admin: `@monarchmentalhealth.org` users/aliases | ☐ |
| B5 | Auth redirect allowlist for MH app URLs | ☐ |
| B6 | Port or enable MH referral form / portal UI (if product-ready) | ☐ |
| B7 | ROI / DocuSeal — only if MH uses same ROI template (likely N/A at first) | ☐ |
| B8 | § 6 pre-live tests on staging (`LOGIN_AND_PORTAL_CHECKLIST`, portal/dashboard checklists) | ☐ |
| B9 | Vercel HIPAA BAA + § 10B sign-off before real MH ePHI | ☐ |
| B10 | Framer MH www CTAs → live `app.*` URLs | ☐ |

---

## Track C — Email & forms (shared infra)

| # | Task | Done |
|---|------|:----:|
| C1 | Confirm `hello@monarchmentalhealth.org` in Google (user or alias) | ☐ |
| C2 | Cross-domain aliases (hello@ ↔ admissions@) per [`FORM_EMAILS.md`](FORM_EMAILS.md) | ☐ |
| C3 | Resend domain verify (after DNS off Wix / on Cloudflare) | ☐ |
| C4 | Contact form webhook — if used on MH site | ☐ |
| C5 | Printable admission form contact block matches live email | ☐ |

---

## Track D — `monarchmentalhealth.com` (Dan.com)

| # | Task | Done |
|---|------|:----:|
| D1 | Confirm listing / sale status on Dan | ☐ |
| D2 | Redirect `.com` → `.org` when ready (registrar/Dan DNS) | ☐ |
| D3 | No accidental email on `.com` | ☐ |

---

## Competency cross-reference — copy these patterns

When MH item matches Competency, follow the same runbook:

| Competency doc | Apply to MH |
|----------------|-------------|
| [`MARKETING_GO_LIVE_MONDAY.md`](MARKETING_GO_LIVE_MONDAY.md) | Framer-only launch playbook |
| [`WIX_TO_FRAMER_GO_LIVE_TODAY.md`](WIX_TO_FRAMER_GO_LIVE_TODAY.md) | DNS cutover steps |
| [`SYNC_TO_FRAMER.md`](SYNC_TO_FRAMER.md) | Code component sync |
| [`VERCEL_PHI_APP_SETUP.md`](VERCEL_PHI_APP_SETUP.md) | App host phases |
| [`DNS_AND_EMAIL_REFERENCE.md`](DNS_AND_EMAIL_REFERENCE.md) | Record inventory template |

---

## Suggested order

1. **Decisions** (D1–D5) — especially shared vs separate `app.*`  
2. **Track A2** email/DNS hygiene (SPF done; DKIM + DMARC next)  
3. **Track A1** Framer content + domain connect  
4. **Track A3** marketing sign-off → MH www live  
5. **Track B** only when Competency `app.*` is signed off or MH scope is defined  
6. **Track C/D** in parallel with DNS migration to Cloudflare  

---

## Changelog

| Date | Change |
|------|--------|
| 2026-07-03 | Initial checklist; SPF duplicate on `.org` marked done |
| 2026-07-03 | Audit: `www.monarchmentalhealth.org` still Wix (not Framer); MX/SPF OK |

---

## Current state snapshot (2026-07-03)

| Item | Status |
|------|--------|
| Public site | **Wix** at `https://www.monarchmentalhealth.org` |
| DNS `www` | `cdn1.wixdns.net` |
| SPF | Fixed (single Google SPF) |
| DKIM / DMARC | Not yet |
| Framer custom domain | Not connected |
| Competency Framer project | `monarchy.framer.website` — **Competency only**; MH Framer TBD |
