import { COLORS, FONT, RADIUS } from "@design"
import type { OrganizationListStats } from "../organizationUtils"

type Props = {
    stats: OrganizationListStats
}

export function OrganizationsSummaryBar({ stats }: Props) {
    const items = [
        { label: "Total", value: stats.total },
        { label: "New", value: stats.newThisMonth },
        { label: "Multi", value: stats.multiReferral },
        { label: "Referral Admitted", value: stats.admitted },
        { label: "This Week", value: stats.thisWeek },
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
