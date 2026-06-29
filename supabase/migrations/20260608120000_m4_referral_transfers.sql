-- M4 — Immutable transfer history between programs (cross-program checklist).
-- Complements M3 transfer_status on referral_submissions; wire via RPC in M7.

CREATE TABLE IF NOT EXISTS public.referral_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referral_id UUID NOT NULL REFERENCES public.referral_submissions(id) ON DELETE CASCADE,
    from_program_id TEXT REFERENCES public.programs(id) ON DELETE SET NULL,
    to_program_id TEXT NOT NULL REFERENCES public.programs(id) ON DELETE RESTRICT,
    from_assigned_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    to_assigned_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    requested_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'pending',
    resolved_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    reason TEXT,
    notes TEXT,
    CONSTRAINT referral_transfers_status_check CHECK (
        status IN ('pending', 'accepted', 'declined', 'cancelled', 'returned')
    )
);

COMMENT ON TABLE public.referral_transfers IS 'Immutable history of inter-program referral transfers (M4).';

CREATE INDEX IF NOT EXISTS referral_transfers_referral_requested_idx
    ON public.referral_transfers (referral_id, requested_at DESC);

CREATE INDEX IF NOT EXISTS referral_transfers_to_program_status_idx
    ON public.referral_transfers (to_program_id, status, requested_at DESC);

CREATE INDEX IF NOT EXISTS referral_transfers_to_assignee_status_idx
    ON public.referral_transfers (to_assigned_user_id, status, requested_at DESC);
