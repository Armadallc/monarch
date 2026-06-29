import { COLORS } from "@design"
import { DashboardDateClock } from "./DashboardDateClock"
import { StaffDashboardTabBar, type StaffDashboardTab } from "./StaffDashboardTabBar"

type Props = {
    active: StaffDashboardTab
    onChange: (tab: StaffDashboardTab) => void
}

export function StaffDashboardHeader({ active, onChange }: Props) {
    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) auto",
                alignItems: "start",
                columnGap: 24,
                marginBottom: 16,
                flexShrink: 0,
                borderBottom: `1px solid ${COLORS.ashSubtle}`,
                minWidth: 0,
            }}
        >
            <StaffDashboardTabBar active={active} onChange={onChange} embedded />
            <DashboardDateClock />
        </div>
    )
}
