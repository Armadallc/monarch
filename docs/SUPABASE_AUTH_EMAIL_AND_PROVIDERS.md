# Supabase auth — magic link delivery, custom email, Apple

Use this when magic links are slow or missing, and when enabling **Apple** in addition to **Google** and **email link**.

**SMS:** `/login` **AuthGateway** does **not** use SMS sign-in. Vonage (or another provider) can still be used later for **operational** texts (referral updates, third-party pings, staff alerts) via Edge Functions or your own API—not as a Supabase Auth login path unless you re-enable it.

---

## 1. Magic link slow or never arrives (fix first)

Most of this is **Supabase Dashboard** → **Authentication** (not Framer code).

### Checklist

1. **Auth logs** — Dashboard → Authentication → **Logs** (or project Logs). Look for failed sends, rate limits, or SMTP errors when you click “Send login link.”
2. **Spam / Promotions** — Default Supabase mail often lands in **Spam** or Gmail **Promotions**. Have testers check all tabs.
3. **Rate limits** — Repeated sends to the same address can be throttled. Wait a few minutes between tests.
4. **Redirect URL allowlist** — Authentication → **URL Configuration** → **Redirect URLs** must include every URL your app uses as `emailRedirectTo` / OAuth `redirectTo`. For Monarch’s split staff vs portal sessions, add **all** of:
   - `https://monarchy.framer.website/login?bucket=source` (referral partners — public **LOGIN** nav)
   - `https://monarchy.framer.website/admin?bucket=staff` (admissions staff — bookmark only, not in nav)
   - `https://monarchy.framer.website/admin` (if staff land without query string but `/admin` path sets staff bucket)
   - `https://monarchy.framer.website/dashboard` (if the admissions dashboard uses magic link with `emailRedirectTo` there)
   A mismatch can break the link after click or leave you on the login screen with no session.
5. **Custom SMTP (recommended for production)** — Authentication → **SMTP Settings**. Use a transactional provider (SendGrid, Postmark, Amazon SES, Resend, etc.) with **SPF, DKIM, and DMARC** for your domain so mail is **from Monarch** (e.g. `auth@yourdomain.com`) instead of Supabase’s shared infrastructure. This usually fixes **delays** and **trust** issues.
6. **Email template** — Authentication → **Email Templates** → **Magic Link**. Confirm the link uses `{{ .ConfirmationURL }}` and that the template is not disabled.

Code sends `emailRedirectTo` / `redirectTo` from `loginPageRedirectUrlFor()` in AuthGateway — **source** → `…/login?bucket=source`, **staff** → `…/admin?bucket=staff` (see `Code/config/monarchProgramCompetency.ts`). If the API returns **success** but mail is late, the problem is **almost always** mail delivery (SMTP, reputation, spam).

---

## 2. Apple Sign in with Apple

### Supabase

- Dashboard → **Authentication** → **Providers** → enable **Apple**.
- Fill **Services ID**, **Secret Key** (JWT from Apple), **Team ID**, **Key ID** per [Supabase Apple docs](https://supabase.com/docs/guides/auth/social-login/auth-apple).

### Apple Developer

- Create a **Services ID** for Sign in with Apple, link it to your app/website domain, configure **Return URLs** to include Supabase’s callback URL (shown in the Supabase Apple provider UI).

- Create an Apple ID with a role mailbox you control long-term (e.g. developer@… or apple-dev@…), not someone’s personal iCloud.
- Enroll in the Apple Developer Program with that account or (often better for a company) enroll as an Organization under Monarch’s legal entity and add that mailbox as an Admin / Account Holder as your policy allows. That way billing, renewals, and legal name on the certificate side match the org.
- Store recovery info, 2FA, and who can access that Apple ID in your internal runbook so you’re not locked out if one person leaves.

### App code

- `AuthGateway` calls `signInWithOAuth` with `redirectTo` set by `loginPageRedirectUrl()` (includes `?bucket=staff` or `?bucket=source`) after Apple is enabled.
- **Note:** Apple may hide the user’s email (`@privaterelay.appleid.com`). Referral rows keyed on **real work email** may not match; referral sources who use Apple should still be able to use the portal if `submitted_by_user_id` matches, but train staff on relay addresses if needed.

---

## 3. SMS (Vonage) — not used for `/login`

- **AuthGateway** login methods: **Google**, **Apple** (when configured), **email magic link** only.
- You may still configure **Vonage** (or Twilio, etc.) in Supabase for **future** features, or use **Vonage’s API outside Auth** (e.g. Edge Function) for **referral workflow SMS** to referring sources, collateral contacts, or staff—subject to consent, rate limits, and compliance.
- If **Phone** auth is enabled in Supabase but unused in the UI, it has no effect on the login page until something calls `signInWithOtp({ phone })`.

---

## 4. Google 403 in Framer Preview

If the console shows **`GET accounts.google.com/AccountChooser … 403 (Forbidden)`** while testing **`/login` inside Framer’s canvas preview** (`framer.com/projects/…&view=preview`), that is expected: Google blocks OAuth inside embedded iframes.

**What to do:**

1. Test on the **published** site: `https://monarchy.framer.website/login?bucket=source` (not editor preview).
2. In preview, use **Continue with Email** (magic link), or open the published login URL in a new tab.
3. **AuthGateway** uses `skipBrowserRedirect` and navigates `window.top` so OAuth can work when Framer allows a top-level redirect; the warning banner appears when the page detects preview/iframe context.

Other console lines (`ambient-light-sensor`, `allowfullscreen`) come from Framer’s preview iframe and are harmless.

---

## 5. Framer sync

After changing auth in the repo, paste **`Code/Framer/AuthGateway.tsx`** into Framer’s AuthGateway code component (or your sync process) so production `/login` matches.

---

## Revision

| Date | Notes |
|------|--------|
| 2026-05-10 | Initial: magic link checklist, Apple, staff email caveat. |
| 2026-05-10 | Redirect allowlist: `login?bucket=staff` and `login?bucket=source`; AuthGateway always appends `bucket` on OAuth/magic link return. |
| *(update)* | Removed SMS login from AuthGateway; Vonage reserved for non-auth / operational use. |
| 2026-05-20 | Staff sign-in URL → `/admin?bucket=staff`; public partners → `/login?bucket=source`. Same AuthGateway on both Framer pages. |
