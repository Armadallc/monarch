import { assigneeShortName } from "./referralAssignmentUtils"
import type {
    DashboardProgram,
    MockReferral,
    MockReferralTransfer,
    ReferralTransferRecordStatus,
    StaffMember,
} from "./types"

export const ALL_DASHBOARD_PROGRAMS: DashboardProgram[] = [
    "Competency",
    "Mental Health",
    "Sober Living",
    "Launch",
]

export function programsStaffMayTransferTo(staff: StaffMember | undefined): DashboardProgram[] {
    if (!staff) return []
    return ALL_DASHBOARD_PROGRAMS.filter((p) => staff.program_ids.includes(p))
}

export function transferableProgramsForReferral(
    staff: StaffMember | undefined,
    referral: MockReferral
): DashboardProgram[] {
    return programsStaffMayTransferTo(staff).filter((p) => p !== referral.program)
}

export function pendingTransferForReferral(
    transfers: MockReferralTransfer[],
    referralId: string
): MockReferralTransfer | undefined {
    return transfers.find((t) => t.referral_id === referralId && t.status === "pending")
}

export function incomingPendingTransfers(
    transfers: MockReferralTransfer[],
    staffPrograms: DashboardProgram[]
): MockReferralTransfer[] {
    const allowed = new Set(staffPrograms)
    return transfers.filter((t) => t.status === "pending" && allowed.has(t.to_program))
}

export function referralHasOutboundTransferPending(referral: MockReferral): boolean {
    return referral.transfer_status === "pending_acceptance"
}

export function createTransferId(): string {
    return `xfer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export type RequestTransferInput = {
    referral: MockReferral
    toProgram: DashboardProgram
    toAssigneeId?: string | null
    notes?: string
    requestedByStaffId: string
}

export function buildPendingTransferRequest(input: RequestTransferInput): {
    transfer: MockReferralTransfer
    referralPatch: Partial<MockReferral>
} {
    const now = new Date().toISOString().slice(0, 10)
    const transfer: MockReferralTransfer = {
        id: createTransferId(),
        referral_id: input.referral.id,
        from_program: input.referral.program,
        to_program: input.toProgram,
        from_assigned_user_id: input.referral.assigned_to_user_id ?? null,
        to_assigned_user_id: input.toAssigneeId ?? null,
        requested_by_staff_id: input.requestedByStaffId,
        requested_at: now,
        status: "pending",
        notes: input.notes?.trim() || null,
    }
    return {
        transfer,
        referralPatch: {
            transfer_status: "pending_acceptance",
            pending_transfer_to_program: input.toProgram,
            last_activity_at: now,
        },
    }
}

export function buildAcceptedTransfer(
    transfer: MockReferralTransfer,
    staffDirectory: StaffMember[]
): { transferPatch: Partial<MockReferralTransfer>; referralPatch: Partial<MockReferral> } {
    const now = new Date().toISOString().slice(0, 10)
    const assignee = transfer.to_assigned_user_id
        ? staffDirectory.find((s) => s.id === transfer.to_assigned_user_id)
        : undefined
    const assigneeName = assignee ? assigneeShortName(assignee.display_name) : undefined

    return {
        transferPatch: { status: "accepted" as ReferralTransferRecordStatus, resolved_at: now },
        referralPatch: {
            program: transfer.to_program,
            transfer_status: "none",
            pending_transfer_to_program: null,
            assigned_to_user_id: transfer.to_assigned_user_id ?? null,
            assignee_name: assigneeName,
            last_activity_at: now,
        },
    }
}

export function buildDeclinedTransfer(): {
    transferPatch: Partial<MockReferralTransfer>
    referralPatch: Partial<MockReferral>
} {
    const now = new Date().toISOString().slice(0, 10)
    return {
        transferPatch: { status: "declined", resolved_at: now },
        referralPatch: {
            transfer_status: "none",
            pending_transfer_to_program: null,
            last_activity_at: now,
        },
    }
}
