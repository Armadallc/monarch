# Audit logging and activity — what’s implemented

**See also:** **`docs/HIPAA_AUDIT_LOGGING.md`** for HIPAA 164.312(b) audit controls: what we record, activity types, append-only behavior, and retention.

## Two different things in the UI

In the dashboard referral detail modal there are two sections:

1. **Activity** — timeline of events from **`referral_activity_log`** (message sent, status change, section note, referral viewed, assignment changed, etc.). This is the HIPAA audit log; it is populated.
2. **Audit Trail** — submission-level metadata (IP address, user agent, form completion %, time spent, session ID, last auto save) from **`referral_submissions`** columns. Those columns are not currently populated by the form; the Activity section above is the primary audit trail.

---

## What **is** being recorded (Activity)

The **Activity** section is driven by the **`referral_activity_log`** table and **is working**.

- **Source:** Table `referral_activity_log`; rows are written by:
  - **Status changes:** Trigger on `referral_status_history` (Phase 2b) inserts an activity row when status changes (e.g. to “Pending Review”).
  - **Messages:** When a user sends a message, the app calls `log_referral_activity(..., 'message', ...)` and the portal/dashboard calls it when the referral source sends a message.
  - **Section notes:** When someone adds a section note, the app calls `log_referral_activity(..., 'section_note', ...)`.

- **What’s stored per row:** `referral_id`, `activity_type`, `actor_user_id`, `actor_email`, `details` (JSONB), `created_at`. No IP, user agent, or form-completion data.

So entries like “Message sent” and “Pending Review” in the Activity section are from this table and are correct.

---

## What is **not** being recorded (Audit Trail)

The **Audit Trail** section in the dashboard shows fields that are intended to live on **`referral_submissions`**:

- IP Address  
- User Agent  
- Form Completion %  
- Time Spent  
- Session ID  
- Last Auto Save  

**Current state:**

- The **applied Supabase migrations** in `supabase/migrations/` do **not** add these columns. So in the current schema they either don’t exist or come from some other migration/source.
- **ReferralForm** does **not** send these values on submit (or at all). The insert payload is `cleanedData` plus `is_priority_referral`, `status`, `submitted_by_user_id` — no IP, user_agent, time spent, session ID, or auto-save time.
- There is no auto-save or client-side tracking that writes form completion %, time spent, or last auto save to the backend.

So the Audit Trail will show dashes or 0% until:

1. The schema has the right columns on `referral_submissions` (if they’re missing).
2. The referral form (and any auto-save flow) captures and sends: IP, user agent, session ID, form completion %, time spent, and last auto save.

---

## Summary

| What you see in the UI | Data source              | Status |
|------------------------|--------------------------|--------|
| **Activity** (Message sent, Pending Review, etc.) | `referral_activity_log` | Implemented and populated (trigger + RPC). |
| **Audit Trail** (IP, user agent, form completion %, time spent, session ID, last auto save) | Columns on `referral_submissions` | Not populated: columns may be missing in applied migrations, and the form does not send these values. |

So “audit logging” in the sense of **who did what and when** (Activity) is working. The **submission-level audit metadata** (Audit Trail) is not yet captured or stored; the UI is there but the data pipeline is not.
