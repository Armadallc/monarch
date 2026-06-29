-- Phase 2A: Link referral_submissions to auth user for portal "my referrals" and future RLS.
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query).

-- Add column (nullable for existing rows)
ALTER TABLE referral_submissions
ADD COLUMN IF NOT EXISTS submitted_by_user_id UUID REFERENCES auth.users(id);

-- Optional: index for portal queries and future RLS
CREATE INDEX IF NOT EXISTS idx_referral_submissions_submitted_by_user_id
ON referral_submissions(submitted_by_user_id);

-- Optional: comment for documentation
COMMENT ON COLUMN referral_submissions.submitted_by_user_id IS 'Auth user who submitted this referral; used for portal "my referrals" and RLS.';

-- Backfill: leave as-is (null for old rows) or run a one-time update if you have a way to match
-- referral_source_email to auth.users (e.g. only for users who have logged in).
-- Example (uncomment and adjust if you want to backfill from auth.users.email):
-- UPDATE referral_submissions r
-- SET submitted_by_user_id = u.id
-- FROM auth.users u
-- WHERE r.referral_source_email = u.email
--   AND r.submitted_by_user_id IS NULL;
