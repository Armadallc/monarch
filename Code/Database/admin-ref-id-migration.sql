-- ============================================================================
-- MONARCH COMPETENCY — Admin Reference ID Migration
-- Sprint 6: Adds admin_ref_id column (REF-MC-001 format)
-- Run in Supabase SQL Editor
-- ============================================================================

-- 1. Add admin_ref_id column
ALTER TABLE referral_submissions
  ADD COLUMN IF NOT EXISTS admin_ref_id text;

-- 2. Create sequence for sequential numbering
CREATE SEQUENCE IF NOT EXISTS admin_ref_id_seq START WITH 1;

-- 3. Function to generate admin ref ID (REF-MC-001, REF-MC-002, etc.)
CREATE OR REPLACE FUNCTION generate_admin_ref_id()
RETURNS text AS $$
DECLARE
  seq_val int;
BEGIN
  seq_val := nextval('admin_ref_id_seq');
  RETURN 'REF-MC-' || LPAD(seq_val::text, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger function to auto-set on INSERT
CREATE OR REPLACE FUNCTION auto_set_admin_ref_id()
RETURNS trigger AS $$
BEGIN
  IF NEW.admin_ref_id IS NULL THEN
    NEW.admin_ref_id := generate_admin_ref_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger
DROP TRIGGER IF EXISTS trg_auto_admin_ref_id ON referral_submissions;
CREATE TRIGGER trg_auto_admin_ref_id
  BEFORE INSERT ON referral_submissions
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_admin_ref_id();

-- 6. Backfill existing rows (ordered by created_at so oldest = 001)
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn
  FROM referral_submissions
  WHERE admin_ref_id IS NULL
)
UPDATE referral_submissions s
SET admin_ref_id = 'REF-MC-' || LPAD(n.rn::text, 3, '0')
FROM numbered n
WHERE s.id = n.id;

-- 7. Reset sequence to continue after last backfilled value
SELECT setval('admin_ref_id_seq',
  COALESCE(
    (SELECT MAX(SUBSTRING(admin_ref_id FROM '\d+$')::int) FROM referral_submissions WHERE admin_ref_id IS NOT NULL),
    0
  )
);

-- 8. Unique index for lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_ref_id
  ON referral_submissions (admin_ref_id)
  WHERE admin_ref_id IS NOT NULL;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run after migration to verify:
-- SELECT admin_ref_id, referral_code, client_first_name, created_at
-- FROM referral_submissions ORDER BY created_at LIMIT 10;
