# Supabase Edge Function webhook for MonarchContactCardForm

This project now includes a function at:

- `supabase/functions/monarch-contact-form/index.ts`

It accepts the JSON payload sent by `MonarchContactCardForm` and forwards it via Resend.

## 1) Prerequisites

- Supabase CLI installed and authenticated
- A Supabase project linked to this repo
- A Resend API key
- A verified sender in Resend

## 2) Required secrets

Set these in Supabase project secrets:

- `RESEND_API_KEY` = your Resend API key
- `CONTACT_FROM_EMAIL` = verified sender, e.g. `Monarch Contact <no-reply@yourdomain.com>`
- `CONTACT_DEFAULT_TO` = default destination, e.g. `hello@monarchcompetency.com`
- `CONTACT_ALLOWED_TO` = comma-separated allowlist (optional but recommended), e.g. `hello@monarchcompetency.com,admissions@monarchcompetency.com`

Commands:

```bash
supabase secrets set \
  RESEND_API_KEY="re_xxx" \
  CONTACT_FROM_EMAIL="Monarch Contact <no-reply@yourdomain.com>" \
  CONTACT_DEFAULT_TO="hello@monarchcompetency.com" \
  CONTACT_ALLOWED_TO="hello@monarchcompetency.com,admissions@monarchcompetency.com"
```

## 3) Deploy function

```bash
supabase functions deploy monarch-contact-form
```

## 4) Webhook URL for Framer

Use this URL in your component `Webhook URL` field:

```text
https://<YOUR_PROJECT_REF>.functions.supabase.co/monarch-contact-form
```

Example:

```text
https://abcd1234efgh.functions.supabase.co/monarch-contact-form
```

## 5) Test locally (optional)

```bash
supabase functions serve monarch-contact-form --env-file .env.local
```

Then post sample JSON to:

```text
http://127.0.0.1:54321/functions/v1/monarch-contact-form
```

## Notes

- `destinationEmail` from the form payload is supported.
- If `CONTACT_ALLOWED_TO` is set and the destination is not in the allowlist, the function falls back to `CONTACT_DEFAULT_TO`.
- Function includes CORS headers for browser form submissions.

## Troubleshooting

### `401 Unauthorized` from the function URL

Framer posts from the browser without a Supabase JWT. Deploy with JWT verification off:

```bash
supabase functions deploy monarch-contact-form --project-ref esbmnympligtknhtkary --no-verify-jwt
```

Or in Dashboard: Edge Functions → `monarch-contact-form` → disable “Require JWT” / enable public invoke (wording varies by Supabase version).

### `502 Bad Gateway` in the browser

The function returns **502** when **Resend** rejects the send (`!resendResponse.ok`). It is not a Framer bug.

1. In DevTools → **Network** → select the `monarch-contact-form` request → **Response**: read `details` (Resend’s error JSON/text).
2. In Supabase → **Edge Functions** → **Logs** for `monarch-contact-form`: look for `[monarch-contact-form] Resend error`.

**Typical Resend fixes:**

- `CONTACT_FROM_EMAIL` must use an address or domain **verified in Resend** (e.g. `Monarch <hello@yourverifieddomain.com>`).
- `RESEND_API_KEY` must be a live key with permission to send.
- `to` / `CONTACT_DEFAULT_TO` must be valid; allowlist in `CONTACT_ALLOWED_TO` must include the inbox you use in the form’s `destinationEmail` (or the function falls back to default).

### Quick curl test (see exact error body)

```bash
curl -sS -X POST \
  'https://esbmnympligtknhtkary.functions.supabase.co/monarch-contact-form' \
  -H 'Content-Type: application/json' \
  -d '{"fromName":"Test","fromEmail":"you@example.com","message":"Hello","destinationEmail":"hello@monarchcompetency.com","emailSubjectPrefix":"[Test] "}'
```
