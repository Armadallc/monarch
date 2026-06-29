# Login, admin sign-in, and portal — placement checklist

Use this to confirm AuthGateway and ReferralSourcePortal are on the right pages and behave correctly.

---

## Sign-in URLs (canonical)

| Audience | Framer page | URL | Auth bucket | In public nav? |
|----------|-------------|-----|-------------|----------------|
| **Referral partners** | `/login` | `https://monarchy.framer.website/login` (defaults to `?bucket=source`) | `source` | Yes — **LOGIN** → `/login` |
| **Admissions staff** | `/admin` | `https://monarchy.framer.website/admin` (or `?bucket=staff`) | `staff` | **No** — bookmark / internal link only |

Same **AuthGateway** code component on **both** pages (`Code/Framer/AuthGateway.tsx`). Constants: `Code/config/monarchProgramCompetency.ts` (`referralPartnerLoginPath`, `staffLoginPath`).

**Supabase redirect allowlist** must include:

- `https://monarchy.framer.website/login?bucket=source`
- `https://monarchy.framer.website/admin?bucket=staff` (and/or `/admin` if the page forces staff bucket)

See `docs/SUPABASE_AUTH_EMAIL_AND_PROVIDERS.md`.

---

## `/login` page (referral partners)

### In Framer

- [ ] Page slug **`/login`**
- [ ] **AuthGateway** in main content (not ReferralSourcePortal)
- [ ] Nav **LOGIN** links here only (not `/admin`)

### When not signed in

- [ ] Google / Apple / email magic link options
- [ ] PHI / secure referral copy
- [ ] **No** “Use referral partner sign-in” line (that appears only on **staff** `/admin`)

### After sign-in

- [ ] `@monarchcompetency.com` on source login → promoted to staff session → **/dashboard**
- [ ] All other emails → **/portal**

---

## `/admin` page (staff)

### In Framer

- [ ] Page slug **`/admin`**
- [ ] **AuthGateway** (same component as `/login`)
- [ ] **Not** linked from public nav or sitemap
- [ ] Staff bookmark: `/admin` or `/admin?bucket=staff`

### When not signed in

- [ ] “Referring a client…? **Use referral partner sign-in**” → `/login?bucket=source`
- [ ] Sign-in buttons (staff bucket / `-auth-staff` storage)

### After sign-in

- [ ] `@monarchcompetency.com` → **/dashboard** (plus future provisioned-staff allowlist at go-live)
- [ ] Non-staff on staff bucket → blocked; link to partner sign-in

---

## `/portal` page

**Component:** **ReferralSourcePortal** (`Code/Framer/ReferralSourcePortal.tsx`) only.

- [ ] Unsigned → “Sign in” → `/login?bucket=source` (portal sets bucket hint)
- [ ] Signed in → My Referrals, submit referral, etc.

---

## `/dashboard` page

**Component:** **ReferralDashboard** (`Code/Framer/ReferralDashboard.tsx`).

- [ ] Unsigned → redirect to **`/admin?bucket=staff`** (`ACTIVE_MONARCH_PROGRAM.staffLoginPath`)

---

## Quick reference

| Page | Path | Component | Source file |
|------|------|-----------|-------------|
| Partner login | `/login` | AuthGateway | `Code/Framer/AuthGateway.tsx` |
| Staff login | `/admin` | AuthGateway | `Code/Framer/AuthGateway.tsx` |
| Portal | `/portal` | ReferralSourcePortal | `Code/Framer/ReferralSourcePortal.tsx` |
| Dashboard | `/dashboard` | ReferralDashboard | `Code/Framer/ReferralDashboard.tsx` |
| Repo (import path) | — | AuthGateway | `Code/OAuth/AuthGateway.tsx` |

After changing auth URLs in the repo, paste **`Code/Framer/AuthGateway.tsx`** into Framer on **both** `/login` and `/admin`.
