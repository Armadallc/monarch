import { useMemo, useState } from "react"
import { COLORS, FONT, RADIUS, SHADOWS } from "@design"
import { staffForProgram } from "../referralAssignmentUtils"
import type { DashboardProgram, MockReferral, StaffMember } from "../types"
import { clientDisplayId } from "../utils"

type Props = {
    referral: MockReferral
    programs: DashboardProgram[]
    staffDirectory: StaffMember[]
    onConfirm: (input: { toProgram: DashboardProgram; toAssigneeId: string | null; notes: string }) => void
    onCancel: () => void
}

const fieldLabel = {
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
    fontSize: 12,
    color: COLORS.ashMuted,
    fontFamily: FONT,
}

const fieldInput = {
    padding: "10px 12px",
    fontSize: 13,
    fontFamily: FONT,
    border: `1px solid ${COLORS.ashSubtle}`,
    borderRadius: RADIUS.small,
    background: COLORS.white,
    color: COLORS.ash,
} as const

export function ConfirmTransferDialog({ referral, programs, staffDirectory, onConfirm, onCancel }: Props) {
    const [toProgram, setToProgram] = useState<DashboardProgram>(programs[0] ?? "Mental Health")
    const [toAssigneeId, setToAssigneeId] = useState<string>("")
    const [notes, setNotes] = useState("")

    const receivingStaff = useMemo(
        () => staffForProgram(staffDirectory, toProgram),
        [staffDirectory, toProgram]
    )

    return (
        <div
            role="dialog"
            aria-modal
            style={{
                position: "fixed",
                inset: 0,
                background: COLORS.overlay,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 2100,
                padding: 24,
                backdropFilter: "blur(8px)",
            }}
            onClick={(e) => e.target === e.currentTarget && onCancel()}
        >
            <div
                style={{
                    background: COLORS.white,
                    borderRadius: RADIUS.modal,
                    padding: "28px 32px",
                    maxWidth: 480,
                    width: "100%",
                    boxShadow: SHADOWS.modal,
                    fontFamily: FONT,
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: COLORS.ash }}>
                    Transfer program
                </h2>
                <p style={{ margin: "0 0 20px", fontSize: 14, lineHeight: 1.55, color: COLORS.ashMuted }}>
                    Request transfer for <strong style={{ color: COLORS.ash }}>{clientDisplayId(referral)}</strong> from{" "}
                    <strong style={{ color: COLORS.ash }}>{referral.program}</strong>. The referral stays in your queue
                    until the receiving program accepts.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
                    <label style={fieldLabel}>
                        Target program
                        <select
                            value={toProgram}
                            onChange={(e) => {
                                setToProgram(e.target.value as DashboardProgram)
                                setToAssigneeId("")
                            }}
                            style={{ ...fieldInput, cursor: "pointer" }}
                        >
                            {programs.map((p) => (
                                <option key={p} value={p}>
                                    {p}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label style={fieldLabel}>
                        Assignee at receiving program (optional)
                        <select
                            value={toAssigneeId}
                            onChange={(e) => setToAssigneeId(e.target.value)}
                            style={{ ...fieldInput, cursor: "pointer" }}
                        >
                            <option value="">Unassigned at destination</option>
                            {receivingStaff.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.display_name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label style={fieldLabel}>
                        Notes (optional)
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            placeholder="Reason or context for the receiving team"
                            style={{ ...fieldInput, resize: "vertical" as const }}
                        />
                    </label>
                </div>

                <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                    <button type="button" onClick={onCancel} style={cancelBtn}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={programs.length === 0}
                        onClick={() =>
                            onConfirm({
                                toProgram,
                                toAssigneeId: toAssigneeId || null,
                                notes: notes.trim(),
                            })
                        }
                        style={{
                            ...confirmBtn,
                            opacity: programs.length === 0 ? 0.5 : 1,
                            cursor: programs.length === 0 ? "not-allowed" : "pointer",
                        }}
                    >
                        Request transfer
                    </button>
                </div>
            </div>
        </div>
    )
}

const cancelBtn = {
    padding: "10px 20px",
    fontSize: 14,
    fontWeight: 600,
    fontFamily: FONT,
    border: `1px solid ${COLORS.ashSubtle}`,
    borderRadius: RADIUS.input,
    background: COLORS.white,
    color: COLORS.ash,
    cursor: "pointer",
} as const

const confirmBtn = {
    padding: "10px 20px",
    fontSize: 14,
    fontWeight: 600,
    fontFamily: FONT,
    border: "none",
    borderRadius: RADIUS.input,
    background: COLORS.moonstone,
    color: COLORS.white,
    cursor: "pointer",
} as const
