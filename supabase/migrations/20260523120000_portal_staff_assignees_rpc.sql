-- Portal assignee display: referral sources could not read admissions_staff_profiles
-- via PostgREST even with SELECT policy (subquery/RLS ordering issues in some setups).
-- This SECURITY DEFINER function returns only profiles for assignees on referrals the
-- caller may see, using the same ownership rule as referral_submissions_select_own.

DROP FUNCTION IF EXISTS public.portal_staff_assignees_for_ids(uuid[]);

CREATE OR REPLACE FUNCTION public.portal_staff_assignees_for_ids(p_user_ids uuid[])
RETURNS TABLE (
  user_id uuid,
  display_name text,
  title text,
  contact_email text,
  phone text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT ON (asp.user_id)
    asp.user_id,
    asp.display_name,
    asp.title,
    asp.contact_email,
    asp.phone
  FROM public.admissions_staff_profiles asp
  WHERE asp.user_id = ANY(p_user_ids)
    AND EXISTS (
      SELECT 1
      FROM public.referral_submissions rs
      WHERE rs.assigned_to_user_id = asp.user_id
        AND (
          rs.submitted_by_user_id = auth.uid()
          OR (
            auth.jwt() ->> 'email' IS NOT NULL
            AND rs.referral_source_email IS NOT NULL
            AND lower(trim(rs.referral_source_email)) = lower(trim(auth.jwt() ->> 'email'))
          )
        )
    )
  ORDER BY asp.user_id;
$$;

COMMENT ON FUNCTION public.portal_staff_assignees_for_ids(uuid[]) IS
  'Referral source portal: published staff profile fields for assignees on referrals visible to the caller (submitted_by_user_id or referral_source_email match only).';

REVOKE ALL ON FUNCTION public.portal_staff_assignees_for_ids(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.portal_staff_assignees_for_ids(uuid[]) TO authenticated;

-- Harden direct SELECT path: case-insensitive email match (same as portal list query).
DROP POLICY IF EXISTS admissions_staff_profiles_select_assignee_on_my_referral
  ON public.admissions_staff_profiles;

CREATE POLICY admissions_staff_profiles_select_assignee_on_my_referral
  ON public.admissions_staff_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.referral_submissions rs
      WHERE rs.assigned_to_user_id = admissions_staff_profiles.user_id
        AND (
          rs.submitted_by_user_id = auth.uid()
          OR (
            auth.jwt() ->> 'email' IS NOT NULL
            AND rs.referral_source_email IS NOT NULL
            AND lower(trim(rs.referral_source_email)) = lower(trim(auth.jwt() ->> 'email'))
          )
        )
    )
  );

COMMENT ON POLICY admissions_staff_profiles_select_assignee_on_my_referral
  ON public.admissions_staff_profiles IS
  'Referring sources: read assignee profile row only when that staff member is assigned to a submission they own (user id or case-insensitive referral_source_email).';
