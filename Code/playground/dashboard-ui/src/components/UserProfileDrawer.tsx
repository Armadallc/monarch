import { useEffect, useState } from "react"
import { COLORS, FONT, FONT_HEADING, RADIUS, SHADOWS, TRANSITION } from "@design"

export type ProfileMenuAction = "profile" | "notifications" | "help" | "logout"

type Props = {
    open: boolean
    onClose: () => void
    userName: string
    userRole: string
    onAction: (action: ProfileMenuAction) => void
}

const MENU_ITEMS: { id: ProfileMenuAction; label: string; destructive?: boolean }[] = [
    { id: "profile", label: "Profile Settings" },
    { id: "notifications", label: "Notifications Preferences" },
    { id: "help", label: "Help / Support" },
    { id: "logout", label: "Logout", destructive: true },
]

const SLIDE_MS = 280

export function UserProfileDrawer({ open, onClose, userName, userRole, onAction }: Props) {
    const [mounted, setMounted] = useState(open)
    const [slideIn, setSlideIn] = useState(false)

    useEffect(() => {
        if (open) {
            setMounted(true)
            const frame = requestAnimationFrame(() => {
                requestAnimationFrame(() => setSlideIn(true))
            })
            return () => cancelAnimationFrame(frame)
        }
        setSlideIn(false)
        const timer = window.setTimeout(() => setMounted(false), SLIDE_MS)
        return () => window.clearTimeout(timer)
    }, [open])

    useEffect(() => {
        if (!mounted) return
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
        }
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [mounted, onClose])

    if (!mounted) return null

    return (
        <div
            role="dialog"
            aria-modal
            aria-label="User menu"
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 2100,
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                fontFamily: FONT,
            }}
        >
            <button
                type="button"
                aria-label="Close menu"
                onClick={onClose}
                style={{
                    position: "absolute",
                    inset: 0,
                    border: "none",
                    background: COLORS.overlay,
                    backdropFilter: "blur(4px)",
                    cursor: "pointer",
                    padding: 0,
                }}
            />
            <div
                style={{
                    position: "relative",
                    background: COLORS.white,
                    borderRadius: `${RADIUS.modal} ${RADIUS.modal} 0 0`,
                    boxShadow: SHADOWS.modal,
                    padding: "8px 0 24px",
                    transform: slideIn ? "translateY(0)" : "translateY(100%)",
                    transition: `transform ${SLIDE_MS}ms cubic-bezier(0.32, 0.72, 0, 1)`,
                    maxHeight: "min(420px, 85vh)",
                    overflowY: "auto",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    style={{
                        width: 40,
                        height: 4,
                        borderRadius: RADIUS.pill,
                        background: COLORS.ashSubtle,
                        margin: "8px auto 16px",
                    }}
                    aria-hidden
                />

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "0 24px 20px",
                        borderBottom: `1px solid ${COLORS.ashSubtle}`,
                    }}
                >
                    <span
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: "50%",
                            background: COLORS.moonstone,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 16,
                            fontWeight: 700,
                            color: COLORS.ash,
                            flexShrink: 0,
                        }}
                    >
                        {userName.charAt(0)}
                    </span>
                    <div style={{ minWidth: 0 }}>
                        <div
                            style={{
                                fontSize: 15,
                                fontWeight: 700,
                                color: COLORS.ash,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {userName}
                        </div>
                        <div style={{ fontSize: 13, color: COLORS.ashMuted, marginTop: 2 }}>{userRole}</div>
                    </div>
                </div>

                <nav style={{ padding: "8px 12px 0" }}>
                    {MENU_ITEMS.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => onAction(item.id)}
                            style={{
                                width: "100%",
                                display: "flex",
                                alignItems: "center",
                                padding: "14px 12px",
                                border: "none",
                                borderRadius: RADIUS.small,
                                background: "transparent",
                                color: item.destructive ? COLORS.errorText : COLORS.ash,
                                fontSize: 15,
                                fontWeight: 600,
                                fontFamily: FONT_HEADING,
                                cursor: "pointer",
                                textAlign: "left",
                                transition: TRANSITION,
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = item.destructive
                                    ? COLORS.errorBg
                                    : COLORS.coconut25
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = "transparent"
                            }}
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>
            </div>
        </div>
    )
}
