# Supabase connection

This project uses Supabase for database, authentication, and storage. Forms and dashboard are pasted into Framer as code components; Framer does not use this repo’s build or env at runtime.

## Connection

- **Same project**: If you use the existing Monarch Competency Supabase project, the copied TSX files currently hardcode URL and anon key. For production, configure Supabase in Framer (e.g. Framer’s env or code overrides) and avoid committing the anon key in this repo when you centralize config later.
- **New project**: Create a Supabase project, then set `SUPABASE_URL` and `SUPABASE_ANON_KEY` in a local `.env` (see `.env.example`). For Framer, supply the same URL and anon key via Framer’s mechanism; do not commit `.env` or real keys.

## Security

- **Do not commit** the Supabase anon key (or service role key) in this repo. Use `.env` locally (gitignored) and Framer’s config for the live site.
- The **Google/** folder contains OAuth client credentials and is gitignored; keep it out of version control.

## Database

- Run migrations in the Supabase SQL Editor when needed. Migration files live in `Code/Database/`.
- See `docs/DATABASE.md` for schema and table reference.
