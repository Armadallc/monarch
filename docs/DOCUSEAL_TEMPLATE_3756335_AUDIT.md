# DocuSeal ROI v2.2 — template audit (3756335)

**Template:** [Monarch Competency ROI v2.2](https://docuseal.com/templates/3756335/edit)  
**Audited:** 2026-05-20 (builder UI + condition dialogs)  
**Roles (template):**

| Role | Public ROI embed (`/r?token=`) | Notes |
|------|-------------------------------|--------|
| `Authorizing Party` | **Yes** — API creates this submitter | Client or authorized rep; §1–§9 signer fields |
| `Witness` | No (v1) | §9 witness block — staff/second envelope later |
| `Monarch Admissions` | No (v1) | Staff/internal block — not in public session |

**Do not** use legacy role name `client_or_other_authorized` (v2.1); DocuSeal returns *Unknown submitter role*.

### Witness role (§9 PDF block)

Expand **Witness** in [template editor](https://docuseal.com/templates/3756335/edit) sidebar to confirm exact **Names**. Expected from PDF layout:

| PDF label | Likely field name |
|-----------|-------------------|
| Witness Signature | `witness_signature` |
| Date | `witness_signature_date` |
| Witness Printed Name | `witness_printed_name` |
| Title / Organization | `witness_title_organization` |

Not used by public ROI embed until we add a second submitter flow.

---

## Naming convention — status

Section 1 fields are **snake_case** without `§` prefixes. Good.

**Pattern in use:**

| Kind | Pattern | Example |
|------|---------|---------|
| API field name | `snake_case` | `legal_first_name` |
| Radio option value (Other) | `*_specify` | `other_current_location_specify` |
| Conditional text field | `*_specified` | `other_current_location_specified` |

That `specify` / `specified` split is fine as long as conditions reference the **radio option value** (`*_specify`), not the text field name.

**Set friendly labels in DocuSeal:** Field **Title** (signing stepper) can stay human-readable; only **Name** must match our prefill keys.

---

## Monarch prefill (edge function)

| DocuSeal field name | Supabase column | Status |
|-------------------|-----------------|--------|
| `legal_first_name` | `client_first_name` | ✓ present |
| `legal_middle_name` | `client_middle_name` | ✓ present |
| `legal_last_name` | `client_last_name` | ✓ present |
| `date_of_birth` | `client_dob` (`YYYY-MM-DD`) | ✓ present |
| `last_four_ssn` | last 4 of `client_ssn` | ✓ present |
| `internal_use_referral_reference_code` | `referral_code` | ✓ **Authorizing Party** (Option A) |
| `roi_received_by` | `admissions_staff_profiles.display_name` for link `created_by_user_id` | ✓ if profile exists |
| `roi_received_date` | DocuSeal **Set signing date** on the field (actual signature time) | ✓ template — **not** API prefill |

**Not** `referral_reference_code` — v2.2 uses `internal_use_referral_reference_code`.

**Do not** pass `roi_received_date` in submission `values` when the field uses signing date — DocuSeal sets it at completion.

After saving template changes, use a **new ROI link** or `&refresh=1` so DocuSeal creates a fresh submission.

---

## Conditional fields (6 total)

All use **Equal** on a parent radio/checkbox field.

| # | Field shown when condition met | When (field = value) |
|---|-------------------------------|----------------------|
| 1 | `other_current_location_specified` | `current_location` = `other_current_location_specify` |
| 2 | `other_legal_authority_specified` | `authorizing_party` = `other_legal_authority_specify` |
| 3 | `other_information_authorized_for_release` | `information_authorized_for_release` = `other_information_authorized_for_release_specify` |
| 4 | `other_purpose_of_disclosure_specified` | `purpose_of_disclosure` = `other_purpose_of_disclosure_specify` |
| 5 | `expiration_months` | `expiration_of_authorization` = `expires_after_months` *(verify option value in builder)* |
| 6 | `expiration_specific_date` | `expiration_of_authorization` = `expires_on_specific_date` *(verify option value in builder)* |

Parent for #5–6 is **`expiration_of_authorization`** (not `authorization_expiration`).

---

## Spellcheck & typos

| Item | Status |
|------|--------|
| `right_to_inspect_records_initials` | ✓ fixed (was v2.1 `…_stater`) |
| `intake_admission_assessment` (or similar) | User-set; open **15 Options** on `information_authorized_for_release` to confirm |
| Numeric prefixes on **field names** | Remove if any remain; use **Title** only |

**PDF static text:** Section headers looked correct (HIPAA, 42 CFR Part 2, C.R.S., etc.).

---

## Naming consistency checks

| Issue | Recommendation |
|-------|----------------|
| Release/receive parties | ✓ `release_party_N_*` and `receive_party_N_*` (1–6) |
| **`internal_use_referral_reference_code`** | ✓ In **Internal use** section (separate from Authorizing Party sidebar); read-only is fine for prefill |
| Staff `roi_*` / other `internal_use_*` | In Internal use section if present; not required for signer E2E |
| Default on referral code field | Clear any test default; we prefill from Supabase |

---

## Section 1 field list (verified in builder)

| Field name | Type | Notes |
|------------|------|-------|
| `legal_first_name` | text | Prefill |
| `legal_middle_name` | text | Prefill |
| `legal_last_name` | text | Prefill |
| `date_of_birth` | date | Prefill |
| `last_four_ssn` | number | Prefill |
| `current_location` | radio (5) | Options include `community`, `jail_detention`, `treatment_facility`, `hospital`, `other_current_location_specify` |
| `other_current_location_specified` | text | Conditional (#1) |
| `facility_name` | text | |
| `facility_address` | text | |
| `case_docket_number` | text | |
| `court_jurisdiction` | text | |
| `authorizing_party` | radio (5) | Options include `client_self`, `power_of_attorney`, `legal_guardian`, `court_appointed_representative`, `other_legal_authority_specify` |
| `other_legal_authority_specified` | text | Conditional (#2) |

---

## Re-run full field dump (API)

Local `.env` DocuSeal key did not authenticate (use **production** key from Supabase):

```bash
DOCUSEAL_API_KEY='<production>' node scripts/audit-docuseal-template.mjs 3756335
```

Writes `docs/docuseal-template-3756335-raw.json` and updates this audit’s field table.

---

## Code updates (repo)

- `supabase/functions/monarch-roi-signing-session/index.ts` — prefill keys updated to snake_case v2.2 names
- `docs/DOCUSEAL_API_WEBHOOKS_QUICK_REFERENCE.md` — prefill table
- `docs/ROI_SIGNING_UX_AND_TEMPLATE_V2_2.md` — pointer to this audit

**Deploy after pull:** `supabase functions deploy monarch-roi-signing-session --no-verify-jwt`
