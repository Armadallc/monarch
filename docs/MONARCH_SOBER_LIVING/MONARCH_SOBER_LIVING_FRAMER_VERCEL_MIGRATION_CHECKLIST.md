# Monarch Sober Living — Framer + Vercel migration checklist

**Canonical domain:** `monarchsoberlivinghomes.com`  
**Also:** `monarchsoberliving.com` (Dan parking — redirect TBD)  
**Pattern:** Same split as Competency / MH — **Framer `www`** (marketing) + later **program-scoped PHI** on shared Vercel app  
**Parent docs:** [`PRODUCTION_STRATEGY_FRAMER_VERCEL.md`](../PRODUCTION_STRATEGY_FRAMER_VERCEL.md), [`DNS_AND_EMAIL_REFERENCE.md`](../DNS_AND_EMAIL_REFERENCE.md), [`DNS_EMAIL_AUDIT_CHECKLIST.md`](../DNS_EMAIL_AUDIT_CHECKLIST.md)  
**MH twin:** [`../MONARCH_MENTAL_HEALTH/MONARCH_MENTAL_HEALTH_FRAMER_VERCEL_MIGRATION_CHECKLIST.md`](../MONARCH_MENTAL_HEALTH/MONARCH_MENTAL_HEALTH_FRAMER_VERCEL_MIGRATION_CHECKLIST.md)

---

## Decisions to lock first

| # | Decision | Choice | Date |
|---|----------|--------|------|
| D1 | Canonical public domain | ☑ `monarchsoberlivinghomes.com` ☐ other | 2026-10-26 |
| D2 | `monarchsoberliving.com` | ☐ redirect → homes ☐ leave parking ☐ other | |
| D3 | App host | ☐ shared Competency/MH `app.*` + `prog_sober_living` ☐ separate `app.monarchsoberlivinghomes.com` | |
| D4 | Mail | ☐ stay Google (MX already `smtp.google.com`) ☐ other | |
| D5 | Launch scope | ☐ marketing-only first ☐ + application / referral on app | |

---

## Track A — Marketing (Framer → `www.monarchsoberlivinghomes.com`)

*No PHI on this domain.*

### A1. Framer site

| # | Task | Done |
|---|------|:----:|
| A1.1 | Framer project exists (separate from Competency / MH) | ☐ |
| A1.2 | Pages from WordPress inventory (below) rebuilt | ☐ |
| A1.3 | **No** portal / dashboard / submit-referrals / login on published www | ☐ |
| A1.4 | **No** Supabase / DocuSeal secrets in Framer | ☐ |
| A1.5 | CTAs → phone `(877) 835-1545` + `info@monarchsoberlivinghomes.com` until app ready | ☐ |
| A1.6 | Mobile/tablet pass | ☐ |
| A1.7 | Custom domain connected in Framer | ☐ |
| A1.8 | Publish + smoke on Framer staging URL | ☐ |

### A2. DNS (Cloudflare today)

| # | Task | Done |
|---|------|:----:|
| A2.1 | Export/screenshot **all** Cloudflare DNS for `monarchsoberlivinghomes.com` | ☐ |
| A2.2 | `www` → Framer (`sites.framer.app` or Framer-provided target) | ☐ blocked until A1.7 |
| A2.3 | Apex `@` → redirect to `www` (today A → `107.180.50.177` GoDaddy WP) | ☐ |
| A2.4 | **MX → Google** unchanged | ☑ dig 2026-10-26: `smtp.google.com` |
| A2.5 | SPF cleanup — today includes Google **plus** PPE + secureserver; decide single policy | ☐ |
| A2.6 | DKIM `google._domainkey` | ☑ published |
| A2.7 | DMARC `_dmarc` | ☑ `p=none` |
| A2.8 | Confirm GoDaddy **hosting** cancel/plan after Framer cutover (site IP still GoDaddy) | ☐ |
| A2.9 | Fill [`DNS_EMAIL_AUDIT_CHECKLIST.md`](../DNS_EMAIL_AUDIT_CHECKLIST.md) for SL | ☐ |

### A3. Marketing sign-off

| # | Gate | Done |
|---|------|:----:|
| A3.1 | M1 — no PHI routes on SL www | ☐ |
| A3.2 | M2 — no secrets in Framer | ☐ |
| A3.3 | M5 — privacy / terms linked | ☐ |
| A3.4 | M6 — DNS + TLS verified | ☐ |
| A3.5 | M7 — editors documented | ☐ |

---

## Track B — Clinical / application (shared Vercel — later)

| # | Task | Done |
|---|------|:----:|
| B1 | Route plan vs Competency/MH app | ☐ |
| B2 | `prog_sober_living` activate + staff memberships when product-ready | ☐ program row exists, inactive |
| B3 | Application / referral UI (see `SOBER_LIVING_APPLICATION.md`, Behave reference) | ☐ |
| B4 | Auth allowlist / program scoping | ☐ |
| B5 | § 10B / BAA before real ePHI | ☐ |
| B6 | Framer CTAs → live app URLs | ☐ |

---

## Gather before Framer www cutover (inventory)

### Access & accounts

| Need | Have? | Notes |
|------|:-----:|-------|
| Monarch Cloudflare account (org-owned) | ☐ | **New account** — do not keep SL on a personal CF account long-term |
| Cloudflare login (SL zone currently on private account; NS `ernest`/`gwen`) | ☐ | Move zone → Monarch account later (export records, re-add zone, switch NS if CF assigns new ones) |
| GoDaddy — registrar + **WordPress hosting** product | ☐ | Apex still `107.180.50.177` |
| Framer project for SL | ☐ | |
| Google Admin (SL domain + `info@`) | ☐ | MX Google; SPF still hybrid |
| Dan.com for `monarchsoberliving.com` | ☐ | parking |
| WordPress admin (content export) | ☐ | |

### Live WordPress page probe (2026-10-26)

| Path | HTTP | Action |
|------|:----:|--------|
| `/` | 200 | Home — rebuild in Framer |
| `/about` | 200 | Capture copy + images |
| `/contact` | 200 | Phone + `info@` |
| `/blog` | 200 | Keep / archive / drop? |
| `/homes`, `/houses`, `/apply`, `/admissions`, `/resources` | 404 | Confirm real WP slugs in WP admin |

**Public copy signals from home:** 12-step based, family-oriented, Lakewood / Denver Metro, `(877) 835-1545`, `info@monarchsoberlivinghomes.com`.

### Content / assets to pull

| Asset | Status |
|-------|--------|
| Full WP page + menu export (or Wayback + screenshots) | ☐ |
| Logo (`MonarchSoberLivingHomes.png` on WP uploads) | ☐ into `docs/MONARCH_SOBER_LIVING/` or Framer |
| House photos / gallery | ☐ |
| Blog posts — migrate, link-out, or drop | ☐ |
| Legal pages | ☐ |
| Application form current path (Behave vs PDF vs phone) | ☐ see `SOBER_LIVING_APPLICATION.md` |

### DNS notes (dig 2026-10-26) — **docs were stale**

| Item | Was (July docs) | Now |
|------|-----------------|-----|
| NS | “GoDaddy” | **Cloudflare** `ernest` / `gwen` |
| MX | “GoDaddy/PPE” | **Google** `smtp.google.com` |
| Website | WordPress GoDaddy | Still WP on `107.180.50.177` |
| SPF | — | Google + `a:dispatch-us.ppe-hosted.com` + `include:secureserver.net` (cleanup candidate) |
| DKIM / DMARC | unknown | **Both present** |

---

## Competency / MH cross-reference

| Doc | Use for SL |
|-----|------------|
| [`WIX_TO_FRAMER_GO_LIVE_TODAY.md`](../WIX_TO_FRAMER_GO_LIVE_TODAY.md) | Cutover steps — swap “Wix DNS” → **Cloudflare DNS** for SL |
| [`MARKETING_GO_LIVE_MONDAY.md`](../MARKETING_GO_LIVE_MONDAY.md) | Framer-only launch |
| [`VERCEL_PHI_APP_SETUP.md`](../VERCEL_PHI_APP_SETUP.md) | Later app host |
| MH checklist | Parallel gather pattern |

---

## Suggested order

1. Lock D2–D5 + export Cloudflare DNS + WP content  
2. Build Framer SL marketing (Track A1)  
3. Point `www` (+ apex) to Framer; leave MX alone  
4. Cancel GoDaddy WP hosting when stable  
5. SPF cleanup (drop PPE/secureserver if mail is Google-only)  
6. Track B only when application product is ready  

---

## Changelog

| Date | Change |
|------|--------|
| 2026-10-26 | Initial checklist; dig refresh (Cloudflare NS, Google MX, WP still live) |

---

## Current state snapshot (2026-10-26)

| Item | Status |
|------|--------|
| Public site | **WordPress** at `https://www.monarchsoberlivinghomes.com` |
| DNS NS | Cloudflare |
| Apex / www | `107.180.50.177` (GoDaddy hosting) |
| Mail | Google MX; SPF still hybrid |
| DKIM / DMARC | Published |
| Framer | Not started (`Code/Framer/sober-living/` placeholder) |
| PHI / referrals | Not started (`prog_sober_living` inactive) |
