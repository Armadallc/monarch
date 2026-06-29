-- Referral form: portal access opt-in (per submission) + default preference on source profile.

ALTER TABLE public.referral_submissions
  ADD COLUMN IF NOT EXISTS portal_access_opt_in BOOLEAN;

COMMENT ON COLUMN public.referral_submissions.portal_access_opt_in IS
  'Referral source chose ongoing referral source portal access for this submission (Y/N). Contact fields on the row remain for admissions regardless.';

ALTER TABLE public.referral_source_profiles
  ADD COLUMN IF NOT EXISTS portal_access_preferred BOOLEAN;

COMMENT ON COLUMN public.referral_source_profiles.portal_access_preferred IS
  'Last explicit portal access preference from referral form (true/false); guides post-submit UX and future sessions.';
