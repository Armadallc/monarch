-- P0: Align referral_submissions CHECK constraints with app (ReferralDashboard, ReferralForm).
-- Status app values: pending_review | under_review | accepted | declined | waitlisted
-- referral_source_type app values: full set including other_professional (see ReferralSourceType in TS).
--
-- Legacy status values (older CHECK): approved | rejected | converted_to_client | more_info_needed
-- We must DROP the old CHECKs first; otherwise UPDATE … TO 'accepted' etc. can fail while the old CHECK still applies.

-- ---------------------------------------------------------------------------
-- 1) Drop existing single-column CHECK on status (constraint name may vary)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attname = 'status' AND NOT a.attisdropped
    WHERE n.nspname = 'public'
      AND t.relname = 'referral_submissions'
      AND c.contype = 'c'
      AND c.conkey IS NOT NULL
      AND array_length(c.conkey, 1) = 1
      AND c.conkey[1] = a.attnum
  LOOP
    EXECUTE format('ALTER TABLE public.referral_submissions DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 2) Drop existing single-column CHECK on referral_source_type
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attname = 'referral_source_type' AND NOT a.attisdropped
    WHERE n.nspname = 'public'
      AND t.relname = 'referral_submissions'
      AND c.contype = 'c'
      AND c.conkey IS NOT NULL
      AND array_length(c.conkey, 1) = 1
      AND c.conkey[1] = a.attnum
  LOOP
    EXECUTE format('ALTER TABLE public.referral_submissions DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 3) Map legacy status values → app vocabulary (unconstrained until step 5)
-- ---------------------------------------------------------------------------
UPDATE public.referral_submissions SET status = 'accepted' WHERE status = 'approved';
UPDATE public.referral_submissions SET status = 'declined' WHERE status = 'rejected';
UPDATE public.referral_submissions SET status = 'under_review' WHERE status = 'more_info_needed';
UPDATE public.referral_submissions SET status = 'accepted' WHERE status = 'converted_to_client';

UPDATE public.referral_submissions
SET status = 'pending_review'
WHERE status IS NOT NULL
  AND status NOT IN (
    'pending_review',
    'under_review',
    'accepted',
    'declined',
    'waitlisted'
  );

-- ---------------------------------------------------------------------------
-- 4) Normalize referral_source_type to app enum (handles typos / pre-app values)
-- ---------------------------------------------------------------------------
UPDATE public.referral_submissions
SET referral_source_type = 'other_professional'
WHERE referral_source_type IS NOT NULL
  AND referral_source_type NOT IN (
    'court',
    'legal_representative',
    'probation_parole',
    'mental_health_facility',
    'case_management',
    'other_professional',
    'family',
    'self_referral'
  );

-- ---------------------------------------------------------------------------
-- 5) Add new CHECK constraints
-- ---------------------------------------------------------------------------
ALTER TABLE public.referral_submissions
  ADD CONSTRAINT referral_submissions_status_check
  CHECK (
    status = ANY (
      ARRAY[
        'pending_review'::text,
        'under_review'::text,
        'accepted'::text,
        'declined'::text,
        'waitlisted'::text
      ]
    )
  );

COMMENT ON CONSTRAINT referral_submissions_status_check ON public.referral_submissions IS
  'Workflow statuses used by admissions dashboard and portal; keep in sync with ReferralStatus in app.';

ALTER TABLE public.referral_submissions
  ADD CONSTRAINT referral_submissions_referral_source_type_check
  CHECK (
    referral_source_type = ANY (
      ARRAY[
        'court'::text,
        'legal_representative'::text,
        'probation_parole'::text,
        'mental_health_facility'::text,
        'case_management'::text,
        'other_professional'::text,
        'family'::text,
        'self_referral'::text
      ]
    )
  );

COMMENT ON CONSTRAINT referral_submissions_referral_source_type_check ON public.referral_submissions IS
  'Referral source categories from ReferralForm / ReferralDashboard; includes other_professional.';
