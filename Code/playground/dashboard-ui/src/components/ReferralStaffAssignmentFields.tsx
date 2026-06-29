import { useMemo, type CSSProperties } from "react"
import { COLORS, FONT, RADIUS } from "@design"
import { staffForProgram, staffMemberById } from "../referralAssignmentUtils"
import type { DashboardProgram, MockReferral, MockReferralTransfer, StaffMember } from "../types"
import { ReferralTransferBadge } from "./ReferralTransferBadge"

type Props = {
    referral: MockReferral
    staffDirectory: StaffMember[]
    currentStaffId: string
    transferablePrograms: DashboardProgram[]
    pendingTransfer?: MockReferralTransfer
    selectStyle?: CSSProperties
    onAssigneeSelect: (staffId: string | null) => void
    onOpenTransferDialog: () => void
}

const defaultSelectStyle: CSSProperties = {
    padding: "10px 12px",
    fontSize: 13,
    fontFamily: FONT,
    border: `1px solid ${COLORS.ashSubtle}`,
    borderRadius: RADIUS.small,
    background: COLORS.white,
    color: COLORS.ash,
    cursor: "pointer",
    width: "100%",
}

export function ReferralStaffAssignmentFields({
    referral,
    staffDirectory,
    currentStaffId,
    transferablePrograms,
    pendingTransfer,
    selectStyle,
    onAssigneeSelect,
    onOpenTransferDialog,
}: Props) {
    const assignableStaff = useMemo(
        () => staffForProgram(staffDirectory, referral.program),
        [staffDirectory, referral.program]
    )

    const transferPending = referral.transfer_status === "pending_acceptance" || !!pendingTransfer
    const selectCss = selectStyle ?? defaultSelectStyle

    return (
        <>
            {pendingTransfer ? (
                <div
                    style={{
                        padding: "10px 12px",
                        borderRadius: RADIUS.small,
                        background: COLORS.infoBg,
                        border: `1px solid ${COLORS.infoBorder}`,
                        fontSize: 12,
                        color: COLORS.infoText,
                        lineHeight: 1.45,
                    }}
                >
                    <ReferralTransferBadge transfer={pendingTransfer} mode="outbound" />
                    <p style={{ margin: "8px 0 0", color: COLORS.ashMuted }}>
                        Waiting for {pendingTransfer.to_program} to accept. You retain custody until then.
                    </p>
                </div>
            ) : null}

            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: COLORS.ashMuted }}>
                Assignee
                <select
                    value={referral.assigned_to_user_id ?? ""}
                    onChange={(e) => {
                        const next = e.target.value || null
                        if (next === (referral.assigned_to_user_id ?? null)) return
                        onAssigneeSelect(next)
                    }}
                    style={selectCss}
                >
                    <option value="">Unassigned</option>
                    {assignableStaff.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.display_name}
                            {s.id === currentStaffId ? " (you)" : ""}
                        </option>
                    ))}
                </select>
            </label>

            <button
                type="button"
                onClick={() => onAssigneeSelect(currentStaffId)}
                disabled={referral.assigned_to_user_id === currentStaffId}
                style={{
                    padding: "8px 12px",
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: FONT,
                    border: `1px solid ${COLORS.ashSubtle}`,
                    borderRadius: RADIUS.small,
                    background: COLORS.coconut25,
                    color: COLORS.ash,
                    cursor: referral.assigned_to_user_id === currentStaffId ? "default" : "pointer",
                    opacity: referral.assigned_to_user_id === currentStaffId ? 0.6 : 1,
                    textAlign: "left",
                }}
            >
                Assign to me
            </button>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: COLORS.ashMuted }}>
                    PROGRAM
                </div>
                <button
                    type="button"
                    onClick={onOpenTransferDialog}
                    disabled={transferPending || transferablePrograms.length === 0}
                    title={
                        transferPending
                            ? "Transfer already pending"
                            : transferablePrograms.length === 0
                              ? "No other programs in your scope"
                              : "Transfer to another Monarch program"
                    }
                    style={{
                        padding: "10px 12px",
                        fontSize: 13,
                        fontWeight: 600,
                        fontFamily: FONT,
                        border: `1px solid ${COLORS.ashSubtle}`,
                        borderRadius: RADIUS.small,
                        background: COLORS.white,
                        color: COLORS.ash,
                        cursor:
                            transferPending || transferablePrograms.length === 0 ? "not-allowed" : "pointer",
                        opacity: transferPending || transferablePrograms.length === 0 ? 0.55 : 1,
                        textAlign: "left",
                    }}
                >
                    Transfer program…
                </button>
                <p style={{ margin: 0, fontSize: 11, color: COLORS.ashMuted, lineHeight: 1.4 }}>
                    Current: <strong style={{ color: COLORS.ash }}>{referral.program}</strong>
                    {staffMemberById(staffDirectory, referral.assigned_to_user_id)
                        ? ` · ${staffMemberById(staffDirectory, referral.assigned_to_user_id)!.display_name}`
                        : ""}
                </p>
            </div>
        </>
    )
}
