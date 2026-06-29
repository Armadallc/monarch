import { COLORS, FONT, RADIUS, SHADOWS } from "@design"
import type { MockReferral } from "../types"
import { STATUS_LABELS, type ReferralStatus } from "../types"
import { clientDisplayId } from "../utils"

type Props = {
    referral: MockReferral
    nextStatus: ReferralStatus
    onConfirm: () => void
    onCancel: () => void
}

export function ConfirmStatusDialog({ referral, nextStatus, onConfirm, onCancel }: Props) {
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
                zIndex: 2000,
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
                    Confirm status change
                </h2>
                <p style={{ margin: "0 0 24px", fontSize: 14, lineHeight: 1.55, color: COLORS.ashMuted }}>
                    Move <strong style={{ color: COLORS.ash }}>{clientDisplayId(referral)}</strong> to{" "}
                    <strong style={{ color: COLORS.ash }}>{STATUS_LABELS[nextStatus]}</strong>?
                    <br />
                    <span style={{ fontSize: 13 }}>This will notify the referral source.</span>
                </p>
                <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                    <button
                        type="button"
                        onClick={onCancel}
                        style={{
                            padding: "10px 20px",
                            fontSize: 14,
                            fontWeight: 600,
                            fontFamily: FONT,
                            border: `1px solid ${COLORS.ashSubtle}`,
                            borderRadius: RADIUS.input,
                            background: COLORS.white,
                            color: COLORS.ash,
                            cursor: "pointer",
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        style={{
                            padding: "10px 20px",
                            fontSize: 14,
                            fontWeight: 600,
                            fontFamily: FONT,
                            border: "none",
                            borderRadius: RADIUS.input,
                            background: COLORS.ash,
                            color: COLORS.shell,
                            cursor: "pointer",
                        }}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    )
}
