# Admin shell, Auth Gateway, and DB-driven help / FAQ (reference)

Working notes for a future **admin CMS** on **`/admin`** (or a subpath). **Today:** `/admin` is the **staff AuthGateway** sign-in page (bookmark only, not in nav). **Later:** the same slug may host CMS/help tools behind the same staff gate, or CMS may move to a different path—see milestones below.

**Product boundary:** this admin surface is **not** a general-purpose or PHI-facing control center. It does **not** manage clinical/referral row data for admins’ day-to-day work—that stays in **ReferralDashboard** / portal with normal RLS. The admin app is a **bounded GUI**: staff/role **assignment**, optional **super-admin-only** permission overrides, **audit** of those changes, and **CMS** for internal-facing copy and notices.

Implementation order stays aligned with **`docs/REFERRAL_PORTAL_AND_ADMISSIONS_DASHBOARD_CHECKLISTS`** (staging sign-off before heavy RLS).

---

## Three layers: definition vs assignment vs CMS

| Layer | Who changes it | What it is | Admin GUI |
|--------|----------------|------------|-----------|
| **Definition** | Developers (migrations/releases) | `permissions` (stable rows / `permission_key`), `roles` / role bundles, `role_permissions` junction—what each bundle *means* | **No.** Admins cannot create permissions or alter cap tables. |
| **Assignment** | Super admin, corp/program ops (as you allow) | `user_roles` (attach user ↔ existing role IDs). Optional `user_permission_overrides` (attach user ↔ existing permission IDs, **super admin only**) | **Yes.** Pick user → assign role bundle(s) → super admin may toggle overrides from a checklist. Prefer **roles as default**; overrides rare, ideally **time-bounded** and/or **reason + audit**. |
| **CMS** | Editors you designate (tier TBD) | FAQ, help copy, **banner / notice** blocks: draft vs published, `surface` (+ optional `program_id`), no PHI | **Yes** for allowed editors; RLS separates **read published** from **write**. |

**Enforcement:** meaning of permissions lives in **RLS / RPC**, not in the UI. The GUI only mirrors assignment; the database still decides whether a given user can run a query.

---

## CMS scope (internal tools only)

CMS is **not** for general marketing website content. It targets **internal operational** communication and evolving product help:

- **Primary:** **ReferralDashboard** — FAQs, help copy, banners / notices (e.g. intake delays, process changes).
- **Possible, lower priority:** **ReferralSourcePortal** — same pattern if you decide portal users need staff-edited notices/help without a deploy.

Surfaces in schema should reflect that (e.g. `admissions_dashboard`, `referral_source_portal`), not a public-site CMS.

---

## Goals (draft)

- Manage **FAQ** and **help / support** copy per `surface` (and optionally per program).
- **Banner / alert** style notices for staff (and portal if enabled).
- Same pattern for other **published, non-PHI** blocks without redeploying Framer for every tweak.
- Optional later: **program-scoped** editors with RLS keyed by `program_id` + `staff_program_memberships`.

---

## MVP role bundles (operational)

Role bundles should mirror **internal operational roles**. **Prefer bundles** over many ad-hoc per-user toggles; use overrides only when truly necessary (super admin only).

| Role (bundle) | Intent (MVP) |
|----------------|----------------|
| **Admissions staff** (`staff_program_memberships.role = user`) | Full referral dashboard for approved programs — no permission matrix. |
| **Admissions admin** (`role = admin`) | Same dashboard + **staff allowlist** (add / block `@monarchcompetency.com` users) + portal source block. |
| **Super admin** (seeded allowlist, Option B) | Break-glass + **assign/revoke admissions admin**; not editable in admissions admin UI. |

**Later (only if product proves the need):**

- **Program admin** — e.g. decides who may access the dashboard for a program, coordinates with super admin on `@monarch` allowlisting and role bundle. Implement when workflow demands it.
- **Corporate admin** — analytics / oversight (timeliness, comms patterns, aggregates). **Likely defer:** often satisfied by reporting you build for program admins; corporate may never need a login if they do not ask for one.

After production use, add new bundles only when permissions **meaningfully differ** from these three—avoid one-off permission spaghetti.

---

## Architecture sketch

| Layer | Role |
|--------|------|
| **`/admin` page** | Custom UI; Auth Gateway; access limited to roles you allow (super admin for overrides and sensitive assignment; optionally program ops for CMS only—decide per screen). |
| **Postgres** | Definition tables (permissions, roles, role_permissions); assignment tables (`user_roles`, optional `user_permission_overrides`); CMS tables (`help_support_pages`, `faq_items`, banner rows). |
| **RLS** | Published CMS: `SELECT` for staff/portal apps on **published** rows only; writes for editors. Assignment writes restricted by role. **No service role in browser.** |
| **Consumers** | ReferralDashboard (primary); ReferralSourcePortal (optional); Framer copies as today. |
| **Audit** | **Assignment layer:** append-only or history for grant/revoke of roles and overrides (who, when, optional reason). **CMS:** `updated_by` / optional `content_versions` for accountability. |

---

## Implementation priority (suggested)

1. **P0 — RLS + definition seed** — Permissions and role bundles exist in DB; dashboard behavior enforced by policies/RPCs; MVP bundles match Admissions staff / Case manager / Super admin.
2. **P1 — Assignment UI + audit** — `user_roles` management; `user_permission_overrides` **super admin only**; audit log for all assignment changes.
3. **P2 — CMS read path** — Published FAQ + help + banners for **ReferralDashboard**; editors + RLS; no drafts leaked to non-admin reads.
4. **P3 — CMS writes UI** — `/admin` or embedded screen for designated editors (may be super admin only at first).
5. **P4 — Optional** — Portal-facing CMS; program-scoped editors; corporate / analytics role if needed.

---

## Open questions (fill in as you go)

1. **Super admin source of truth** — Email allowlist vs `tenant_roles` vs JWT claims vs metadata? (Pick one for checks in RLS/RPC.)
2. **Program scope v1 for CMS** — Global-only first, or `program_id` from day one?
3. **Rich text** — Plain text / markdown only (simpler, safer) vs sanitized HTML?
4. **Framer** — Duplicate TSX under `Code/Framer/` vs single bundle; confirm **read** paths use anon/authenticated key with **tight** RLS.
5. **Caching** — Read on mount vs Edge Function TTL vs client cache keyed on `updated_at`.
6. **Staging vs prod** — Separate Supabase projects preferred over a single `environment` column.

---

## Schema ideas (not migrated until you approve)

```text
-- Definition (migration-maintained; not admin-editable)
permissions (id, permission_key unique, description)
roles (id, role_key unique, label)
role_permissions (role_id, permission_id) PK (role_id, permission_id)

-- Assignment (admin GUI)
user_roles (user_id, role_id, …)  -- unique per user/role as appropriate
user_permission_overrides (user_id, permission_id, …)  -- super admin only via RLS/RPC

-- Optional: assignment_audit (append-only)
-- actor_id, target_user_id, action, payload jsonb, reason text nullable, created_at

-- CMS
help_support_pages
  id, surface (e.g. admissions_dashboard | referral_source_portal)
  program_id (nullable FK → programs)
  title, body_markdown, support_phone, support_email, extra_links jsonb
  published_at, updated_at, updated_by (uuid nullable)

faq_items
  id, surface (or program_id), sort_order int, question text, answer text
  is_published boolean, created_at, updated_at, updated_by

-- Banners/notices: separate table or boolean flags on help_support_pages — decide
```

Indexes: `(surface, program_id, is_published)` for CMS list queries.

---

## Security checklist (before build)

- [ ] No **service role** key in Framer or browser admin page.
- [ ] Admin / assignment / CMS writes go through **authenticated** user + **RLS** (or narrow `SECURITY DEFINER` RPC with explicit role checks).
- [ ] Published **read** policies cannot leak drafts (`is_published = false` hidden from non-editors).
- [ ] **Override** mutations: **super admin** only, same in RLS as in UI.
- [ ] Rate limit / size limits on text fields to avoid abuse.
- [ ] Admin dashboard **stores and displays no PHI**; staff directory (name, email, membership) is scoped and audited.

---

## Related repo pointers

- Staff gate patterns: `Code/OAuth/AuthGateway.tsx`, `Code/config/monarchProgramCompetency.ts` (`staffEmailDomains`).
- Portal / dashboard help placeholders: checklist §P0 **Help / support** (admissions + portal).
- Multi-program context: `docs/CROSS_PROGRAM_REFERRAL_MIGRATION_CHECKLIST_V1.md`, `docs/TENANT_AND_PROGRAM_DATABASE_REFERENCE.md`.

---

## Referral form step rail (reuse)

Competency **`Code/Framer/ReferralForm.tsx`** now ships a **vertical step rail** (desktop) and **horizontal scroller** (mobile) with short labels and dot states driven by `referralFormStepHasIssues` (extend per step as validation tightens). Copy the pattern for Sober Living / Mental Health application forms: same component shape, different `STEP_TITLES` / short labels / `stepHasIssues` map.

---

*Last updated: 2026-05-15 — Added definition vs assignment vs CMS, CMS internal-tool scope, MVP role bundles, implementation priority, assignment audit note.*
