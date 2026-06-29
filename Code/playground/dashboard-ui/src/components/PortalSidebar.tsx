import { useState, type ReactNode } from "react"
import { COLORS, FONT, FONT_HEADING, RADIUS } from "@design"
import {
    PROGRAM_SIDEBAR_BRANDING,
    SIDEBAR_WIDTH_COLLAPSED,
    SIDEBAR_WIDTH_EXPANDED,
} from "../programBranding"
import type { PortalProfileTab } from "../portalSourceProfile"
import { ArchiveIcon, MessagesIcon, ReferralsIcon } from "./SidebarNavIcons"
import { SidebarProgramLogo } from "./SidebarProgramLogo"
import { MessageIcon } from "./ReferralCardIndicators"
import { UserProfileDrawer, type ProfileMenuAction } from "./UserProfileDrawer"
import { SidebarFooterToggleRow } from "./EdgePanelCollapseToggle"

export type PortalSidebarView = "referrals" | "archive" | "messages"

type Props = {
    active: PortalSidebarView
    onNavigate: (view: PortalSidebarView) => void
    collapsed: boolean
    onToggleCollapse: () => void
    userName: string
    userRole: string
    onLogout?: () => void
    onOpenProfileModal?: (tab: PortalProfileTab) => void
    onOpenHelpModal?: () => void
    hasUnreadMessages?: boolean
}

const NAV_ITEMS: { id: PortalSidebarView; label: string; icon: ReactNode }[] = [
    { id: "referrals", label: "My Referrals", icon: <ReferralsIcon /> },
    { id: "messages", label: "Messages", icon: <MessagesIcon /> },
    { id: "archive", label: "Archive", icon: <ArchiveIcon /> },
]

const sectionFullWidth = {
    width: "100%",
    boxSizing: "border-box" as const,
    flexShrink: 0,
}

/** Portal shell — layout aligned with staff AppSidebar (logo, nav, theme/collapse, profile). */
export function PortalSidebar({
    active,
    onNavigate,
    collapsed,
    onToggleCollapse,
    userName,
    userRole,
    onLogout,
    onOpenProfileModal,
    onOpenHelpModal,
    hasUnreadMessages = false,
}: Props) {
    const width = collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED
    const [profileDrawerOpen, setProfileDrawerOpen] = useState(false)
    const branding = PROGRAM_SIDEBAR_BRANDING.Competency

    const handleProfileAction = (action: ProfileMenuAction) => {
        setProfileDrawerOpen(false)
        if (action === "logout") {
            onLogout?.()
            return
        }
        if (action === "profile") {
            onOpenProfileModal?.("profile")
            return
        }
        if (action === "notifications") {
            onOpenProfileModal?.("notifications")
            return
        }
        if (action === "help") {
            onOpenHelpModal?.()
            return
        }
    }

    return (
        <aside
            style={{
                width,
                flexShrink: 0,
                background: COLORS.sidebar,
                color: COLORS.onChrome,
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-start",
                alignItems: "stretch",
                paddingTop: 0,
                fontFamily: FONT,
                transition: "width 0.2s ease",
                borderRight: `1px solid ${COLORS.sidebarBorder}`,
                minHeight: 0,
            }}
        >
            <div
                style={{
                    ...sectionFullWidth,
                    minHeight: collapsed ? 56 : 106,
                    height: collapsed ? undefined : 108,
                    padding: collapsed ? "12px 8px" : "0 3px 0 12px",
                    borderBottom: `1px solid ${COLORS.sidebarBorder}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: collapsed ? "center" : "flex-start",
                }}
            >
                <SidebarProgramLogo branding={branding} collapsed={collapsed} />
            </div>

            <nav
                style={{
                    flex: "1 1 0",
                    width: "100%",
                    boxSizing: "border-box",
                    minHeight: 0,
                    padding: collapsed ? "12px 6px" : "12px 10px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                }}
            >
                {NAV_ITEMS.map((item) => {
                    const isActive = active === item.id
                    return (
                        <button
                            key={item.id}
                            type="button"
                            title={collapsed ? item.label : undefined}
                            onClick={() => onNavigate(item.id)}
                            style={{
                                width: "100%",
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                padding: collapsed ? "12px" : "12px 14px",
                                justifyContent: collapsed ? "center" : "flex-start",
                                border: "none",
                                borderRadius: RADIUS.small,
                                background: isActive ? COLORS.sidebarAccent : "transparent",
                                color: COLORS.ash,
                                opacity: isActive ? 1 : 0.75,
                                fontSize: 14,
                                fontWeight: 600,
                                cursor: "pointer",
                                textAlign: "left",
                                fontFamily: FONT_HEADING,
                                boxSizing: "border-box",
                            }}
                        >
                            <span
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                    flex: collapsed ? undefined : 1,
                                    minWidth: 0,
                                }}
                            >
                                {item.icon}
                                {!collapsed && <span>{item.label}</span>}
                            </span>
                            {!collapsed && item.id === "messages" && hasUnreadMessages ? (
                                <MessageIcon size={14} title="Unread messages" color={COLORS.ash} />
                            ) : null}
                        </button>
                    )
                })}
            </nav>

            <div style={{ ...sectionFullWidth, flexShrink: 0 }}>
                <SidebarFooterToggleRow collapsed={collapsed} onToggleCollapse={onToggleCollapse} />
            </div>

            <div
                style={{
                    ...sectionFullWidth,
                    padding: collapsed ? 4 : 8,
                    borderTop: `1px solid ${COLORS.sidebarBorder}`,
                    overflow: "hidden",
                }}
            >
                <button
                    type="button"
                    aria-expanded={profileDrawerOpen}
                    aria-haspopup="dialog"
                    onClick={() => setProfileDrawerOpen(true)}
                    style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: collapsed ? "center" : "flex-start",
                        gap: collapsed ? 0 : 10,
                        padding: collapsed ? 4 : "12px 10px",
                        border: "none",
                        borderRadius: RADIUS.small,
                        background: COLORS.sidebarAccent,
                        color: COLORS.onChrome,
                        cursor: "pointer",
                        fontFamily: FONT,
                        textAlign: "left",
                        boxSizing: "border-box",
                        minWidth: 0,
                    }}
                >
                    <span
                        style={{
                            width: collapsed ? 30 : 36,
                            height: collapsed ? 30 : 36,
                            borderRadius: "50%",
                            background: COLORS.primary,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: collapsed ? 12 : 14,
                            fontWeight: 700,
                            color: COLORS.primaryForeground,
                            flexShrink: 0,
                        }}
                    >
                        {userName.charAt(0)}
                    </span>
                    {!collapsed && (
                        <div style={{ minWidth: 0, flex: 1 }}>
                            <div
                                style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    fontFamily: FONT_HEADING,
                                    color: COLORS.onChrome,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                }}
                            >
                                {userName}
                            </div>
                            <div style={{ fontSize: 11, opacity: 0.75 }}>{userRole}</div>
                        </div>
                    )}
                </button>
            </div>

            <UserProfileDrawer
                open={profileDrawerOpen}
                onClose={() => setProfileDrawerOpen(false)}
                userName={userName}
                userRole={userRole}
                onAction={handleProfileAction}
            />
        </aside>
    )
}
