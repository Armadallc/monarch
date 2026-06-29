# Production strategy — Framer (marketing) + Vercel (clinical app)

Living plan for Monarch’s split hosting architecture, security gates, and go-live sign-off. **Not legal advice** — run BAAs and risk assessment past counsel and your privacy officer.

**Related docs:** [`PLATFORM_CONTINUITY.md`](PLATFORM_CONTINUITY.md), [`HIPAA_AUDIT_LOGGING.md`](HIPAA_AUDIT_LOGGING.md), [`DATA_RETENTION_POLICY.md`](DATA_RETENTION_POLICY.md), [`LOGIN_AND_PORTAL_CHECKLIST.md`](LOGIN_AND_PORTAL_CHECKLIST.md), [`REFERRAL_PORTAL_AND_ADMISSIONS_DASHBOARD_CHECKLISTS`](REFERRAL_PORTAL_AND_ADMISSIONS_DASHBOARD_CHECKLISTS), [`REQUIRED_FORMS.md`](REQUIRED_FORMS.md), [`SYNC_TO_FRAMER.md`](SYNC_TO_FRAMER.md).

**Long-term goal:** Strategy C — rebuild marketing natively on the same app host (optional). **Short-term:** Framer marketing + Vercel PHI app.

---

## 0. Executive summary

| Zone | Host | Domain (target) | PHI | BAA |
|------|------|-----------------|-----|-----|
| **Marketing** | Framer | `www.monarchcompetency.com` | **None** (by policy) | Not required for PHI |
| **Clinical app** | Vercel Pro + HIPAA add-on | `app.monarchcompetency.com` | Yes (display/submit) | **Vercel BAA** (~$350/mo add-on + Pro) |
| **System of record** | Supabase HIPAA project | API + DB + Storage + Auth | Yes | **Supabase BAA** |
| **Staff/source identity** | Google OAuth (+ Apple if used) | — | Identifiers | **Google BAA** ✓ |
| **ROI signing** | DocuSeal (embed on `/r`) | via app host | Yes | **DocuSeal BAA** (before live ROI) |
| **Email** | Resend or similar | — | PHI-free by design | BAA if PHI risk |
| **Source control** | GitHub | This repo | No PHI in git | DPA |

**Compliance principle:** Framer does not create, receive, maintain, or transmit ePHI. All referral/portal/dashboard workflows live on `app.*` under Vercel BAA. Supabase is the only ePHI datastore.

**Priority (current):** Ship **marketing on Framer ASAP** — no PHI URLs, no auth-gated clinical routes on the marketing domain. Clinical app on Vercel follows on a separate track.

---

## 1. Two launch tracks

### Track A — Marketing go-live (Framer) — **priority now**

Marketing can go live **before** Vercel, **before** full BAAs for the app host, and **without** Supabase keys on public pages.

| Rule | Requirement |
|------|-------------|
| **Pages** | Home, programs, team, about, contact, resources, legal — public content only |
| **No PHI routes on Framer** | Do **not** publish `/portal`, `/dashboard`, `/submit-referrals`, `/admin`, `/login` (clinical), `/r`, or document upload on the marketing domain |
| **CTAs** | “Submit a referral”, “Login”, “Staff” → link to **placeholder** (`#`, “Coming soon”) or **staging app URL** until `app.*` is live — never embed referral forms on www until Vercel is ready |
| **Forms** | General contact → `hello@monarchcompetency.com` only; no clinical intake on Framer unless counsel approves minimal fields |
| **Secrets** | No Supabase anon key, no DocuSeal keys, no service role in Framer marketing pages |
| **Analytics** | Avoid trackers that capture health-related query strings; document in privacy policy when published |

**Staging today:** `https://monarchy.framer.website`  
**Production target:** `https://www.monarchcompetency.com` (DNS cutover from Wix when ready)

→ Use **§ 8 Marketing go-live sign-off** when publishing.

---

### Track B — Clinical app go-live (Vercel + Supabase)

Referral portal, admissions dashboard, secure referral form, document upload, ROI (`/r`), and auth (`/login`, `/admin`) deploy to **`app.monarchcompetency.com`** only after **§ 7 Clinical app go-live sign-off**.

Framer marketing then updates CTAs from placeholders to `https://app.monarchcompetency.com/...`.

---

## 2. Target architecture (production)

```
                    ┌─────────────────────────────────────┐
                    │  Users (public, sources, staff)      │
                    └──────────────┬──────────────────────┘
                                   │
          ┌────────────────────────┼────────────────────────┐
          │                        │                        │
          ▼                        ▼                        ▼
   www.monarchcompetency.com   app.monarchcompetency.com   Google OAuth
   (Framer — marketing)         (Vercel Pro + HIPAA BAA)     (Google BAA)
   No PHI                       SPA shell + routes           Auth redirects
          │                     │
          │  links only         │  HTTPS (browser → Supabase)
          └────────────────────►┼──────────────────────────► Supabase (HIPAA)
                                │                            Postgres + RLS
                                │                            Auth, Storage, Edge
                                ▼
                          DocuSeal (BAA)    Resend (BAA if needed)
                          ROI on /r
```

### Routes by host

| Route | Marketing (Framer) | App (Vercel) |
|-------|-------------------|--------------|
| `/` (home) | ✓ | — |
| Program, team, about, resources | ✓ | — |
| Contact / general inquiry | ✓ (non-PHI) | — |
| `/login` | — | ✓ (`bucket=source`) |
| `/admin` | — | ✓ (`bucket=staff`) |
| `/portal` | — | ✓ |
| `/dashboard` | — | ✓ |
| `/submit-referrals` | — | ✓ |
| `/submit-referrals/documents` | — | ✓ |
| `/r?token=…` | — | ✓ |

---

## 3. Onramp phases

### Phase 1 — Prepare (no Vercel account required)

**Goal:** Repo, policies, and architecture ready so Vercel is “deploy,” not “design.”

- [ ] Lock route table (§ 2) and share with Framer editors + dev
- [ ] **Marketing:** Finish Framer pages; audit all nav/footer links — no PHI URLs on www
- [ ] Decide app package: extend `Code/playground/dashboard-ui` (Vite) or new `apps/referral-app`
- [ ] Plan env-based Supabase config (no hardcoded keys in Vercel app — see `docs/SUPABASE.md`)
- [ ] Confirm Supabase HIPAA org add-on + High Compliance settings ([HIPAA projects](https://supabase.com/docs/guides/platform/hipaa-projects))
- [ ] Draft/finish policies: Breach Notification, Incident Response, Workforce Training (`REQUIRED_FORMS.md`)
- [ ] Assign privacy officer + security contact; fill backup super admin (`PLATFORM_CONTINUITY.md`)
- [ ] Vendor BAA inventory: Supabase, Google ✓, DocuSeal (pre-ROI), Vercel (at prod app cutover), email vendor
- [ ] Document lightweight HIPAA Security Rule risk assessment (Framer = no PHI, Vercel = app shell, Supabase = ePHI)

**Exit:** Architecture agreed; marketing ready for Track A sign-off; app port plan written.

---

### Phase 2 — Staging app (Vercel + staging Supabase)

**Goal:** Full PHI app on Vercel without production PHI or public app DNS.

- [ ] Create Vercel **team** (Pro); connect GitHub; 2FA for deploying members
- [ ] Deploy app to preview/staging (`staging-app.monarchcompetency.com` or Vercel preview URLs)
- [ ] **Counsel decision:** HIPAA BAA on staging only if staging holds real ePHI; otherwise synthetic data only without BAA
- [ ] Separate staging Supabase project **or** strict synthetic data only
- [ ] Add staging URLs to Supabase auth redirect allowlist
- [ ] Port routes from `Code/Framer/*.tsx` into Vercel app router
- [ ] Run functional QA: `LOGIN_AND_PORTAL_CHECKLIST.md`, `REFERRAL_PORTAL_AND_ADMISSIONS_DASHBOARD_CHECKLISTS`
- [ ] Enable RLS on tables flagged P1 in dashboard checklists; fix Supabase Security Advisor critical/high

**Exit:** Staging app passes § 6 pre-live technical tests (staging environment).

---

### Phase 3 — Production app cutover

**Goal:** Real ePHI on BAA-covered `app.*`.

- [ ] Enable Vercel **HIPAA BAA add-on** ($350/mo) + accept BAA on production team
- [ ] DNS: `app.monarchcompetency.com` → Vercel
- [ ] Production env vars; **never** service role in client bundle
- [ ] Supabase production redirect allowlist → `app.monarchcompetency.com/*`
- [ ] DocuSeal: production API key, template, webhook **Production** toggle, **BAA signed**
- [ ] Rotate any keys that lived in Framer paste files or shared channels
- [ ] Framer www: update CTAs to `app.monarchcompetency.com` (remove placeholders)
- [ ] Complete **§ 7 Clinical app go-live sign-off**

---

## 4. Vercel account setup (when starting Track B)

- [ ] Create **team** (not personal Hobby) — **Pro** plan ($20/mo platform + seats)
- [ ] Connect GitHub; restrict production deploys to `main` (or release branch)
- [ ] Enable **2FA** for all deploying members
- [ ] Staging project first; production project when ready for BAA
- [ ] Enable **HIPAA BAA** on production team: Settings → Billing → Add-ons → HIPAA BAA (~$350/mo)
- [ ] Custom domain `app.monarchcompetency.com`; TLS automatic
- [ ] Document Vercel team admin + billing owner in `PLATFORM_CONTINUITY.md`

**Budget floor (app host):** ~$370/mo (1 deploying seat: $20 Pro + $350 BAA) + usage within $20 credit.

---

## 5. Production infrastructure checklist

### Framer (`www`)

- [ ] Marketing pages only; no clinical code components on published www project
- [ ] CTAs point to `app.*` (or placeholder until app live)
- [ ] Contact form → `hello@monarchcompetency.com`; referrals copy points to app when live
- [ ] No Supabase / DocuSeal secrets in Framer
- [ ] Publish workflow: marketing editors ≠ production DB secrets

### Vercel (`app`)

- [ ] Pro + HIPAA BAA enabled (production)
- [ ] Security headers: HSTS, `X-Content-Type-Options`, `Referrer-Policy`; CSP where feasible
- [ ] Env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` only (public anon key)
- [ ] No Vercel Analytics / third-party scripts that log PHI on app routes
- [ ] GitHub → production deploy pipeline documented

### Supabase

- [ ] HIPAA add-on + High Compliance project
- [ ] SSL enforcement, network restrictions, PITR enabled
- [ ] RLS on all PHI/PII tables; program-scoped staff policies (M6) when app verified
- [ ] Private `referral-documents` bucket; signed URLs only
- [ ] `referral_activity_log` append-only (`HIPAA_AUDIT_LOGGING.md`)
- [ ] Edge secrets: DocuSeal, Resend — production keys only

---

## 6. Pre-go-live tests (clinical app — staging or prod gate)

### 6A. Legal & administrative

- [ ] Signed BAAs: Supabase, Google, Vercel (prod), DocuSeal
- [ ] HIPAA risk assessment documented and filed
- [ ] Privacy policy / notice updated for `app.*` and www
- [ ] Breach notification policy finalized
- [ ] Incident response plan finalized
- [ ] Workforce HIPAA training completed for admissions staff (or scheduled ≤30 days post-live with interim controls)
- [ ] Data retention policy acknowledged (`DATA_RETENTION_POLICY.md`)
- [ ] Platform continuity: two super admins on file

### 6B. Technical security

- [ ] RLS: non-member JWT cannot read `referral_submissions`
- [ ] Staff: `@monarchcompetency.com` without `staff_program_memberships` blocked from dashboard
- [ ] Portal: source A cannot see source B referrals
- [ ] Service role not in client build (grep `dist/` / bundle)
- [ ] Storage: anonymous cannot list/download `referral-documents`
- [ ] Share links: token + DOB; revoke works; tokens not in analytics logs
- [ ] Supabase Security Advisor: no unresolved critical/high
- [ ] Auth redirects: only allowlisted `app.monarchcompetency.com` URLs
- [ ] HTTPS only on www + app
- [ ] Staff vs source auth buckets (`AuthGateway`) sign-out/isolation verified

### 6C. Functional E2E

- [ ] Partner login → submit referral → `referral_submitted` audit
- [ ] Portal list + detail; `referral_viewed` audit
- [ ] Staff login → dashboard; program filter; assign; status change
- [ ] Messages + section notes; internal notes hidden from portal (RLS)
- [ ] Document upload → private storage
- [ ] ROI `/r?token=` — DocuSeal production; webhook updates status
- [ ] Export CSV/Ritten — staff only
- [ ] Archive / transfer per product rules

### 6D. Security testing (minimum before clinical prod)

- [ ] `npm audit` / Dependabot: highs criticals resolved or accepted with written exception
- [ ] Secret scan: no service role / DocuSeal prod keys in git
- [ ] Manual authZ: cross-account portal ↔ dashboard access denied
- [ ] OWASP spot check: XSS in messages, IDOR on referral IDs, open redirects on auth
- [ ] **Within 90 days of clinical go-live:** schedule third-party penetration test (scope: `app.*`, Supabase API, auth, `/r`)

---

## 7. Post-go-live operations (clinical app)

### Continuous / weekly

- [ ] Dependabot + monthly dependency review
- [ ] Supabase Security Advisor review
- [ ] Framer publish review: no PHI routes or secrets re-added to www

### Monthly

- [ ] Access review: `staff_program_memberships` vs HR; offboard blocked users
- [ ] Vendor advisories: Supabase, Vercel, DocuSeal
- [ ] Audit spot check: sample `referral_activity_log`

### Quarterly

- [ ] HIPAA risk assessment update
- [ ] Incident response tabletop (e.g. wrong ROI link)
- [ ] PITR restore drill (documented)

### Annual

- [ ] External penetration test
- [ ] Workforce HIPAA training refresh
- [ ] BAA / subprocessors review
- [ ] Retention policy review (no ad-hoc audit deletes)

---

## 8. Security controls summary

| Control | Approach |
|---------|----------|
| **SCA** | GitHub Dependabot + `npm audit` on CI for app package |
| **SAST** | TypeScript strict + ESLint; optional CodeQL on GitHub |
| **WAF** | Vercel edge + Supabase RLS/network restrictions first; Cloudflare Enterprise + BAA later if required |
| **Pentest** | Manual pre-live authZ + OWASP spot check; external pentest within 90 days, then annual |
| **Threat intel** | Supabase/Vercel/GitHub advisories; Google Workspace alerts — formal SIEM later if needed |

---

## 9. Compliance posture (auditor narrative)

**Monarch** maintains policies, training, risk assessment, and access reviews.

**Framer (www):** Marketing only; no ePHI by architecture and [Framer HIPAA guidance](https://www.framer.com/help/articles/framer-hipaa-compliance/). No BAA required for PHI because PHI is not routed through Framer.

**Vercel (app):** Business associate for hosting the application that displays and submits ePHI to Supabase.

**Supabase:** Business associate; ePHI at rest; RLS + audit logging (`referral_activity_log`, 10-year retention).

**Evidence pack:** Executed BAAs, risk assessment, policies, architecture (this doc), pentest reports, training attestations, migration/change log.

---

## 10. Go-live sign-off sheets

### A. Marketing go-live (Framer → `www.monarchcompetency.com`)

*Can be signed independently of Vercel. No PHI workflows on this domain.*

| # | Gate | Pass | Owner | Date |
|---|------|:----:|-------|------|
| M1 | All published pages reviewed — **no** `/portal`, `/dashboard`, `/submit-referrals`, `/admin`, `/login`, `/r`, document upload | ☐ | | |
| M2 | No Supabase anon key, service role, or DocuSeal secrets in Framer project | ☐ | | |
| M3 | Nav/footer “Login” / “Submit referral” → placeholder or external staging URL — **not** production PHI forms on www | ☐ | | |
| M4 | Contact / inquiry forms do not collect full clinical referral packet (counsel sign-off if any health fields) | ☐ | | |
| M5 | Privacy policy + terms linked (or “draft” notice if counsel allows soft launch) | ☐ | | |
| M6 | DNS/TLS: `www` + apex redirect tested; Wix cutover plan documented | ☐ | | |
| M7 | Framer editors list + publish access documented (`PLATFORM_CONTINUITY.md`) | ☐ | | |

**Marketing launch approved:**

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Site / marketing owner | | | |
| Technical reviewer | | | |
| Privacy / compliance (optional for marketing-only) | | | |

---

### B. Clinical app go-live (`app.monarchcompetency.com`)

*Requires Vercel HIPAA BAA + § 6 complete.*

| # | Gate | Pass | Owner | Date |
|---|------|:----:|-------|------|
| C1 | Vercel Pro + HIPAA BAA enabled on production team | ☐ | | |
| C2 | BAAs executed: Supabase, Google, Vercel, DocuSeal (+ email vendor if applicable) | ☐ | | |
| C3 | § 6A Legal & administrative — all checked | ☐ | | |
| C4 | § 6B Technical security — all checked | ☐ | | |
| C5 | § 6C Functional E2E — all checked | ☐ | | |
| C6 | § 6D Security testing minimum — all checked | ☐ | | |
| C7 | Framer www CTAs updated to `https://app.monarchcompetency.com/...` | ☐ | | |
| C8 | Supabase auth redirect allowlist includes all `app.*` routes | ☐ | | |
| C9 | DocuSeal production webhook + template verified | ☐ | | |
| C10 | Admissions staff onboarding + SOP distributed (`ADMISSIONS_STAFF_ONBOARDING_AND_SOP.md`) | ☐ | | |
| C11 | Pilot plan: controlled first referrals (internal/test sources) before broad announcement | ☐ | | |

**Clinical app launch approved:**

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Platform owner / super admin | | | |
| Admissions lead | | | |
| Privacy officer / compliance | | | |

---

## 11. Suggested timeline (parallel tracks)

| When | Track A (Marketing) | Track B (Clinical app) |
|------|---------------------|-------------------------|
| **Now** | Finish Framer pages; remove PHI URLs; § 10A sign-off → www go-live | Phase 1 prepare; port app to Vite on Vercel staging |
| **+2–4 wks** | Live www; CTAs “coming soon” or mailto for referrals | Staging app + RLS + § 6 on staging |
| **+4–8 wks** | Content iterations on Framer only | Vercel BAA + `app.*` DNS + § 10B sign-off |
| **Post-live** | Optional: Strategy C native marketing rebuild | Annual pentest; quarterly drills |

---

## 12. Changelog

| Date | Change |
|------|--------|
| 2026-06-10 | Initial strategy: split Framer marketing + Vercel app; dual sign-off sheets; marketing-first priority |
