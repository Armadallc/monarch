-- Populate changed_by_name for staff (@monarchcompetency.com) in referral_status_history.
-- Run after 20260211120001_referral_status_history.sql.

-- 1. Trigger: set changed_by_name from JWT email when user is staff
CREATE OR REPLACE FUNCTION referral_status_history_on_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  staff_email TEXT;
BEGIN
  staff_email := NULL;
  -- Prefer JWT email (dashboard requests); fallback to auth.users (e.g. server-side)
  IF auth.uid() IS NOT NULL THEN
    staff_email := COALESCE(auth.jwt() ->> 'email', (SELECT u.email FROM auth.users u WHERE u.id = auth.uid() LIMIT 1));
    IF staff_email IS NOT NULL AND staff_email NOT LIKE '%@monarchcompetency.com' THEN
      staff_email := NULL;  /* only store for staff */
    END IF;
  END IF;

  IF (TG_OP = 'INSERT') THEN
    INSERT INTO referral_status_history (referral_id, status, previous_status, changed_by_user_id, changed_by_name, visible_to_referral_source)
    VALUES (NEW.id, COALESCE(NEW.status, 'pending_review'), NULL, NEW.submitted_by_user_id, staff_email, true);
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO referral_status_history (referral_id, status, previous_status, changed_by_user_id, changed_by_name, visible_to_referral_source)
    VALUES (NEW.id, NEW.status, OLD.status, auth.uid(), staff_email, true);
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$;

-- 2. Backfill: set changed_by_name from auth.users for staff only (existing rows)
UPDATE referral_status_history h
SET changed_by_name = u.email
FROM auth.users u
WHERE h.changed_by_user_id = u.id
  AND (h.changed_by_name IS NULL OR h.changed_by_name = '')
  AND u.email LIKE '%@monarchcompetency.com';
