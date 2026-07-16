# ROI signing — template v2.2 swap and UX backlog

## Template v2.2 (priority)

| Item | Value |
|------|--------|
| DocuSeal template (production) | [3756335](https://docuseal.com/templates/3756335/edit) |
| Reference PDF | `docs/Monarch Competency ROI v2.2 Docuseal.pdf` |
| Previous template id | `3736303` (v2.1) |

### Go-live checklist

1. **Supabase secret** (production):
   ```bash
   supabase secrets set DOCUSEAL_ROI_TEMPLATE_ID='3756335'
   ```
2. Confirm `DOCUSEAL_API_KEY` is the **production** key (no sandbox banner on new submissions).
3. **New ROI share links** from dashboard/portal (or `&refresh=1` on existing links) so DocuSeal creates submissions against v2.2.
4. **Prefill smoke test** — template field **Names** match `buildPrefillValues` in `monarch-roi-signing-session/index.ts`; redeploy after changes.
5. **Webhook** — unchanged URL; production toggle on DocuSeal webhook.
6. **Republish Framer** — `ReferralSharePage.tsx` (colors, sticky stepper CSS, embed layout).

### Option A — internal / received-by on Authorizing Party

Place **read-only, prefillable** fields on **Authorizing Party**: `internal_use_referral_reference_code`, `roi_received_by`. For **`roi_received_date`**, use a date field with DocuSeal **Set signing date** (auto at signature — no API value). Defer admit / entered-by / notes until post-admit or a **staff ROI link** on the referral (backlog).

### Staff-only ROI completion link (backlog)

Flexible flow: generate a second share link (or dashboard deep link) so admissions completes `roi_entered_*`, `client_admitted_flag`, `internal_use_client_admission_date`, `roi_internal_notes` when appropriate — without blocking the public client envelope.

### Full template audit

See **`docs/DOCUSEAL_TEMPLATE_3756335_AUDIT.md`** — naming, conditionals, spellcheck, prefill keys (2026-05-20).

### Prefill field naming (v2.2 — aligned in code)

**Decision:** Use **snake_case** in DocuSeal; **drop `§1` (and other section prefixes)** from API field names. Section grouping stays in the PDF layout only — not in prefill keys.

**Browser scan (template 3756335, May 2026)** — Section 1 sidebar is **mixed** today:

| # | Current DocuSeal name | Target (proposed) |
|---|----------------------|-------------------|
| 1 | `§1 legal_first_name` | `legal_first_name` |
| 2 | `§1 legal_middle_name` | `legal_middle_name` |
| 3 | `Legal Last Name` | `legal_last_name` |
| 4 | `Date of Birth` | `date_of_birth` |
| 5 | `Last Four SSN` | `last_four_ssn` |
| 6+ | Title Case (`Current Location`, `Facility Name`, …) | snake_case optional (not prefilled from referral) |

`referral_reference_code` was **not** visible in the Section 1 list — confirm it exists elsewhere on the template or add a hidden/read-only field before go-live.

**After you rename in DocuSeal:** run `node scripts/list-docuseal-template-fields.mjs` with production `DOCUSEAL_API_KEY` to dump exact names, then we align the edge function once.

**Planned prefill map (code → DocuSeal):**

| DocuSeal key | Supabase / referral column |
|--------------|----------------------------|
| `legal_first_name` | `client_first_name` |
| `legal_middle_name` | `client_middle_name` |
| `legal_last_name` | `client_last_name` |
| `date_of_birth` | `client_dob` (`YYYY-MM-DD`) |
| `last_four_ssn` | last 4 of `client_ssn` |
| `internal_use_referral_reference_code` | `referral_code` |
| `roi_received_by` | staff profile for link creator |
| `roi_received_date` | DocuSeal **Set signing date** on template (not in API prefill) |

---

## Stepper / walkthrough visibility

**Problem:** DocuSeal’s expanded field editor (`.steps-form`) defaults open and can consume a large share of the signing viewport.

**Monarch fix (in `ReferralSharePage`):**
1. `data-minimize="true"` — field editor stays collapsed until the signer clicks a field (popover-style fill).
2. `data-custom-css` — Monarch-colored chrome; on pointer devices `.steps-progress` collapses to a quiet moonstone strip until hover/focus; touch keeps a slim always-usable rail; constrain `.steps-form` when expanded.
3. Tip copy above the embed explains click-to-fill + optional step bar.

**DocuSeal template (optional):** Confirm step-by-step signing is enabled (not fill-on-page-only). Field order follows page layout when `data-order-as-on-page="true"`.

After changing the Framer paste of `ReferralSharePage`, republish the `/r` page.

---

## Page colors (Framer)

| Token | Hex | Use on `/r` |
|-------|-----|-------------|
| Coconut | `#E9EDF6` | Page background |
| Ash | `#2B2828` | Headings, primary button, dark accents |
| Ash Dark | `#181818` | Optional footer band |
| White | `#FFFFFF` | DOB card / header card |

Shell uses coconut (not shell/beige). Primary actions use ash fill with coconut text.

---

## DOB gate UX (backlog — not priority)

Replace native `<input type="date">` with a friendlier control:

- **Option A:** Three fields (MM / DD / YYYY) with auto-advance after 2 / 2 / 4 digits and validation.
- **Option B:** Text input with masked `MM/DD/YYYY` and parsing to `YYYY-MM-DD` for the API.
- **Option C:** Mobile-friendly picker library (heavier for Framer paste).

Keep server comparison as `YYYY-MM-DD` (calendar date, no timezone shift).

---

## Framer layout note

`/r` page: stack with **overflow scroll** is correct. Avoid `overflow: hidden` on the embed wrapper (clips DocuSeal UI). ReferralSharePage uses a full-width embed region when signing (not only the narrow header card).
