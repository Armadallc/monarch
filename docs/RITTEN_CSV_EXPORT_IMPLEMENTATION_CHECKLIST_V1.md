# Ritten CSV Export — Implementation Checklist (Competency v1)

**Status:** Complete

This checklist implements `docs/RITTEN_CSV_EXPORT_MAPPING_SPEC_V1` in the dashboard while keeping the existing full CSV export unchanged.

---

## 1) Implementation goals

- Keep current exports working exactly as-is:
  - `CSV — Selected`
  - `CSV — All`
- Add a second export profile for submissions:
  - `CSV — Ritten Import (Selected)`
  - `CSV — Ritten Import (All)`
- Use exact Ritten header names and mapping rules from the spec.
- Do not block export when `Member ID` is blank.

---

## 2) Code touchpoints

Primary file:

- `Code/Framer/ReferralDashboard.tsx`

Existing export utilities are already in this file:

- `escapeCSV()` around export utility section
- `exportSubmissionsCSV()` (full export)
- `handleExportCSV()` and toolbar export menu UI

---

## 3) Add new helpers (export utility section)

Add helper functions near current CSV helpers:

1. `formatDateForRitten(value: unknown): string`
   - Output `YYYY-MM-DD`
   - Return `""` for invalid/missing values

2. `normalizeBirthSex(value: unknown, fallback?: unknown): string`
   - Prefer `client_sex_at_birth`, then fallback to `client_gender`
   - Normalize:
     - male -> `Male`
     - female -> `Female`
     - anything else -> `""`

3. `resolveMemberId(row: ReferralSubmission): string`
   - Precedence:
     1. `medicaid_number`
     2. `medicare_number`
     3. optional parse from `private_insurance_details`
     4. `""`

4. Optional utility:
   - `safeString(value: unknown): string` for trim + null/undefined cleanup.

---

## 4) Add new exporter function

Add `exportRittenCSV(data: ReferralSubmission[], filename: string)`.

### Required header order (exact text)

1. `First Name`
2. `Last Name`
3. `Date of Birth`
4. `Birth Sex`
5. `Diagnosis`
6. `Payer`
7. `Member ID`

### Row mapping

- `First Name` -> `client_first_name`
- `Last Name` -> `client_last_name`
- `Date of Birth` -> `formatDateForRitten(client_dob)`
- `Birth Sex` -> `normalizeBirthSex(client_sex_at_birth, client_gender)`
- `Diagnosis` -> `current_diagnoses`
- `Payer` -> `"self"` (or empty string if team toggles to null-style later)
- `Member ID` -> `resolveMemberId(row)`

### Export file name

- `ritten_import_referrals_YYYY-MM-DD.csv`

---

## 5) Update export handler API

Current handler:

- `handleExportCSV(mode: "selected" | "all")`

Update to support export profile:

- `handleExportCSV(mode: "selected" | "all", profile: "full" | "ritten")`

Behavior for submissions tab:

- profile `full` -> `exportSubmissionsCSV(...)`
- profile `ritten` -> `exportRittenCSV(...)`

Behavior for inquiries tab:

- keep existing `exportInquiriesCSV(...)`
- hide/disable Ritten options on inquiries tab (Ritten profile is submissions-only)

---

## 6) Update export menu UI

In toolbar export dropdown, replace two options with grouped options for submissions:

- `Full CSV — Selected (N)` *(if selected > 0)*
- `Full CSV — All (N)`
- divider
- `Ritten CSV — Selected (N)` *(if selected > 0)*
- `Ritten CSV — All (N)`

For inquiries tab, keep:

- `CSV — Selected (N)` *(if selected > 0)*
- `CSV — All (N)`

---

## 7) Validation + warnings (non-blocking)

Before generating Ritten CSV, compute counts:

- Missing first name
- Missing last name
- Missing DOB
- Missing birth sex
- Missing diagnosis (optional warning)
- Missing member ID (informational only)

Show a summary banner/toast/modal message (non-blocking), e.g.:

- `Ritten export generated with warnings: 12/38 rows missing recommended fields.`
- `Missing Member ID: 18 (informational; expected for uninsured admissions).`

Do **not** cancel export for missing data.

---

## 8) QA checklist (manual)

Use real + test referrals:

1. Export `Full CSV` still matches previous behavior/columns.
2. `Ritten CSV` headers exactly match spec (spelling/case/order).
3. `Date of Birth` always outputs `YYYY-MM-DD` or blank.
4. Birth sex normalization works (`Male`/`Female` or blank).
5. `Member ID` precedence works (Medicaid > Medicare > optional parsed > blank).
6. Blank member IDs do not block export.
7. Inquiries tab does not show Ritten export options.
8. Selected/all counts in button labels are accurate.
9. CSV escaping still handles commas, quotes, multiline notes.
10. Filename is `ritten_import_referrals_YYYY-MM-DD.csv`.

---

## 9) Acceptance criteria

- Existing full exports remain unchanged.
- New Ritten export is available for submissions and generates valid CSV.
- Ritten CSV headers and mappings match `docs/RITTEN_CSV_EXPORT_MAPPING_SPEC_V1`.
- Missing insurance/member ID does not block export.
- Warnings are visible but informational.

### Acceptance result

- Passed in dashboard testing (selected + all exports for both profiles).
- Filename convention updated to safer, differentiable names:
  - `MC-FULL-*`
  - `MC-RITTEN-*`

---

## 10) Post-v1 (optional)

- Add dedicated payer/member/address fields to form/schema for cleaner Ritten imports.
- Add dashboard toggle for `Payer` strategy (`self` vs blank).
- Add unit tests for date/sex/member-id mapping helpers.
