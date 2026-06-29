-- role_permissions: drop transport/trip/driver permissions, repoint corporate_client,
-- remove rows tied to missing roles or legacy driver role IDs.
-- Table/column layout is not in repo; uses information_schema + guarded statements.

-- ---------------------------------------------------------------------------
-- 1) Remove explicit transport permissions (single string column variants)
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  perms text[] := ARRAY[
    'trips:view',
    'drivers:assign',
    'trips:create',
    'trips:view_own'
  ];
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'role_permissions'
  ) THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'role_permissions' AND column_name = 'permission'
  ) THEN
    DELETE FROM public.role_permissions WHERE permission = ANY(perms);
    DELETE FROM public.role_permissions
    WHERE permission ILIKE 'trips:%' OR permission ILIKE 'drivers:%';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'role_permissions' AND column_name = 'permission_key'
  ) THEN
    DELETE FROM public.role_permissions WHERE permission_key = ANY(perms);
    DELETE FROM public.role_permissions
    WHERE permission_key ILIKE 'trips:%' OR permission_key ILIKE 'drivers:%';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'role_permissions' AND column_name = 'code'
  ) THEN
    DELETE FROM public.role_permissions WHERE code = ANY(perms);
    DELETE FROM public.role_permissions
    WHERE code ILIKE 'trips:%' OR code ILIKE 'drivers:%';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2) Remove transport rows when permission is split resource + action
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'role_permissions' AND column_name = 'resource'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'role_permissions' AND column_name = 'action'
  ) THEN
    DELETE FROM public.role_permissions
    WHERE lower(resource) IN ('trips', 'trip', 'drivers', 'driver', 'dispatch');
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3) Remove rows for legacy driver/dispatch role definitions (same UUIDs as tenant_roles cleanup)
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'role_permissions'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'role_permissions' AND column_name = 'role_id'
  ) THEN
    DELETE FROM public.role_permissions
    WHERE role_id::text IN (
      '5668973e-7d8c-4a40-abba-6cce43a8121f',
      '735a36a9-5685-46b2-8209-a124675711d2'
    );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 4) Repoint corporate_client_id → monarch_referral_admissions when missing or legacy
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'role_permissions'
  ) THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'role_permissions' AND column_name = 'corporate_client_id'
  ) THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.corporate_clients m WHERE m.id::text = 'monarch_referral_admissions'
  ) THEN
    RAISE NOTICE 'role_permissions cleanup: no corporate_clients row id=monarch_referral_admissions; skip repoint';
    RETURN;
  END IF;

  UPDATE public.role_permissions rp
  SET corporate_client_id = m.id
  FROM public.corporate_clients m
  WHERE m.id::text = 'monarch_referral_admissions'
    AND (
      rp.corporate_client_id::text = 'client_monarch'
      OR NOT EXISTS (
        SELECT 1 FROM public.corporate_clients c
        WHERE c.id::text = rp.corporate_client_id::text
      )
    );
END $$;

-- ---------------------------------------------------------------------------
-- 5) Remove role_permissions whose role_id no longer exists in public.roles
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'role_permissions'
  ) THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'role_permissions' AND column_name = 'role_id'
  ) THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'roles'
  ) AND (SELECT COUNT(*) FROM public.roles) > 0 THEN
    DELETE FROM public.role_permissions rp
    WHERE NOT EXISTS (
      SELECT 1 FROM public.roles r WHERE r.id::text = rp.role_id::text
    );
  END IF;
END $$;
