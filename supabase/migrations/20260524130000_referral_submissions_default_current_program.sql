-- Referral dashboard scopes rows by staff_program_memberships vs referral_submissions.current_program_id.
-- Inserts from the public form did not set program columns, so current_program_id stayed NULL and
-- staff queries using .in(current_program_id, ...) returned no rows.
-- Depends on M3 columns (20260518120000_m3_referral_program_routing_columns.sql).

-- 1) Backfill any rows still missing program routing (same pattern as M3 migration).
UPDATE public.referral_submissions rs
SET
  origin_program_id = COALESCE(rs.origin_program_id, p.id),
  intended_program_id = COALESCE(rs.intended_program_id, p.id),
  current_program_id = COALESCE(rs.current_program_id, p.id)
FROM (SELECT id FROM public.programs WHERE slug = 'competency' LIMIT 1) AS p(id)
WHERE EXISTS (SELECT 1 FROM public.programs WHERE slug = 'competency')
  AND rs.current_program_id IS NULL;

-- 2) Default program on new inserts when columns are null (competency program must exist).
CREATE OR REPLACE FUNCTION public.referral_submissions_set_default_program_routing()
RETURNS TRIGGER AS $$
DECLARE
  competency_id TEXT;
BEGIN
  SELECT id
  INTO competency_id
  FROM public.programs
  WHERE slug = 'competency'
    AND (is_active IS DISTINCT FROM false)
  LIMIT 1;

  IF competency_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.current_program_id IS NULL THEN
    NEW.current_program_id := competency_id;
  END IF;
  IF NEW.origin_program_id IS NULL THEN
    NEW.origin_program_id := competency_id;
  END IF;
  IF NEW.intended_program_id IS NULL THEN
    NEW.intended_program_id := competency_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_referral_submissions_default_program_routing ON public.referral_submissions;
CREATE TRIGGER trg_referral_submissions_default_program_routing
  BEFORE INSERT ON public.referral_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.referral_submissions_set_default_program_routing();

COMMENT ON FUNCTION public.referral_submissions_set_default_program_routing() IS
  'Sets origin/intended/current program to competency when null on INSERT so admissions dashboard program filter includes the row.';
