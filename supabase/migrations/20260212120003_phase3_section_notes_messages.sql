-- Phase 3: Section notes and messages. Additive only.
-- RLS: referral source sees own referral data; staff (@monarchcompetency.com) see all.

-- 1. Section notes: notes per referral + section (e.g. legal, insurance). Optional is_internal (staff-only).
CREATE TABLE IF NOT EXISTS referral_section_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID NOT NULL REFERENCES referral_submissions(id) ON DELETE CASCADE,
  section_key TEXT NOT NULL,
  author_user_id UUID REFERENCES auth.users(id),
  author_email TEXT,
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_section_notes_referral_id
  ON referral_section_notes(referral_id);
CREATE INDEX IF NOT EXISTS idx_referral_section_notes_referral_section
  ON referral_section_notes(referral_id, section_key);

COMMENT ON TABLE referral_section_notes IS 'Notes on a referral, optionally scoped to a section; is_internal notes are staff-only.';

ALTER TABLE referral_section_notes ENABLE ROW LEVEL SECURITY;

-- Referral source: SELECT only non-internal notes on their referrals
CREATE POLICY referral_section_notes_select_own
  ON referral_section_notes FOR SELECT
  USING (
    (is_internal = false)
    AND EXISTS (
      SELECT 1 FROM referral_submissions r
      WHERE r.id = referral_section_notes.referral_id
        AND (r.submitted_by_user_id = auth.uid() OR r.referral_source_email = (auth.jwt() ->> 'email'))
    )
  );

-- Staff: SELECT all
CREATE POLICY referral_section_notes_select_staff
  ON referral_section_notes FOR SELECT
  USING (
    (auth.jwt() ->> 'email') IS NOT NULL
    AND (auth.jwt() ->> 'email') LIKE '%@monarchcompetency.com'
  );

-- Referral source: INSERT on own referrals, is_internal must be false
CREATE POLICY referral_section_notes_insert_own
  ON referral_section_notes FOR INSERT
  WITH CHECK (
    is_internal = false
    AND EXISTS (
      SELECT 1 FROM referral_submissions r
      WHERE r.id = referral_section_notes.referral_id
        AND (r.submitted_by_user_id = auth.uid() OR r.referral_source_email = (auth.jwt() ->> 'email'))
    )
  );

-- Staff: INSERT any
CREATE POLICY referral_section_notes_insert_staff
  ON referral_section_notes FOR INSERT
  WITH CHECK (
    (auth.jwt() ->> 'email') IS NOT NULL
    AND (auth.jwt() ->> 'email') LIKE '%@monarchcompetency.com'
  );

-- 2. Messages: conversation thread per referral (both sides see all)
CREATE TABLE IF NOT EXISTS referral_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID NOT NULL REFERENCES referral_submissions(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES auth.users(id),
  from_email TEXT,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_messages_referral_id
  ON referral_messages(referral_id);
CREATE INDEX IF NOT EXISTS idx_referral_messages_created_at
  ON referral_messages(referral_id, created_at DESC);

COMMENT ON TABLE referral_messages IS 'Messages between staff and referral source on a referral; both sides see full thread.';

ALTER TABLE referral_messages ENABLE ROW LEVEL SECURITY;

-- Same visibility as referral_submissions: owner or staff
CREATE POLICY referral_messages_select
  ON referral_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM referral_submissions r
      WHERE r.id = referral_messages.referral_id
        AND (r.submitted_by_user_id = auth.uid()
             OR r.referral_source_email = (auth.jwt() ->> 'email')
             OR ((auth.jwt() ->> 'email') IS NOT NULL AND (auth.jwt() ->> 'email') LIKE '%@monarchcompetency.com'))
    )
  );

CREATE POLICY referral_messages_insert
  ON referral_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM referral_submissions r
      WHERE r.id = referral_messages.referral_id
        AND (r.submitted_by_user_id = auth.uid()
             OR r.referral_source_email = (auth.jwt() ->> 'email')
             OR ((auth.jwt() ->> 'email') IS NOT NULL AND (auth.jwt() ->> 'email') LIKE '%@monarchcompetency.com'))
    )
  );
