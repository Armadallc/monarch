-- View-only audit should not reorder admissions dashboard default sort.
-- referral_viewed rows still insert into referral_activity_log (HIPAA audit).
-- last_activity_at is only bumped for substantive activity types.

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

  IF p_activity_type IS DISTINCT FROM 'referral_viewed' THEN
    UPDATE referral_submissions
    SET last_activity_at = NOW()
    WHERE id = p_referral_id;
  END IF;

  RETURN v_log_id;
END;
$$;

COMMENT ON FUNCTION log_referral_activity IS
  'Append-only HIPAA audit log entry. Bumps referral_submissions.last_activity_at for all activity types except referral_viewed (audit row still written).';
