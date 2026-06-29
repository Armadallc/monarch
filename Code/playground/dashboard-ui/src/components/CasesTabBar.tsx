import type { ReactNode } from "react"
import { COLORS, FONT_HEADING, RADIUS } from "@design"

export type CasesTabId = "referrals" | "inquiries"

type Props = {
    activeTab: CasesTabId
    onTabChange: (tab: CasesTabId) => void
    referralCount: number
    inquiryCount: number
    trailing?: ReactNode
}

export function CasesTabBar({
    activeTab,
    onTabChange,
    referralCount,
    inquiryCount,
    trailing,
}: Props) {
    const tabs: { id: CasesTabId; label: string; count: number }[] = [
        { id: "referrals", label: "Referrals", count: referralCount },
        { id: "inquiries", label: "Inquiries", count: inquiryCount },
    ]

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                marginBottom: 20,
                flexShrink: 0,
                flexWrap: "wrap",
            }}
        >
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {tabs.map((tab) => {
                    const active = activeTab === tab.id
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => onTabChange(tab.id)}
                            style={{
                                padding: "10px 28px",
                                fontSize: 13,
                                fontWeight: 600,
                                fontFamily: FONT_HEADING,
                                borderRadius: RADIUS.pill,
                                cursor: "pointer",
                                border: active ? "none" : `1px solid ${COLORS.ashSubtle}`,
                                background: active ? COLORS.moonstone : "transparent",
                                color: active ? COLORS.white : COLORS.ashMuted,
                            }}
                        >
                            {tab.label}
                            <span
                                style={{
                                    marginLeft: 8,
                                    padding: "2px 10px",
                                    borderRadius: RADIUS.pill,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    background: active ? "rgba(255,255,255,0.25)" : COLORS.coconut,
                                }}
                            >
                                {tab.count}
                            </span>
                        </button>
                    )
                })}
            </div>
            {trailing ? <div style={{ display: "flex", alignItems: "center", gap: 8 }}>{trailing}</div> : null}
        </div>
    )
}
