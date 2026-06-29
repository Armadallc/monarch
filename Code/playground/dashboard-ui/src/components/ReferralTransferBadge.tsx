import { COLORS, FONT, RADIUS } from "@design"
import type { MockReferralTransfer } from "../types"

type Props = {
    transfer?: MockReferralTransfer
    /** Outbound pending on the referral's current program. */
    mode?: "outbound" | "inbound"
}

export function ReferralTransferBadge({ transfer, mode = "outbound" }: Props) {
    if (!transfer) return null

    const label =
        mode === "inbound"
            ? `Incoming from ${transfer.from_program}`
            : `Transfer to ${transfer.to_program} pending`

    return (
        <span
            title={label}
            style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "2px 8px",
                fontSize: 10,
                fontWeight: 700,
                fontFamily: FONT,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                borderRadius: RADIUS.pill,
                background: COLORS.infoBg,
                color: COLORS.infoText,
                border: `1px solid ${COLORS.infoBorder}`,
                flexShrink: 0,
                whiteSpace: "nowrap",
            }}
        >
            {label}
        </span>
    )
}
