-- M2b — staff_program_memberships RLS + admissions admin RPCs (Option B super-admin allowlist).
-- Playground parity: staff allowlist, block/restore, super-admin-only admin role, portal source block.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.monarch_staff_jwt_email()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lower(trim(COALESCE(auth.jwt() ->> 'email', '')));
$$;

COMMENT ON FUNCTION public.monarch_staff_jwt_email() IS
  'Lowercase staff email from JWT; used by dashboard access helpers.';

-- Option B — add backup super admins via migration (not editable in admissions admin UI).
CREATE OR REPLACE FUNCTION public.is_platform_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.monarch_staff_jwt_email() IN (
    'sefe@monarchcompetency.com'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admissions_admin_for_program(p_program_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_platform_super_admin()
    OR EXISTS (
      SELECT 1
      FROM public.staff_program_memberships spm
      WHERE spm.user_id = auth.uid()
        AND spm.program_id::text = p_program_id
        AND spm.role = 'admin'
        AND spm.status = 'active'
    );
$$;

CREATE OR REPLACE FUNCTION public.has_active_staff_dashboard_access()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_platform_super_admin()
    OR EXISTS (
      SELECT 1
      FROM public.staff_program_memberships spm
      WHERE spm.user_id = auth.uid()
        AND spm.status = 'active'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_staff_dashboard_blocked()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT public.is_platform_super_admin()
    AND NOT public.has_active_staff_dashboard_access()
    AND EXISTS (
      SELECT 1
      FROM public.staff_program_memberships spm
      WHERE spm.user_id = auth.uid()
    );
$$;

-- ---------------------------------------------------------------------------
-- RLS — staff_program_memberships
-- ---------------------------------------------------------------------------

ALTER TABLE public.staff_program_memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS staff_program_memberships_select_own ON public.staff_program_memberships;
CREATE POLICY staff_program_memberships_select_own
  ON public.staff_program_memberships
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS staff_program_memberships_select_admin ON public.staff_program_memberships;
CREATE POLICY staff_program_memberships_select_admin
  ON public.staff_program_memberships
  FOR SELECT
  USING (public.is_admissions_admin_for_program(program_id::text));

-- Mutations go through SECURITY DEFINER RPCs below.

-- ---------------------------------------------------------------------------
-- Admin RPCs — staff allowlist
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.list_staff_program_memberships_admin(p_program_id TEXT)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  email TEXT,
  display_name TEXT,
  role TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admissions_admin_for_program(p_program_id) THEN
    RAISE EXCEPTION 'Not authorized to view staff for this program';
  END IF;

  RETURN QUERY
  SELECT
    spm.id,
    spm.user_id,
    lower(u.email::text) AS email,
    COALESCE(asp.display_name, split_part(lower(u.email::text), '@', 1)) AS display_name,
    spm.role,
    spm.status,
    spm.created_at,
    spm.updated_at
  FROM public.staff_program_memberships spm
  INNER JOIN auth.users u ON u.id = spm.user_id
  LEFT JOIN public.admissions_staff_profiles asp ON asp.user_id = spm.user_id
  WHERE spm.program_id::text = p_program_id
  ORDER BY lower(u.email::text);
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_staff_program_membership(
  p_email TEXT,
  p_program_id TEXT,
  p_role TEXT DEFAULT 'user'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT := lower(trim(p_email));
  v_user_id UUID;
  v_role TEXT := lower(trim(COALESCE(p_role, 'user')));
  v_row public.staff_program_memberships%ROWTYPE;
BEGIN
  IF NOT public.is_admissions_admin_for_program(p_program_id) THEN
    RAISE EXCEPTION 'Not authorized to manage staff for this program';
  END IF;

  IF v_email IS NULL OR v_email = '' OR v_email NOT LIKE '%@monarchcompetency.com' THEN
    RAISE EXCEPTION 'Staff email must be @monarchcompetency.com';
  END IF;

  IF v_role NOT IN ('user', 'admin') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;

  IF v_role = 'admin' AND NOT public.is_platform_super_admin() THEN
    RAISE EXCEPTION 'Only platform super admins may assign admissions admin role';
  END IF;

  SELECT u.id INTO v_user_id
  FROM auth.users u
  WHERE lower(u.email::text) = v_email
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'ok', false,
      'code', 'user_not_found',
      'message', 'No account for this email yet. Ask them to sign in once at /admin, then add again.'
    );
  END IF;

  INSERT INTO public.staff_program_memberships (user_id, program_id, role, status, created_by_user_id, updated_by_user_id)
  VALUES (v_user_id, p_program_id, v_role, 'active', auth.uid(), auth.uid())
  ON CONFLICT (user_id, program_id)
  DO UPDATE SET
    role = EXCLUDED.role,
    status = 'active',
    updated_at = now(),
    updated_by_user_id = auth.uid()
  RETURNING * INTO v_row;

  RETURN jsonb_build_object(
    'ok', true,
    'membership_id', v_row.id,
    'user_id', v_row.user_id,
    'email', v_email,
    'role', v_row.role,
    'status', v_row.status
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.set_staff_program_membership_status(
  p_membership_id UUID,
  p_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.staff_program_memberships%ROWTYPE;
  v_status TEXT := lower(trim(p_status));
BEGIN
  IF v_status NOT IN ('active', 'blocked') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  SELECT * INTO v_row
  FROM public.staff_program_memberships
  WHERE id = p_membership_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Membership not found';
  END IF;

  IF NOT public.is_admissions_admin_for_program(v_row.program_id::text) THEN
    RAISE EXCEPTION 'Not authorized to manage staff for this program';
  END IF;

  UPDATE public.staff_program_memberships
  SET status = v_status, updated_at = now(), updated_by_user_id = auth.uid()
  WHERE id = p_membership_id
  RETURNING * INTO v_row;

  RETURN jsonb_build_object('ok', true, 'id', v_row.id, 'status', v_row.status);
END;
$$;

CREATE OR REPLACE FUNCTION public.set_staff_program_membership_role(
  p_membership_id UUID,
  p_role TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.staff_program_memberships%ROWTYPE;
  v_role TEXT := lower(trim(p_role));
BEGIN
  IF NOT public.is_platform_super_admin() THEN
    RAISE EXCEPTION 'Only platform super admins may change admissions admin role';
  END IF;

  IF v_role NOT IN ('user', 'admin') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;

  UPDATE public.staff_program_memberships
  SET role = v_role, updated_at = now(), updated_by_user_id = auth.uid()
  WHERE id = p_membership_id
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Membership not found';
  END IF;

  RETURN jsonb_build_object('ok', true, 'id', v_row.id, 'role', v_row.role);
END;
$$;

-- ---------------------------------------------------------------------------
-- Admin RPCs — portal source block / unblock
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.list_staff_blocked_portal_sources()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  display_name TEXT,
  organization TEXT,
  profile_deactivated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    public.is_platform_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.staff_program_memberships spm
      WHERE spm.user_id = auth.uid()
        AND spm.role = 'admin'
        AND spm.status = 'active'
    )
  ) THEN
    RAISE EXCEPTION 'Not authorized to view blocked portal sources';
  END IF;

  RETURN QUERY
  SELECT
    rsp.user_id,
    lower(u.email::text) AS email,
    rsp.display_name,
    rsp.organization,
    rsp.profile_deactivated_at
  FROM public.referral_source_profiles rsp
  INNER JOIN auth.users u ON u.id = rsp.user_id
  WHERE rsp.profile_deactivated_at IS NOT NULL
  ORDER BY rsp.profile_deactivated_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.staff_deactivate_referral_source_profile(p_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT := lower(trim(p_email));
  v_user_id UUID;
BEGIN
  IF NOT (
    public.is_platform_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.staff_program_memberships spm
      WHERE spm.user_id = auth.uid()
        AND spm.role = 'admin'
        AND spm.status = 'active'
    )
  ) THEN
    RAISE EXCEPTION 'Not authorized to block portal sources';
  END IF;

  IF v_email IS NULL OR v_email = '' OR v_email NOT LIKE '%@%' THEN
    RAISE EXCEPTION 'Valid portal email required';
  END IF;

  SELECT u.id INTO v_user_id
  FROM auth.users u
  WHERE lower(u.email::text) = v_email
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'user_not_found', 'message', 'No portal account for this email');
  END IF;

  UPDATE public.referral_source_profiles
  SET profile_deactivated_at = now(), updated_at = now()
  WHERE user_id = v_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'profile_not_found', 'message', 'No referral source profile for this email');
  END IF;

  RETURN jsonb_build_object('ok', true, 'user_id', v_user_id, 'email', v_email);
END;
$$;

CREATE OR REPLACE FUNCTION public.staff_reactivate_referral_source_profile(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    public.is_platform_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.staff_program_memberships spm
      WHERE spm.user_id = auth.uid()
        AND spm.role = 'admin'
        AND spm.status = 'active'
    )
  ) THEN
    RAISE EXCEPTION 'Not authorized to unblock portal sources';
  END IF;

  UPDATE public.referral_source_profiles
  SET profile_deactivated_at = NULL, updated_at = now()
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  RETURN jsonb_build_object('ok', true, 'user_id', p_user_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.monarch_staff_jwt_email() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_platform_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admissions_admin_for_program(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_staff_dashboard_access() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff_dashboard_blocked() TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_staff_program_memberships_admin(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_staff_program_membership(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_staff_program_membership_status(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_staff_program_membership_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_staff_blocked_portal_sources() TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_deactivate_referral_source_profile(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_reactivate_referral_source_profile(UUID) TO authenticated;
