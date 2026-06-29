# Tenant, corporate client, and programs — database reference

**Purpose:** Align on what exists in Supabase today versus the hierarchy we want for admissions profiles, roles, and permissions before P1 work. This doc is based on repository documentation, migration history in this repo, and product intent — **not** a live `pg_dump` of your instance.

**Out of scope for the referral project:** The corporate client **“Alpha Transport”** (and any similar mock transport org) is **not** a real Monarch program or referral tenant. **Driver** roles and transport workflows are **irrelevant**; do not model permissions or UX around them.

---

## 1. Short answer: are we on the same page?

| Your understanding | Accurate? | Notes | Stakeholder confirmation |
|--------------------|-----------|--------|--------------------------|
| There is a `tenant_roles` table but no `tenants` table | **Yes** | Naming is misleading: “tenant” in the table name does **not** imply a sibling `tenants` table exists in this schema. | Understood |
| `corporate_clients` is probably the “tenant” / org dimension | **Mostly** | In a typical scaffold, **corporate org** rows live here. For Monarch referral/admissions, you should treat **one canonical corporate row** (e.g. umbrella Monarch / referral operations client) as the org anchor — **not** mock transport clients. | Understood; Monarch should be the one canonical corporate row |
| `programs` exists but names look mock | **Consistent with reports** | This repo’s tracked **Supabase migrations do not create or seed** `programs` / `corporate_clients` / `tenant_roles` / `role_permissions` / `users` (public). Those tables pre-existed (dashboard SQL, seed scripts, or another repo). Mock slugs/display names should be **replaced or superseded** before trusting them for RLS or UI. | Understood; normalize program slugs when ready: `competency`, `mental_health`, `sober_living`, `launch` |
| Users need correct tenant **and** program relationships before roles | **Yes, as a product goal** | **Today the referral app does not drive access from these tables.** Staff access is largely **email domain** (and app logic); referral rows are not consistently keyed by `program_id` until you add and backfill columns (see §5). | Understood |

---

## 2. Current hierarchy (as implemented in practice)

What **actually** governs referral + admissions behavior **right now**:

```text
auth.users (Supabase Auth)
    └── sign-in identity (email, OAuth)

Referral / portal / dashboard (application layer)
    └── staff: allowed if email matches configured staff domain(s) (e.g. monarchcompetency.com)
    └── referral sources: auth user + RLS/policies tied to submitted_by_user_id / email on referral rows

public.users, corporate_clients, programs, tenant_roles, role_permissions
    └── present in the database per DATABASE.md / introspection
    └── not the source of truth for referral dashboard access in the current codebase
```

So the **effective** hierarchy for development so far is: **Auth user → app gate (domain / session) → referral tables**, not **Auth user → tenant_roles → programs → referrals**.

---

## 3. Intended hierarchy (what you described — target model) 

```text
Organization (umbrella / “corporate” anchor for this product)
    └── Monarch referral & admissions operations (single logical org for this Supabase project is OK)

Programs (business lines / LLCs / sites)
    └── Monarch Competency
    └── Monarch Mental Health
    └── Monarch Sober Living
    └── Monarch Launch
        └── each program: own admissions queue, branding, rules (over time)

Staff identity
    └── auth user
    └── membership: which program(s) they work + role (admin vs user, etc.)
    └── optional: org-level role for cross-program super admin

Referrals
    └── belong to a program (origin / current / intended / assigned as you evolve — see checklist M3)
```

That model matches **`docs/CROSS_PROGRAM_REFERRAL_MIGRATION_CHECKLIST_V1.md`** (canonical `programs` rows, then `staff_program_memberships`, then routing columns on `referral_submissions`).

> **Stakeholder:** I agree with this target model.

---

## 4. Tables you mentioned — roles in the schema (conceptual)

| Table | Likely original intent | Relation to “tenant” |
|-------|------------------------|----------------------|
| **`corporate_clients`** | Row per **corporate / B2B customer** or internal org unit | Closest thing to a **single-org “tenant”** row if you use one Monarch anchor client. **Do not** conflate with “program.” |
| **`programs`** | Row per **program** or product line under a client | Should eventually hold **stable slugs** (`competency`, `mental_health`, …) and display metadata. |
| **`tenant_roles`** | Assign **roles** to a **user** in the context of some **tenant key** (often `corporate_client_id` or similar — **verify in your DB**) | Name suggests `tenants`; if the FK is to `corporate_clients`, mentally read **“org_roles”** not “tenant_roles.” |
| **`role_permissions`** | Map **role** → **permission** strings or flags | Useful once roles are real; unused by current referral RLS in most migrations here. |
| **`users` (public)** | App profile row keyed to auth user (common pattern) | May duplicate or extend `auth.users`; confirm whether triggers keep it in sync. |

**Correction:** There is **no** requirement in PostgreSQL that a table named `tenant_roles` must reference a table named `tenants`. The gap you noticed is a **naming / modeling** issue, not a hidden `tenants` table.

> **Stakeholder:** Understood.

**Question:** Will it be beneficial to correct `corporate_clients` so Monarch is the only row, and to add all correct programs, even if Competency is the only program with an active referral-source login for now? Goal: a real admissions-level user can test how referrals track between programs and to lay a foundation for roles and permission flags.

**Assessment:** **Yes, beneficial** — with two caveats so expectations stay realistic.

1. **Data layer first:** Canonical `corporate_clients` + `programs` rows cost little and unblock M2/M3 (memberships, `current_program_id`, transfer UI dropdowns). Inactive programs can stay `is_active = false` (or equivalent) until those sites go live; slugs still exist for FKs and test users.
2. **App layer second:** Until the dashboard queries filter by `staff_program_memberships` and referral rows carry `current_program_id`, seed data alone will not change what users see. Plan a thin slice: seed tables → add columns + backfill → wire one cross-program test user → then tighten RLS.

---

## 5. What this repo’s migrations actually add (relevant to programs)

Tracked migrations under `supabase/migrations/` focus on **referral workflow**, **portal**, **activity**, **HIPAA audit**, etc. They **do not** define `corporate_clients`, `programs`, `tenant_roles`, or `role_permissions`.

Implications:

- **Program-aware referrals** (which program owns a row) are **planned** in the cross-program checklist (**M1–M3**), not assumed to exist on every column today.
- **`Code/config/monarchProgramCompetency.ts`** is **application-level** deployment config; it is **not** the database `programs` table.

---

## 6. Suggestions before P1 (profiles, roles, permissions)

1. **Canonical data**  
   - Insert or update **`programs`** so slugs match production reality (`competency`, `mental_health`, `sober_living`, `launch`) and **`is_active`** (or equivalent) is meaningful.  
   - Ensure **one** `corporate_clients` row represents the Monarch referral/admissions **organization** you want in RLS (name it clearly in DB comments or `name` field). **Ignore or delete mock transport clients** from any seed logic going forward (DB rows can remain archived if you prefer not to delete history).

   > **Stakeholder:** Agreed; delete mock transport clients and driver roles/permissions.

2. **Staff ↔ program**  
   - Prefer **`staff_program_memberships`** (checklist **M2**) over overloading `tenant_roles` unless you already have a clear mapping from `tenant_roles` to programs.  
   - If you keep `tenant_roles`, document the **exact FK** (which table is the “tenant” column?) and rename in a future migration if it reduces confusion.

   > **Stakeholder:** Prefer `staff_program_memberships`. **Dashboard model:** One admissions shell is reasonable: the **same** dashboard code loads, and **which referrals and actions appear** is driven by the signed-in user’s **program memberships** (and later fine-grained permission flags). User A with only Competency membership sees Competency-scoped lists and actions; User B with memberships for Competency **and** Mental Health sees the **union** (or explicit program filter tabs) — same app, different effective scope. That matches your User A / User B example (use `@monarchcompetency.com` consistently for the domain).  
   > **MVP:** Super admin creates per-program admissions directors; each director manages program users and permission toggles for their program. Cross-program transfer dropdown = all programs (or all programs user may target); assign dropdown = staff for the program **in custody** of the referral (`current_program_id`). Not over-engineered if you implement scope first (membership + `current_program_id`) before a large permission matrix.

3. **Referrals ↔ program**  
   - Add and backfill **`origin_program_id` / `current_program_id`** (M3) when you are ready so dashboards and RLS have a single column to filter on, not only email domain.

   > **Stakeholder:** Agreed.

4. **RLS**  
   - Move from “any authenticated user sees all referrals” to policies that use **`staff_program_memberships`** + **`referral_submissions.current_program_id`** (once populated).  
   - Keep **referral sources** scoped by `submitted_by_user_id` / email as already partially implemented.

   > **Stakeholder:** Agreed. **Alignment with §6.2:** Yes — RLS is how the database **enforces** the same rules the dashboard shows: staff `SELECT`/`UPDATE` on a referral row only if `current_program_id` is in their active `staff_program_memberships` (and optionally extra checks for “assignee” or transfer state). The UI scope you described and RLS should match; app-only filtering without RLS would be insecure.

5. **Driver / transport**  
   - Drop any seed roles or permissions tied to drivers or Alpha Transport from **active** permission checks; if rows exist, mark inactive or exclude with `WHERE corporate_client_id NOT IN (…)` until cleaned up.

   > **Stakeholder:** Agreed.

---

## 7. Implementation order (recommended thin slice)

Execute in order; each step should be **validated** (queries in `docs/CROSS_PROGRAM_REFERRAL_MIGRATION_CHECKLIST_V1.md` where noted) before the next depends on it.

| Step | What | Why |
|------|------|-----|
| **1 — Org + programs (M1)** | One canonical **`corporate_clients`** row for Monarch referral/admissions; **`programs`** rows with stable slugs `competency`, `mental_health`, `sober_living`, `launch` and meaningful **`is_active`**. Follow-ups: `20260514120000_remove_client_monarch_and_prog_monarch_ny.sql`, `20260515120000_remove_driver_dispatch_tenant_roles.sql`, `20260516120000_role_permissions_transport_cleanup.sql`. | FK targets exist; transport mock data and driver RBAC noise cleared; next is M2. |
| **2 — Staff memberships (M2)** | Create **`staff_program_memberships`** (migration); seed real Competency staff (+ optional cross-program test user). **Repo:** `supabase/migrations/20260517120000_m2_staff_program_memberships.sql` (`program_id` **TEXT** to match varchar `programs.id`; switch to `uuid` in that file if your `programs.id` is uuid). | Dashboard and RLS have a single source for “which programs this staff user may see.” |
| **3 — Referral routing columns (M3)** | **`supabase/migrations/20260518120000_m3_referral_program_routing_columns.sql`** — TEXT FKs to `programs`, `transfer_status`, indexes, backfill to Competency. **Deployed backfill (example):** 100% of submitted referrals → **`current_program_id` = `prog_competency`**. | List filters, assignee scope, and RLS key off `current_program_id`. |
| **4 — App** | **Next:** Admissions dashboard loads **`staff_program_memberships`**, filters **`referral_submissions`** where **`current_program_id`** ∈ allowed program ids; transfer/assign dropdowns follow product rules. | DB truth surfaces in UX; prerequisite before step 5 RLS. |
| **5 — RLS** | Replace broad authenticated staff access with policies: **`SELECT`/`UPDATE`** on `referral_submissions` for staff only if `current_program_id` matches an active **`staff_program_memberships`** row for `auth.uid()`. Keep referral-source policies on **`submitted_by_user_id`** / email. | Matches UI scope; blocks direct API access outside membership. |
| **6 — Later** | Fine-grained permission flags (beyond admin/user), M4+ transfer history, optional retirement of **`tenant_roles`** if fully superseded. | Avoid blocking MVP on a large matrix. |

**Rule of thumb:** Do not enable strict staff RLS (step 5) until step 3 backfill and step 4 queries are verified, or you risk locking legitimate staff out of the dashboard.

---

## 8. Appendix — introspection SQL (run in Supabase SQL editor)

Use these to capture **ground truth** for your instance (column names can differ slightly):

**A. Foreign keys from `tenant_roles`**

```sql
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name = 'tenant_roles';
```

**B. Columns for RBAC-related tables**

```sql
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'tenant_roles',
    'role_permissions',
    'corporate_clients',
    'programs',
    'users'
  )
ORDER BY table_name, ordinal_position;
```

**C. Whether `referral_submissions` already has program FKs**

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'referral_submissions'
  AND column_name LIKE '%program%';
```

Paste results into an internal doc or ticket if you want the reference file updated with **exact** column-level truth for your project.

---

## 9. Related docs

- `docs/CROSS_PROGRAM_REFERRAL_MIGRATION_CHECKLIST_V1.md` — M1 program rows, M2 staff memberships, M3 referral routing columns.  
- `docs/REFERRAL_PORTAL_AND_ADMISSIONS_DASHBOARD_CHECKLISTS` — “Schema, tenant model, and roles” section (Monarch umbrella vs programs).  
- `DATABASE.md` — high-level table list (row counts may be stale).  
- `Code/config/monarchProgramCompetency.ts` — **app** deployment constants (not DB `programs`).

---

## Changelog

- **2026-05-10** — Initial reference: tenant vs corporate client vs programs, mock Alpha Transport / drivers out of scope, gap vs target hierarchy, P1-oriented suggestions.
- **2026-05-10** — Stakeholder confirmations and Q&A folded in; §1 table fourth column; §4 benefit assessment; §6.2 dashboard/RLS alignment note.
- **2026-05-10** — §7 implementation order (M1→M2→M3→app→RLS→deferrals); appendix and related-docs sections renumbered to §8–§9.
- **2026-05-10** — M1 migration added: `supabase/migrations/20260513120000_m1_monarch_corporate_client_and_programs.sql`; cross-program checklist M1 links to it.
- **2026-05-14** — Checklist sync: M1 follow-up migrations 20260514–20260516 documented in §7 step 1 and `docs/REFERRAL_PORTAL_AND_ADMISSIONS_DASHBOARD_CHECKLISTS`.
- **2026-05-14** — M2: `supabase/migrations/20260517120000_m2_staff_program_memberships.sql`; cross-program checklist M2 links to it.
- **2026-05-14** — M3: `supabase/migrations/20260518120000_m3_referral_program_routing_columns.sql`; checklist “next” → M4 or app + M6 RLS.
- **2026-05-14** — M3 backfill verified (100% `current_program_id` = `prog_competency`); §7 steps 3–4 table clarified — **next** = app wiring then M6 RLS.
