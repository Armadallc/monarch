-- Phase 2A/2C: Status timeline for portal and dashboard.
-- Run in Supabase SQL Editor after 20260211120000_add_submitted_by_user_id.sql.

-- Table: one row per status change
CREATE TABLE IF NOT EXISTS referral_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID NOT NULL REFERENCES referral_submissions(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  previous_status TEXT,
  changed_by_user_id UUID REFERENCES auth.users(id),
  changed_by_name TEXT,
  notes TEXT,
  visible_to_referral_source BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_status_history_referral_id
ON referral_status_history(referral_id);

CREATE INDEX IF NOT EXISTS idx_referral_status_history_created_at
ON referral_status_history(referral_id, created_at DESC);

COMMENT ON TABLE referral_status_history IS 'One row per status change on referral_submissions; drives timeline in portal and dashboard.';

-- Trigger: on INSERT, record initial status; on UPDATE, record when status changes
CREATE OR REPLACE FUNCTION referral_status_history_on_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO referral_status_history (referral_id, status, previous_status, changed_by_user_id, visible_to_referral_source)
    VALUES (NEW.id, COALESCE(NEW.status, 'pending_review'), NULL, NEW.submitted_by_user_id, true);
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO referral_status_history (referral_id, status, previous_status, changed_by_user_id, visible_to_referral_source)
    VALUES (NEW.id, NEW.status, OLD.status, auth.uid(), true);
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS referral_status_history_trigger ON referral_submissions;
CREATE TRIGGER referral_status_history_trigger
  AFTER INSERT OR UPDATE OF status
  ON referral_submissions
  FOR EACH ROW
  EXECUTE FUNCTION referral_status_history_on_change();

-- Backfill: insert one row per existing referral with current status (so timeline shows "Submitted" until next change)
INSERT INTO referral_status_history (referral_id, status, previous_status, visible_to_referral_source)
SELECT id, COALESCE(status, 'pending_review'), NULL, true
FROM referral_submissions
WHERE NOT EXISTS (
  SELECT 1 FROM referral_status_history h WHERE h.referral_id = referral_submissions.id
);
