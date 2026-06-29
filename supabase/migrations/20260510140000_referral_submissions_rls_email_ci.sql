-- Case-insensitive + trimmed match between referral_source_email and JWT email.
-- Fixes portal visibility when casing differs or when PostgREST client filters misparsed dotted addresses.

DROP POLICY IF EXISTS referral_submissions_select_own ON referral_submissions;
CREATE POLICY referral_submissions_select_own
  ON referral_submissions FOR SELECT
  USING (
    submitted_by_user_id = auth.uid()
    OR (
      referral_source_email IS NOT NULL
      AND (auth.jwt() ->> 'email') IS NOT NULL
      AND lower(trim(referral_source_email)) = lower(trim((auth.jwt() ->> 'email')))
    )
    OR ((auth.jwt() ->> 'email') IS NOT NULL AND (auth.jwt() ->> 'email') LIKE '%@monarchcompetency.com')
  );

DROP POLICY IF EXISTS referral_submissions_update_own ON referral_submissions;
CREATE POLICY referral_submissions_update_own
  ON referral_submissions FOR UPDATE
  USING (
    submitted_by_user_id = auth.uid()
    OR (
      referral_source_email IS NOT NULL
      AND (auth.jwt() ->> 'email') IS NOT NULL
      AND lower(trim(referral_source_email)) = lower(trim((auth.jwt() ->> 'email')))
    )
    OR ((auth.jwt() ->> 'email') IS NOT NULL AND (auth.jwt() ->> 'email') LIKE '%@monarchcompetency.com')
  )
  WITH CHECK (
    submitted_by_user_id = auth.uid()
    OR (
      referral_source_email IS NOT NULL
      AND (auth.jwt() ->> 'email') IS NOT NULL
      AND lower(trim(referral_source_email)) = lower(trim((auth.jwt() ->> 'email')))
    )
    OR ((auth.jwt() ->> 'email') IS NOT NULL AND (auth.jwt() ->> 'email') LIKE '%@monarchcompetency.com')
  );
