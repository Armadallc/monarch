-- Phase 5.17: Staff verify / waive / flag document request items.

ALTER TABLE referral_document_request_items
  ADD COLUMN IF NOT EXISTS staff_note TEXT;

COMMENT ON COLUMN referral_document_request_items.staff_note IS
  'Admissions note when item is waived, insufficient, or re-requested; visible to referral source in portal.';

CREATE OR REPLACE FUNCTION update_referral_document_request_item_status(
  p_item_id UUID,
  p_item_status TEXT,
  p_staff_note TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_staff_email TEXT;
  v_row referral_document_request_items%ROWTYPE;
  v_note TEXT;
BEGIN
  v_staff_email := auth.jwt() ->> 'email';
  IF v_staff_email IS NULL OR v_staff_email NOT LIKE '%@monarchcompetency.com' THEN
    RAISE EXCEPTION 'Only admissions staff may update document request items';
  END IF;

  IF p_item_id IS NULL THEN
    RAISE EXCEPTION 'item_id is required';
  END IF;

  IF p_item_status IS NULL OR p_item_status NOT IN (
    'requested', 'uploaded', 'waived', 'insufficient', 'replaced'
  ) THEN
    RAISE EXCEPTION 'Invalid item status';
  END IF;

  SELECT * INTO v_row FROM referral_document_request_items WHERE id = p_item_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Document request item not found';
  END IF;

  v_note := NULLIF(trim(p_staff_note), '');

  IF p_item_status IN ('waived', 'insufficient') AND v_note IS NULL THEN
    RAISE EXCEPTION 'A note is required when waiving or marking insufficient';
  END IF;

  IF p_item_status = 'requested' AND v_row.item_status NOT IN ('insufficient', 'uploaded', 'replaced') THEN
    RAISE EXCEPTION 'Can only re-request from insufficient, received, or replaced status';
  END IF;

  UPDATE referral_document_request_items
  SET
    item_status = p_item_status,
    staff_note = CASE
      WHEN p_item_status IN ('waived', 'insufficient', 'requested') THEN v_note
      WHEN p_item_status = 'uploaded' THEN NULL
      ELSE staff_note
    END,
    updated_at = NOW()
  WHERE id = p_item_id;

  PERFORM log_referral_activity(
    v_row.referral_id,
    'document_request_item_updated',
    jsonb_build_object(
      'item_id', p_item_id,
      'batch_id', v_row.batch_id,
      'document_type', v_row.document_type,
      'previous_status', v_row.item_status,
      'item_status', p_item_status,
      'staff_note', v_note
    )
  );
END;
$$;

COMMENT ON FUNCTION update_referral_document_request_item_status IS
  'Admissions: verify (uploaded), waive, insufficient, or re-request (requested) a document request line item.';

REVOKE ALL ON FUNCTION update_referral_document_request_item_status(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION update_referral_document_request_item_status(UUID, TEXT, TEXT) TO authenticated;
