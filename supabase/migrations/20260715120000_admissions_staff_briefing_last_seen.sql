-- Staff briefing cursor: when admissions staff last marked the sidebar briefing as caught up.

ALTER TABLE public.admissions_staff_profiles
  ADD COLUMN IF NOT EXISTS briefing_last_seen_at TIMESTAMPTZ;

COMMENT ON COLUMN public.admissions_staff_profiles.briefing_last_seen_at IS
  'When the staff user last marked the dashboard Briefing panel as caught up (While you were away).';
