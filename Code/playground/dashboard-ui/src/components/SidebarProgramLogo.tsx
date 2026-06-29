import { useEffect, useState } from "react"
import { COLORS, FONT_HEADING, RADIUS } from "@design"
import type { ProgramSidebarBranding } from "../programBranding"
import { getStoredThemeMode, resolveThemeMode } from "../theme/themeMode"

type Props = {
    branding: ProgramSidebarBranding
    collapsed: boolean
}

function useResolvedTheme(): "light" | "dark" {
    const [resolved, setResolved] = useState<"light" | "dark">(() =>
        resolveThemeMode(getStoredThemeMode())
    )

    useEffect(() => {
        const sync = () => setResolved(resolveThemeMode(getStoredThemeMode()))
        window.addEventListener("monarch-theme-change", sync)
        const mq = window.matchMedia("(prefers-color-scheme: dark)")
        mq.addEventListener("change", sync)
        return () => {
            window.removeEventListener("monarch-theme-change", sync)
            mq.removeEventListener("change", sync)
        }
    }, [])

    return resolved
}

export function SidebarProgramLogo({ branding, collapsed }: Props) {
    const [failed, setFailed] = useState(false)
    const theme = useResolvedTheme()
    const logoSrc = (() => {
        if (collapsed) {
            if (theme === "dark" && branding.collapsedLogoUrlDark) return branding.collapsedLogoUrlDark
            if (branding.collapsedLogoUrl) return branding.collapsedLogoUrl
        }
        return theme === "dark" && branding.logoUrlDark ? branding.logoUrlDark : branding.logoUrl
    })()

    if (failed) {
        return (
            <div
                aria-label={branding.logoAlt}
                style={{
                    width: collapsed ? 34 : "100%",
                    maxWidth: collapsed ? 34 : branding.logoMaxWidthPx,
                    height: collapsed ? 34 : branding.logoMaxHeightPx,
                    minHeight: collapsed ? 34 : 56,
                    borderRadius: RADIUS.small,
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: FONT_HEADING,
                    fontSize: collapsed ? 13 : 22,
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    color: COLORS.white,
                    flexShrink: 0,
                }}
            >
                {collapsed ? branding.fallbackMonogram.charAt(0) : branding.fallbackMonogram}
            </div>
        )
    }

    return (
        <img
            key={logoSrc}
            src={logoSrc}
            alt={branding.logoAlt}
            onError={() => setFailed(true)}
            style={{
                display: "block",
                width: collapsed ? 34 : "100%",
                maxWidth: collapsed ? 34 : branding.logoMaxWidthPx,
                height: collapsed ? 34 : branding.logoMaxHeightPx,
                maxHeight: collapsed ? 34 : branding.logoMaxHeightPx,
                objectFit: "contain",
                objectPosition: collapsed ? "center" : "left center",
                flexShrink: 0,
            }}
        />
    )
}
