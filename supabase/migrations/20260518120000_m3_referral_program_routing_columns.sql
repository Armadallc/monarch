-- M3 — Program routing columns on referral_submissions (cross-program checklist).
-- program_* columns use TEXT to match public.programs.id when varchar/text.
-- Does not change RLS on referral_submissions (separate M6 deploy).

-- ---------------------------------------------------------------------------
-- 1) Columns + FKs
-- ---------------------------------------------------------------------------

ALTER TABLE public.referral_submissions
  ADD COLUMN IF NOT EXISTS origin_program_id TEXT REFERENCES public.programs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS intended_program_id TEXT REFERENCES public.programs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS current_program_id TEXT REFERENCES public.programs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_program_id TEXT REFERENCES public.programs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS transfer_status TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_viewed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_edited_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.referral_submissions.origin_program_id IS 'Program where referral was first submitted (M3 routing).';
COMMENT ON COLUMN public.referral_submissions.intended_program_id IS 'Target program if different from origin (M3 routing).';
COMMENT ON COLUMN public.referral_submissions.current_program_id IS 'Program that owns the row for dashboard/RLS (M3 routing).';
COMMENT ON COLUMN public.referral_submissions.assigned_program_id IS 'Program context for assignee when cross-program (M3 routing).';
COMMENT ON COLUMN public.referral_submissions.transfer_status IS 'Inter-program transfer lifecycle: none | pending_acceptance | accepted | declined | returned.';

-- transfer_status domain (idempotent: drop/recreate if re-run with old definition)
ALTER TABLE public.referral_submissions DROP CONSTRAINT IF EXISTS referral_submissions_transfer_status_check;
ALTER TABLE public.referral_submissions
  ADD CONSTRAINT referral_submissions_transfer_status_check
  CHECK (transfer_status IN ('none', 'pending_acceptance', 'accepted', 'declined', 'returned'));

-- ---------------------------------------------------------------------------
-- 2) Indexes (dashboard filters)
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_referral_submissions_current_program_status_created
  ON public.referral_submissions (current_program_id, status, created_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_referral_submissions_assigned_program_status_created
  ON public.referral_submissions (assigned_program_id, status, created_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_referral_submissions_assigned_user_status_created
  ON public.referral_submissions (assigned_to_user_id, status, created_at DESC NULLS LAST)
  WHERE assigned_to_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_referral_submissions_transfer_status_created
  ON public.referral_submissions (transfer_status, created_at DESC NULLS LAST);

-- ---------------------------------------------------------------------------
-- 3) Backfill: existing rows → Competency program id (slug = competency)
-- ---------------------------------------------------------------------------

UPDATE public.referral_submissions rs
SET
  origin_program_id = COALESCE(rs.origin_program_id, p.id),
  intended_program_id = COALESCE(rs.intended_program_id, p.id),
  current_program_id = COALESCE(rs.current_program_id, p.id)
FROM (SELECT id FROM public.programs WHERE slug = 'competency' LIMIT 1) AS p(id)
WHERE EXISTS (SELECT 1 FROM public.programs WHERE slug = 'competency');

-- Validation (SQL editor):
-- SELECT COUNT(*) FILTER (WHERE current_program_id IS NULL) AS missing_current FROM referral_submissions;
-- SELECT slug, id FROM programs WHERE slug = 'competency';
