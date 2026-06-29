-- Phase 4: Share links (staff create/revoke time-limited links to share a referral).
-- Internal notes already exist: referral_section_notes with is_internal = true (staff-only).
-- Additive only.

CREATE TABLE IF NOT EXISTS referral_share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID NOT NULL REFERENCES referral_submissions(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_by_user_id UUID REFERENCES auth.users(id),
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_share_links_referral_id
  ON referral_share_links(referral_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_referral_share_links_token
  ON referral_share_links(token);
CREATE INDEX IF NOT EXISTS idx_referral_share_links_expires_at
  ON referral_share_links(expires_at);

COMMENT ON TABLE referral_share_links IS 'Time-limited share links for a referral; staff create/revoke. Use token for read-only access (e.g. via app or anon policy) when needed.';

ALTER TABLE referral_share_links ENABLE ROW LEVEL SECURITY;

-- Staff only: manage share links
CREATE POLICY referral_share_links_select_staff
  ON referral_share_links FOR SELECT
  USING (
    (auth.jwt() ->> 'email') IS NOT NULL
    AND (auth.jwt() ->> 'email') LIKE '%@monarchcompetency.com'
  );

CREATE POLICY referral_share_links_insert_staff
  ON referral_share_links FOR INSERT
  WITH CHECK (
    (auth.jwt() ->> 'email') IS NOT NULL
    AND (auth.jwt() ->> 'email') LIKE '%@monarchcompetency.com'
  );

CREATE POLICY referral_share_links_delete_staff
  ON referral_share_links FOR DELETE
  USING (
    (auth.jwt() ->> 'email') IS NOT NULL
    AND (auth.jwt() ->> 'email') LIKE '%@monarchcompetency.com'
  );
