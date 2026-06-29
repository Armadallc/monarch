import type { ReactNode } from "react"
import { COLORS, FONT, RADIUS } from "@design"
import type { ReferralViewMode } from "../referralFilters"

type Props = {
    viewMode: ReferralViewMode
    onViewModeChange: (mode: ReferralViewMode) => void
}

const VIEW_ICON_SIZE = 16

function ColumnsViewIcon({ color }: { color: string }) {
    return (
        <svg width={VIEW_ICON_SIZE} height={VIEW_ICON_SIZE} viewBox="0 0 18 18" fill="none" aria-hidden>
            <rect x="2" y="3" width="3.5" height="12" rx="1" fill={color} />
            <rect x="7.25" y="3" width="3.5" height="12" rx="1" fill={color} />
            <rect x="12.5" y="3" width="3.5" height="12" rx="1" fill={color} />
        </svg>
    )
}

function RowsViewIcon({ color }: { color: string }) {
    return (
        <svg width={VIEW_ICON_SIZE} height={VIEW_ICON_SIZE} viewBox="0 0 18 18" fill="none" aria-hidden>
            <rect x="3" y="2.5" width="12" height="3" rx="1" fill={color} />
            <rect x="3" y="7.5" width="12" height="3" rx="1" fill={color} />
            <rect x="3" y="12.5" width="12" height="3" rx="1" fill={color} />
        </svg>
    )
}

function ViewToggleButton({
    active,
    onClick,
    ariaLabel,
    children,
}: {
    active: boolean
    onClick: () => void
    ariaLabel: string
    children: ReactNode
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={ariaLabel}
            aria-pressed={active}
            title={ariaLabel}
            style={{
                padding: "2px 8px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                border: "none",
                borderRadius: RADIUS.small,
                background: active ? COLORS.moonstone : "transparent",
                cursor: "pointer",
                fontFamily: FONT,
            }}
        >
            {children}
        </button>
    )
}

export function ReferralViewToggle({ viewMode, onViewModeChange }: Props) {
    return (
        <div
            role="group"
            aria-label="View mode"
            style={{
                display: "flex",
                padding: "6px 3px",
                borderRadius: RADIUS.input,
                boxSizing: "border-box",
                border: `1px solid ${COLORS.ashSubtle}`,
                background: COLORS.coconut25,
                flexShrink: 0,
            }}
        >
            <ViewToggleButton
                active={viewMode === "column"}
                onClick={() => onViewModeChange("column")}
                ariaLabel="Column view"
            >
                <ColumnsViewIcon color={viewMode === "column" ? COLORS.white : COLORS.ashMuted} />
            </ViewToggleButton>
            <ViewToggleButton
                active={viewMode === "row"}
                onClick={() => onViewModeChange("row")}
                ariaLabel="Row view"
            >
                <RowsViewIcon color={viewMode === "row" ? COLORS.white : COLORS.ashMuted} />
            </ViewToggleButton>
        </div>
    )
}
