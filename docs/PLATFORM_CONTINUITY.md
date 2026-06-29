# Platform continuity — Monarch referral dashboard & portal

Living handoff document for who owns what, how access works, and what to do when someone leaves. **Keep at least two platform super admins on file.**

**Production hosting plan (Framer marketing + Vercel app):** [`PRODUCTION_STRATEGY_FRAMER_VERCEL.md`](PRODUCTION_STRATEGY_FRAMER_VERCEL.md) — includes marketing-first go-live and clinical app sign-off sheets.

---

## 1. Systems map

| System | Purpose | Primary repo / URL |
|--------|---------|-------------------|
| **Supabase** | Auth, Postgres, RLS, Edge Functions, storage | Project dashboard + `supabase/migrations/` |
| **Framer** | Public marketing sites, Auth Gateway, embedded dashboard/portal code components | Monarch Framer workspace |
| **GitHub** | Source of truth for SQL, Framer code exports, docs | This repository |
| **Google Workspace** | `@monarchcompetency.com` identity for staff OAuth | Admin console |
| **DocuSeal** | ROI / application e-sign | DocuSeal dashboard |

Staff admissions UI: `/admin` (Auth Gateway → `ReferralDashboard` code component).  
Referral sources: program portal routes (Auth Gateway → `ReferralSourcePortal`).

---

## 2. Access model (v1)

### Staff (`@monarchcompetency.com`)

1. **Auth Gateway** — any `@monarchcompetency.com` Google account may authenticate.
2. **Dashboard choke** — only users with an **active** row in `staff_program_memberships` for the program may load the admissions dashboard.
3. **Roles** (no case-manager tier in v1):
   - **Admissions staff** (`role = user`) — full dashboard for approved programs.
   - **Admissions admin** (`role = admin`) — same dashboard + manage staff allowlist (add / block `user` rows).
   - **Super admin** (Option B) — break-glass; only super admins may grant or revoke `role = admin`. Seeded allowlist, not editable in the admissions admin UI.

Schema: `supabase/migrations/20260517120000_m2_staff_program_memberships.sql`.

### Referral source portal

- Separate auth path (non-`@monarch` emails allowed per program policy).
- Bad actors: set `referral_source_profiles.profile_deactivated_at` (see `20260525120000_referral_source_portal_terms_and_deactivate.sql`).
- Workflow: locate referral & user → block portal profile → archive fake referral in staff dashboard.

---

## 3. People & roles (fill in and update)

| Role | Name | Email | Notes |
|------|------|-------|-------|
| **Super admin** | _[owner]_ | sbrown@monarchcompetency.com | Platform owner; assigns admissions admins |
| **Super admin (backup)** | _[name]_ | _[email]_ | **Required second break-glass contact** |
| **Admissions admin (Competency)** | Claire Baldwin | claire@monarchcompetency.com | Director of Ops — staff allowlist |
| **Admissions staff (Competency)** | Christina Fleishman | cfleishman@monarchcompetency.com | Primary admissions user |
| **Framer / site editor** | _[name]_ | _[email]_ | Publishes code component updates |
| **Supabase org admin** | _[name]_ | _[email]_ | Billing, backups, service role rotation |

---

## 4. Credentials & secrets (do not store values here)

Document **where** secrets live, not the secrets themselves.

| Secret | Location | Rotated by |
|--------|----------|------------|
| Supabase service role | Supabase dashboard → Settings → API | Super admin |
| Supabase anon key | Framer env / `.env` (local) | Super admin |
| Google OAuth client | Google Cloud Console | Super admin |
| DocuSeal API key | Supabase secrets / Edge env | Super admin |
| GitHub deploy tokens | GitHub → Settings → Secrets | Super admin |

---

## 5. Onboarding a new admissions staff member

1. Admissions admin adds email in **Administration** (playground: staff allowlist; production: `staff_program_memberships` insert + magic invite).
2. New hire signs in at **`/admin`** with their `@monarchcompetency.com` Google account.
3. Confirm they see the correct program scope and Cases load.
4. Add to internal SOP / Slack channel list (see `docs/ADMISSIONS_STAFF_ONBOARDING_AND_SOP.md`).

---

## 6. Offboarding / blocking staff

1. Admissions admin sets membership `status = blocked` (do not delete the row — audit trail).
2. Confirm user receives access-denied at dashboard gate on next login.
3. Reassign open referrals in Cases before or immediately after block.
4. Optional: revoke Google Workspace account via IT (separate from dashboard block).

---

## 7. Promoting / demoting admissions admin

**Super admin only.**

1. Update `staff_program_memberships.role` to `admin` or `user` for the target program.
2. Confirm target user sees **Administration** in sidebar (admin) or loses it (user).
3. Record change in team comms.

---

## 8. Super admin succession

If the primary super admin is unavailable:

1. Backup super admin uses seeded allowlist access (migration / env `PLATFORM_SUPER_ADMIN_EMAILS`).
2. Promote a trusted admissions admin to `role = admin` if needed.
3. Add a new backup super admin email via migration + deploy (Option B — not self-service in UI).
4. Update **Section 3** of this document.

---

## 9. Deploy / release checklist (dashboard change)

1. Merge PR in GitHub with Framer component + migration changes.
2. Apply new Supabase migrations (`supabase db push` or CI).
3. Paste updated code components into Framer (see `Code/Framer/README.md`).
4. Publish Framer site.
5. Smoke test: staff login, portal login, one referral status change, one message send.

---

## 10. Disaster recovery contacts

| Scenario | First action | Escalation |
|----------|--------------|------------|
| Dashboard down / blank | Check Framer publish + browser console | Super admin |
| Auth loop at `/admin` | Check Auth Gateway + Supabase auth settings | Super admin |
| Data concern / HIPAA question | Preserve logs; no ad-hoc deletes | Super admin + compliance lead |
| Locked out of Supabase | Backup super admin account | Supabase support |

---

## 11. Playground reference

Local UI prototype: `Code/playground/dashboard-ui/`

- **Staff session** dropdown simulates personas (super admin, Claire, Christina, blocked, unapproved).
- **Administration** sidebar view mirrors production allowlist + portal block workflows (mock invites).

Run: `cd Code/playground/dashboard-ui && npm run dev`

---

## 12. Document maintenance

- **Review quarterly** or when staff roles change.
- **Update Section 3** within 48 hours of any admin change.
- Last updated: _2026-06-08_ — Step 5 production wiring: migration `20260608140000_staff_memberships_rls_and_admin_rpcs.sql`, `ReferralDashboard` access gate + Administration tab.
