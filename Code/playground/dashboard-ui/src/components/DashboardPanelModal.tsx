import { useEffect, type ReactNode } from "react"
import { COLORS, FONT, FONT_HEADING, RADIUS, SHADOWS } from "@design"

type Props = {
    title: string
    onClose: () => void
    children: ReactNode
    maxWidth?: number
    /** Optional content between header and scroll body (e.g. tab bar). */
    headerBelow?: ReactNode
    /** Sticky footer (e.g. save actions). */
    footer?: ReactNode
}

export function DashboardPanelModal({
    title,
    onClose,
    children,
    maxWidth = 720,
    headerBelow,
    footer,
}: Props) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [onClose])

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                background: COLORS.overlay,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 2200,
                padding: 20,
                backdropFilter: "blur(8px)",
                fontFamily: FONT,
            }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                role="dialog"
                aria-modal
                aria-labelledby="dashboard-panel-modal-title"
                style={{
                    background: COLORS.white,
                    borderRadius: RADIUS.modal,
                    maxWidth,
                    width: "100%",
                    maxHeight: "min(90vh, 920px)",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: SHADOWS.modal,
                    overflow: "hidden",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    style={{
                        flexShrink: 0,
                        padding: "18px 22px",
                        borderBottom: headerBelow ? undefined : `1px solid ${COLORS.ashSubtle}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 16,
                        background: COLORS.sidebar,
                        color: COLORS.onChrome,
                    }}
                >
                    <h2
                        id="dashboard-panel-modal-title"
                        style={{
                            margin: 0,
                            fontSize: 18,
                            fontWeight: 700,
                            fontFamily: FONT_HEADING,
                            color: COLORS.onChrome,
                            letterSpacing: "-0.02em",
                        }}
                    >
                        {title}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        style={{
                            flexShrink: 0,
                            padding: "6px 14px",
                            fontSize: 13,
                            fontWeight: 600,
                            fontFamily: FONT,
                            border: `1px solid ${COLORS.sidebarBorder}`,
                            borderRadius: RADIUS.small,
                            background: "rgba(255,255,255,0.1)",
                            color: COLORS.onChrome,
                            cursor: "pointer",
                        }}
                    >
                        Close
                    </button>
                </div>

                {headerBelow}

                <div
                    style={{
                        flex: 1,
                        minHeight: 0,
                        overflow: "auto",
                        WebkitOverflowScrolling: "touch",
                        padding: "24px 28px",
                        boxSizing: "border-box",
                    }}
                >
                    {children}
                </div>

                {footer ? (
                    <div
                        style={{
                            flexShrink: 0,
                            padding: "16px 28px",
                            borderTop: `1px solid ${COLORS.ashSubtle}`,
                            background: COLORS.coconut,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            gap: 12,
                        }}
                    >
                        {footer}
                    </div>
                ) : null}
            </div>
        </div>
    )
}
