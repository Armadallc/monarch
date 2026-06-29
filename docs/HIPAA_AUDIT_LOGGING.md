# HIPAA audit logging (164.312(b))

This project implements audit controls for systems that contain or use ePHI (electronic protected health information), in line with the HIPAA Security Rule **164.312(b) Audit Controls**.

## What we record

Each audit row in `referral_activity_log` captures:

| Field | Purpose (HIPAA) |
|-------|------------------|
| **referral_id** | Record (ePHI) accessed or changed |
| **activity_type** | Action performed (see list below) |
| **actor_user_id** / **actor_email** | Who performed the action (user identity) |
| **created_at** | When (timestamp) |
| **outcome** | Success or failure |
| **ip_address** | Source IP (when available, e.g. from server/edge) |
| **user_agent** | Client device/browser (when provided by client) |
| **session_id** | Client session for correlation |
| **details** | JSONB with action-specific data (e.g. previous_status, section_key) |

## Activity types (audit events)

| activity_type | When it is logged |
|---------------|-------------------|
| **referral_submitted** | New referral created (trigger on `referral_submissions` INSERT) |
| **referral_viewed** | User opened referral detail (dashboard or portal modal) |
| **status_change** | Referral status changed (trigger on `referral_status_history` INSERT) |
| **section_note** | Section note added |
| **message** | Message sent in referral thread |
| **assignment_changed** | Referral assigned or unassigned to a user |
| **section_status_changed** | ROI / Insurance / Safety section status updated |
| **share_link_created** | Share link created for referral |
| **share_link_revoked** | Share link deleted/revoked |

Optional future: **document_uploaded** when a file is attached to a referral (log after successful upload in ReferralForm or dashboard).

## Integrity (append-only)

- **INSERT** is allowed via RLS for authenticated users; the application and triggers insert rows only.
- **UPDATE** and **DELETE** have no permissive RLS policies, so they are denied for normal roles. Log rows are not altered or removed by the application, supporting tamper-evident audit trails.

## Retention

**10-year retention** applies to audit logs and all referral-related data per Monarch policy (HIPAA + Colorado). See **`docs/DATA_RETENTION_POLICY.md`**. The application does not auto-delete; optional purge is available via `purge_referrals_older_than_retention(p_years)` when authorized and documented.

## Where logs are used

- **Dashboard:** The “Activity” section in the referral detail modal shows `referral_activity_log` for that referral (timeline of who did what, when).
- **Reporting / compliance:** Query `referral_activity_log` (with RLS) for audits, investigations, or compliance reviews. Filter by `referral_id`, `actor_email`, `activity_type`, or `created_at` as needed.

## Migration

Schema and triggers are in **`supabase/migrations/20260217120000_hipaa_audit_logging.sql`** (adds columns, extends `log_referral_activity`, adds trigger for `referral_submitted`).

## Optional: IP address at creation

Source IP is often captured server-side. To store IP for “referral_submitted” or other events:

- Use a Supabase Edge Function or your API to capture `X-Forwarded-For` / `X-Real-IP` (or equivalent) and call `log_referral_activity` with `p_ip_address` set, or
- Add an Edge Function that runs on referral insert and writes IP into a new row or into `details` for the trigger-created row (if you add a small extension to the trigger to accept server-provided context).

Client-side code cannot reliably obtain the user’s public IP; it is intentionally not set from the browser.
