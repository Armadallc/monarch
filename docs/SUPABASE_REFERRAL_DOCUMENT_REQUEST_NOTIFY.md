# Document request notification (Phase 2.9)

**Status (2026-05): deferred** — Code and edge function are ready. Sending is off in Framer (`REFERRAL_DOCUMENT_REQUEST_EMAIL_ENABLED = false`) until `monarchcompetency.com` is verified in Resend. Wix-managed DNS cannot add the required records; migrate DNS (e.g. Cloudflare) or move domain off Wix, then verify at [resend.com/domains](https://resend.com/domains) and flip the flag to `true`.

Edge function: `supabase/functions/monarch-referral-document-request-notify/index.ts`

Invoked by **ReferralDashboard** after `create_referral_document_request()` succeeds. Sends a **PHI-free** Resend email to `referral_submissions.referral_source_email`.

## Email rules

- **Subject:** `Referral MON-XXXX needs your attention` (referral code only).
- **Body:** Portal link, optional due date, generic ROI note if flagged — **no** client name, demographics, staff message text, or document-type checklist (sources see details in the portal).

## Secrets

Set in Supabase project secrets (reuse contact-form Resend key):

| Secret | Required | Example |
|--------|----------|---------|
| `RESEND_API_KEY` | Yes | `re_xxx` |
| `REFERRAL_NOTIFY_FROM_EMAIL` | Yes* | `Monarch Referrals <referrals@monarchcompetency.com>` |
| `REFERRAL_PORTAL_BASE_URL` | No | `https://monarchy.framer.website` |
| `REFERRAL_NOTIFY_REPLY_TO` | No | `admissions@monarchcompetency.com` |
| `REFERRAL_NOTIFY_SUPPORT_EMAIL` | No | `referrals@monarchcompetency.com` |

\*If `REFERRAL_NOTIFY_FROM_EMAIL` is unset, falls back to `CONTACT_FROM_EMAIL`. Sender domain must be verified in Resend.

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are provided automatically to edge functions.

## Deploy

```bash
supabase secrets set \
  REFERRAL_NOTIFY_FROM_EMAIL="Monarch Referrals <referrals@monarchcompetency.com>" \
  REFERRAL_PORTAL_BASE_URL="https://monarchy.framer.website"

supabase functions deploy monarch-referral-document-request-notify --project-ref esbmnympligtknhtkary
```

**Gateway JWT is off** (`verify_jwt = false` in `supabase/config.toml`). The function does **not** rely on a staff JWT from the browser (Framer `invoke` often sends the anon key). Instead it verifies `referral_id` + `batch_id` against a batch created in the last 24 hours with a staff `created_by_user_id` (the batch is only creatable via staff RPC).

### Dashboard: “Verify JWT with legacy secret”

**Leave it OFF** for this function.

That toggle only matters when **Enforce JWT** is ON at the function gateway. This function uses **`verify_jwt = false`**; staff auth runs inside the handler via `access_token` / staff session JWT.

In the function’s Supabase Dashboard page, confirm:

- **Enforce JWT verification** (or equivalent) → **OFF**
- **Verify JWT with legacy secret** → **OFF** (irrelevant when enforcement is off)

If **Enforce JWT** keeps turning itself ON after deploy, redeploy from this repo (see `supabase/config.toml`) or set OFF manually after each deploy.

### Troubleshooting: portal shows request but no email

1. **Dashboard success line** after send — if it says email could not be sent, read the reason in parentheses.
2. **Edge Function logs** — filter HTTP for `monarch-referral-document-request-notify`:
   - **`401` before any app logs** — usually missing/invalid staff JWT on invoke; paste updated `ReferralDashboard.tsx` (explicit `Authorization` header) and redeploy the function after `config.toml` change.
   - **`502` + Resend details** — fix `RESEND_API_KEY` or verify `REFERRAL_NOTIFY_FROM_EMAIL` / `CONTACT_FROM_EMAIL` domain in Resend.
   - **`400` invalid source email** — referral row has no valid `referral_source_email`.
3. **Secrets** — confirm `RESEND_API_KEY` is set (same as contact form).
4. **Spam** — check junk for subject `Referral MON-… needs your attention`.
5. **Redeploy** after config change:
   ```bash
   supabase functions deploy monarch-referral-document-request-notify --project-ref esbmnympligtknhtkary
   ```

## Test

1. Admissions: send **Request documents** on a referral with a valid `referral_source_email`.
2. Confirm success copy includes “Notification email sent…”.
3. Source inbox: subject `Referral MON-… needs your attention`, link to `/portal`.
4. If send fails, dashboard still saves the request; message notes email failure — check Edge Function logs and Resend dashboard.
