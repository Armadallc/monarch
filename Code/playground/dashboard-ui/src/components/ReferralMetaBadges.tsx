import type { CSSProperties } from "react"
import { ReferralCardIndicators } from "./ReferralCardIndicators"
import { ReferralProgramLabel } from "./ReferralProgramLabel"
import { ReferralStatusBadge } from "./ReferralStatusBadge"
import { ExpeditedBadge, TimeBoundBadge } from "./ReferralUrgencyBadges"
import type { MockReferral } from "../types"
import { expeditedLabel } from "../utils"

const rowStyle: CSSProperties = {
    display: "inline-flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
}

const splitRowStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    width: "100%",
}

type Props = {
    referral: MockReferral
    showStatus?: boolean
    showUrgency?: boolean
    showProgram?: boolean
    showIndicators?: boolean
    /** Kanban card: urgency icons left, program label right in one row. */
    layout?: "inline" | "split"
    compact?: boolean
}

export function ReferralMetaBadges({
    referral,
    showStatus = true,
    showUrgency = true,
    showProgram = true,
    showIndicators = true,
    layout = "inline",
    compact = false,
}: Props) {
    const priority = expeditedLabel(referral.urgent_placement, referral.urgency_level)
    const badgeVariant = compact ? "compact" : "default"

    const urgency = (
        <>
            {showUrgency && priority === "EXPEDITED" && <ExpeditedBadge variant={badgeVariant} />}
            {showUrgency && priority === "TIME-BOUND" && (
                <TimeBoundBadge targetDateIso={referral.urgency_target_date} variant={badgeVariant} />
            )}
        </>
    )

    if (layout === "split") {
        return (
            <div style={splitRowStyle}>
                <div style={rowStyle}>
                    {showStatus && <ReferralStatusBadge status={referral.status} />}
                    {urgency}
                    {showIndicators && <ReferralCardIndicators referral={referral} variant="info" />}
                </div>
                {showProgram && (
                    <ReferralProgramLabel program={referral.program} variant={compact ? "compact" : "default"} />
                )}
            </div>
        )
    }

    return (
        <div style={rowStyle}>
            {showStatus && <ReferralStatusBadge status={referral.status} />}
            {urgency}
            {showProgram && (
                <ReferralProgramLabel program={referral.program} variant={compact ? "compact" : "default"} />
            )}
            {showIndicators && <ReferralCardIndicators referral={referral} variant="info" />}
        </div>
    )
}
