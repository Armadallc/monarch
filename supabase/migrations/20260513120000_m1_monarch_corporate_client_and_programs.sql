-- M1 — Canonical Monarch corporate client + programs (referral project).
-- Idempotent: safe to re-run.
--
-- Intended shape (see docs/TENANT_AND_PROGRAM_DATABASE_REFERENCE.md):
--   corporate_clients: id, name, created_at, updated_at
--   programs: id, corporate_client_id → corporate_clients, slug (unique), name, is_active
--
-- If your instance already has these tables with different column names, run the
-- introspection queries in docs/TENANT_AND_PROGRAM_DATABASE_REFERENCE.md §8 and
-- adjust this file once before applying.

-- ---------------------------------------------------------------------------
-- 1) Tables (create only when missing)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.corporate_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.corporate_clients IS 'Org anchor for Monarch referral & admissions (umbrella client; not a clinical program).';

CREATE TABLE IF NOT EXISTS public.programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_client_id UUID NOT NULL REFERENCES public.corporate_clients(id) ON DELETE RESTRICT,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true
);

COMMENT ON TABLE public.programs IS 'Monarch programs; stable slug for staff_program_memberships and referral routing (M2–M3).';

-- Legacy instances: ensure columns exist if `programs` predates this migration.
ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS corporate_client_id UUID,
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- FK from programs → corporate_clients (ignore if already present)
DO $$
BEGIN
  ALTER TABLE public.programs
    ADD CONSTRAINT programs_corporate_client_id_fkey
    FOREIGN KEY (corporate_client_id) REFERENCES public.corporate_clients(id) ON DELETE RESTRICT;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_programs_slug_unique ON public.programs (slug);

-- ---------------------------------------------------------------------------
-- 2) Remove mock transport org (Alpha Transport) and program rows tied to it
-- ---------------------------------------------------------------------------
-- Legacy schemas sometimes use TEXT primary keys (e.g. id = 'client_alpha').
-- Compare FKs via ::text so we never cast those values into UUID variables.
-- Delete child rows first: tenant_roles → role_permissions → programs → corporate_clients.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'tenant_roles'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tenant_roles' AND column_name = 'corporate_client_id'
  ) THEN
    DELETE FROM public.tenant_roles tr
    USING public.corporate_clients c
    WHERE c.name ILIKE '%alpha%transport%'
      AND tr.corporate_client_id::text = c.id::text;
  END IF;
END $$;

-- role_permissions FKs to corporate_clients (e.g. mock Alpha Transport client).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'role_permissions'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'role_permissions' AND column_name = 'corporate_client_id'
  ) THEN
    DELETE FROM public.role_permissions rp
    USING public.corporate_clients c
    WHERE c.name ILIKE '%alpha%transport%'
      AND rp.corporate_client_id::text = c.id::text;
  END IF;
END $$;

DELETE FROM public.programs p
USING public.corporate_clients c
WHERE c.name ILIKE '%alpha%transport%'
  AND p.corporate_client_id::text = c.id::text;

DELETE FROM public.corporate_clients c
WHERE c.name ILIKE '%alpha%transport%';

-- ---------------------------------------------------------------------------
-- 3) Seed Monarch client + four canonical programs
-- ---------------------------------------------------------------------------
-- Legacy `corporate_clients` may have no DEFAULT on `id` (TEXT slugs like
-- `client_alpha` supplied explicitly). Supply `id` explicitly by column type.

DO $$
DECLARE
  v_name text := 'Monarch Referral & Admissions';
  id_dt text;
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.corporate_clients c
    WHERE lower(trim(c.name)) = lower(trim(v_name))
  ) THEN
    RETURN;
  END IF;

  SELECT c.data_type INTO id_dt
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'corporate_clients'
    AND c.column_name = 'id';

  IF id_dt = 'uuid' THEN
    INSERT INTO public.corporate_clients (id, name)
    VALUES (gen_random_uuid(), v_name);
  ELSIF id_dt IN ('text', 'character varying') THEN
    INSERT INTO public.corporate_clients (id, name)
    VALUES ('monarch_referral_admissions', v_name);
  ELSE
    RAISE EXCEPTION 'M1 seed: corporate_clients.id type % is not handled; set id manually or extend migration', id_dt;
  END IF;
END $$;

-- `programs.id` may also have no DEFAULT (legacy). Supply explicit `id` and
-- match `corporate_client_id` type to the column (uuid vs text).

DO $$
DECLARE
  pid_dt text;
  cc_dt text;
  mc_id text;
  r record;
BEGIN
  SELECT c.data_type INTO pid_dt
  FROM information_schema.columns c
  WHERE c.table_schema = 'public' AND c.table_name = 'programs' AND c.column_name = 'id';

  SELECT c.data_type INTO cc_dt
  FROM information_schema.columns c
  WHERE c.table_schema = 'public' AND c.table_name = 'programs' AND c.column_name = 'corporate_client_id';

  SELECT mc.id::text INTO mc_id
  FROM public.corporate_clients mc
  WHERE lower(trim(mc.name)) = lower(trim('Monarch Referral & Admissions'))
  LIMIT 1;

  IF mc_id IS NULL THEN
    RAISE EXCEPTION 'M1 seed: Monarch corporate client row not found (expected name: Monarch Referral & Admissions).';
  END IF;

  FOR r IN
    SELECT * FROM (
      VALUES
        ('competency'::text, 'Monarch Competency'::text, true::boolean),
        ('mental_health', 'Monarch Mental Health', false),
        ('sober_living', 'Monarch Sober Living', false),
        ('launch', 'Monarch Launch', false)
    ) AS t(slug, pname, active)
  LOOP
    IF pid_dt = 'uuid' AND cc_dt = 'uuid' THEN
      INSERT INTO public.programs (id, corporate_client_id, slug, name, is_active)
      VALUES (gen_random_uuid(), mc_id::uuid, r.slug, r.pname, r.active)
      ON CONFLICT (slug) DO UPDATE SET
        corporate_client_id = EXCLUDED.corporate_client_id,
        name = EXCLUDED.name,
        is_active = EXCLUDED.is_active;
    ELSIF pid_dt = 'uuid' AND cc_dt IN ('text', 'character varying') THEN
      INSERT INTO public.programs (id, corporate_client_id, slug, name, is_active)
      VALUES (gen_random_uuid(), mc_id, r.slug, r.pname, r.active)
      ON CONFLICT (slug) DO UPDATE SET
        corporate_client_id = EXCLUDED.corporate_client_id,
        name = EXCLUDED.name,
        is_active = EXCLUDED.is_active;
    ELSIF pid_dt IN ('text', 'character varying') AND cc_dt IN ('text', 'character varying') THEN
      INSERT INTO public.programs (id, corporate_client_id, slug, name, is_active)
      VALUES ('prog_' || r.slug, mc_id, r.slug, r.pname, r.active)
      ON CONFLICT (slug) DO UPDATE SET
        corporate_client_id = EXCLUDED.corporate_client_id,
        name = EXCLUDED.name,
        is_active = EXCLUDED.is_active;
    ELSIF pid_dt IN ('text', 'character varying') AND cc_dt = 'uuid' THEN
      INSERT INTO public.programs (id, corporate_client_id, slug, name, is_active)
      VALUES ('prog_' || r.slug, mc_id::uuid, r.slug, r.pname, r.active)
      ON CONFLICT (slug) DO UPDATE SET
        corporate_client_id = EXCLUDED.corporate_client_id,
        name = EXCLUDED.name,
        is_active = EXCLUDED.is_active;
    ELSE
      RAISE EXCEPTION 'M1 seed: programs id type % + corporate_client_id type % not handled; extend migration', pid_dt, cc_dt;
    END IF;
  END LOOP;
END $$;

-- Validation (run manually in SQL editor after migrate):
-- SELECT slug, name, is_active FROM public.programs ORDER BY slug;
-- SELECT id, name FROM public.corporate_clients ORDER BY name;
