# Cross-Program Referral Migration Checklist (v1 Prep)

**Purpose:** Prepare the referral system for future integration with:

- `monarchmentalhealth.org`
- `monarchsoberlivinghomes.com`

without requiring those sites to be live yet.

**Principles:** Additive only, no destructive changes, no interruption to existing Monarch Competency referral workflow.

---

## Scope of this checklist

This checklist prepares:

1. Program-aware referral ownership/routing
2. Cross-program assignment/forwarding primitives
3. Minimal staff membership/role model (`admin`, `user`)
4. Audit-ready transfer lifecycle events

It does **not** require immediate UI launch for other programs.

---

## Migration order (execute in sequence)

## M1 — Program canonicalization

### Objective
Ensure stable program records exist for future routing.

### Changes
- Verify/create canonical rows in `programs`:
  - `competency`
  - `mental_health`
  - `sober_living`
  - `launch`
- Ensure unique `slug`.
- Ensure `is_active` flag.

**Repo migration:** `supabase/migrations/20260513120000_m1_monarch_corporate_client_and_programs.sql` — creates `corporate_clients` / `programs` if missing (canonical 4- and 5-column shapes), unique index on `programs.slug`, seeds **Monarch Referral & Admissions** plus the four programs (`competency` active; others inactive until launch), removes **Alpha Transport** mock client (and `tenant_roles` / `programs` rows tied to that client when `tenant_roles.corporate_client_id` exists). If your live tables use different column names, introspect first (`docs/TENANT_AND_PROGRAM_DATABASE_REFERENCE.md` §8) and adjust the migration once.

**M1 follow-up (same sprint / after M1 apply):** `20260514120000_remove_client_monarch_and_prog_monarch_ny.sql` (legacy `client_monarch` + `prog_monarch_ny`), `20260515120000_remove_driver_dispatch_tenant_roles.sql`, `20260516120000_role_permissions_transport_cleanup.sql` (transport permissions, `corporate_client_id` repoint, orphan `role_permissions`).

### Validation query
- Confirm one row per slug and active status.

---

## M2 — Staff program memberships

### Objective
Move from single-domain staff assumptions toward explicit program membership.

### New table
`staff_program_memberships`

**Repo migration:** `supabase/migrations/20260517120000_m2_staff_program_memberships.sql` — creates the table, unique `(user_id, program_id)`, indexes, and an `updated_at` trigger. **`program_id` is `TEXT`** (matches `programs.id` when it is `varchar`/`text`, e.g. `prog_competency`). If your `programs.id` is `uuid` instead, change `program_id` to `uuid` in that migration before apply. Seed memberships manually (commented example at bottom of the SQL file).

Columns:
- `id uuid pk`
- `user_id uuid not null` (FK `auth.users`)
- `program_id text not null` (FK `programs` — same type as `programs.id`; use `uuid` only if `programs.id` is uuid)
- `role text not null` check (`admin`, `user`)
- `status text not null default 'active'` check (`active`, `blocked`)
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`
- `created_by_user_id uuid null`
- `updated_by_user_id uuid null`

Indexes/constraints:
- unique (`user_id`, `program_id`)
- index (`program_id`, `role`, `status`)
- index (`user_id`, `status`)

### Validation query
- Insert sample active membership for existing competency staff.
- Confirm uniqueness and role constraints enforce correctly.

---

## M3 — Referral routing columns

### Objective
Add routing state to `referral_submissions` for future program matrix.

**Repo migration:** `supabase/migrations/20260518120000_m3_referral_program_routing_columns.sql` — adds program routing columns as **TEXT** FKs to `programs(id)` (matches varchar `programs.id`), `transfer_status` + CHECK, view/edit audit columns, composite indexes, and backfill from `programs.slug = 'competency'`. **RLS unchanged** (M6).

### Add columns
- `origin_program_id` null (FK `programs`) — **same type as `programs.id`** (`text` if `programs.id` is varchar; `uuid` if uuid)
- `intended_program_id` null (FK `programs`) — same
- `current_program_id` null (FK `programs`) — same
- `assigned_program_id` null (FK `programs`) — same
- `transfer_status text not null default 'none'`
- `last_viewed_at timestamptz null`
- `last_viewed_by_user_id uuid null` (FK `auth.users`)
- `last_edited_at timestamptz null`
- `last_edited_by_user_id uuid null` (FK `auth.users`)

### transfer_status check values
- `none`
- `pending_acceptance`
- `accepted`
- `declined`
- `returned`

### Backfill recommendation
- Existing rows: set `origin_program_id`, `intended_program_id`, `current_program_id` to the **Competency program row’s `id`** (e.g. slug `competency` → your `programs.id` value, not the slug string unless id equals slug).

### Indexes
- (`current_program_id`, `status`, `created_at desc`)
- (`assigned_program_id`, `status`, `created_at desc`)
- (`assigned_to_user_id`, `status`, `created_at desc`)
- (`transfer_status`, `created_at desc`)

### Validation query
- Confirm new columns exist.
- Confirm backfilled rows have competency IDs.
- Confirm index usage on expected dashboard filters.

---

## M4 — Transfer history table

### Objective
Track forwards/reassignments between programs with immutable history.

### New table
`referral_transfers`

Columns:
- `id uuid pk`
- `referral_id uuid not null` (FK `referral_submissions`)
- `from_program_id uuid null` (FK `programs`)
- `to_program_id uuid not null` (FK `programs`)
- `from_assigned_user_id uuid null`
- `to_assigned_user_id uuid null`
- `requested_by_user_id uuid not null`
- `requested_at timestamptz default now()`
- `status text not null` check (`pending`, `accepted`, `declined`, `cancelled`, `returned`)
- `resolved_by_user_id uuid null`
- `resolved_at timestamptz null`
- `reason text null`
- `notes text null`

Indexes:
- (`referral_id`, `requested_at desc`)
- (`to_program_id`, `status`, `requested_at desc`)
- (`to_assigned_user_id`, `status`, `requested_at desc`)

### Validation query
- Insert one pending transfer and one accepted transfer sample.
- Verify both timeline order and lookup indexes.

---

## M5 — Audit visibility + event taxonomy alignment

### Objective
Align audit log with transfer lifecycle while preserving referral-source visibility boundaries.

### Changes
- Ensure `referral_activity_log` supports source visibility flag (`visible_to_referral_source`) if not already present.
- Standardize/allow event types:
  - `referral_received`
  - `referral_viewed`
  - `referral_edited`
  - `assignment_changed`
  - `referral_transferred`
  - `referral_transfer_accepted`
  - `referral_transfer_declined`
  - `referral_transfer_returned`
  - `user_blocked`
  - `user_unblocked`
  - `user_role_changed`

### Validation query
- Confirm transfer actions insert corresponding events.
- Confirm source-facing activity only returns events marked visible.

---

## M6 — Program-aware RLS (staff access)

### Objective
Prepare policies so future program dashboards can share one DB safely.

### Policy intent
Allow staff access when user has active membership and one of:
- referral `current_program_id` matches membership program
- referral `assigned_program_id` matches membership program
- referral `assigned_to_user_id` equals user

Maintain existing referral-source policies for submitters.

### Validation query
- Test with 2 staff users in different programs:
  - each can see own program referrals
  - cannot see unrelated referrals
  - can see directly assigned referrals if cross-program assignment permitted

---

## M7 — Optional helper RPCs (recommended)

### Objective
Reduce app-side race conditions and centralize transfer side-effects.

### Suggested helper functions
- `request_referral_transfer(...)`
- `accept_referral_transfer(...)`
- `decline_referral_transfer(...)`

Each function should:
- update referral routing columns atomically
- write `referral_transfers` row updates
- write `referral_activity_log` event
- update `last_activity_at`

### Validation query
- Call each RPC with test records and verify all side effects in one transaction.

---

## Out-of-scope for v1 prep

- Full admin UI for user management
- Granular permission toggle matrix
- Program-specific intake form divergence for Mental Health/Sober Living
- Public site routing changes for non-live domains

---

## Rollout recommendation

1. Apply M1–M4 in staging.
2. QA exports/dashboard unchanged for existing competency flows.
3. Apply M5–M6 with test users and RLS verification.
4. Keep M7 optional if app-side logic is sufficient initially.

---

## Completion criteria for prep phase

- Current competency referrals still function end-to-end.
- Database is program-aware and transfer-ready.
- Membership model exists (`admin`/`user`) for each program.
- Audit log can represent transfer lifecycle and internal visibility.
- No dependency on mental health/sober websites being live.
