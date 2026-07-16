# Referral field corrections (admissions-only)

Policy for post-submit identity corrections on `referral_submissions`, aligned with **2 CCR 502-1-2.11(I)** (date/time, nature, reason, who) without full-record versioning.

## Rules

1. **Referring sources cannot edit the clinical/identity record after submit.** Portal detail stays read-only for those fields. Sources may still message, upload documents, and manage their profile.
2. **Corrections are admissions-only.** Staff apply changes via `apply_referral_field_corrections` and attest with a required **reason**. Optional `requested_by` / `source_document` capture who asked and the evidence (DL scan, Medicaid letter, portal message, etc.).
3. **Field-level append-only log**, not whole-row versioning. Current truth stays on `referral_submissions`; history lives in `referral_field_corrections`.
4. **After `status = accepted`**, identity corrections are **blocked** in this system. First transition to accepted freezes `acceptance_snapshot` for EMR handoff; further identity fixes belong in the EMR.

## Allowlisted fields (v1)

| `field_key` | Column |
|---|---|
| `client_first_name` | `client_first_name` |
| `client_middle_name` | `client_middle_name` |
| `client_last_name` | `client_last_name` |
| `client_preferred_name` | `client_preferred_name` |
| `client_dob` | `client_dob` |
| `client_drivers_license` | `client_drivers_license` |
| `medicaid_number` | `medicaid_number` |
| `medicaid_id` | `medicaid_id` |

Expand only by updating the RPC allowlist + identity guard trigger together.

## Schema / RPC

Migration: `supabase/migrations/20260716200000_referral_field_corrections.sql`

| Object | Role |
|---|---|
| `referral_field_corrections` | Append-only log (staff SELECT; INSERT via definer RPC) |
| `apply_referral_field_corrections(referral_id, corrections[], reason, requested_by?, source_document?)` | Staff-only; returns `correction_session_id` |
| Identity UPDATE guard trigger | Blocks direct UPDATEs to allowlisted columns unless RPC sets `monarch.allow_identity_correction=on` |
| Acceptance snapshot trigger | On first flip to `accepted`, writes `acceptance_snapshot` / `_at` / `_by` |

Also logs a high-level `field_corrected` row on `referral_activity_log` (field keys + session id; full before/after remain in the corrections table).

### Example call

```ts
await supabase.rpc("apply_referral_field_corrections", {
  p_referral_id: id,
  p_corrections: [
    { field_key: "client_last_name", new_value: "Garcia" },
    { field_key: "client_dob", new_value: "1991-04-02" },
  ],
  p_reason: "Corrected against state-issued driver license",
  p_requested_by: "Jane Doe, Jefferson County Probation",
  p_source_document: "DL scan uploaded 2026-07-15",
})
```

### Compliance query

```sql
SELECT *
FROM referral_field_corrections
WHERE created_at >= date_trunc('quarter', now())
ORDER BY created_at DESC;
```

## Product follow-ups (not in this migration)

- Staff “Correct fields” UI in the admissions detail modal
- Portal copy: replace “edit submissions” with request-via-message / upload guidance
- Optional: show a non-PHI “record was corrected” hint to sources
- Form/collection of DL# at intake if sources should supply it at submit time

## Retired direction

Earlier notes about **source post-submit edit + locking** (`docs/REORGANIZING_MODAL_REFERENCE.md` deferred epic; lifecycle “edit own referral”) are superseded by this model.
