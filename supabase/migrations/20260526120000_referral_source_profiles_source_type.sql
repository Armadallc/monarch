-- Persist professional organization/agency type on referral source profile for referral form autofill.

ALTER TABLE public.referral_source_profiles
  ADD COLUMN IF NOT EXISTS referral_source_type TEXT;

COMMENT ON COLUMN public.referral_source_profiles.referral_source_type IS
  'Professional referral source category (court, legal_representative, etc.) for prefilling authenticated referral form.';
