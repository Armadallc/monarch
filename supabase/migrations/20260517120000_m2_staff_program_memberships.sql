-- M2 — Staff program memberships (cross-program checklist).
-- program_id is TEXT to match public.programs.id when it is varchar/text (e.g. prog_competency).

CREATE TABLE IF NOT EXISTS public.staff_program_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id TEXT NOT NULL REFERENCES public.programs(id) ON DELETE RESTRICT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.staff_program_memberships IS 'Which staff (auth.users) belong to which Monarch program; drives dashboard scope and future RLS.';

CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_program_memberships_user_program
  ON public.staff_program_memberships (user_id, program_id);

CREATE INDEX IF NOT EXISTS idx_staff_program_memberships_program_role_status
  ON public.staff_program_memberships (program_id, role, status);

CREATE INDEX IF NOT EXISTS idx_staff_program_memberships_user_status
  ON public.staff_program_memberships (user_id, status);

-- Keep updated_at fresh on row changes (optional but useful).
CREATE OR REPLACE FUNCTION public.set_staff_program_memberships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_staff_program_memberships_updated_at ON public.staff_program_memberships;
CREATE TRIGGER trg_staff_program_memberships_updated_at
  BEFORE UPDATE ON public.staff_program_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.set_staff_program_memberships_updated_at();

-- If you previously created this table with program_id uuid, drop it (no prod data) or ALTER COLUMN:
--   ALTER TABLE public.staff_program_memberships DROP CONSTRAINT staff_program_memberships_program_id_fkey;
--   ALTER TABLE public.staff_program_memberships ALTER COLUMN program_id TYPE text USING program_id::text;

-- Optional seed (run manually in SQL editor after review):
-- INSERT INTO public.staff_program_memberships (user_id, program_id, role, status)
-- SELECT u.id, p.id, 'admin', 'active'
-- FROM auth.users u
-- CROSS JOIN public.programs p
-- WHERE p.slug = 'competency' AND u.email = 'you@monarchcompetency.com'
-- ON CONFLICT (user_id, program_id) DO NOTHING;

-- Validation:
-- SELECT spm.*, p.slug, u.email
-- FROM public.staff_program_memberships spm
-- JOIN public.programs p ON p.id = spm.program_id
-- JOIN auth.users u ON u.id = spm.user_id
-- ORDER BY p.slug, u.email;
