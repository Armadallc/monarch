-- HIPAA + Colorado 10-year retention policy (documentation and optional purge).
-- Does not change existing schema, RLS, or triggers. Policy: docs/DATA_RETENTION_POLICY.md

-- 1. Document retention on tables (10 years for all referral-related and audit data)
COMMENT ON TABLE referral_submissions IS 'Referral submissions (ePHI). Retain 10 years per HIPAA + Colorado policy. See docs/DATA_RETENTION_POLICY.md.';
COMMENT ON TABLE referral_status_history IS 'Status history per referral. Retain 10 years (part of referral record).';
COMMENT ON TABLE referral_section_notes IS 'Section notes on referrals. Retain 10 years (part of clinical record).';
COMMENT ON TABLE referral_messages IS 'Messages on referrals. Retain 10 years (part of clinical record).';
COMMENT ON TABLE referral_activity_log IS 'HIPAA audit log. Retain 10 years (HIPAA 164.312(b) minimum 6; 10 for policy).';
COMMENT ON TABLE referral_share_links IS 'Share links for referrals. Retain 10 years (tied to referral).';
COMMENT ON TABLE referral_section_statuses IS 'Section workflow statuses. Retain 10 years (part of referral record).';

-- 2. Optional purge function: deletes referral_submissions older than p_years (children cascade)
-- Call only when retention has been reviewed and destruction is authorized. Use from cron or service role.
CREATE OR REPLACE FUNCTION purge_referrals_older_than_retention(p_years INTEGER DEFAULT 10)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cutoff TIMESTAMPTZ;
  v_deleted INTEGER;
BEGIN
  IF p_years IS NULL OR p_years < 1 THEN
    RAISE EXCEPTION 'p_years must be at least 1';
  END IF;
  v_cutoff := NOW() - (p_years || ' years')::INTERVAL;

  WITH deleted AS (
    DELETE FROM referral_submissions
    WHERE created_at < v_cutoff
    RETURNING id
  )
  SELECT COUNT(*)::INTEGER INTO v_deleted FROM deleted;

  RETURN v_deleted;
END;
$$;

COMMENT ON FUNCTION purge_referrals_older_than_retention(INTEGER) IS 'Optional retention purge: deletes referral_submissions with created_at older than p_years. Child tables (activity_log, status_history, section_notes, messages, share_links, section_statuses) are removed by CASCADE. Run only when authorized and document destruction. Policy: 10-year retention per docs/DATA_RETENTION_POLICY.md.';
