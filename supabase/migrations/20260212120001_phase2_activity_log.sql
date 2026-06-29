-- Phase 2: Activity log table and helper; keep last_activity_at updated on status change.
-- Additive only; does not change existing RLS on referral_submissions.

-- 1. referral_activity_log: one row per activity (status change, note, message, etc.)
CREATE TABLE IF NOT EXISTS referral_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID NOT NULL REFERENCES referral_submissions(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  actor_user_id UUID REFERENCES auth.users(id),
  actor_email TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_activity_log_referral_id
  ON referral_activity_log(referral_id);
CREATE INDEX IF NOT EXISTS idx_referral_activity_log_created_at
  ON referral_activity_log(referral_id, created_at DESC);

COMMENT ON TABLE referral_activity_log IS 'Audit-style log of actions on a referral; used for timeline and last_activity_at.';

ALTER TABLE referral_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS: same visibility as referral_submissions (own rows + staff)
CREATE POLICY referral_activity_log_select
  ON referral_activity_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM referral_submissions r
      WHERE r.id = referral_activity_log.referral_id
        AND (r.submitted_by_user_id = auth.uid()
             OR r.referral_source_email = (auth.jwt() ->> 'email')
             OR ((auth.jwt() ->> 'email') IS NOT NULL AND (auth.jwt() ->> 'email') LIKE '%@monarchcompetency.com'))
    )
  );

CREATE POLICY referral_activity_log_insert
  ON referral_activity_log FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 2. Helper: log activity and bump last_activity_at (call from app or triggers)
CREATE OR REPLACE FUNCTION log_referral_activity(
  p_referral_id UUID,
  p_activity_type TEXT,
  p_details JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_user_id UUID;
  v_actor_email TEXT;
  v_log_id UUID;
BEGIN
  v_actor_user_id := auth.uid();
  v_actor_email := auth.jwt() ->> 'email';
  IF v_actor_email IS NULL AND v_actor_user_id IS NOT NULL THEN
    SELECT email INTO v_actor_email FROM auth.users WHERE id = v_actor_user_id LIMIT 1;
  END IF;

  INSERT INTO referral_activity_log (referral_id, activity_type, actor_user_id, actor_email, details)
  VALUES (p_referral_id, p_activity_type, v_actor_user_id, v_actor_email, COALESCE(p_details, '{}'))
  RETURNING id INTO v_log_id;

  UPDATE referral_submissions
  SET last_activity_at = NOW()
  WHERE id = p_referral_id;

  RETURN v_log_id;
END;
$$;

-- 3. Status-change trigger: also set last_activity_at on the submission
CREATE OR REPLACE FUNCTION referral_status_history_on_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  staff_email TEXT;
  actor_role TEXT;
BEGIN
  staff_email := NULL;
  IF auth.uid() IS NOT NULL THEN
    staff_email := COALESCE(auth.jwt() ->> 'email', (SELECT u.email FROM auth.users u WHERE u.id = auth.uid() LIMIT 1));
    IF staff_email IS NOT NULL AND staff_email NOT LIKE '%@monarchcompetency.com' THEN
      staff_email := NULL;
    END IF;
  END IF;

  IF (TG_OP = 'INSERT') THEN
    actor_role := CASE WHEN NEW.submitted_by_user_id IS NOT NULL THEN 'referral_source' ELSE NULL END;
    INSERT INTO referral_status_history (referral_id, status, previous_status, changed_by_user_id, changed_by_name, changed_by_role, visible_to_referral_source)
    VALUES (NEW.id, COALESCE(NEW.status, 'pending_review'), NULL, NEW.submitted_by_user_id, staff_email, actor_role, true);
    UPDATE referral_submissions SET last_activity_at = NOW() WHERE id = NEW.id;
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    actor_role := CASE WHEN staff_email IS NOT NULL THEN 'staff' ELSE NULL END;
    INSERT INTO referral_status_history (referral_id, status, previous_status, changed_by_user_id, changed_by_name, changed_by_role, visible_to_referral_source)
    VALUES (NEW.id, NEW.status, OLD.status, auth.uid(), staff_email, actor_role, true);
    UPDATE referral_submissions SET last_activity_at = NOW() WHERE id = NEW.id;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$;

-- 4. Backfill last_activity_at for existing rows (use created_at where null)
UPDATE referral_submissions
SET last_activity_at = COALESCE(last_activity_at, created_at)
WHERE last_activity_at IS NULL;
