# Supabase connection

This project uses Supabase for database, authentication, and storage. Forms and dashboard are pasted into Framer as code components; Framer does not use this repo’s build or env at runtime.

## CLI: link this repo to the cloud project

Tracked config lives in **`supabase/config.toml`** (from `supabase init`). Linking connects the CLI to your **remote** database for commands like `db pull`, `db push`, and migration status.

1. Install the [Supabase CLI](https://supabase.com/docs/guides/cli).
2. Log in: `supabase login`
3. From the repo root:  
   `supabase link --project-ref esbmnympligtknhtkary`  
   Use the **database password** from the dashboard: **Project Settings → Database** (not your Supabase account password).
4. Confirm: `supabase projects list` or run a read-only command you are comfortable with.

Linked session data is written under **`supabase/.temp/`**, which is **gitignored** — each developer runs `link` on their machine. The project ref above is safe to commit; passwords and keys are not.

## Migration workflow (source of truth = Git)

**Goal:** Remote Supabase stays in lockstep with **`supabase/migrations/`** in this repo. After each sprint or major schema change, apply pending migrations from a **linked** clone.

1. **Link** (once per machine): see above (`supabase link --project-ref …`).
2. **Review** pending files: `ls supabase/migrations`
3. **Apply to remote:** from repo root  
   `supabase db push`  
   This runs migrations that are not yet recorded in the remote migration history table.

**Cadence:** Run `db push` after merges that add or change migrations (e.g. end of sprint), or in CI against a **staging** project first if you adopt branching.

**If the remote migration table is empty but the database already has objects** (historical SQL Editor applies): the first `db push` may try to replay old migrations and fail with “already exists.” Options: use [`supabase migration repair`](https://supabase.com/docs/reference/cli/supabase-migration-repair) to mark versions as applied, or apply only **new** files via SQL Editor once, then use `db push` going forward. Prefer getting onto **CLI-applied migrations only** to avoid drift.

**Do not** hand-edit production without a matching file in `supabase/migrations/` unless you immediately follow up with a migration that matches reality (or a doc that states an exception).

### Policy

- **Going forward:** apply new migrations with **`supabase db push`** only (linked project), after review—especially after sprints or merges that touch `supabase/migrations/`.
- **Exception (rare):** SQL Editor is OK for emergencies; then **log the apply** in the table below and run **`supabase migration repair`** so the next `db push` does not try to run the same file twice.

### Applied migrations log (remote `esbmnympligtknhtkary`)

| Migration file (repo) | Applied on DB | How |
|------------------------|---------------|-----|
| `20260520120000_align_referral_submissions_status_and_source_type_checks.sql` | Yes (P0 status + `referral_source_type` CHECKs) | **Supabase SQL Editor** (manual run; same SQL as in repo) |

**Before your next `supabase db push`:** mark this version as applied in the remote migration history so the CLI skips it:

```bash
supabase migration repair 20260520120000 --status applied
```

If your CLI expects a longer version string, run `supabase migration list --linked -p "$SUPABASE_DB_PASSWORD"` and use the **14-digit** `version` value (filename prefix before `_`), e.g. `20260520120000`.

### Migration version format

Files under **`supabase/migrations/`** use the Supabase convention **`YYYYMMDDHHmmss_description.sql`** (14-digit UTC-style prefix, unique per file). To see what the linked remote has recorded:

- Run **`supabase/queries/inspect_remote_migration_history.sql`** in the SQL Editor, or  
- `supabase migration list --linked -p "$SUPABASE_DB_PASSWORD"`.

**After a bulk rename:** legacy rows in `schema_migrations` may use old version strings that no longer match local files. Inspect first, then mark each **14-digit** local prefix as applied (only if that migration’s SQL is already on the database):

```bash
cd /Users/sefebrun/Projects/MonarchWebsites
set -a && source .env && set +a
for f in supabase/migrations/*.sql; do
  v=$(basename "$f" .sql | sed -E 's/^([0-9]{14})_.*/\1/')
  echo "repair $v"
  supabase migration repair "$v" --status applied --linked -p "$SUPABASE_DB_PASSWORD" --yes
done
supabase db push -p "$SUPABASE_DB_PASSWORD" --yes
```

If a `repair` errors because the version is already recorded, continue; then `db push` should apply only migrations that are genuinely missing on the remote.

## Connection

- **Same project**: If you use the existing Monarch Competency Supabase project, the copied TSX files currently hardcode URL and anon key. For production, configure Supabase in Framer (e.g. Framer’s env or code overrides) and avoid committing the anon key in this repo when you centralize config later.
- **New project**: Create a Supabase project, then set `SUPABASE_URL` and `SUPABASE_ANON_KEY` in a local `.env` (see `.env.example`). For Framer, supply the same URL and anon key via Framer’s mechanism; do not commit `.env` or real keys.

## Security

- **Do not commit** the Supabase anon key (or service role key) in this repo. Use `.env` locally (gitignored) and Framer’s config for the live site.
- The **Google/** folder contains OAuth client credentials and is gitignored; keep it out of version control.

## Database

- **Migrations in Git** live under **`supabase/migrations/`**. Preferred apply path: **`supabase db push`** from a linked project (see **Migration workflow** above). SQL Editor is for one-offs only; reconcile into a migration file afterward.
- Older ad-hoc SQL may still live under `Code/Database/`; prefer new work in `supabase/migrations/` when possible.
- See `docs/DATABASE.md` for schema and table reference (may lag the live DB; refresh from the dashboard or a schema dump when needed).
