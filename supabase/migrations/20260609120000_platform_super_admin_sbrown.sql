-- Point platform super admin at the real break-glass account (replaces placeholder sefe@).

CREATE OR REPLACE FUNCTION public.is_platform_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.monarch_staff_jwt_email() IN (
    'sbrown@monarchcompetency.com'
  );
$$;

COMMENT ON FUNCTION public.is_platform_super_admin() IS
  'Option B break-glass allowlist. Add backup emails via migration only — not editable in admissions admin UI.';
