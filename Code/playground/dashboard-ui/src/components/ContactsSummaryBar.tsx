import { COLORS, FONT, RADIUS } from "@design"
import type { ContactListStats } from "../contactUtils"

type Props = {
    stats: ContactListStats
}

export function ContactsSummaryBar({ stats }: Props) {
    const items = [
        { label: "Total", value: stats.total },
        { label: "Has Referred", value: stats.hasReferred },
        { label: "Personal", value: stats.personal },
        { label: "Multi-Referral", value: stats.multiReferral },
        { label: "Active This Week", value: stats.activeThisWeek },
    ]

    return (
        <div
            style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                marginBottom: 16,
                flexShrink: 0,
            }}
        >
            {items.map((item) => (
                <div
                    key={item.label}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 14px",
                        background: COLORS.white,
                        border: `1px solid ${COLORS.ashSubtle}`,
                        borderRadius: RADIUS.input,
                        fontFamily: FONT,
                    }}
                >
                    <span
                        style={{
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            color: COLORS.ashMuted,
                        }}
                    >
                        {item.label}
                    </span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.ash }}>{item.value}</span>
                </div>
            ))}
        </div>
    )
}
