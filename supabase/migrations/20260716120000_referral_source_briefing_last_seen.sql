-- Source portal briefing cursor: when the referral source last marked the sidebar Briefing as caught up.

ALTER TABLE public.referral_source_profiles
  ADD COLUMN IF NOT EXISTS briefing_last_seen_at TIMESTAMPTZ;

COMMENT ON COLUMN public.referral_source_profiles.briefing_last_seen_at IS
  'When the referral source last marked the portal Briefing panel as caught up (while you were away).';
