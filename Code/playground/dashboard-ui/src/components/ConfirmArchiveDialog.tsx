import { COLORS, FONT, RADIUS, SHADOWS } from "@design"
import type { MockReferral } from "../types"
import type { KanbanArchiveShell } from "../kanbanArchiveColumn"
import { clientDisplayId } from "../utils"

type Props = {
    referrals: MockReferral[]
    shell: KanbanArchiveShell
    onConfirm: () => void
    onCancel: () => void
}

function ArchiveIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <rect x="3" y="5" width="18" height="4" rx="1" stroke="currentColor" strokeWidth="2" />
            <path
                d="M5 9v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
            />
            <path d="M10 13h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    )
}

export function ConfirmArchiveDialog({ referrals, shell, onConfirm, onCancel }: Props) {
    const count = referrals.length
    const isBatch = count > 1
    const primaryLabel = isBatch ? referrals.map((r) => clientDisplayId(r)).join(", ") : clientDisplayId(referrals[0]!)

    const staffCopy =
        "This hides the referral from your admissions dashboard. The record is not deleted and can be recovered from Archive."
    const portalCopy =
        "This hides the referral from your dashboard only — admissions still sees it. You can recover it from Archive anytime."

    return (
        <div
            role="dialog"
            aria-modal
            aria-labelledby="confirm-archive-title"
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
                    maxWidth: 440,
                    width: "100%",
                    boxShadow: SHADOWS.modal,
                    fontFamily: FONT,
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 14,
                        marginBottom: 16,
                        padding: "12px 14px",
                        borderRadius: RADIUS.input,
                        background: COLORS.warningBg,
                        border: `1px solid ${COLORS.warningBorder}`,
                        color: COLORS.warningText,
                    }}
                >
                    <span style={{ flexShrink: 0, marginTop: 1 }}>
                        <ArchiveIcon />
                    </span>
                    <div>
                        <h2
                            id="confirm-archive-title"
                            style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: COLORS.warningText }}
                        >
                            {isBatch ? `Archive ${count} referrals?` : "Archive this referral?"}
                        </h2>
                        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: COLORS.warningText }}>
                            {shell === "staff" ? staffCopy : portalCopy}
                        </p>
                    </div>
                </div>

                <p style={{ margin: "0 0 24px", fontSize: 14, lineHeight: 1.55, color: COLORS.ashMuted }}>
                    {isBatch ? (
                        <>
                            Archive <strong style={{ color: COLORS.ash }}>{count} referrals</strong>?
                        </>
                    ) : (
                        <>
                            Archive <strong style={{ color: COLORS.ash }}>{primaryLabel}</strong>?
                        </>
                    )}
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
                            border: `1px solid ${COLORS.warningBorder}`,
                            borderRadius: RADIUS.input,
                            background: COLORS.warningBg,
                            color: COLORS.warningText,
                            cursor: "pointer",
                        }}
                    >
                        Archive
                    </button>
                </div>
            </div>
        </div>
    )
}
