-- Phase 2.7: Structured document requests (admissions → referral source).
-- Batches group one "Send request" action; items are per document type. Additive only.

CREATE TABLE IF NOT EXISTS referral_document_request_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID NOT NULL REFERENCES referral_submissions(id) ON DELETE CASCADE,
  round_number INT NOT NULL,
  message TEXT,
  due_at TIMESTAMPTZ,
  roi_required BOOLEAN NOT NULL DEFAULT false,
  created_by_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT referral_document_request_batches_round_positive CHECK (round_number > 0),
  UNIQUE (referral_id, round_number)
);

CREATE TABLE IF NOT EXISTS referral_document_request_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES referral_document_request_batches(id) ON DELETE CASCADE,
  referral_id UUID NOT NULL REFERENCES referral_submissions(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  inventory_status TEXT,
  item_status TEXT NOT NULL DEFAULT 'requested',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT referral_document_request_items_inventory_status_check
    CHECK (inventory_status IS NULL OR inventory_status IN ('in_custody', 'can_obtain', 'unknown')),
  CONSTRAINT referral_document_request_items_item_status_check
    CHECK (item_status IN ('requested', 'uploaded', 'waived', 'insufficient', 'replaced')),
  UNIQUE (batch_id, document_type)
);

CREATE INDEX IF NOT EXISTS idx_referral_document_request_batches_referral_id
  ON referral_document_request_batches(referral_id);
CREATE INDEX IF NOT EXISTS idx_referral_document_request_items_referral_id
  ON referral_document_request_items(referral_id);
CREATE INDEX IF NOT EXISTS idx_referral_document_request_items_batch_id
  ON referral_document_request_items(batch_id);

COMMENT ON TABLE referral_document_request_batches IS
  'One row per admissions "Request documents" send (round). PHI-free email references portal; see create_referral_document_request().';
COMMENT ON TABLE referral_document_request_items IS
  'Per document type within a batch. item_status updated as source uploads or staff verifies/waives.';

ALTER TABLE referral_document_request_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_document_request_items ENABLE ROW LEVEL SECURITY;

-- Same visibility as referral_submissions (owner email / submitter / staff).
CREATE POLICY referral_document_request_batches_select
  ON referral_document_request_batches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM referral_submissions r
      WHERE r.id = referral_document_request_batches.referral_id
        AND (
          r.submitted_by_user_id = auth.uid()
          OR (
            auth.jwt() ->> 'email' IS NOT NULL
            AND r.referral_source_email IS NOT NULL
            AND lower(trim(r.referral_source_email)) = lower(trim(auth.jwt() ->> 'email'))
          )
          OR (
            (auth.jwt() ->> 'email') IS NOT NULL
            AND (auth.jwt() ->> 'email') LIKE '%@monarchcompetency.com'
          )
        )
    )
  );

CREATE POLICY referral_document_request_items_select
  ON referral_document_request_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM referral_submissions r
      WHERE r.id = referral_document_request_items.referral_id
        AND (
          r.submitted_by_user_id = auth.uid()
          OR (
            auth.jwt() ->> 'email' IS NOT NULL
            AND r.referral_source_email IS NOT NULL
            AND lower(trim(r.referral_source_email)) = lower(trim(auth.jwt() ->> 'email'))
          )
          OR (
            (auth.jwt() ->> 'email') IS NOT NULL
            AND (auth.jwt() ->> 'email') LIKE '%@monarchcompetency.com'
          )
        )
    )
  );

-- Staff may update item fulfillment status (Phase 5 verify/waive); sources update via future RPC/upload hook.
CREATE POLICY referral_document_request_items_update_staff
  ON referral_document_request_items FOR UPDATE
  USING (
    (auth.jwt() ->> 'email') IS NOT NULL
    AND (auth.jwt() ->> 'email') LIKE '%@monarchcompetency.com'
  )
  WITH CHECK (
    (auth.jwt() ->> 'email') IS NOT NULL
    AND (auth.jwt() ->> 'email') LIKE '%@monarchcompetency.com'
  );

CREATE OR REPLACE FUNCTION create_referral_document_request(
  p_referral_id UUID,
  p_document_types TEXT[],
  p_roi_required BOOLEAN DEFAULT false,
  p_due_at TIMESTAMPTZ DEFAULT NULL,
  p_message TEXT DEFAULT NULL,
  p_inventory_by_type JSONB DEFAULT '[]'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_staff_email TEXT;
  v_batch_id UUID;
  v_round INT;
  v_doc TEXT;
  v_inv_status TEXT;
  v_types TEXT[];
BEGIN
  v_staff_email := auth.jwt() ->> 'email';
  IF v_staff_email IS NULL OR v_staff_email NOT LIKE '%@monarchcompetency.com' THEN
    RAISE EXCEPTION 'Only admissions staff may create document requests';
  END IF;

  IF p_referral_id IS NULL THEN
    RAISE EXCEPTION 'referral_id is required';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM referral_submissions WHERE id = p_referral_id) THEN
    RAISE EXCEPTION 'Referral not found';
  END IF;

  v_types := ARRAY(
    SELECT DISTINCT trim(t)
    FROM unnest(COALESCE(p_document_types, ARRAY[]::text[])) AS t
    WHERE trim(t) <> ''
  );

  IF array_length(v_types, 1) IS NULL OR array_length(v_types, 1) < 1 THEN
    RAISE EXCEPTION 'Select at least one document type';
  END IF;

  SELECT COALESCE(MAX(round_number), 0) + 1
  INTO v_round
  FROM referral_document_request_batches
  WHERE referral_id = p_referral_id;

  INSERT INTO referral_document_request_batches (
    referral_id,
    round_number,
    message,
    due_at,
    roi_required,
    created_by_user_id
  )
  VALUES (
    p_referral_id,
    v_round,
    NULLIF(trim(p_message), ''),
    p_due_at,
    COALESCE(p_roi_required, false),
    auth.uid()
  )
  RETURNING id INTO v_batch_id;

  FOREACH v_doc IN ARRAY v_types LOOP
    v_inv_status := NULL;
    IF jsonb_typeof(p_inventory_by_type) = 'array' THEN
      SELECT e->>'status'
      INTO v_inv_status
      FROM jsonb_array_elements(p_inventory_by_type) AS e
      WHERE e->>'type' = v_doc
      LIMIT 1;
    END IF;

    INSERT INTO referral_document_request_items (
      batch_id,
      referral_id,
      document_type,
      inventory_status,
      item_status
    )
    VALUES (
      v_batch_id,
      p_referral_id,
      v_doc,
      v_inv_status,
      'requested'
    );
  END LOOP;

  PERFORM log_referral_activity(
    p_referral_id,
    'document_request_sent',
    jsonb_build_object(
      'batch_id', v_batch_id,
      'round_number', v_round,
      'document_types', to_jsonb(v_types),
      'roi_required', COALESCE(p_roi_required, false),
      'due_at', p_due_at,
      'item_count', array_length(v_types, 1)
    )
  );

  RETURN v_batch_id;
END;
$$;

COMMENT ON FUNCTION create_referral_document_request IS
  'Admissions: create document request batch + items from inventory selection. Logs document_request_sent activity.';

REVOKE ALL ON FUNCTION create_referral_document_request(UUID, TEXT[], BOOLEAN, TIMESTAMPTZ, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_referral_document_request(UUID, TEXT[], BOOLEAN, TIMESTAMPTZ, TEXT, JSONB) TO authenticated;
