# Review: Referral System Next Steps

This document reviews the proposed additions from **Referral System Next Steps.rtf** and adapts the **workflows** to our system. We only **add** to what exists; we never change or revert existing RLS, triggers, or schema.

---

## Principles

- **Add only.** New migrations add columns, tables, and policies. We do not alter or drop existing RLS policies, triggers, or core schema.
- **SQL matches the system; objectives first.** When external SQL uses different names than our schema, we rewrite the SQL to use our existing column and table names (we do not rename existing columns to match the SQL). If a new workflow needs a column that does not exist, we add it when it does not break current processes.
- **Workflows over names.** We adapt the suggested workflows (assignment, activity, section statuses, notes, messages, etc.); table and column names can follow our conventions.
- **Staff = email.** Staff are identified by `(auth.jwt() ->> 'email') LIKE '%@monarchcompetency.com'`. New policies use this where “staff” access is needed.

---

## Phased implementation plan

### Phase 1 – Schema and profile access (additive only)

- Add columns on `referral_submissions`: activity and assignment (e.g. `last_activity_at`, `assigned_to_user_id`, `assigned_at`, `priority`, and optional unread flags for future use).
- Add `changed_by_role` to `referral_status_history` and set it in the existing trigger (e.g. `'staff'` when the acting user is staff).
- Add **one new** RLS policy on `referral_source_profiles`: staff (by email) can SELECT all rows. No change to existing policies.

### Phase 2 – Activity log

- Create `referral_activity_log` and a `log_referral_activity()` helper using `auth.uid()` and JWT email for actor. Optionally have status changes write to this table (trigger or app).

### Phase 3 – Section notes and messages

- Create tables for section notes and messages with RLS (referral source sees own; staff by email see all). Wire UI when ready.

### Phase 4 – Share links and internal notes

- Create share links and internal notes tables; add UI when needed.

### Phase 5 – Status set and section workflows

- If we expand overall status values, update the DB check constraint and dashboard/portal dropdowns together. Add section-status workflows (ROI, insurance, safety) when design is ready.

---

## Reference: what we have today

| Item | Status |
|------|--------|
| referral_submissions | Exists; RLS by submitted_by_user_id, referral_source_email, staff email |
| referral_source_profiles | Exists; RLS own-profile only |
| referral_status_history | Exists; trigger sets changed_by_name for staff |
| Overall status | pending_review, under_review, accepted, declined, waitlisted (DB constraint) |

Phase 1 is implemented in migration `20260212120000_phase1_referral_workflow.sql` (additive only).  
Phase 2 is implemented in migration `20260212120001_phase2_activity_log.sql`: `referral_activity_log` table, `log_referral_activity()` helper, RLS, and status trigger updated to set `last_activity_at` on submissions.

Phase 3 is implemented in migration `20260212120003_phase3_section_notes_messages.sql`: `referral_section_notes` (section_key, content, is_internal; referral source sees non-internal only, staff see all) and `referral_messages` (thread per referral; both sides see all). UI can be wired when ready.

Phase 4 is implemented in migration `20260212120004_phase4_share_links.sql`: `referral_share_links` (referral_id, token, expires_at, label; staff-only CRUD). Internal notes are already covered by `referral_section_notes` with `is_internal = true`. UI when needed.

Phase 5 is implemented in migration `20260212120006_phase5_section_workflows.sql`: `referral_section_statuses` (referral_id, section_key, status, updated_at, updated_by_user_id; one row per referral per section). Use section_key e.g. `roi`, `insurance`, `safety`; overall referral status is unchanged. UI when design is ready.

---

## Phase status

**Phases 1–5 are complete:** migrations applied and UI/behaviour implemented as below. Remaining work is deferred (see Deferred / follow-up).

## Implemented (UI and behaviour)

- **Phase 3:** Section notes and messages UI in portal and dashboard (create/view notes, send/view messages; staff can add internal notes).
- **Phase 4:** Share links UI — portal: list/copy; dashboard: create/copy/revoke. Phase4b: referral sources can SELECT share links for their own referrals.
- **Phase 2:** Activity log — trigger logs status changes to `referral_activity_log`; dashboard shows Activity timeline; notes and messages call `log_referral_activity` RPC. Phase2b migration backfills and trigger for status→activity.
- **Phase 5:** Section workflows UI — dashboard: ROI, Insurance, Safety status dropdowns (upsert); portal: read-only section statuses.
- **Phase 1:** Assignment — dashboard: Assign to me / Unassign in submission modal; Assigned to me / Unassigned filter in submissions list.
- **Unread indicators:** When staff send a message or add a non-internal section note, `has_unread_messages` or `has_unread_section_notes` is set on the referral. Portal list shows a “New” badge for referrals with unread; opening the referral detail clears the flags.

---

## Deferred / follow-up

- **Portal: X close button on referral detail modal.** Clicking the X does not close the form in the referral source portal (clicking outside the modal does). The X works in the dashboard. Revisit when debugging Framer-embedded code component event handling (e.g. pointer capture or host layer over the close control).
