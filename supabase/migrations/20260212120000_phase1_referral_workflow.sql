-- Phase 1: Additive schema and staff profile access only.
-- Does not change any existing RLS policies, triggers, or columns.

-- 1. referral_submissions: add activity, assignment, and optional unread columns
ALTER TABLE referral_submissions
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS has_unread_messages BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_unread_section_notes BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS unread_section_notes_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS assigned_to_user_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS priority TEXT;

CREATE INDEX IF NOT EXISTS idx_referral_submissions_assigned_to
  ON referral_submissions(assigned_to_user_id) WHERE assigned_to_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_referral_submissions_last_activity_at
  ON referral_submissions(last_activity_at DESC NULLS LAST);

COMMENT ON COLUMN referral_submissions.last_activity_at IS 'Last activity for sorting/filtering in dashboard.';
COMMENT ON COLUMN referral_submissions.assigned_to_user_id IS 'Staff user (auth.users) assigned to this referral; optional.';

-- 2. referral_status_history: add changed_by_role and set it in existing trigger
ALTER TABLE referral_status_history
  ADD COLUMN IF NOT EXISTS changed_by_role TEXT;

COMMENT ON COLUMN referral_status_history.changed_by_role IS 'Actor role: staff, referral_source, or null.';

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
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    actor_role := CASE WHEN staff_email IS NOT NULL THEN 'staff' ELSE NULL END;
    INSERT INTO referral_status_history (referral_id, status, previous_status, changed_by_user_id, changed_by_name, changed_by_role, visible_to_referral_source)
    VALUES (NEW.id, NEW.status, OLD.status, auth.uid(), staff_email, actor_role, true);
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$;

-- 3. referral_source_profiles: one new policy so staff can view all profiles (no change to existing policies)
CREATE POLICY referral_source_profiles_select_staff
  ON referral_source_profiles FOR SELECT
  USING (
    (auth.jwt() ->> 'email') IS NOT NULL
    AND (auth.jwt() ->> 'email') LIKE '%@monarchcompetency.com'
  );
