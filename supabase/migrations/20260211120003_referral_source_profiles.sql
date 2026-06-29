-- Step 4 — Profile: referral source preferences (display name, org, contact, notifications).
-- Run after 20260211120002_referral_status_history_changed_by_name.sql (or after 20260211120001_referral_status_history.sql).

CREATE TABLE IF NOT EXISTS referral_source_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  organization TEXT,
  title TEXT,
  phone TEXT,
  fax TEXT,
  preferred_contact_method TEXT CHECK (preferred_contact_method IN ('email', 'phone', 'fax')),
  notification_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_source_profiles_user_id ON referral_source_profiles(user_id);

COMMENT ON TABLE referral_source_profiles IS 'One row per referral source (auth user); My Profile in portal.';

ALTER TABLE referral_source_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY referral_source_profiles_select_own
  ON referral_source_profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY referral_source_profiles_insert_own
  ON referral_source_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY referral_source_profiles_update_own
  ON referral_source_profiles FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
