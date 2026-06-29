import { COLORS, FONT_HEADING } from "@design"

export type StaffDashboardTab = "cases" | "organizations" | "contacts"

type Props = {
    active: StaffDashboardTab
    onChange: (tab: StaffDashboardTab) => void
    /** When true, omits outer margin/border — used inside StaffDashboardHeader. */
    embedded?: boolean
}

const TABS: { id: StaffDashboardTab; label: string }[] = [
    { id: "cases", label: "Cases" },
    { id: "organizations", label: "Organizations" },
    { id: "contacts", label: "Contacts" },
]

export function StaffDashboardTabBar({ active, onChange, embedded = false }: Props) {
    return (
        <div
            style={{
                display: "flex",
                gap: 4,
                marginBottom: embedded ? 0 : 16,
                flexShrink: 0,
                borderBottom: embedded ? "none" : `1px solid ${COLORS.ashSubtle}`,
                paddingBottom: 0,
                minWidth: 0,
            }}
        >
            {TABS.map((tab) => {
                const isActive = active === tab.id
                return (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => onChange(tab.id)}
                        style={{
                            padding: "10px 20px",
                            fontSize: 12,
                            fontWeight: 600,
                            fontFamily: FONT_HEADING,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            border: "none",
                            borderBottom: isActive ? "2px solid rgb(20, 71, 230)" : "2px solid transparent",
                            background: "transparent",
                            color: COLORS.ash,
                            opacity: isActive ? 1 : 0.75,
                            cursor: "pointer",
                            marginBottom: -1,
                        }}
                    >
                        {tab.label}
                    </button>
                )
            })}
        </div>
    )
}
