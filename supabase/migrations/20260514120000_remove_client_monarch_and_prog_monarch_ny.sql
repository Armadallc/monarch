-- Consolidate corporate anchor: drop legacy `client_monarch` and mock program `prog_monarch_ny`.
-- Prerequisites: row `monarch_referral_admissions` exists in `corporate_clients` (M1 seed).
-- Uses ::text comparisons for legacy TEXT ids.

-- ---------------------------------------------------------------------------
-- 1) Repoint foreign keys from client_monarch → monarch_referral_admissions
-- ---------------------------------------------------------------------------

UPDATE public.programs p
SET corporate_client_id = m.id
FROM public.corporate_clients m
WHERE p.corporate_client_id::text = 'client_monarch'
  AND m.id::text = 'monarch_referral_admissions';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'tenant_roles'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tenant_roles' AND column_name = 'corporate_client_id'
  ) THEN
    UPDATE public.tenant_roles tr
    SET corporate_client_id = m.id
    FROM public.corporate_clients m
    WHERE tr.corporate_client_id::text = 'client_monarch'
      AND m.id::text = 'monarch_referral_admissions';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'role_permissions'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'role_permissions' AND column_name = 'corporate_client_id'
  ) THEN
    UPDATE public.role_permissions rp
    SET corporate_client_id = m.id
    FROM public.corporate_clients m
    WHERE rp.corporate_client_id::text = 'client_monarch'
      AND m.id::text = 'monarch_referral_admissions';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'users'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'corporate_client_id'
  ) THEN
    UPDATE public.users u
    SET corporate_client_id = m.id
    FROM public.corporate_clients m
    WHERE u.corporate_client_id::text = 'client_monarch'
      AND m.id::text = 'monarch_referral_admissions';
  END IF;
END $$;

-- Optional: tenant_roles keyed by program id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tenant_roles' AND column_name = 'program_id'
  ) THEN
    DELETE FROM public.tenant_roles
    WHERE program_id::text = 'prog_monarch_ny';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2) Remove legacy program row (id or slug)
-- ---------------------------------------------------------------------------

DELETE FROM public.programs
WHERE id::text = 'prog_monarch_ny'
   OR slug::text = 'prog_monarch_ny';

-- ---------------------------------------------------------------------------
-- 3) Remove legacy corporate client row
-- ---------------------------------------------------------------------------

DELETE FROM public.corporate_clients
WHERE id::text = 'client_monarch';
