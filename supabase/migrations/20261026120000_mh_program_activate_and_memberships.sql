-- Activate Monarch Mental Health program and seed staff dashboard memberships.
-- Dashboard scope is driven by staff_program_memberships (status=active), not programs.is_active;
-- is_active is still set so MH shows as a live program.

UPDATE public.programs
SET is_active = true
WHERE id = 'prog_mental_health';

-- MH admissions + cross-program competency admins who staff MH launches.
INSERT INTO public.staff_program_memberships (user_id, program_id, role, status)
SELECT u.id, 'prog_mental_health', 'admin', 'active'
FROM auth.users u
WHERE lower(u.email) IN (
  'cdow@monarchmentalhealth.org',
  'cfleishman@monarchmentalhealth.org',
  'cfleishman@monarchcompetency.com',
  'm2@monarchcompetency.com',
  'sbrown@monarchcompetency.com'
)
ON CONFLICT (user_id, program_id) DO UPDATE
SET
  role = EXCLUDED.role,
  status = 'active',
  updated_at = now();
