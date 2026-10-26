-- Mental Health referral form: optional columns + mh_intake jsonb.
-- Leaves prog_mental_health inactive. Expands referral_source_type for MH relationship codes.

-- 1) New optional columns
ALTER TABLE public.referral_submissions
  ADD COLUMN IF NOT EXISTS client_address_line1 text,
  ADD COLUMN IF NOT EXISTS client_address_line2 text,
  ADD COLUMN IF NOT EXISTS client_city text,
  ADD COLUMN IF NOT EXISTS client_state text,
  ADD COLUMN IF NOT EXISTS client_postal_code text,
  ADD COLUMN IF NOT EXISTS client_gender_identity text[],
  ADD COLUMN IF NOT EXISTS client_race text[],
  ADD COLUMN IF NOT EXISTS client_gender_detail text,
  ADD COLUMN IF NOT EXISTS client_military_status text,
  ADD COLUMN IF NOT EXISTS requested_placement_by date,
  ADD COLUMN IF NOT EXISTS attestation_name text,
  ADD COLUMN IF NOT EXISTS attested_at timestamptz,
  ADD COLUMN IF NOT EXISTS submitted_via text,
  ADD COLUMN IF NOT EXISTS mh_intake jsonb;

COMMENT ON COLUMN public.referral_submissions.client_address_line1 IS
  'Client mailing street address (MH + future shared use).';
COMMENT ON COLUMN public.referral_submissions.client_gender_identity IS
  'Ritten-aligned gender identity multi-select (MH).';
COMMENT ON COLUMN public.referral_submissions.client_race IS
  'Ritten-aligned race multi-select (MH).';
COMMENT ON COLUMN public.referral_submissions.requested_placement_by IS
  'Earliest requested placement date (MH section 13).';
COMMENT ON COLUMN public.referral_submissions.attestation_name IS
  'Typed attestation name on submit (MH; may reuse for other programs).';
COMMENT ON COLUMN public.referral_submissions.attested_at IS
  'When attestation was recorded.';
COMMENT ON COLUMN public.referral_submissions.submitted_via IS
  'portal | public_web | paper';
COMMENT ON COLUMN public.referral_submissions.mh_intake IS
  'Mental Health-only structured answers (LOC, treatment history, protection orders, ROI parties, etc.).';

-- 2) Expand referral_source_type for MH relationship values (keep Competency codes)
ALTER TABLE public.referral_submissions
  DROP CONSTRAINT IF EXISTS referral_submissions_referral_source_type_check;

ALTER TABLE public.referral_submissions
  ADD CONSTRAINT referral_submissions_referral_source_type_check
  CHECK (
    referral_source_type IS NULL
    OR referral_source_type = ANY (
      ARRAY[
        -- Competency (existing)
        'court'::text,
        'legal_representative'::text,
        'probation_parole'::text,
        'mental_health_facility'::text,
        'case_management'::text,
        'other_professional'::text,
        'family'::text,
        'self_referral'::text,
        -- Mental Health (MMH referral form)
        'cma_case_manager'::text,
        'state_hospital_staff'::text,
        'facility_clinician'::text,
        'social_worker'::text,
        'other_licensed_provider'::text,
        'family_member'::text,
        'attorney'::text,
        'poa_guardian'::text,
        'self'::text,
        'other'::text
      ]
    )
  );

COMMENT ON CONSTRAINT referral_submissions_referral_source_type_check ON public.referral_submissions IS
  'Competency + Mental Health referral source / relationship codes.';

-- 3) submitted_via soft check (nullable; no hard enum yet)
ALTER TABLE public.referral_submissions
  DROP CONSTRAINT IF EXISTS referral_submissions_submitted_via_check;

ALTER TABLE public.referral_submissions
  ADD CONSTRAINT referral_submissions_submitted_via_check
  CHECK (
    submitted_via IS NULL
    OR submitted_via = ANY (ARRAY['portal'::text, 'public_web'::text, 'paper'::text])
  );
