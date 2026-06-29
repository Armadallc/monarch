-- Phase 3.11: When a referral source uploads files, mark matching open document request items as uploaded.

CREATE OR REPLACE FUNCTION sync_document_request_items_on_upload(
  p_referral_id UUID,
  p_document_types TEXT[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_raw TEXT;
  v_norm TEXT;
  v_types TEXT[] := ARRAY[]::TEXT[];
  v_updated_types TEXT[] := ARRAY[]::TEXT[];
  v_item RECORD;
  v_count INT := 0;
BEGIN
  IF p_referral_id IS NULL THEN
    RAISE EXCEPTION 'referral_id is required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM referral_submissions r
    WHERE r.id = p_referral_id
      AND (
        r.submitted_by_user_id = auth.uid()
        OR (
          (auth.jwt() ->> 'email') IS NOT NULL
          AND r.referral_source_email IS NOT NULL
          AND lower(trim(r.referral_source_email)) = lower(trim(auth.jwt() ->> 'email'))
        )
      )
  ) THEN
    RAISE EXCEPTION 'Not authorized to update document requests for this referral';
  END IF;

  FOREACH v_raw IN ARRAY COALESCE(p_document_types, ARRAY[]::TEXT[]) LOOP
    v_norm := trim(v_raw);
    IF v_norm = '' OR v_norm = 'other' THEN
      CONTINUE;
    END IF;
    -- Upload form historically used competency_eval_report; requests use competency_eval.
    IF v_norm = 'competency_eval_report' THEN
      v_norm := 'competency_eval';
    END IF;
    IF NOT v_norm = ANY (v_types) THEN
      v_types := array_append(v_types, v_norm);
    END IF;
  END LOOP;

  IF array_length(v_types, 1) IS NULL THEN
    RETURN jsonb_build_object('updated_count', 0, 'document_types', '[]'::jsonb);
  END IF;

  FOR v_item IN
    UPDATE referral_document_request_items
    SET
      item_status = 'uploaded',
      staff_note = NULL,
      updated_at = NOW()
    WHERE referral_id = p_referral_id
      AND item_status IN ('requested', 'insufficient')
      AND document_type = ANY (v_types)
    RETURNING document_type
  LOOP
    v_count := v_count + 1;
    IF NOT v_item.document_type = ANY (v_updated_types) THEN
      v_updated_types := array_append(v_updated_types, v_item.document_type);
    END IF;
  END LOOP;

  IF v_count > 0 THEN
    PERFORM log_referral_activity(
      p_referral_id,
      'document_request_items_uploaded',
      jsonb_build_object(
        'document_types', to_jsonb(v_updated_types),
        'item_count', v_count
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'updated_count', v_count,
    'document_types', to_jsonb(v_updated_types)
  );
END;
$$;

COMMENT ON FUNCTION sync_document_request_items_on_upload IS
  'Referral source: after upload, mark open document request items (requested/insufficient) as uploaded when document_type matches.';

REVOKE ALL ON FUNCTION sync_document_request_items_on_upload(UUID, TEXT[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION sync_document_request_items_on_upload(UUID, TEXT[]) TO authenticated;
