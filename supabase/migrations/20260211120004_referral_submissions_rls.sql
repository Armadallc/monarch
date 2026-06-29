-- RLS on referral_submissions: referral sources see only own rows; staff (@monarchcompetency.com) have full access.
-- Run after 20260211120003_referral_source_profiles.sql.

ALTER TABLE referral_submissions ENABLE ROW LEVEL SECURITY;

-- Referral sources: SELECT and UPDATE only their own rows (by user id or legacy email match)
CREATE POLICY referral_submissions_select_own
  ON referral_submissions FOR SELECT
  USING (
    submitted_by_user_id = auth.uid()
    OR (referral_source_email = (auth.jwt() ->> 'email'))
    OR ((auth.jwt() ->> 'email') IS NOT NULL AND (auth.jwt() ->> 'email') LIKE '%@monarchcompetency.com')
  );

CREATE POLICY referral_submissions_update_own
  ON referral_submissions FOR UPDATE
  USING (
    submitted_by_user_id = auth.uid()
    OR (referral_source_email = (auth.jwt() ->> 'email'))
    OR ((auth.jwt() ->> 'email') IS NOT NULL AND (auth.jwt() ->> 'email') LIKE '%@monarchcompetency.com')
  )
  WITH CHECK (
    submitted_by_user_id = auth.uid()
    OR (referral_source_email = (auth.jwt() ->> 'email'))
    OR ((auth.jwt() ->> 'email') IS NOT NULL AND (auth.jwt() ->> 'email') LIKE '%@monarchcompetency.com')
  );

-- Any authenticated user may INSERT (form submit; app sets submitted_by_user_id)
CREATE POLICY referral_submissions_insert_authenticated
  ON referral_submissions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
