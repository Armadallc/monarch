# Referral Source Portal — Schema (from Neew Tables)

> **Source:** Desktop/Neew Tables.rtf. Reviewed for compatibility with current project; aligned with REFERRAL_SOURCE_PORTAL.md phases. Only necessary tables/columns are recommended for each phase.

---

## Compatibility

The Neew Tables schema **is compatible** with our project. It matches the spec in REFERRAL_SOURCE_PORTAL.md and extends DATABASE.md. To avoid unnecessary work:

- **Phase 2A (current):** Add `submitted_by_user_id` to `referral_submissions`, add RLS so portal can filter by auth user. Optionally add `referral_source_profiles` and `referral_status_history` when we build profile and timeline.
- **Phase 2B:** Add `referral_share_links` when we implement shareable ROI/document links.
- **Phase 2C:** Add `referral_activity_log` and `referral_messages` when we implement activity timeline and messaging.

No extra tables or columns are required for the current portal (My Referrals list + detail); we already filter by `referral_source_email`. Adding `submitted_by_user_id` improves security and allows RLS-based “own referrals only.”

---

## Summary: New Tables (from Neew Tables)

| Table | Purpose | When to add |
|-------|---------|-------------|
| **referral_source_profiles** | Profile + notification preferences per user (display_name, organization, title, phone, fax, preferred_contact_method, notification_preferences) | Phase 2A (My Profile) or 2C (notifications) |
| **referral_status_history** | One row per status change; timeline in portal and dashboard; trigger on `referral_submissions.status` | Phase 2A/2C (timeline) |
| **referral_share_links** | Shareable links for ROI signing and document upload (token, type, expiry) | Phase 2B |
| **referral_activity_log** | Audit trail (submitted, status_changed, document_uploaded, etc.) | Phase 2C |
| **referral_messages** | Messaging between referral source and staff | Phase 2C |

---

## Summary: Modified Tables

| Table | Change | When |
|-------|--------|------|
| **referral_submissions** | Add `submitted_by_user_id` (uuid, references auth.users.id). Enables RLS so referral sources see only their own referrals. | Phase 2A |

---

## Phase 2A — Minimum (recommended now)

1. **referral_submissions:** Add column `submitted_by_user_id UUID REFERENCES auth.users(id)` (nullable for existing rows).
2. **Backfill:** Set `submitted_by_user_id` from existing data where possible (e.g. match by `referral_source_email` to auth.users if you have that mapping; otherwise leave null).
3. **ReferralForm:** On submit, set `submitted_by_user_id = auth.uid()` when user is signed in.
4. **RLS (optional but recommended):** Policy on `referral_submissions` so referral sources can SELECT only rows where `submitted_by_user_id = auth.uid()`. Staff (e.g. service role or domain check in app) keep full access.
5. **ReferralSourcePortal:** Can keep filtering by `referral_source_email` until RLS is in place; then you can switch to relying on RLS or filter by `submitted_by_user_id` for consistency.

No new tables are required for the current portal to function; we already use `referral_source_email`. Adding `submitted_by_user_id` + RLS is the key improvement for security and future-proofing.

---

## Phase 2A — Optional (timeline + profile)

- **referral_status_history:** New table + trigger on `referral_submissions.status` to insert a row on each change. Enables status timeline in portal and dashboard. Add when you’re ready to show “Submitted → Under Review → …” in the UI.
- **referral_source_profiles:** New table for display_name, organization, title, phone, preferred_contact_method, notification_preferences. Add when you build My Profile and notification toggles.

---

## Deferred (not needed for current objectives)

- **referral_share_links** — Phase 2B (shareable ROI/document links).
- **referral_activity_log** — Phase 2C (audit trail).
- **referral_messages** — Phase 2C (messaging).

These are not unnecessary; they are simply later-phase work. Do not add them until the features that use them are in scope.

---

## Implementation plan (ordered)

### Step 1 — submitted_by_user_id (Phase 2A) ✅ Done

1. ~~In Supabase: add column~~ Done (migration run).
2. Backfill if desired (optional).
3. ~~ReferralForm: set `submitted_by_user_id` on insert~~ Done.
4. **RLS — add later** (see “RLS for referral_submissions” below). Deferred until app flow is stable.

### Step 2 — ReferralSourcePortal ✅ Done

- Portal now loads referrals by `submitted_by_user_id` or `referral_source_email` (new + legacy).

### RLS for referral_submissions — Done

When you’re ready to enforce “own referrals only” at the DB:

- **Referral sources:** `SELECT` (and `UPDATE` on own rows if needed for document upload) where `submitted_by_user_id = auth.uid()` OR `referral_source_email = (auth.jwt() ->> 'email')`.
- **Staff:** `SELECT` / `UPDATE` (and `INSERT` if needed) where `(auth.jwt() ->> 'email') LIKE '%@monarchcompetency.com'`.
- **INSERT:** allow for authenticated users; app sets `submitted_by_user_id`.

Enable RLS on `referral_submissions` and add the above policies (and test dashboard, portal, and form submit).

### Step 3 — Timeline (Phase 2A/2C) ✅ Done

- **referral_status_history:** Migration `20260211120001_referral_status_history.sql` creates table, trigger (INSERT + UPDATE of status), and backfill for existing referrals.
- **Portal:** Referral detail modal shows a "Status timeline" section (entries with `visible_to_referral_source = true`). **Dashboard:** Submission detail modal shows "Status timeline" (all entries for staff). Changing status via the dropdown is recorded by the trigger.

### Step 4 — Profile (Phase 2A/2C) ✅ Done

- **referral_source_profiles:** Migration `20260211120003_referral_source_profiles.sql` creates table (display_name, organization, title, phone, fax, preferred_contact_method, notification_preferences) and RLS (users see only own row).
- **Portal:** "My Profile" button toggles a profile view; form loads/saves via upsert. Top spacing set to 200px so header and buttons clear the nav bar; button gap 20px.

### Step 5 — Share links, activity log, messages (Phase 2B/2C)

- Implement when you build shareable links, audit log, and messaging features.

---

## Reference: referral_source_profiles columns (from Neew Tables)

- id, user_id (unique, ref auth.users), display_name, organization, title, phone, fax, preferred_contact_method (email/phone/fax), notification_preferences (JSONB), created_at, updated_at. RLS: users see only own row.

## Reference: referral_status_history columns (from Neew Tables)

- id, referral_id (ref referral_submissions), status, previous_status, changed_by_user_id, changed_by_name, changed_by_role, notes, visible_to_referral_source, created_at. Trigger: insert row when referral_submissions.status changes.

## Reference: referral_submissions change (from Neew Tables)

- Add: submitted_by_user_id UUID REFERENCES auth.users(id). Purpose: link referral to auth user for RLS and “my referrals” filtering.
