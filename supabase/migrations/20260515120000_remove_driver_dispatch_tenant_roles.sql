-- Remove driver/dispatch-related assignments from tenant_roles.
-- UUIDs are role or assignment identifiers from legacy mock transport setup.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'tenant_roles'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'tenant_roles' AND column_name = 'id'
    ) THEN
      DELETE FROM public.tenant_roles
      WHERE id::text IN (
        '5668973e-7d8c-4a40-abba-6cce43a8121f',
        '735a36a9-5685-46b2-8209-a124675711d2'
      );
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'tenant_roles' AND column_name = 'role_id'
    ) THEN
      DELETE FROM public.tenant_roles
      WHERE role_id::text IN (
        '5668973e-7d8c-4a40-abba-6cce43a8121f',
        '735a36a9-5685-46b2-8209-a124675711d2'
      );
    END IF;
  END IF;
END $$;
