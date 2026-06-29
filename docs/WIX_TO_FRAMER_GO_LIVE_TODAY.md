# Wix → Framer go-live — step-by-step (Competency, today)

**Goal:** `https://www.monarchcompetency.com` serves the Framer marketing site.  
**Not today:** portal, dashboard, referral forms, `/login`, `/admin`, `/r` — those go on Vercel later (`docs/VERCEL_PHI_APP_SETUP.md`).

**Staging:** `https://monarchy.framer.website`  
**DNS today:** Update records in **Wix** (nameservers stay on Wix). **Do not change MX** — Google mail unchanged.  
**Related:** `docs/MARKETING_GO_LIVE_MONDAY.md`, `docs/PRODUCTION_STRATEGY_FRAMER_VERCEL.md` § 10A, `docs/DNS_EMAIL_AUDIT_CHECKLIST.md`

---

## Before you start (5 min)

- [ ] Framer project published to staging — spot-check `monarchy.framer.website`
- [ ] Wix + GoDaddy + Framer logins open
- [ ] Phone on cellular for post-cutover smoke test (not office Wi‑Fi)
- [ ] Bookmark current Wix site URL if you need to compare copy

---

## Phase 1 — Framer content audit (30–45 min)

Do this **before** DNS. No code deploy required for most items — Framer editor only.

### 1.1 Pages to publish

| Page | Slug | Ship? |
|------|------|:-----:|
| Home | `/` | ✓ |
| About | `/about` | ✓ |
| Program | `/program` | ✓ |
| Resources | `/resources` | ✓ |
| Contact | `/contact` | ✓ |
| Referrals (marketing copy only) | `/referrals` | ✓ |
| Privacy, accessibility, e-signature, legal | per site | ✓ |

### 1.2 Pages to draft (unpublish)

These were never public — **Draft + Publish** is enough (no redirect needed).

| Page / route | Action |
|--------------|--------|
| `/portal` | **Draft** |
| `/dashboard` | **Draft** |
| `/login` | **Draft** |
| `/admin` | **Draft** |
| `/submit-referrals` | **Draft** |
| `/submit-referrals/documents` | **Draft** |
| `/r` (ROI) | **Draft** |

### 1.3 Remove clinical components from live pages

On every **published** page, confirm **none** of these are embedded:

- `PublicInquiryForm`
- `ReferralForm`, `ReferralSourcePortal`, `ReferralDashboard`
- `AuthGateway`, `DocumentUploadForm`

### 1.4 CTAs and footer

- [ ] **LOGIN / Portal** → “Coming soon” or link to `/referrals` with “Call admissions” — **not** `/login`
- [ ] **Submit referral / self-referral** → coming soon + **(877) 835-1545** + **hello@monarchcompetency.com**
- [ ] **Nav:** Home, About, Program, Resources, Contact (Referrals in footer OK as content link)
- [ ] Remove placeholder copy (`[hello]`, lorem, debug webhook text on contact)

### 1.5 Contact page (Resend blocked on Wix DNS)

Pick **Option A** for today:

- [ ] Remove or hide `MonarchContactCardForm` webhook form
- [ ] Show **click-to-call** `(877) 835-1545` (EXT 0)
- [ ] Show **mailto:** `hello@monarchcompetency.com`
- [ ] Admissions block unchanged

Do **not** ship a broken submit button.

### 1.6 Resources PDFs

- [ ] PDFs uploaded to Supabase `assets` (or Framer assets) if using `ResourcePDFList`
- [ ] Download links work on staging

### 1.7 Final Framer publish (pre-DNS)

- [ ] **Publish** in Framer
- [ ] Re-walk every nav/footer link on staging
- [ ] Mobile + desktop pass

---

## Phase 2 — Connect custom domain in Framer (10 min)

1. Framer → **Site settings** → **Domains**
2. **Add domain:** `www.monarchcompetency.com`
3. Framer shows DNS records (typically **CNAME** for `www` — copy exactly)
4. Note apex (`@`) instructions — usually redirect to `www` or Framer A record
5. **Do not** change DNS yet — copy records to a note for Phase 3
6. Remove Framer badge if your plan allows

---

## Phase 3 — DNS cutover in Wix (15 min + propagation)

**Registrar:** GoDaddy · **DNS host:** Wix nameservers · **Mail:** Google MX — **leave MX alone**

1. Log in **Wix** → Domains → `monarchcompetency.com` → **DNS / Manage DNS**
2. Find existing **`www`** record (likely pointing to Wix)
3. **Edit `www`** → set to Framer’s CNAME target (from Phase 2)
4. **Apex `@`:**
   - Framer redirect to `www`, **or**
   - Framer A record per their docs
5. **Do not edit** MX, SPF, DKIM, or Google verification records
6. Save
7. Optional: lower TTL beforehand next time; not required for first cutover

### Records cheat sheet

| Record | Today |
|--------|--------|
| MX → Google | **No change** |
| `www` → Framer | **Change** |
| `@` → `www` or Framer | **Change** |
| Resend `send.` subdomain | **Defer** |

---

## Phase 4 — Verify propagation (15–60 min)

Run checks until stable:

```bash
dig www.monarchcompetency.com CNAME +short
dig monarchcompetency.com A +short
```

Browser checks:

- [ ] `https://www.monarchcompetency.com` → Framer site (not Wix)
- [ ] `https://monarchcompetency.com` → redirects to `www` (or loads Framer)
- [ ] `https://monarchy.framer.website` still works (fallback)
- [ ] HTTPS padlock valid
- [ ] Send test email **to** `@monarchcompetency.com` — confirm receipt (MX unchanged)
- [ ] Smoke test from **phone on cellular**

---

## Phase 5 — Post-launch QA (30 min)

| # | Check |
|---|--------|
| 1 | Every nav/footer link — no `/login`, `/portal`, `/dashboard`, `/submit-referrals` |
| 2 | `/referrals` has no embedded inquiry/referral forms |
| 3 | View source / Network: **no** Supabase keys on marketing pages (gate M2) |
| 4 | Legal pages load |
| 5 | Contact: phone + mailto work |
| 6 | Compare critical copy vs old Wix (programs, contact info, admissions phone) |
| 7 | Resources PDFs download |

Sign-off gates: `docs/PRODUCTION_STRATEGY_FRAMER_VERCEL.md` § 10A (M1–M7)

---

## Phase 6 — Communicate & document

- [ ] Note launch time + who changed DNS in `PLATFORM_CONTINUITY.md` or internal log
- [ ] Tell team: portal/referrals online forms **coming soon** on `app.monarchcompetency.com`
- [ ] Intake path today: phone + email + PDF forms on Resources page

---

## Rollback (if something goes wrong)

1. Wix DNS → point `www` back to Wix hosting target
2. Wait for propagation (15–60 min)
3. Framer staging `monarchy.framer.website` remains available
4. MX untouched — email should not be affected

---

## After today

| When | Action |
|------|--------|
| Vercel app live | Update CTAs to `https://app.monarchcompetency.com/login`, `/portal`, etc. |
| DNS moved off Wix | Fix Resend + contact form webhook (`docs/DNS_EMAIL_AUDIT_CHECKLIST.md`) |
| Optional | Merge `sync/jun-2026` → `main` on GitHub |

**Next doc:** `docs/VERCEL_PHI_APP_SETUP.md`
