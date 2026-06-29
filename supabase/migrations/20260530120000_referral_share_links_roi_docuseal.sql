-- Phase 4: ROI signing via DocuSeal — extend share links with envelope tracking (no per-field ROI tables).

ALTER TABLE referral_share_links
  ADD COLUMN IF NOT EXISTS link_type TEXT NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS requires_dob BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS envelope_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS docuseal_template_id INTEGER,
  ADD COLUMN IF NOT EXISTS docuseal_submission_id INTEGER,
  ADD COLUMN IF NOT EXISTS docuseal_submitter_slug TEXT,
  ADD COLUMN IF NOT EXISTS signer_email TEXT,
  ADD COLUMN IF NOT EXISTS signer_name TEXT,
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS signed_pdf_storage_path TEXT;

ALTER TABLE referral_share_links
  DROP CONSTRAINT IF EXISTS referral_share_links_link_type_check;

ALTER TABLE referral_share_links
  ADD CONSTRAINT referral_share_links_link_type_check
  CHECK (link_type IN ('general', 'roi_sign', 'document_upload'));

ALTER TABLE referral_share_links
  DROP CONSTRAINT IF EXISTS referral_share_links_envelope_status_check;

ALTER TABLE referral_share_links
  ADD CONSTRAINT referral_share_links_envelope_status_check
  CHECK (
    envelope_status IN (
      'pending',
      'embed_ready',
      'signer_completed',
      'completed',
      'expired',
      'revoked'
    )
  );

COMMENT ON COLUMN referral_share_links.link_type IS
  'general = legacy share; roi_sign = DocuSeal ROI; document_upload = upload-only (future).';
COMMENT ON COLUMN referral_share_links.envelope_status IS
  'ROI workflow: pending → embed_ready → signer_completed/completed. DocuSeal holds field data; we store PDF + status only.';
COMMENT ON COLUMN referral_share_links.docuseal_submitter_slug IS
  'DocuSeal submitter slug for embedded form (https://docuseal.com/s/{slug}).';
COMMENT ON COLUMN referral_share_links.signed_pdf_storage_path IS
  'Supabase storage path to executed ROI PDF after webhook (e.g. referrals/{id}/roi/signed-....pdf).';

CREATE INDEX IF NOT EXISTS idx_referral_share_links_link_type
  ON referral_share_links(referral_id, link_type);

CREATE INDEX IF NOT EXISTS idx_referral_share_links_docuseal_submission
  ON referral_share_links(docuseal_submission_id)
  WHERE docuseal_submission_id IS NOT NULL;

-- Staff: create ROI signing link for a referral (optionally tied to a document-request batch).
CREATE OR REPLACE FUNCTION create_referral_roi_share_link(
  p_referral_id UUID,
  p_label TEXT DEFAULT NULL,
  p_expires_days INT DEFAULT 14,
  p_signer_email TEXT DEFAULT NULL,
  p_signer_name TEXT DEFAULT NULL,
  p_requires_dob BOOLEAN DEFAULT true,
  p_document_request_batch_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_staff_email TEXT;
  v_token TEXT;
  v_link_id UUID;
  v_expires TIMESTAMPTZ;
BEGIN
  v_staff_email := lower(trim(coalesce(auth.jwt() ->> 'email', '')));
  IF v_staff_email = '' OR v_staff_email NOT LIKE '%@monarchcompetency.com' THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM referral_submissions r WHERE r.id = p_referral_id) THEN
    RAISE EXCEPTION 'Referral not found';
  END IF;

  v_token := replace(gen_random_uuid()::text, '-', '');
  v_expires := NOW() + (GREATEST(p_expires_days, 1) || ' days')::interval;

  INSERT INTO referral_share_links (
    referral_id,
    token,
    label,
    expires_at,
    created_by_user_id,
    link_type,
    requires_dob,
    envelope_status,
    docuseal_template_id,
    signer_email,
    signer_name,
    sent_at
  )
  VALUES (
    p_referral_id,
    v_token,
    coalesce(nullif(trim(p_label), ''), 'ROI signing'),
    v_expires,
    auth.uid(),
    'roi_sign',
    coalesce(p_requires_dob, true),
    'pending',
    NULL,
    nullif(trim(p_signer_email), ''),
    nullif(trim(p_signer_name), ''),
    NOW()
  )
  RETURNING id INTO v_link_id;

  PERFORM log_referral_activity(
    p_referral_id,
    'roi_share_link_created',
    jsonb_build_object(
      'share_link_id', v_link_id,
      'document_request_batch_id', p_document_request_batch_id
    )
  );

  INSERT INTO referral_section_statuses (referral_id, section_key, status, updated_at, updated_by_user_id)
  VALUES (p_referral_id, 'roi', 'in_progress', NOW(), auth.uid())
  ON CONFLICT (referral_id, section_key)
  DO UPDATE SET
    status = CASE
      WHEN referral_section_statuses.status = 'not_started' THEN 'in_progress'
      ELSE referral_section_statuses.status
    END,
    updated_at = NOW(),
    updated_by_user_id = COALESCE(auth.uid(), referral_section_statuses.updated_by_user_id);

  RETURN v_link_id;
END;
$$;

COMMENT ON FUNCTION create_referral_roi_share_link IS
  'Staff-only: create roi_sign share link for /r/{token}. DocuSeal session created on first visit via edge function.';

GRANT EXECUTE ON FUNCTION create_referral_roi_share_link TO authenticated;
