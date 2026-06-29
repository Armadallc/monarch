-- HIPAA-aligned audit logging (164.312(b) Audit Controls).
-- Additive: extends referral_activity_log, keeps existing RLS and triggers.
-- Logs who accessed/changed what and when; append-only for integrity.

-- 1. Add HIPAA-relevant columns to referral_activity_log (who, what, when, where, outcome)
ALTER TABLE referral_activity_log
  ADD COLUMN IF NOT EXISTS ip_address TEXT,
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS session_id TEXT,
  ADD COLUMN IF NOT EXISTS outcome TEXT DEFAULT 'success';

COMMENT ON COLUMN referral_activity_log.ip_address IS 'Source IP for audit (HIPAA); set when available (e.g. server/edge).';
COMMENT ON COLUMN referral_activity_log.user_agent IS 'Client user agent for audit (HIPAA).';
COMMENT ON COLUMN referral_activity_log.session_id IS 'Client session id for correlation (HIPAA).';
COMMENT ON COLUMN referral_activity_log.outcome IS 'success or failure (HIPAA audit).';

COMMENT ON TABLE referral_activity_log IS 'HIPAA audit log: activity in systems containing ePHI. Append-only; record who, what, when, outcome (and IP/user_agent when available).';

-- 2. Replace log_referral_activity with extended signature (drop old overload so name is unique)
DROP FUNCTION IF EXISTS log_referral_activity(uuid, text, jsonb);

CREATE OR REPLACE FUNCTION log_referral_activity(
  p_referral_id UUID,
  p_activity_type TEXT,
  p_details JSONB DEFAULT '{}',
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_outcome TEXT DEFAULT 'success'
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

  INSERT INTO referral_activity_log (
    referral_id, activity_type, actor_user_id, actor_email, details,
    ip_address, user_agent, session_id, outcome
  )
  VALUES (
    p_referral_id, p_activity_type, v_actor_user_id, v_actor_email, COALESCE(p_details, '{}'),
    NULLIF(TRIM(p_ip_address), ''), NULLIF(TRIM(p_user_agent), ''), NULLIF(TRIM(p_session_id), ''),
    COALESCE(NULLIF(TRIM(p_outcome), ''), 'success')
  )
  RETURNING id INTO v_log_id;

  UPDATE referral_submissions
  SET last_activity_at = NOW()
  WHERE id = p_referral_id;

  RETURN v_log_id;
END;
$$;

COMMENT ON FUNCTION log_referral_activity IS 'Append-only HIPAA audit log entry for referral activity. Use for view, status change, note, message, assignment, section status, share link, etc.';

-- 3. Log referral submission (creation) in audit log — trigger so it cannot be skipped
CREATE OR REPLACE FUNCTION referral_submissions_after_insert_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_email TEXT;
BEGIN
  v_actor_email := NULL;
  IF NEW.submitted_by_user_id IS NOT NULL THEN
    SELECT email INTO v_actor_email FROM auth.users WHERE id = NEW.submitted_by_user_id LIMIT 1;
  END IF;

  INSERT INTO referral_activity_log (referral_id, activity_type, actor_user_id, actor_email, details, outcome)
  VALUES (
    NEW.id,
    'referral_submitted',
    NEW.submitted_by_user_id,
    v_actor_email,
    '{}',
    'success'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS referral_submissions_after_insert_audit ON referral_submissions;
CREATE TRIGGER referral_submissions_after_insert_audit
  AFTER INSERT ON referral_submissions
  FOR EACH ROW
  EXECUTE FUNCTION referral_submissions_after_insert_audit();

COMMENT ON FUNCTION referral_submissions_after_insert_audit() IS 'HIPAA audit: log referral creation (who submitted, when).';

-- 4. Append-only: no UPDATE or DELETE on referral_activity_log by application users.
-- RLS: we only have SELECT and INSERT policies; UPDATE/DELETE have no permissive policy, so they are denied.
-- Document that explicitly (no schema change needed).
-- Optional: revoke UPDATE/DELETE from roles that insert (e.g. authenticated). Supabase uses authenticated role;
-- revoking may break migrations that need to fix data. Prefer policy-only: no UPDATE/DELETE policies = denied.
