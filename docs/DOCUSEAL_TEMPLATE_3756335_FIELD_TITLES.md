# ROI v2.2 — suggested field titles (copy-paste)

Use in DocuSeal: select field → open field settings on the PDF (or sidebar **Settings**) → paste into **Title** (signing stepper label). Leave **Name** (snake_case) unchanged.

**Not the same as:** Default value · Description (helper text under the field)

---

## Section 1 — Client

| Name (do not change) | Suggested title |
|----------------------|-----------------|
| `legal_first_name` | Legal first name |
| `legal_middle_name` | Legal middle name |
| `legal_last_name` | Legal last name |
| `date_of_birth` | Date of birth |
| `last_four_ssn` | Last four digits of SSN |
| `current_location` | Current location |
| `other_current_location_specified` | Other location (specify) |
| `facility_name` | Facility name |
| `facility_address` | Facility address |
| `case_docket_number` | Case / docket number |
| `court_jurisdiction` | Court of jurisdiction |
| `authorizing_party` | I am signing this authorization as |
| `other_legal_authority_specified` | Other authority (specify) |

## Authorizing party contact (§2)

| Name | Suggested title |
|------|-----------------|
| `authorizing_party_name` | Authorizing party name |
| `relationship_to_client` | Relationship to client |
| `authorizing_party_phone` | Phone number (text) |
| `authorizing_party_email` | Email |
| `supporting_document_upload` | Upload supporting document (if applicable) |

**Deferred (no PDF placement in v2.2):** `authorizing_party_address` — remove from template sidebar if present, or leave off until a later PDF adds an address line. Not in Monarch prefill.

**Phone / OTP:** Use a **Text** field (not DocuSeal phone verification) unless you want SMS OTP for this workflow.

## Authorizing party — Monarch prefill / read-only (Option A)

Per **Option A**, place these on the **Authorizing Party** role (not only Internal use / Monarch Admissions), mark **prefillable** + **read-only**, aligned with `monarch-roi-signing-session`:

| Name | Suggested title | Source |
|------|-----------------|--------|
| `internal_use_referral_reference_code` | Referral reference code | `referral_code` |
| `roi_received_by` | ROI received by | `admissions_staff_profiles.display_name` (API prefill) |
| `roi_received_date` | Date received | DocuSeal **Set signing date** + read-only — actual sign date, **no** API prefill |

**Deferred** (admission / data entry timing — leave off template or optional & empty until process defined): `client_admitted_flag`, `internal_use_client_admission_date`, `roi_entered_by`, `roi_entered_date`, `roi_internal_notes`.

**Backlog:** A **staff-only** DocuSeal session or dashboard UI on the referral to complete internal rows after sign or after admit keeps the public client flow simple.

## Release / receive parties (v2.2 names)

| Name pattern | Suggested title |
|--------------|-----------------|
| `release_party_1_name` | Release to party 1 — name |
| `release_party_1_role` | Release to party 1 — role |
| `release_party_1_contact` | Release to party 1 — contact |
| `release_party_2_name` … `release_party_6_*` | Release to party N — … |
| `receive_party_1_name` | Receive from party 1 — name |
| `receive_party_1_role` | Receive from party 1 — role |
| `receive_party_1_contact` | Receive from party 1 — contact |
| `receive_party_2_name` … `receive_party_6_*` | Receive from party N — … |

## Information authorized / purpose / expiration

| Name | Suggested title |
|------|-----------------|
| `information_authorized_for_release` | Information authorized for release |
| `other_information_authorized_for_release` | Other information (specify) |
| `purpose_of_disclosure` | Purpose of disclosure |
| `other_purpose_of_disclosure_specified` | Other purpose (specify) |
| `expiration_of_authorization` | Authorization expiration |
| `expiration_months` | Number of months (if applicable) |
| `expiration_specific_date` | Specific expiration date |

## Part 2 initials / rights (examples)

| Name | Suggested title |
|------|-----------------|
| `sud_treatment_records_initials` | SUD treatment records — initials |
| `mental_health_treatment_records_initials` | Mental health treatment records — initials |
| `genetic_information_initials` | Genetic information — initials |
| `psychotherapy_notes_initials` | Psychotherapy notes — initials |
| `right_to_revoke_initials` | Right to revoke — initials |
| `right_to_inspect_records_initials` | Right to inspect records — initials |
| `right_to_a_copy_statement_initials` | Right to a copy — initials |
| `court_communication_notice_initials` | Court communication notice — initials |
| `potential_re-disclosure_notice_initials` | Re-disclosure notice — initials |
| `voluntary_authorization_statement_initials` | Voluntary authorization — initials |

## Signatures (§9)

| Name | Suggested title |
|------|-----------------|
| `client_signature` | Signature |
| `client_signature_date` | Date signed |
| `client_printed_name` | Printed name |
| `legal_authority_role_if_other` | Legal authority (if other) |

## Witness role (§9 — separate DocuSeal role)

Expand **Witness** in the template sidebar (not Authorizing Party). PDF labels: Witness Signature, Date, Witness Printed Name, Title / Organization.

| Name (confirm in builder) | Suggested title |
|---------------------------|-----------------|
| `witness_signature` | Witness signature |
| `witness_signature_date` | Witness date |
| `witness_printed_name` | Witness printed name |
| `witness_title_organization` | Title / organization |

Public `/r?token=` embed does **not** create a Witness submitter yet (v1).

## Monarch Admissions role (optional / deferred)

If the bottom-of-form staff block is **only** filled later or in a separate staff flow, you can leave this role with no fields or with fields not required. Public `/r?token=` only instantiates **Authorizing Party**.

## Revocation (§10)

| Name | Suggested title |
|------|-----------------|
| `revocation_client_name` | Client name (revocation) |
| `revocation_date` | Revocation date |
| `revocation_client_printed_name` | Printed name (revocation) |
| `revocation_client_signature` | Signature (revocation) |
| `revocation_signature_date` | Date signed (revocation) |

## Internal block labels (if still on PDF under Monarch Admissions)

If any of these remain on the **Monarch Admissions** role for a future staff link, keep **Name** as below. **Option A** prefers referral code + received-by/date on **Authorizing Party** (see above).

| Name | Suggested title |
|------|-----------------|
| `internal_use_referral_reference_code` | Referral reference code |
| `client_admitted_flag` | Client admitted |
| `internal_use_client_admission_date` | Admission date |
| `roi_received_by` | ROI received by |
| `roi_received_date` | ROI received date |
| `roi_entered_by` | ROI entered by |
| `roi_entered_date` | ROI entered date |
| `roi_internal_notes` | Internal notes |

---

## Workflow tip

1. Open [template 3756335](https://docuseal.com/templates/3756335/edit).
2. Click a field on the PDF (orange outline).
3. In the floating settings panel, find **Title** (separate from Description and Default value).
4. Paste from the table; Tab to next field if the UI allows.
5. **Save** when done.

To verify titles: **Sign Yourself** and check the step list at the bottom.
