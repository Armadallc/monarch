-- Phase 2b: Log status changes to referral_activity_log when referral_status_history is inserted.
-- Ensures dashboard activity timeline shows status updates (trigger runs in same tx as status update).

CREATE OR REPLACE FUNCTION referral_status_history_after_insert_log_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO referral_activity_log (referral_id, activity_type, actor_user_id, actor_email, details)
  VALUES (
    NEW.referral_id,
    'status_change',
    NEW.changed_by_user_id,
    NEW.changed_by_name,
    jsonb_build_object(
      'status', NEW.status,
      'previous_status', NEW.previous_status,
      'changed_by_role', NEW.changed_by_role
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS referral_status_history_after_insert_activity ON referral_status_history;
CREATE TRIGGER referral_status_history_after_insert_activity
  AFTER INSERT ON referral_status_history
  FOR EACH ROW
  EXECUTE FUNCTION referral_status_history_after_insert_log_activity();

COMMENT ON FUNCTION referral_status_history_after_insert_log_activity() IS 'Writes a row to referral_activity_log when status history is inserted (Phase 2b).';

-- One-time backfill: existing status history rows get an activity log entry (run once)
INSERT INTO referral_activity_log (referral_id, activity_type, actor_user_id, actor_email, details, created_at)
SELECT referral_id, 'status_change', changed_by_user_id, changed_by_name,
  jsonb_build_object('status', status, 'previous_status', previous_status, 'changed_by_role', changed_by_role),
  created_at
FROM referral_status_history h
WHERE NOT EXISTS (
  SELECT 1 FROM referral_activity_log a
  WHERE a.referral_id = h.referral_id AND a.activity_type = 'status_change' AND a.details->>'status' = h.status
  AND a.created_at = h.created_at
);
