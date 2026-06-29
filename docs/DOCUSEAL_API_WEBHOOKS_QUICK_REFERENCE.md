# DocuSeal — Monarch ROI quick reference

DocuSeal is the **system of record** for ROI form fields and signed PDFs. Supabase holds share links, envelope status, and the stored PDF path — not per-field ROI columns.

**Official docs:** [API](https://www.docuseal.com/docs/api) · [OpenAPI](https://console.docuseal.com/openapi.yml) · [Embed signing (JS)](https://www.docuseal.com/guides/embed-document-signing-into-web-app-with-javascript)

---

## Test vs production

| Environment | API key | Templates |
|-------------|---------|-----------|
| **Test / sandbox** | DocuSeal → Settings → API → Test key | Only templates visible in **Test Mode** |
| **Production** | Production API key | Production templates (e.g. ROI `3736303`) |

A test key against production template `3736303` returns *“Template not found… Use production API key”*. Either use a **production** key in Supabase, or duplicate the ROI template in Test Mode and set `DOCUSEAL_ROI_TEMPLATE_ID` to the **test** template id.

---

## Supabase secrets

Set via Dashboard → Edge Functions → Secrets, or:

```bash
supabase secrets set DOCUSEAL_API_KEY='...'
supabase secrets set DOCUSEAL_ROI_TEMPLATE_ID='3736303'
supabase secrets set DOCUSEAL_WEBHOOK_SECRET='...'
# optional:
supabase secrets set DOCUSEAL_EMBED_HOST='https://docuseal.com'
```

| Secret | Used by |
|--------|---------|
| `DOCUSEAL_API_KEY` | `monarch-roi-signing-session`, `monarch-docuseal-webhook` |
| `DOCUSEAL_ROI_TEMPLATE_ID` | Signing session (default `3736303`) |
| `DOCUSEAL_WEBHOOK_SECRET` | Webhook (optional; if set, requests must include matching header) |
| `DOCUSEAL_EMBED_HOST` | Signing session embed URL fallback |

See `.env.example` for local notes. **Do not commit real keys** to the repo.

---

## Monarch edge functions

| Function | JWT | Role |
|----------|-----|------|
| `monarch-roi-signing-session` | `verify_jwt = false` | Public `/r?token=` → DOB gate → create DocuSeal submission → return `embed_src` |
| `monarch-docuseal-webhook` | `verify_jwt = false` | `submission.completed` / `form.completed` → download PDF → storage → update link + ROI section |

**API base:** `https://api.docuseal.com`  
**Auth header:** `X-Auth-Token: <DOCUSEAL_API_KEY>`

---

## ROI template (Competency)

| Item | Value |
|------|--------|
| Production template ID | `3756335` (ROI v2.2; was `3736303`) |
| Signer role (API) | `Authorizing Party` (must match template role label exactly) |
| Other template roles | `Witness`, `Monarch Admissions` — not created by public ROI embed (v1) |

**Prefill field names** (from `monarch-roi-signing-session`):

| Key | Source |
|-----|--------|
| `legal_first_name` | `client_first_name` |
| `legal_middle_name` | `client_middle_name` |
| `legal_last_name` | `client_last_name` |
| `date_of_birth` | `client_dob` (`YYYY-MM-DD`) |
| `last_four_ssn` | last 4 of `client_ssn` |
| `internal_use_referral_reference_code` | `referral_code` |
| `roi_received_by` | `admissions_staff_profiles.display_name` for `referral_share_links.created_by_user_id` (empty if no profile row) |
| `roi_received_date` | **DocuSeal only:** enable **Set signing date** on the date field — filled at actual sign time; **do not** prefill via API |

---

## Create submission (API)

```http
POST https://api.docuseal.com/submissions
X-Auth-Token: <DOCUSEAL_API_KEY>
Content-Type: application/json
```

```json
{
  "template_id": 3756335,
  "send_email": false,
  "order": "preserved",
  "submitters": [{
    "role": "Authorizing Party",
    "email": "signer@example.com",
    "name": "Client Name",
    "external_id": "<referral_share_link.uuid>",
    "send_email": false,
    "values": { "legal_first_name": "Jane", "date_of_birth": "2000-01-01", "roi_received_by": "Pat Staff" }
  }]
}
```

### Response shape (important)

**`POST /submissions` returns a JSON array of submitter objects**, not `{ id, submitters }`.

Each item includes at least:

- `submission_id` — submission id (use this, not a top-level `id`)
- `slug` — for embed URL `/s/{slug}`
- `embed_src` — full signing URL (prefer this when present)
- `role`, `status` (e.g. `awaiting`)

Our signing session parses the array first; treating the body as an object caused *“missing submitter slug or id”* while DocuSeal had already created the submission.

---

## Embed URLs

| Pattern | Use |
|---------|-----|
| `https://docuseal.com/d/{template_slug}` | Template signing link (dashboard copy) |
| `https://docuseal.com/s/{submitter_slug}` | **Per-signer link** from `POST /submissions` |
| `embed_src` from API | Preferred; use as `data-src` on `<docuseal-form>` |

Monarch public flow: `ReferralSharePage` loads `embed_src` from `monarch-roi-signing-session` (no API key in Framer).

```html
<script src="https://cdn.docuseal.com/js/form.js"></script>
<docuseal-form data-src="https://docuseal.com/s/{submitter_slug}"></docuseal-form>
```

```javascript
document.querySelector('docuseal-form').addEventListener('completed', (e) => {
  console.log(e.detail) // UI success; webhook is source of truth for PDF + DB
})
```

---

## Webhook (DocuSeal → Supabase)

**URL (production project):**

```text
https://esbmnympligtknhtkary.supabase.co/functions/v1/monarch-docuseal-webhook
```

### DocuSeal UI: one webhook, production ↔ testing toggle

Monarch uses **one** webhook in DocuSeal. The console shows two sides (**Production** / **Testing**) for the same endpoint, but only **one mode is active at a time** — flip the toggle when you change environments.

| Monarch phase | DocuSeal webhook side | Supabase `DOCUSEAL_API_KEY` |
|---------------|----------------------|-----------------------------|
| Sandbox ROI testing | **Testing** | Test key |
| Live ROI | **Production** | Production key |

Same URL and same `DOCUSEAL_WEBHOOK_SECRET` on both sides; only the active side receives events for that environment.

**Go-live (your setup):** toggle → **Production**, production API key in Supabase.

**Sandbox testing again:** toggle → **Testing** and set Supabase back to the **test** API key (and test template id if used). Testing toggle + production signing (or the reverse) = missed or broken webhooks.

**Custom secret (implemented):** If `DOCUSEAL_WEBHOOK_SECRET` is set, DocuSeal must send the same value in:

- `x-docuseal-secret`, or
- `x-webhook-secret`

**HMAC (`X-Docuseal-Signature` / `whsec_…`):** Not implemented in our webhook yet.

**Events handled:** `submission.completed`, `form.completed` → fetch PDF → **`referral-documents`** bucket at `referrals/{id}/roi/signed-….pdf` → mirror **`supporting_document_upload`** files to `referrals/{id}/roi/supporting/…` → update share link, ROI section **complete**, activity **`roi_signed`**.

**ROI supporting uploads:** DocuSeal keeps file-field uploads as temporary blob URLs in submitter `values` (often linked from the combined PDF, not embedded pages). The webhook downloads those URLs immediately (they expire ~40 min) and appends `uploaded_documents` entries with `type: "roi_supporting_document"`. They appear in the dashboard attachments list and ZIP like other referral files.

**Lookup:** share link via submitter `external_id` (referral_share_links.id), fallback `docuseal_submission_id`. If webhook secret/env wrong or DocuSeal **Testing** toggle while signing with production key, dashboard will show only **ROI signing started** (edge function), not completion.

---

## Public ROI link (Framer)

| Item | Value |
|------|--------|
| Page path | `/r` (static; **not** `/r/:token`) |
| URL shape | `https://monarchy.framer.website/r?token=<share_token>` |
| Component | `Code/Framer/ReferralSharePage.tsx` |
| DOB gate | `client_dob` on referral, compared as `YYYY-MM-DD` |

Share links are created from admissions dashboard / portal (`SHARE_LINK_BASE` + `?token=`).

---

## End-to-end flow

```text
Staff/portal → referral_share_links (roi_sign)
     → signer opens /r?token=…
     → monarch-roi-signing-session (DOB + POST /submissions)
     → ReferralSharePage embed (docuseal-form)
     → signer completes
     → monarch-docuseal-webhook
     → PDF in Supabase storage + envelope_status completed
```

---

## Sandbox banner (“Developer Sandbox…”)

A **paid Pro account** does not remove this banner by itself. It appears when the **DocuSeal submission** was created with a **test API key**. Updating Supabase to a production key alone does **not** change existing submissions.

| Situation | What you see |
|-----------|----------------|
| New sign after prod key + **new** submission | No sandbox banner |
| Same share link as during sandbox testing | Banner remains — link still points at old submission id/slug |

**Fix for an existing ROI link:** create a **new** ROI share link from the dashboard, **or** open the same link once with `&refresh=1` (after deploying `ReferralSharePage` + signing-session):  
`/r?token=…&refresh=1` — forces a new DocuSeal submission using the current API key.

**Prevent reuse:** `referral_share_links.docuseal_submission_id` / `docuseal_submitter_slug` are cached; `monarch-roi-signing-session` skips `POST /submissions` when both are set unless `refresh_submission: true`.

---

## Walkthrough / step tracker

DocuSeal’s **steps-progress** UI (field list, “start here”, step-by-step) comes from the **template** and signing mode, not from Monarch code alone.

| Link type | Pattern | Notes |
|-----------|---------|--------|
| Template link (dashboard) | `/d/{template_slug}` | Single-party; may show start form if email not passed |
| API signer link (Monarch) | `/s/{submitter_slug}` | Created by `POST /submissions`; use as `embed_src` |

If the dashboard `/d/…` link feels more guided than Monarch’s embed:

1. In DocuSeal, open **Monarch_Competency_ROI** → template settings → ensure **step-by-step / field-order signing** is enabled (not “fill on page only”).
2. On Monarch’s page we pass `data-minimize="false"`, `data-order-as-on-page="true"`, and a **How to complete** callout above the embed (`ReferralSharePage.tsx`).
3. Avoid `overflow: hidden` on the embed container — it can clip the step tracker.

Embed attributes reference: [signing form JS](https://www.docuseal.com/guides/embed-document-signing-into-web-app-with-javascript).

---

## PDF copy (upload section)

Text **inside the PDF** after “authorizing party” (explaining what uploads are for) is edited in **DocuSeal** (template PDF or field descriptions), not in this repo. Add a static line or a **description** on the file-upload field in the template builder.

---

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| “Developer Sandbox” banner | Test API key in Supabase; switch to production key |
| Template not found (test key) | Test key + production template id → use prod key or test template id |
| Missing submitter slug or id | Parser expected `data.submitters`; response is an **array** (fixed in signing session) |
| No step tracker on Monarch link | Template signing mode; embed height/overflow; compare `/d/` vs `/s/` |
| DOB mismatch | Wrong date entered, or `client_dob` null on referral |
| DOB off by one day in UI only | Display bug (`new Date('YYYY-MM-DD')` UTC); DB often correct — use calendar-safe `formatDate` |
| Webhook 401 | `DOCUSEAL_WEBHOOK_SECRET` mismatch with DocuSeal header |
| Embed loads but DB not updated | Webhook URL, secret, or event type; check Edge Function logs |

---

## Repo map

| Path | Purpose |
|------|---------|
| `supabase/functions/monarch-roi-signing-session/index.ts` | Session + DOB + create submission |
| `supabase/functions/monarch-docuseal-webhook/index.ts` | Completion + PDF storage |
| `Code/Framer/ReferralSharePage.tsx` | Public signing page |
| `Code/Framer/ReferralDashboard.tsx` | Staff share links, envelope status |
| `Code/Framer/ReferralSourcePortal.tsx` | Portal ROI CTA + links |
| `supabase/migrations/20260530120000_referral_share_links_roi_docuseal.sql` | Schema + RPC |

---

## Embed / builder (full attribute lists)

Monarch ROI only needs **`data-src`** (+ optional `completed` listener). For all `docuseal-form` / `docuseal-builder` attributes, callbacks, and JWT builder setup, use the official guides above — do not duplicate them here.
