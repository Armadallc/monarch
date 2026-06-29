import { COLORS, FONT, RADIUS } from "@design"
import type { MockReferral, MockReferralTransfer } from "../types"
import { clientDisplayId } from "../utils"

type Props = {
    transfers: MockReferralTransfer[]
    referralsById: Record<string, MockReferral | undefined>
    onAccept: (transferId: string) => void
    onDecline: (transferId: string) => void
}

export function IncomingTransfersBar({ transfers, referralsById, onAccept, onDecline }: Props) {
    if (transfers.length === 0) return null

    return (
        <div
            style={{
                marginBottom: 12,
                padding: "12px 14px",
                borderRadius: RADIUS.small,
                border: `1px solid ${COLORS.infoBorder}`,
                background: COLORS.infoBg,
                fontFamily: FONT,
                flexShrink: 0,
            }}
        >
            <div
                style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: COLORS.infoText,
                    marginBottom: 10,
                }}
            >
                Incoming program transfers ({transfers.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {transfers.map((t) => {
                    const referral = referralsById[t.referral_id]
                    const label = referral ? clientDisplayId(referral) : t.referral_id
                    return (
                        <div
                            key={t.id}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 12,
                                flexWrap: "wrap",
                                padding: "8px 10px",
                                borderRadius: RADIUS.small,
                                background: COLORS.white,
                                border: `1px solid ${COLORS.ashSubtle}`,
                            }}
                        >
                            <div style={{ fontSize: 13, color: COLORS.ash, minWidth: 0 }}>
                                <strong>{label}</strong>
                                <span style={{ color: COLORS.ashMuted }}>
                                    {" "}
                                    — {t.from_program} → {t.to_program}
                                </span>
                                {t.notes ? (
                                    <div style={{ fontSize: 12, color: COLORS.ashMuted, marginTop: 4 }}>{t.notes}</div>
                                ) : null}
                            </div>
                            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                                <button type="button" onClick={() => onDecline(t.id)} style={declineBtn}>
                                    Decline
                                </button>
                                <button type="button" onClick={() => onAccept(t.id)} style={acceptBtn}>
                                    Accept
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

const declineBtn = {
    padding: "6px 12px",
    fontSize: 12,
    fontWeight: 600,
    fontFamily: FONT,
    border: `1px solid ${COLORS.ashSubtle}`,
    borderRadius: RADIUS.small,
    background: COLORS.white,
    color: COLORS.ashMuted,
    cursor: "pointer",
} as const

const acceptBtn = {
    padding: "6px 12px",
    fontSize: 12,
    fontWeight: 600,
    fontFamily: FONT,
    border: "none",
    borderRadius: RADIUS.small,
    background: COLORS.moonstone,
    color: COLORS.white,
    cursor: "pointer",
} as const
