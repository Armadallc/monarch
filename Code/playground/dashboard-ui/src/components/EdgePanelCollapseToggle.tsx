import type { CSSProperties } from "react"
import { COLORS, RADIUS } from "@design"
import { ThemeToggle } from "./ThemeToggle"

export type PanelEdge = "left" | "right"

/** Expand/collapse icon — bar + chevron matching Monarch panel toggle artwork. */
export function EdgePanelToggleIcon({
    edge,
    collapsed,
    size = 18,
}: {
    edge: PanelEdge
    collapsed: boolean
    size?: number
}) {
    const isExpand = collapsed
    const mirror = edge === "left"

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden
            style={mirror ? { transform: "scaleX(-1)" } : undefined}
        >
            {isExpand ? (
                <>
                    <rect x="2" y="4" width="4" height="16" rx="0.5" />
                    <polygon points="10,12 18,6 18,18" />
                </>
            ) : (
                <>
                    <polygon points="6,6 6,18 14,12" />
                    <rect x="18" y="4" width="4" height="16" rx="0.5" />
                </>
            )}
        </svg>
    )
}

const toggleButtonStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    border: "none",
    borderRadius: RADIUS.small,
    background: "transparent",
    cursor: "pointer",
    flexShrink: 0,
    lineHeight: 1,
    boxSizing: "border-box",
}

const toggleRowStyle = (collapsed: boolean, edge: PanelEdge): CSSProperties => ({
    paddingTop: 8,
    display: "flex",
    justifyContent: collapsed ? "center" : edge === "left" ? "flex-end" : "flex-start",
    width: "100%",
    flexShrink: 0,
})

/** Mirrors AppSidebar profile footer height so the actions rail aligns with the sidebar. */
export const profileFooterSpacerStyle = (collapsed: boolean): CSSProperties => ({
    flexShrink: 0,
    width: "100%",
    boxSizing: "border-box",
    padding: collapsed ? 4 : 8,
    borderTop: `1px solid ${COLORS.ashSubtle}`,
    overflow: "hidden",
    height: 77,
})

type ToggleRowProps = {
    collapsed: boolean
    onToggleCollapse: () => void
    edge: PanelEdge
    panelLabel: string
    color?: string
}

function EdgePanelCollapseToggleButton({
    collapsed,
    onToggleCollapse,
    edge,
    panelLabel,
    color = COLORS.ash,
}: ToggleRowProps) {
    const action = collapsed ? "Expand" : "Collapse"
    const ariaLabel = `${action} ${panelLabel}`

    return (
        <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={ariaLabel}
            title={ariaLabel}
            style={{ ...toggleButtonStyle, color }}
        >
            <EdgePanelToggleIcon edge={edge} collapsed={collapsed} />
        </button>
    )
}

export function EdgePanelCollapseToggleRow({
    collapsed,
    onToggleCollapse,
    edge,
    panelLabel,
    color = COLORS.ash,
}: ToggleRowProps) {
    return (
        <div style={toggleRowStyle(collapsed, edge)}>
            <EdgePanelCollapseToggleButton
                collapsed={collapsed}
                onToggleCollapse={onToggleCollapse}
                edge={edge}
                panelLabel={panelLabel}
                color={color}
            />
        </div>
    )
}

/** Theme + panel collapse on one row — sits above the sidebar profile block. */
export function SidebarFooterToggleRow({
    collapsed,
    onToggleCollapse,
}: {
    collapsed: boolean
    onToggleCollapse: () => void
}) {
    return (
        <div
            style={{
                paddingTop: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: collapsed ? "center" : "space-between",
                flexDirection: collapsed ? "column" : "row",
                gap: collapsed ? 4 : 0,
                width: "100%",
                flexShrink: 0,
            }}
        >
            <ThemeToggle collapsed={collapsed} />
            <EdgePanelCollapseToggleButton
                collapsed={collapsed}
                onToggleCollapse={onToggleCollapse}
                edge="left"
                panelLabel="sidebar"
                color={COLORS.onChrome}
            />
        </div>
    )
}

/** Actions panel footer — toggle row plus spacer that lines up with the sidebar profile block. */
export function EdgePanelCollapseFooter({
    collapsed,
    onToggleCollapse,
    edge,
    panelLabel,
    color,
}: ToggleRowProps) {
    return (
        <div style={{ flexShrink: 0, width: "100%" }}>
            <EdgePanelCollapseToggleRow
                collapsed={collapsed}
                onToggleCollapse={onToggleCollapse}
                edge={edge}
                panelLabel={panelLabel}
                color={color}
            />
            <div style={profileFooterSpacerStyle(collapsed)} aria-hidden>
                <div
                    style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: collapsed ? 4 : "12px 10px",
                        minHeight: collapsed ? 30 : 36,
                    }}
                />
            </div>
        </div>
    )
}
