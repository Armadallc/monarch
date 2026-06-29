# Auth and pages setup (before referral source dashboard)

Answers to: new pages, single login in nav, and whether to use Framer Memberspace or our own auth.

---

## 1. Are we using Framer auth / Memberspace or our own?

**We are using our own auth and bypassing Framer’s options.**

- **Auth:** Supabase Auth (Google OAuth + magic link). No Framer Memberships, no Framer auth, no Memberspace.
- **Site `<head>`:** You do **not** need to add any code to the site’s `<head>` for a “memberspace” or Framer auth. Our code components (AuthGateway, ReferralDashboard, ReferralSourcePortal) handle sign-in via Supabase only.

So: no new head tags, no Framer membership setup. Keep everything as-is on the Framer side; all auth lives in Supabase and in our code.

---

## 2. Single login link in the NAV BAR

**Yes — use a single “Sign in” (or “Login”) link in the nav.** Both dashboards are reached through the same Google Auth:

- **Referral partners** → nav **LOGIN** → **`/login`** (source bucket) → **`/portal`**.
- **Staff (@monarchcompetency.com)** → **`/admin`** only (not in nav) → **`/dashboard`**.

**What to do:**

1. ~~**Add a page** in Framer for sign-in~~ **Done:** **`/login`** page created.
2. **On `/login`:** put the shared sign-in UI (AuthGateway) — **Done:** AuthGateway is on `/login`. (Was: e.g. AuthGateway code component, or a small “Sign in with Google” component that uses the same Supabase `signInWithOAuth` and a **single** `redirectTo` URL).
3. **Set `redirectTo`** to the login page (e.g. `https://monarchy.framer.website/login`), so after Google redirects back, the user lands on `/login`.
4. **On `/login` after auth:** read the session; if the user’s email is `@monarchcompetency.com` → redirect to `/dashboard`; otherwise → redirect to `/portal`.
5. ~~**In the NAV BAR:** add one link “Sign in” (or “Login”) → `/login`~~ **Done:** nav link created and linked to `/login`.

So: one URL, one nav link, one auth flow; only the post-login redirect differs by domain.

---

## 3. New pages to add before starting the referral source dashboard

**Add these in Framer:**

| Page      | Path       | Purpose | Status |
|-----------|------------|--------|--------|
| **Login** | `/login`   | Referral partner sign-in (AuthGateway, source bucket). | **Created** |
| **Admin sign-in** | `/admin` | Staff sign-in (AuthGateway, staff bucket); not in public nav. | **Created** |
| **Portal**| `/portal`  | Referral Source Dashboard (My Referrals, referral detail, later: profile). Add ReferralSourcePortal code component here. | **Created** |

**Next steps:**

1. ~~Add the “Sign in” link in the NAV BAR → `/login`.~~ **Done.**
2. ~~On `/login`, add the shared sign-in component and wire redirect-by-domain (staff → `/dashboard`, others → `/portal`).~~ **Done:** AuthGateway on `/login` with redirect-by-domain in code.
3. ~~Build the ReferralSourcePortal component~~ **Done** (`Code/Framer/ReferralSourcePortal.tsx`). **Next:** Add the ReferralSourcePortal code component to the **Portal** page in Framer.

No other new pages are required to start the referral source dashboard. We’ll use `/portal` for the referral source dashboard and keep `/dashboard` for the admin dashboard.

---

## 4. Nav bar and referrals flow (public vs professional)

**Nav bar:**

- **LOGIN** → `/login` (referral partners only). Staff use **`/admin`** (bookmark; not in nav). No “Dashboard” link in the nav.
- **REFERRALS** → `/referrals`. This is the public referrals entry: public inquiry form and a CTA to sign in for professional referrals.
- **No link to `/submit-referrals`** in the nav. Professional users reach the referral form by: Login → Portal → “Submit new referral” → `/submit-referrals`. Unauthenticated users who hit `/submit-referrals` directly are redirected to `/login`.

**Pages:**

- **`/referrals`** — Public inquiry form (e.g. PublicInquiryForm) plus “Sign in for professional referrals” linking to `/login`.
- **`/submit-referrals`** — ReferralForm (professional referral). No login form on this page; unauthenticated visitors are redirected to `/login`.

**Framer setup:** ~~Remove the DASHBOARD button and set the REFERRALS link to `/referrals`; ensure `/referrals` has the public inquiry form and “Sign in for professional referrals” → `/login`.~~ **Done.** Public inquiry, referral form, and referral dashboard components are updated in Framer.

---

## 5. Summary

- **No Memberspace, no Framer auth, no `<head>` changes.** Auth = Supabase only.
- **One “Sign in” in the NAV BAR** → `/login` page with shared Google sign-in and redirect-by-domain.
- **New pages:** `/login`, `/portal`, and `/referrals` are set up. Nav: LOGIN → `/login`, REFERRALS → `/referrals`, no Dashboard link. `/referrals` has public inquiry form and professional sign-in CTA. Public inquiry, referral form, and referral dashboard files are updated in Framer.
