import type { MockReferralTransfer } from "./types"

/** Demo inbound transfer — Jane Doe (referral 2) Competency → Mental Health. */
export const INITIAL_MOCK_REFERRAL_TRANSFERS: MockReferralTransfer[] = [
    {
        id: "xfer-demo-1",
        referral_id: "2",
        from_program: "Competency",
        to_program: "Mental Health",
        from_assigned_user_id: "staff-1",
        to_assigned_user_id: "staff-4",
        requested_by_staff_id: "staff-1",
        requested_at: "2026-05-20",
        status: "pending",
        notes: "Client may be better served in MH program — collateral attached.",
    },
]
