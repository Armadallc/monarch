-- ============================================================================
-- MONARCH COMPETENCY — REVISED REFERRAL FORM DATABASE MIGRATION
-- ============================================================================
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard)
-- This migration adds ~45 new columns, converts 3 boolean columns to text,
-- and adds a referral code system for post-submission document uploads.
--
-- IMPORTANT: Run this BEFORE deploying the updated TestForm.tsx
-- ============================================================================

-- ============================================================================
-- STEP 1: NEW COLUMNS — Referral Source (Step 1)
-- ============================================================================

-- referral_source_organization and referral_source_title already exist in DB
-- Just adding the new fields

ALTER TABLE referral_submissions
  ADD COLUMN IF NOT EXISTS can_provide_collateral text,
  ADD COLUMN IF NOT EXISTS previous_monarch_referral text,
  ADD COLUMN IF NOT EXISTS referral_code text;

-- Unique index on referral_code for lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_referral_code
  ON referral_submissions (referral_code)
  WHERE referral_code IS NOT NULL;

-- ============================================================================
-- STEP 2: NEW COLUMNS — Additional Contacts (Step 2)
-- ============================================================================

ALTER TABLE referral_submissions
  ADD COLUMN IF NOT EXISTS emergency_contact_can_provide_info boolean,
  ADD COLUMN IF NOT EXISTS additional_contacts jsonb DEFAULT '[]'::jsonb;

-- additional_contacts stores array of objects:
-- [
--   {
--     "name": "Jane Smith",
--     "organization": "Public Defender's Office",
--     "phone_email": "jane@example.com",
--     "role": "Defense Attorney",
--     "can_provide_info": true
--   }
-- ]

-- ============================================================================
-- STEP 3: NEW COLUMNS — Demographics (Step 3)
-- ============================================================================

ALTER TABLE referral_submissions
  ADD COLUMN IF NOT EXISTS client_sex_at_birth text,
  ADD COLUMN IF NOT EXISTS client_pronouns text,
  ADD COLUMN IF NOT EXISTS client_english_proficiency text,
  ADD COLUMN IF NOT EXISTS client_ethnicity text,
  ADD COLUMN IF NOT EXISTS client_marital_status text,
  ADD COLUMN IF NOT EXISTS client_phone text,
  ADD COLUMN IF NOT EXISTS client_email text,
  ADD COLUMN IF NOT EXISTS client_consents_to_referral text;

-- client_middle_name, client_primary_language, interpreter_needed,
-- client_preferred_name already exist in DB — just need to be collected in form

-- ============================================================================
-- STEP 4: NEW COLUMNS — Documents & Identification (Step 4)
-- ============================================================================

ALTER TABLE referral_submissions
  ADD COLUMN IF NOT EXISTS documents_available jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS documents_notes text;

-- uploaded_documents already exists in DB — will be activated
-- documents_available stores array of strings:
-- ["valid_co_id", "court_order", "psychiatric_records", ...]

-- ============================================================================
-- STEP 5: NEW COLUMNS — Insurance & Benefits (Step 5)
-- ============================================================================

-- medicaid_status already exists but options are changing
-- medicaid_id already exists (may keep as-is or add medicaid_number)

ALTER TABLE referral_submissions
  ADD COLUMN IF NOT EXISTS medicaid_number text,
  ADD COLUMN IF NOT EXISTS medicare_status text,
  ADD COLUMN IF NOT EXISTS medicare_number text,
  ADD COLUMN IF NOT EXISTS has_private_insurance boolean,
  ADD COLUMN IF NOT EXISTS private_insurance_details text,
  ADD COLUMN IF NOT EXISTS ssdi_status text,
  ADD COLUMN IF NOT EXISTS benefits_notes text;

-- ============================================================================
-- STEP 6: NEW COLUMNS — Legal Status & Court (Step 6)
-- ============================================================================

ALTER TABLE referral_submissions
  ADD COLUMN IF NOT EXISTS courtroom text,
  ADD COLUMN IF NOT EXISTS competency_status text,
  ADD COLUMN IF NOT EXISTS competency_evaluator text,
  ADD COLUMN IF NOT EXISTS attorney_phone text,
  ADD COLUMN IF NOT EXISTS attorney_email text,
  ADD COLUMN IF NOT EXISTS on_probation boolean,
  ADD COLUMN IF NOT EXISTS probation_officer_contact text,
  ADD COLUMN IF NOT EXISTS on_parole boolean,
  ADD COLUMN IF NOT EXISTS parole_officer_contact text,
  ADD COLUMN IF NOT EXISTS active_warrants text,
  ADD COLUMN IF NOT EXISTS has_bond_holds text,
  ADD COLUMN IF NOT EXISTS bond_holds_details text,
  ADD COLUMN IF NOT EXISTS pr_bond_to_monarch text,
  ADD COLUMN IF NOT EXISTS pr_bond_judge_contact text,
  ADD COLUMN IF NOT EXISTS pr_bond_da_contact text,
  ADD COLUMN IF NOT EXISTS pr_bond_other_contacts text;

-- ============================================================================
-- STEP 7: NEW COLUMNS — Current Location & Situation (Step 7)
-- ============================================================================

ALTER TABLE referral_submissions
  ADD COLUMN IF NOT EXISTS facility_address text,
  ADD COLUMN IF NOT EXISTS currently_incarcerated boolean,
  ADD COLUMN IF NOT EXISTS expected_release_date date,
  ADD COLUMN IF NOT EXISTS housing_prior text,
  ADD COLUMN IF NOT EXISTS housing_post_program text,
  ADD COLUMN IF NOT EXISTS housing_notes text;

-- ============================================================================
-- STEP 8: NEW COLUMNS — Mental Health & Clinical (Step 8)
-- ============================================================================

ALTER TABLE referral_submissions
  ADD COLUMN IF NOT EXISTS medication_compliance text,
  ADD COLUMN IF NOT EXISTS medication_barriers text,
  ADD COLUMN IF NOT EXISTS previous_treatment_programs text,
  ADD COLUMN IF NOT EXISTS tbi_history text,
  ADD COLUMN IF NOT EXISTS tbi_details text,
  ADD COLUMN IF NOT EXISTS idd_status text,
  ADD COLUMN IF NOT EXISTS idd_details text;

-- ============================================================================
-- STEP 9: NEW COLUMNS — Substance Use (Step 9)
-- ============================================================================

ALTER TABLE referral_submissions
  ADD COLUMN IF NOT EXISTS substance_use_pattern text,
  ADD COLUMN IF NOT EXISTS substance_use_current text,
  ADD COLUMN IF NOT EXISTS detox_required text,
  ADD COLUMN IF NOT EXISTS detox_details text;

-- ============================================================================
-- STEP 10: NEW COLUMNS — Medical & Somatic (Step 10)
-- ============================================================================

ALTER TABLE referral_submissions
  ADD COLUMN IF NOT EXISTS medical_conditions_controlled text,
  ADD COLUMN IF NOT EXISTS medications_non_psychiatric text,
  ADD COLUMN IF NOT EXISTS medication_allergies text,
  ADD COLUMN IF NOT EXISTS mobility_needs text,
  ADD COLUMN IF NOT EXISTS adl_support_needed boolean,
  ADD COLUMN IF NOT EXISTS adl_support_details text,
  ADD COLUMN IF NOT EXISTS acute_medical_needs text;

-- ============================================================================
-- STEP 11: NEW COLUMNS — Safety & Risk (Step 11)
-- ============================================================================

ALTER TABLE referral_submissions
  ADD COLUMN IF NOT EXISTS suicide_risk_details text,
  ADD COLUMN IF NOT EXISTS violence_risk_details text,
  ADD COLUMN IF NOT EXISTS elopement_risk_details text,
  ADD COLUMN IF NOT EXISTS arson_history text,
  ADD COLUMN IF NOT EXISTS arson_details text,
  ADD COLUMN IF NOT EXISTS rso_status text,
  ADD COLUMN IF NOT EXISTS rso_details text;

-- ============================================================================
-- STEP 12: NEW COLUMNS — Urgency (Step 12)
-- ============================================================================

ALTER TABLE referral_submissions
  ADD COLUMN IF NOT EXISTS urgency_level text,
  ADD COLUMN IF NOT EXISTS urgency_reason text,
  ADD COLUMN IF NOT EXISTS referral_source_channel text;

-- ============================================================================
-- TYPE CHANGES — Risk Assessment Columns (boolean → text enum)
-- ============================================================================
--
-- Converting boolean risk columns to text so they can store timeframe enums:
--   Current (within 30 days) / Recent (within 90 days) /
--   Recovering (4-12 months) / Historical (1+ year) / No history
--
-- Existing data is preserved:
--   true  → 'historical' (conservative — we don't know the timeframe)
--   false → 'no_history'
--   NULL  → NULL (unchanged)
--
-- NOTE: If your existing data has no rows yet, you can skip the data migration
-- and just change the column type directly.
-- ============================================================================

-- suicide_risk: boolean → text
ALTER TABLE referral_submissions
  ALTER COLUMN suicide_risk TYPE text
  USING CASE
    WHEN suicide_risk = true THEN 'historical'
    WHEN suicide_risk = false THEN 'no_history'
    ELSE NULL
  END;

-- violence_risk: boolean → text
ALTER TABLE referral_submissions
  ALTER COLUMN violence_risk TYPE text
  USING CASE
    WHEN violence_risk = true THEN 'historical'
    WHEN violence_risk = false THEN 'no_history'
    ELSE NULL
  END;

-- elopement_risk: boolean → text
ALTER TABLE referral_submissions
  ALTER COLUMN elopement_risk TYPE text
  USING CASE
    WHEN elopement_risk = true THEN 'historical'
    WHEN elopement_risk = false THEN 'no_history'
    ELSE NULL
  END;

-- ============================================================================
-- REFERRAL CODE GENERATOR FUNCTION
-- ============================================================================
--
-- Generates a unique short code like MON-A4K7 for each referral.
-- Called at INSERT time by the form.
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text;
  i int;
  exists_check boolean;
BEGIN
  LOOP
    code := 'MON-';
    FOR i IN 1..4 LOOP
      code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;

    SELECT EXISTS(
      SELECT 1 FROM referral_submissions WHERE referral_code = code
    ) INTO exists_check;

    EXIT WHEN NOT exists_check;
  END LOOP;

  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- AUTO-GENERATE REFERRAL CODE ON INSERT (trigger)
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_set_referral_code()
RETURNS trigger AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS trg_auto_referral_code ON referral_submissions;
CREATE TRIGGER trg_auto_referral_code
  BEFORE INSERT ON referral_submissions
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_referral_code();

-- ============================================================================
-- SUPABASE STORAGE SETUP (Manual Steps)
-- ============================================================================
--
-- 1. Go to Supabase Dashboard → Storage
-- 2. Create a new bucket: "referral-documents"
--    - Set to PRIVATE (not public)
-- 3. Add RLS policies:
--
-- Policy: Allow authenticated users to upload
-- CREATE POLICY "Authenticated users can upload referral documents"
-- ON storage.objects FOR INSERT
-- WITH CHECK (
--   bucket_id = 'referral-documents'
--   AND auth.role() = 'authenticated'
-- );
--
-- Policy: Allow admins to read/download
-- CREATE POLICY "Admins can read referral documents"
-- ON storage.objects FOR SELECT
-- USING (
--   bucket_id = 'referral-documents'
--   AND auth.role() = 'authenticated'
-- );
--
-- File path pattern: referrals/{referral_id}/{filename}
-- uploaded_documents column stores jsonb array:
-- [
--   {
--     "filename": "competency_eval.pdf",
--     "storage_path": "referrals/abc123/competency_eval.pdf",
--     "file_size": 245000,
--     "mime_type": "application/pdf",
--     "uploaded_at": "2025-02-08T14:30:00Z"
--   }
-- ]
--
-- ============================================================================

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check all new columns were added:
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'referral_submissions'
-- ORDER BY ordinal_position;

-- Check risk columns are now text:
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'referral_submissions'
--   AND column_name IN ('suicide_risk', 'violence_risk', 'elopement_risk');

-- Test referral code generation:
-- SELECT generate_referral_code();

-- Check total column count:
-- SELECT count(*)
-- FROM information_schema.columns
-- WHERE table_name = 'referral_submissions';


-----------

VERIFICATION QUERIES

| column_name                        | data_type                |
| ---------------------------------- | ------------------------ |
| id                                 | uuid                     |
| referral_source_type               | text                     |
| is_priority_referral               | boolean                  |
| referral_source_name               | text                     |
| referral_source_email              | text                     |
| referral_source_phone              | text                     |
| referral_source_organization       | text                     |
| referral_source_title              | text                     |
| urgent_placement                   | boolean                  |
| client_first_name                  | text                     |
| client_middle_name                 | text                     |
| client_last_name                   | text                     |
| client_dob                         | date                     |
| client_ssn                         | text                     |
| client_gender                      | text                     |
| case_number                        | text                     |
| court_jurisdiction                 | text                     |
| judge_name                         | text                     |
| attorney_name                      | text                     |
| charges                            | text                     |
| competency_eval_date               | date                     |
| next_court_date                    | date                     |
| current_location_type              | text                     |
| facility_name                      | text                     |
| inmate_id                          | text                     |
| facility_contact_person            | text                     |
| facility_contact_phone             | text                     |
| emergency_contact_name             | text                     |
| emergency_contact_relationship     | text                     |
| emergency_contact_phone            | text                     |
| current_diagnoses                  | text                     |
| current_medications                | jsonb                    |
| psychiatric_history                | text                     |
| substance_use_history              | text                     |
| medical_conditions                 | text                     |
| medicaid_status                    | text                     |
| medicaid_id                        | text                     |
| medicaid_mco                       | text                     |
| expected_payer                     | text                     |
| violence_risk                      | text                     |
| suicide_risk                       | text                     |
| elopement_risk                     | text                     |
| medical_needs                      | boolean                  |
| safety_notes                       | text                     |
| uploaded_documents                 | jsonb                    |
| status                             | text                     |
| reviewed_by                        | uuid                     |
| reviewed_at                        | timestamp with time zone |
| review_notes                       | text                     |
| created_at                         | timestamp with time zone |
| updated_at                         | timestamp with time zone |
| ip_address                         | inet                     |
| user_agent                         | text                     |
| form_completion_percentage         | integer                  |
| time_spent_seconds                 | integer                  |
| session_id                         | uuid                     |
| last_auto_save                     | timestamp with time zone |
| client_preferred_name              | text                     |
| client_primary_language            | text                     |
| interpreter_needed                 | boolean                  |
| additional_notes                   | text                     |
| archived_at                        | timestamp with time zone |
| can_provide_collateral             | text                     |
| previous_monarch_referral          | text                     |
| referral_code                      | text                     |
| emergency_contact_can_provide_info | boolean                  |
| additional_contacts                | jsonb                    |
| client_sex_at_birth                | text                     |
| client_pronouns                    | text                     |
| client_english_proficiency         | text                     |
| client_ethnicity                   | text                     |
| client_marital_status              | text                     |
| client_phone                       | text                     |
| client_email                       | text                     |
| client_consents_to_referral        | text                     |
| documents_available                | jsonb                    |
| documents_notes                    | text                     |
| medicaid_number                    | text                     |
| medicare_status                    | text                     |
| medicare_number                    | text                     |
| has_private_insurance              | boolean                  |
| private_insurance_details          | text                     |
| ssdi_status                        | text                     |
| benefits_notes                     | text                     |
| courtroom                          | text                     |
| competency_status                  | text                     |
| competency_evaluator               | text                     |
| attorney_phone                     | text                     |
| attorney_email                     | text                     |
| on_probation                       | boolean                  |
| probation_officer_contact          | text                     |
| on_parole                          | boolean                  |
| parole_officer_contact             | text                     |
| active_warrants                    | text                     |
| has_bond_holds                     | text                     |
| bond_holds_details                 | text                     |
| pr_bond_to_monarch                 | text                     |
| pr_bond_judge_contact              | text                     |
| pr_bond_da_contact                 | text                     |
| pr_bond_other_contacts             | text                     |

---

| column_name    | data_type |
| -------------- | --------- |
| violence_risk  | text      |
| suicide_risk   | text      |
| elopement_risk | text      |

---

| count |
| ----- |
| 134   |