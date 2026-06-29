-- Referral sources may read published staff profiles only for users assigned to
-- referrals they can see (portal "Assigned to" column + detail contact).

CREATE POLICY admissions_staff_profiles_select_assignee_on_my_referral
  ON public.admissions_staff_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.referral_submissions rs
      WHERE rs.assigned_to_user_id = admissions_staff_profiles.user_id
        AND (
          rs.submitted_by_user_id = auth.uid()
          OR rs.referral_source_email = (auth.jwt() ->> 'email')
        )
    )
  );

COMMENT ON POLICY admissions_staff_profiles_select_assignee_on_my_referral
  ON public.admissions_staff_profiles IS
  'Referring sources: read assignee directory row only when that staff member is assigned to a submission visible to them.';
