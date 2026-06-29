import { COLORS, FONT, RADIUS, SHADOWS } from "@design"
import type { MockReferral } from "../types"
import { clientDisplayId } from "../utils"

type Props = {
    referral: MockReferral
    fromLabel: string
    toLabel: string
    onConfirm: () => void
    onCancel: () => void
}

export function ConfirmAssigneeDialog({ referral, fromLabel, toLabel, onConfirm, onCancel }: Props) {
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
                    maxWidth: 420,
                    width: "100%",
                    boxShadow: SHADOWS.modal,
                    fontFamily: FONT,
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <h2 style={{ margin: "0 0 12px", fontSize: 18, fontWeight: 700, color: COLORS.ash }}>
                    Confirm reassignment
                </h2>
                <p style={{ margin: "0 0 24px", fontSize: 14, lineHeight: 1.55, color: COLORS.ashMuted }}>
                    Reassign <strong style={{ color: COLORS.ash }}>{clientDisplayId(referral)}</strong> from{" "}
                    <strong style={{ color: COLORS.ash }}>{fromLabel}</strong> to{" "}
                    <strong style={{ color: COLORS.ash }}>{toLabel}</strong>?
                </p>
                <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                    <button type="button" onClick={onCancel} style={cancelBtn}>
                        Cancel
                    </button>
                    <button type="button" onClick={onConfirm} style={confirmBtn}>
                        Confirm
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
    background: COLORS.ash,
    color: COLORS.shell,
    cursor: "pointer",
} as const
