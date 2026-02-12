-- ============================================================================
-- Monarch Competency — Auto-Archive Setup
-- ============================================================================
-- Archives referral records older than 30 days that are still unarchived.
-- Run these SQL statements in the Supabase SQL Editor (Dashboard → SQL Editor).
-- ============================================================================

-- ============================================================================
-- STEP 1: Add archived_at column to both tables (if not already present)
-- ============================================================================

ALTER TABLE referral_submissions
ADD COLUMN IF NOT EXISTS archived_at timestamptz DEFAULT NULL;

ALTER TABLE referral_inquiries
ADD COLUMN IF NOT EXISTS archived_at timestamptz DEFAULT NULL;

-- ============================================================================
-- STEP 2: Create the auto-archive function
-- ============================================================================
-- This function sets archived_at = NOW() on any record where:
--   1. archived_at IS NULL (not already archived)
--   2. created_at is older than 30 days
--   3. status is NOT 'under_review' (don't archive actively worked items)
--
-- Returns the total number of records archived.
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_archive_old_referrals()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    archived_subs integer;
    archived_inqs integer;
BEGIN
    -- Archive old submissions
    UPDATE referral_submissions
    SET archived_at = NOW(), updated_at = NOW()
    WHERE archived_at IS NULL
      AND created_at < NOW() - INTERVAL '30 days'
      AND status NOT IN ('under_review');

    GET DIAGNOSTICS archived_subs = ROW_COUNT;

    -- Archive old inquiries
    UPDATE referral_inquiries
    SET archived_at = NOW(), updated_at = NOW()
    WHERE archived_at IS NULL
      AND created_at < NOW() - INTERVAL '30 days'
      AND status NOT IN ('under_review');

    GET DIAGNOSTICS archived_inqs = ROW_COUNT;

    RAISE LOG 'Auto-archive complete: % submissions, % inquiries archived', archived_subs, archived_inqs;

    RETURN archived_subs + archived_inqs;
END;
$$;

-- ============================================================================
-- STEP 3: Schedule with pg_cron (Supabase Pro plan required)
-- ============================================================================
-- pg_cron runs scheduled jobs inside PostgreSQL.
-- This schedules the auto-archive to run daily at 3:00 AM UTC.
--
-- If you're NOT on the Pro plan, skip this step and use the Edge Function
-- approach described in the comments below instead.
-- ============================================================================

-- Enable the pg_cron extension (may already be enabled)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily at 3 AM UTC
-- SELECT cron.schedule(
--     'auto-archive-referrals',      -- job name
--     '0 3 * * *',                    -- cron schedule: daily at 3:00 AM UTC
--     'SELECT auto_archive_old_referrals()'
-- );

-- ============================================================================
-- USEFUL COMMANDS
-- ============================================================================

-- Test the function manually:
-- SELECT auto_archive_old_referrals();

-- View scheduled jobs:
-- SELECT * FROM cron.job;

-- Remove the scheduled job:
-- SELECT cron.unschedule('auto-archive-referrals');

-- View archived records:
-- SELECT id, client_first_name, client_last_name, created_at, archived_at
-- FROM referral_submissions WHERE archived_at IS NOT NULL ORDER BY archived_at DESC;

-- Unarchive a specific record:
-- UPDATE referral_submissions SET archived_at = NULL WHERE id = 'some-uuid';
