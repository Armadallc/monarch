import type { CSSProperties } from "react"
import { COLORS, FONT, RADIUS } from "@design"
import type { MockReferral, ReferralStatus } from "../types"

export type PortalFilter = "all" | "active" | ReferralStatus

type Props = {
    referrals: MockReferral[]
    filter: PortalFilter
    onFilterChange: (f: PortalFilter) => void
}

function countBy(referrals: MockReferral[], statuses: ReferralStatus[]): number {
    return referrals.filter((r) => statuses.includes(r.status)).length
}

export function PortalSummaryBar({ referrals, filter, onFilterChange }: Props) {
    const active = countBy(referrals, ["pending_review", "under_review"])
    const waitlisted = countBy(referrals, ["waitlisted"])
    const accepted = countBy(referrals, ["accepted"])
    const declined = countBy(referrals, ["declined"])

    const items: { key: PortalFilter; label: string; count: number }[] = [
        { key: "active", label: "Active", count: active },
        { key: "waitlisted", label: "Waitlisted", count: waitlisted },
        { key: "accepted", label: "Accepted", count: accepted },
        { key: "declined", label: "Declined", count: declined },
    ]

    return (
        <div
            style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 16,
                fontFamily: FONT,
            }}
        >
            <button
                type="button"
                onClick={() => onFilterChange("all")}
                style={chipStyle(filter === "all")}
            >
                All ({referrals.length})
            </button>
            {items.map((item) => (
                <button
                    key={item.key}
                    type="button"
                    onClick={() => onFilterChange(item.key)}
                    style={chipStyle(filter === item.key)}
                >
                    {item.count} {item.label}
                </button>
            ))}
        </div>
    )
}

function chipStyle(active: boolean): CSSProperties {
    return {
        padding: "8px 14px",
        fontSize: 13,
        fontWeight: 600,
        fontFamily: FONT,
        border: `1px solid ${active ? COLORS.moonstone : COLORS.ashSubtle}`,
        borderRadius: RADIUS.pill,
        background: active ? COLORS.moonstoneLight : COLORS.white,
        color: COLORS.ash,
        cursor: "pointer",
    }
}
