# Marketing go-live — Monday (Framer only)

**Target:** `https://www.monarchcompetency.com` on Framer  
**Out of scope until Vercel:** referral portal, public inquiry form, secure referral form, staff dashboard, `/login`, `/admin`, `/r`  
**DNS / Resend:** Not required for Monday if contact page uses phone + `mailto:` (see §4)

**Staging:** `https://monarchy.framer.website`  
**Sign-off sheet:** `docs/PRODUCTION_STRATEGY_FRAMER_VERCEL.md` § 10A (M1–M7)

---

## In scope Monday

| Page / area | Ship? |
|-------------|:-----:|
| Home `/` | ✓ |
| About `/about` | ✓ |
| Program `/program` | ✓ |
| Resources `/resources` | ✓ |
| Contact `/contact` | ✓ (no working webhook required — see §4) |
| Referrals **marketing** `/referrals` (copy only, no forms) | ✓ |
| Privacy, e-signature, accessibility | ✓ |
| Legal / footer nav | ✓ |

## Out of scope Monday (do not expose on www)

| Route / component | Action |
|-------------------|--------|
| `/portal` | Unpublish page **or** noindex + redirect to `/referrals` |
| `/dashboard` | Unpublish **or** redirect |
| `/login` | Unpublish **or** redirect to “coming soon” |
| `/admin` | Unpublish **or** redirect (never in nav) |
| `/submit-referrals` | Unpublish **or** redirect |
| `/submit-referrals/documents` | Unpublish **or** redirect |
| `/r` (ROI) | Unpublish **or** redirect |
| `PublicInquiryForm` on any page | **Remove** or hide section |
| `ReferralForm`, `ReferralSourcePortal`, `ReferralDashboard`, `AuthGateway`, `DocumentUploadForm` on published pages | **None** on any live page |

---

## Friday–Sunday task list

### 1. Framer content & links (editor — no code deploy)

- [ ] **Footer** — `[Portal] Login` and `[Self Refer] Public Inquiry Form`: change to **Coming soon** (no link) or link to `/referrals#contact` with copy “Portal opens soon — call admissions.”
- [ ] **Home** — “Sign in for professional referrals”, inquiry buttons: same treatment (no `/login`, no inquiry form).
- [ ] **`/referrals`** — Keep educational content; remove/hide **PublicInquiryForm** at bottom; “Login” / “Submit referral” CTAs → coming soon + phone/email.
- [ ] **Nav** — Home, About, Program, Resources, Contact only (Admissions/Referrals in footer OK as **content** links to `/referrals` or `/program`).
- [ ] **Placeholder copy** on `/contact` — Remove visible webhook URL debug text if still on page.
- [ ] **Draft placeholders** — `[hello]` headers, lorem contact intro: replace or hide.
- [ ] **Privacy / legal** — Links work; pages published.

### 2. Framer site settings

- [ ] **Custom domain:** Framer → Site settings → Domains → add `www.monarchcompetency.com` (and apex if Framer supports redirect).
- [ ] Note Framer’s required DNS records (CNAME / A) for step 3.
- [ ] **Publish** staging site after link audit.
- [ ] Remove **Framer badge** if plan allows.

### 3. DNS cutover (GoDaddy registrar + Wix DNS — no Cloudflare required for Monday)

Current: nameservers → Wix; live site → Wix.

- [ ] In **Wix** → Domains → DNS for `monarchcompetency.com`:
  - Point **`www`** to Framer (per Framer domain instructions).
  - **`@` apex** → Framer redirect or `www` (Framer docs).
- [ ] Lower TTL a day early if possible (optional).
- [ ] **Do not change MX records** — Google mail stays as-is.
- [ ] After propagation: `https://www.monarchcompetency.com` loads Framer; apex redirects to `www`.
- [ ] Old Wix site no longer served on production domain (bookmark staging if needed).

**Alternative:** Point nameservers to Cloudflare later; for Monday, updating records **in Wix DNS** is enough to swap the website.

### 4. Contact page (no Resend Monday)

Resend is blocked until DNS leaves Wix. Pick one:

| Option | Monday UX |
|--------|-----------|
| **A (recommended)** | Remove/hide `MonarchContactCardForm`; show **phone**, **info@** / **hello@** as `mailto:` links, admissions block unchanged. |
| **B** | Keep form UI but disabled + “Call (877) 835-1545 or email hello@monarchcompetency.com” |
| **C** | Wait for DNS/Resend — **not recommended** for Monday (broken submit) |

### 5. Pre-launch QA (30 min)

- [ ] Every footer/nav link on mobile + desktop (no `/login`, `/portal`, `/dashboard`, `/submit-referrals`).
- [ ] `/referrals` has **no** embedded inquiry or referral form components.
- [ ] View page source / Network: **no** Supabase keys on marketing pages (M2).
- [ ] Legal pages load.
- [ ] Contact: phone click-to-call, mailto works.
- [ ] Compare key pages to current Wix if anything business-critical is missing.

### 6. Launch day

- [ ] Final Framer **Publish**.
- [ ] DNS change (if not done night before).
- [ ] Smoke test from phone (cellular, not office Wi‑Fi).
- [ ] Spot-check email still works (send test to `@monarchcompetency.com`) — MX unchanged.

---

## After Monday (Vercel track)

When `app.monarchcompetency.com` is ready:

1. Point footer/login/referral CTAs to `https://app.monarchcompetency.com/login`, `/portal`, etc.
2. Re-enable public inquiry on app host (not www), per `PRODUCTION_STRATEGY_FRAMER_VERCEL.md` Track B.
3. Optional: fix DNS + Resend for www contact form.

---

## Quick reference — what stays on Wix DNS for now

| Record | Monday action |
|--------|-----------------|
| MX → Google | **Leave alone** |
| `www` → Framer | **Change** |
| `@` → `www` or Framer | **Change** |
| Resend / `send.` subdomain | **Defer** |

---

## Owners

| Task | Owner | Done |
|------|-------|:----:|
| Framer links + forms off | | ☐ |
| Framer custom domain + publish | | ☐ |
| Wix DNS `www` → Framer | | ☐ |
| QA sign-off (M1–M5) | | ☐ |
| Launch smoke test | | ☐ |
