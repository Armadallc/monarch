-- Admissions staff directory row: how assigned staff appear to referring sources (dashboard "My profile").
-- One row per auth user; RLS: staff @monarchcompetency.com can read all; only own row insert/update.

CREATE TABLE IF NOT EXISTS public.admissions_staff_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  phone TEXT,
  contact_email TEXT,
  title TEXT,
  notification_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.admissions_staff_profiles IS 'Staff-published contact for referrals (assignee display); separate from sign-in email.';

CREATE OR REPLACE FUNCTION public.set_admissions_staff_profiles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_admissions_staff_profiles_updated_at ON public.admissions_staff_profiles;
CREATE TRIGGER trg_admissions_staff_profiles_updated_at
  BEFORE UPDATE ON public.admissions_staff_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_admissions_staff_profiles_updated_at();

ALTER TABLE public.admissions_staff_profiles ENABLE ROW LEVEL SECURITY;

-- Staff domain: read all profiles (resolve assignees on dashboard / exports).
CREATE POLICY admissions_staff_profiles_select_staff
  ON public.admissions_staff_profiles FOR SELECT
  USING (
    (auth.jwt() ->> 'email') IS NOT NULL
    AND (auth.jwt() ->> 'email') LIKE '%@monarchcompetency.com'
  );

CREATE POLICY admissions_staff_profiles_insert_own
  ON public.admissions_staff_profiles FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (auth.jwt() ->> 'email') IS NOT NULL
    AND (auth.jwt() ->> 'email') LIKE '%@monarchcompetency.com'
  );

CREATE POLICY admissions_staff_profiles_update_own
  ON public.admissions_staff_profiles FOR UPDATE
  USING (
    user_id = auth.uid()
    AND (auth.jwt() ->> 'email') IS NOT NULL
    AND (auth.jwt() ->> 'email') LIKE '%@monarchcompetency.com'
  )
  WITH CHECK (
    user_id = auth.uid()
    AND (auth.jwt() ->> 'email') IS NOT NULL
    AND (auth.jwt() ->> 'email') LIKE '%@monarchcompetency.com'
  );
