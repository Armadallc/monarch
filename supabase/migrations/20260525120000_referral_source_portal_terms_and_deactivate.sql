-- Referral source: one-time portal terms acknowledgement + optional profile deactivation.

ALTER TABLE public.referral_source_profiles
  ADD COLUMN IF NOT EXISTS portal_terms_acknowledged_at TIMESTAMPTZ;

ALTER TABLE public.referral_source_profiles
  ADD COLUMN IF NOT EXISTS profile_deactivated_at TIMESTAMPTZ;

COMMENT ON COLUMN public.referral_source_profiles.portal_terms_acknowledged_at IS
  'When the referral source accepted the one-time portal disclosure (secure transmission, portal availability).';

COMMENT ON COLUMN public.referral_source_profiles.profile_deactivated_at IS
  'When the referral source deactivated their portal profile; referral PHI rows remain per retention policy.';
