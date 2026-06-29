-- Phase 4b: Let referral sources SELECT share links for their own referrals (so they can see/copy links staff created).
-- Additive only; staff policies unchanged.

CREATE POLICY referral_share_links_select_referral_source
  ON referral_share_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM referral_submissions rs
      WHERE rs.id = referral_share_links.referral_id
        AND (
          rs.referral_source_email = (auth.jwt() ->> 'email')
          OR rs.submitted_by_user_id = auth.uid()
        )
    )
  );

COMMENT ON POLICY referral_share_links_select_referral_source ON referral_share_links IS 'Referral sources can see share links for referrals they submitted.';
