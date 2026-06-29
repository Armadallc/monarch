-- Admissions assignee dropdown: active staff for a program (any member of that program may list assignees).

CREATE OR REPLACE FUNCTION public.list_assignable_staff_for_program(p_program_id TEXT)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  display_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_active_staff_dashboard_access() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF NOT public.is_platform_super_admin()
    AND NOT EXISTS (
      SELECT 1
      FROM public.staff_program_memberships spm
      WHERE spm.user_id = auth.uid()
        AND spm.program_id::text = p_program_id
        AND spm.status = 'active'
    ) THEN
    RAISE EXCEPTION 'Not authorized for this program';
  END IF;

  RETURN QUERY
  SELECT
    spm.user_id,
    lower(u.email::text) AS email,
    COALESCE(asp.display_name, split_part(lower(u.email::text), '@', 1)) AS display_name
  FROM public.staff_program_memberships spm
  INNER JOIN auth.users u ON u.id = spm.user_id
  LEFT JOIN public.admissions_staff_profiles asp ON asp.user_id = spm.user_id
  WHERE spm.program_id::text = p_program_id
    AND spm.status = 'active'
  ORDER BY lower(COALESCE(asp.display_name, u.email::text));
END;
$$;

COMMENT ON FUNCTION public.list_assignable_staff_for_program(TEXT) IS
  'Referral dashboard: list active program members for assignee dropdown; caller must have active membership in the program (or be platform super admin).';

REVOKE ALL ON FUNCTION public.list_assignable_staff_for_program(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_assignable_staff_for_program(TEXT) TO authenticated;
