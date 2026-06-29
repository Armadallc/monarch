-- Phase 5: Section-level status workflows (e.g. ROI, insurance, safety).
-- Does not change the overall referral status constraint (pending_review, etc.).
-- Additive only.

CREATE TABLE IF NOT EXISTS referral_section_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID NOT NULL REFERENCES referral_submissions(id) ON DELETE CASCADE,
  section_key TEXT NOT NULL,
  status TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by_user_id UUID REFERENCES auth.users(id),
  UNIQUE(referral_id, section_key)
);

CREATE INDEX IF NOT EXISTS idx_referral_section_statuses_referral_id
  ON referral_section_statuses(referral_id);

COMMENT ON TABLE referral_section_statuses IS 'Per-section workflow status (e.g. roi, insurance, safety); one row per referral per section.';

ALTER TABLE referral_section_statuses ENABLE ROW LEVEL SECURITY;

-- Same visibility as referral_submissions: owner or staff
CREATE POLICY referral_section_statuses_select
  ON referral_section_statuses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM referral_submissions r
      WHERE r.id = referral_section_statuses.referral_id
        AND (r.submitted_by_user_id = auth.uid()
             OR r.referral_source_email = (auth.jwt() ->> 'email')
             OR ((auth.jwt() ->> 'email') IS NOT NULL AND (auth.jwt() ->> 'email') LIKE '%@monarchcompetency.com'))
    )
  );

CREATE POLICY referral_section_statuses_insert
  ON referral_section_statuses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM referral_submissions r
      WHERE r.id = referral_section_statuses.referral_id
        AND (r.submitted_by_user_id = auth.uid()
             OR r.referral_source_email = (auth.jwt() ->> 'email')
             OR ((auth.jwt() ->> 'email') IS NOT NULL AND (auth.jwt() ->> 'email') LIKE '%@monarchcompetency.com'))
    )
  );

CREATE POLICY referral_section_statuses_update
  ON referral_section_statuses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM referral_submissions r
      WHERE r.id = referral_section_statuses.referral_id
        AND (r.submitted_by_user_id = auth.uid()
             OR r.referral_source_email = (auth.jwt() ->> 'email')
             OR ((auth.jwt() ->> 'email') IS NOT NULL AND (auth.jwt() ->> 'email') LIKE '%@monarchcompetency.com'))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM referral_submissions r
      WHERE r.id = referral_section_statuses.referral_id
        AND (r.submitted_by_user_id = auth.uid()
             OR r.referral_source_email = (auth.jwt() ->> 'email')
             OR ((auth.jwt() ->> 'email') IS NOT NULL AND (auth.jwt() ->> 'email') LIKE '%@monarchcompetency.com'))
    )
  );

CREATE POLICY referral_section_statuses_delete
  ON referral_section_statuses FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM referral_submissions r
      WHERE r.id = referral_section_statuses.referral_id
        AND (r.submitted_by_user_id = auth.uid()
             OR r.referral_source_email = (auth.jwt() ->> 'email')
             OR ((auth.jwt() ->> 'email') IS NOT NULL AND (auth.jwt() ->> 'email') LIKE '%@monarchcompetency.com'))
    )
  );
