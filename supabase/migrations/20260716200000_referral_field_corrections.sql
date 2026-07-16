-- Field-level corrections (2 CCR 502-1-2.11(I)-oriented) + acceptance snapshot for EMR handoff.
-- Sources do not edit post-submit; admissions staff apply corrections via RPC only.

-- ---------------------------------------------------------------------------
-- 1. Identity column used by correction allowlist (was not on submissions yet)
-- ---------------------------------------------------------------------------
ALTER TABLE public.referral_submissions
  ADD COLUMN IF NOT EXISTS client_drivers_license TEXT;

COMMENT ON COLUMN public.referral_submissions.client_drivers_license IS
  'Client driver license / ID number when known; correctable by admissions via apply_referral_field_corrections.';

-- ---------------------------------------------------------------------------
-- 2. Acceptance snapshot (freeze at accepted → EMR handoff)
-- ---------------------------------------------------------------------------
ALTER TABLE public.referral_submissions
  ADD COLUMN IF NOT EXISTS acceptance_snapshot JSONB,
  ADD COLUMN IF NOT EXISTS acceptance_snapshot_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS acceptance_snapshot_by UUID REFERENCES auth.users(id);

COMMENT ON COLUMN public.referral_submissions.acceptance_snapshot IS
  'Immutable JSON of key field values at the moment status first became accepted (EMR handoff boundary).';
COMMENT ON COLUMN public.referral_submissions.acceptance_snapshot_at IS
  'When acceptance_snapshot was written. Not overwritten on later status changes.';
COMMENT ON COLUMN public.referral_submissions.acceptance_snapshot_by IS
  'Staff user who flipped status to accepted when the snapshot was taken.';

-- ---------------------------------------------------------------------------
-- 3. Append-only field corrections log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.referral_field_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID NOT NULL REFERENCES public.referral_submissions(id) ON DELETE CASCADE,
  correction_session_id UUID NOT NULL,
  field_key TEXT NOT NULL,
  previous_value TEXT,
  new_value TEXT,
  reason TEXT NOT NULL,
  requested_by TEXT,
  source_document TEXT,
  corrected_by_user_id UUID NOT NULL REFERENCES auth.users(id),
  corrected_by_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT referral_field_corrections_reason_nonempty CHECK (length(trim(reason)) > 0),
  CONSTRAINT referral_field_corrections_field_key_nonempty CHECK (length(trim(field_key)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_referral_field_corrections_referral_id
  ON public.referral_field_corrections(referral_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_referral_field_corrections_created_at
  ON public.referral_field_corrections(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_referral_field_corrections_session
  ON public.referral_field_corrections(correction_session_id);

COMMENT ON TABLE public.referral_field_corrections IS
  'Append-only identity/field corrections by admissions staff. Nature=field_key+values; reason; corrected_by=staff; requested_by/source_document=who asked / evidence. Retain with referral record (10yr).';
COMMENT ON COLUMN public.referral_field_corrections.correction_session_id IS
  'Groups multiple field rows from one staff attestation (same reason/document).';
COMMENT ON COLUMN public.referral_field_corrections.corrected_by_user_id IS
  'Accountable staff member who applied and attested the correction (not the referring source).';
COMMENT ON COLUMN public.referral_field_corrections.requested_by IS
  'Who requested the change (referring source name/org/email or free text).';
COMMENT ON COLUMN public.referral_field_corrections.source_document IS
  'Evidence reference (DL scan filename, Medicaid letter, message id, etc.).';

ALTER TABLE public.referral_field_corrections ENABLE ROW LEVEL SECURITY;

-- Staff read; no client UPDATE/DELETE (append-only). Writes go through SECURITY DEFINER RPC.
CREATE POLICY referral_field_corrections_select_staff
  ON public.referral_field_corrections FOR SELECT
  USING (
    (auth.jwt() ->> 'email') IS NOT NULL
    AND (auth.jwt() ->> 'email') LIKE '%@monarchcompetency.com'
  );

-- Block application-role mutations; RPC runs as definer and bypasses RLS for INSERT.
REVOKE INSERT, UPDATE, DELETE ON public.referral_field_corrections FROM authenticated, anon;
GRANT SELECT ON public.referral_field_corrections TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. Guard: identity columns only change when RPC sets session flag
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.referral_submissions_guard_identity_corrections()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_allow TEXT;
BEGIN
  v_allow := nullif(current_setting('monarch.allow_identity_correction', true), '');
  IF v_allow = 'on' THEN
    RETURN NEW;
  END IF;

  IF NEW.client_first_name IS DISTINCT FROM OLD.client_first_name
     OR NEW.client_middle_name IS DISTINCT FROM OLD.client_middle_name
     OR NEW.client_last_name IS DISTINCT FROM OLD.client_last_name
     OR NEW.client_preferred_name IS DISTINCT FROM OLD.client_preferred_name
     OR NEW.client_dob IS DISTINCT FROM OLD.client_dob
     OR NEW.client_drivers_license IS DISTINCT FROM OLD.client_drivers_license
     OR NEW.medicaid_number IS DISTINCT FROM OLD.medicaid_number
     OR NEW.medicaid_id IS DISTINCT FROM OLD.medicaid_id
  THEN
    RAISE EXCEPTION
      'Identity fields may only be changed via apply_referral_field_corrections (field-level correction log).';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS referral_submissions_guard_identity_corrections ON public.referral_submissions;
CREATE TRIGGER referral_submissions_guard_identity_corrections
  BEFORE UPDATE ON public.referral_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.referral_submissions_guard_identity_corrections();

COMMENT ON FUNCTION public.referral_submissions_guard_identity_corrections() IS
  'Blocks direct UPDATEs to identity allowlist columns unless monarch.allow_identity_correction=on (set by apply_referral_field_corrections).';

-- ---------------------------------------------------------------------------
-- 5. Freeze snapshot the first time status becomes accepted
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.referral_submissions_capture_acceptance_snapshot()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'accepted'
     AND (OLD.status IS DISTINCT FROM 'accepted')
     AND NEW.acceptance_snapshot_at IS NULL
  THEN
    NEW.acceptance_snapshot := jsonb_strip_nulls(jsonb_build_object(
      'client_first_name', NEW.client_first_name,
      'client_middle_name', NEW.client_middle_name,
      'client_last_name', NEW.client_last_name,
      'client_preferred_name', NEW.client_preferred_name,
      'client_dob', NEW.client_dob,
      'client_drivers_license', NEW.client_drivers_license,
      'client_ssn', NEW.client_ssn,
      'medicaid_number', NEW.medicaid_number,
      'medicaid_id', NEW.medicaid_id,
      'medicaid_status', NEW.medicaid_status,
      'referral_code', NEW.referral_code,
      'admin_ref_id', NEW.admin_ref_id,
      'status', NEW.status,
      'captured_at', NOW()
    ));
    NEW.acceptance_snapshot_at := NOW();
    NEW.acceptance_snapshot_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS referral_submissions_capture_acceptance_snapshot ON public.referral_submissions;
CREATE TRIGGER referral_submissions_capture_acceptance_snapshot
  BEFORE UPDATE OF status ON public.referral_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.referral_submissions_capture_acceptance_snapshot();

COMMENT ON FUNCTION public.referral_submissions_capture_acceptance_snapshot() IS
  'On first transition to accepted, freezes key field values for EMR handoff. Snapshot is not overwritten later.';

-- ---------------------------------------------------------------------------
-- 6. Staff RPC: apply one or more field corrections in a single attestation
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.apply_referral_field_corrections(
  p_referral_id UUID,
  p_corrections JSONB,
  p_reason TEXT,
  p_requested_by TEXT DEFAULT NULL,
  p_source_document TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_staff_email TEXT;
  v_staff_uid UUID;
  v_status TEXT;
  v_reason TEXT;
  v_session_id UUID := gen_random_uuid();
  v_item JSONB;
  v_field TEXT;
  v_new TEXT;
  v_old TEXT;
  v_keys TEXT[] := ARRAY[]::TEXT[];
BEGIN
  v_staff_uid := auth.uid();
  v_staff_email := auth.jwt() ->> 'email';
  IF v_staff_uid IS NULL OR v_staff_email IS NULL OR v_staff_email NOT LIKE '%@monarchcompetency.com' THEN
    RAISE EXCEPTION 'Only admissions staff may apply field corrections';
  END IF;

  v_reason := nullif(trim(p_reason), '');
  IF v_reason IS NULL THEN
    RAISE EXCEPTION 'reason is required';
  END IF;

  IF p_referral_id IS NULL THEN
    RAISE EXCEPTION 'referral_id is required';
  END IF;

  IF p_corrections IS NULL OR jsonb_typeof(p_corrections) <> 'array' OR jsonb_array_length(p_corrections) = 0 THEN
    RAISE EXCEPTION 'corrections must be a non-empty JSON array of {field_key, new_value}';
  END IF;

  SELECT status INTO v_status FROM public.referral_submissions WHERE id = p_referral_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Referral not found';
  END IF;

  IF v_status = 'accepted' THEN
    RAISE EXCEPTION 'Identity corrections are blocked after acceptance; correct in the EMR after handoff';
  END IF;

  -- Allow identity UPDATEs for this transaction only
  PERFORM set_config('monarch.allow_identity_correction', 'on', true);

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_corrections)
  LOOP
    v_field := nullif(trim(v_item ->> 'field_key'), '');
    IF v_field IS NULL THEN
      RAISE EXCEPTION 'Each correction requires field_key';
    END IF;

    IF v_item ? 'new_value' THEN
      v_new := nullif(trim(v_item ->> 'new_value'), '');
    ELSE
      v_new := NULL;
    END IF;

    CASE v_field
      WHEN 'client_first_name' THEN
        SELECT client_first_name INTO v_old FROM public.referral_submissions WHERE id = p_referral_id;
      WHEN 'client_middle_name' THEN
        SELECT client_middle_name INTO v_old FROM public.referral_submissions WHERE id = p_referral_id;
      WHEN 'client_last_name' THEN
        SELECT client_last_name INTO v_old FROM public.referral_submissions WHERE id = p_referral_id;
      WHEN 'client_preferred_name' THEN
        SELECT client_preferred_name INTO v_old FROM public.referral_submissions WHERE id = p_referral_id;
      WHEN 'client_dob' THEN
        SELECT client_dob::text INTO v_old FROM public.referral_submissions WHERE id = p_referral_id;
      WHEN 'client_drivers_license' THEN
        SELECT client_drivers_license INTO v_old FROM public.referral_submissions WHERE id = p_referral_id;
      WHEN 'medicaid_number' THEN
        SELECT medicaid_number INTO v_old FROM public.referral_submissions WHERE id = p_referral_id;
      WHEN 'medicaid_id' THEN
        SELECT medicaid_id INTO v_old FROM public.referral_submissions WHERE id = p_referral_id;
      ELSE
        RAISE EXCEPTION 'Field % is not correctable via this RPC', v_field;
    END CASE;

    IF v_old IS NOT DISTINCT FROM v_new THEN
      CONTINUE;
    END IF;

    CASE v_field
      WHEN 'client_first_name' THEN
        UPDATE public.referral_submissions SET client_first_name = v_new WHERE id = p_referral_id;
      WHEN 'client_middle_name' THEN
        UPDATE public.referral_submissions SET client_middle_name = v_new WHERE id = p_referral_id;
      WHEN 'client_last_name' THEN
        UPDATE public.referral_submissions SET client_last_name = v_new WHERE id = p_referral_id;
      WHEN 'client_preferred_name' THEN
        UPDATE public.referral_submissions SET client_preferred_name = v_new WHERE id = p_referral_id;
      WHEN 'client_dob' THEN
        UPDATE public.referral_submissions
          SET client_dob = CASE WHEN v_new IS NULL THEN NULL ELSE v_new::date END
          WHERE id = p_referral_id;
      WHEN 'client_drivers_license' THEN
        UPDATE public.referral_submissions SET client_drivers_license = v_new WHERE id = p_referral_id;
      WHEN 'medicaid_number' THEN
        UPDATE public.referral_submissions SET medicaid_number = v_new WHERE id = p_referral_id;
      WHEN 'medicaid_id' THEN
        UPDATE public.referral_submissions SET medicaid_id = v_new WHERE id = p_referral_id;
    END CASE;

    INSERT INTO public.referral_field_corrections (
      referral_id,
      correction_session_id,
      field_key,
      previous_value,
      new_value,
      reason,
      requested_by,
      source_document,
      corrected_by_user_id,
      corrected_by_email
    ) VALUES (
      p_referral_id,
      v_session_id,
      v_field,
      v_old,
      v_new,
      v_reason,
      nullif(trim(COALESCE(p_requested_by, '')), ''),
      nullif(trim(COALESCE(p_source_document, '')), ''),
      v_staff_uid,
      v_staff_email
    );

    v_keys := array_append(v_keys, v_field);
  END LOOP;

  IF coalesce(array_length(v_keys, 1), 0) = 0 THEN
    RAISE EXCEPTION 'No field values changed';
  END IF;

  PERFORM public.log_referral_activity(
    p_referral_id,
    'field_corrected',
    jsonb_build_object(
      'correction_session_id', v_session_id,
      'fields', to_jsonb(v_keys),
      'requested_by', nullif(trim(COALESCE(p_requested_by, '')), ''),
      'source_document', nullif(trim(COALESCE(p_source_document, '')), '')
    )
  );

  RETURN v_session_id;
END;
$$;

COMMENT ON FUNCTION public.apply_referral_field_corrections(UUID, JSONB, TEXT, TEXT, TEXT) IS
  'Admissions-only: update allowlisted identity fields and append referral_field_corrections rows in one attestation. Blocked after status=accepted.';

GRANT EXECUTE ON FUNCTION public.apply_referral_field_corrections(UUID, JSONB, TEXT, TEXT, TEXT) TO authenticated;
