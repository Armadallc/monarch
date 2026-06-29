import { COLORS, FONT } from "@design"
import type { MockReferral } from "../types"

type Props = {
    program: MockReferral["program"]
    /** Kanban card — 8px, foreground @ 75%, assignee row right. */
    variant?: "default" | "compact"
}

export function ReferralProgramLabel({ program, variant = "default" }: Props) {
    const compact = variant === "compact"
    return (
        <span
            style={{
                fontSize: compact ? 8 : 10,
                fontWeight: 600,
                fontFamily: FONT,
                color: compact ? COLORS.ash : COLORS.infoText,
                letterSpacing: "0.01em",
                opacity: compact ? 0.75 : 1,
                whiteSpace: "nowrap",
            }}
        >
            {program}
        </span>
    )
}
