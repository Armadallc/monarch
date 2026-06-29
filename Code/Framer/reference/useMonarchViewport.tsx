import { useState, useEffect } from "react"

/**
 * Repo source of truth for viewport breakpoints.
 * Framer: do NOT import this file — the hook is inlined in ReferralDashboard.tsx and ReferralSourcePortal.tsx for publish.
 */

/** Aligns with Framer Desktop (≥1200) and Tablet (810–1199). */
export const MONARCH_DESKTOP_MIN_PX = 1200
/** Submissions table full layout (jurisdiction column, full org/client labels). Below this uses compact table. */
export const MONARCH_WIDE_TABLE_MIN_PX = 1440
/** Widths ≤809 match Framer Phone; mobile-specific UI is added in a later pass. */
export const MONARCH_MOBILE_MAX_PX = 809

export type MonarchViewport = {
    width: number
    isDesktop: boolean
    isTablet: boolean
    isMobile: boolean
    /** Below desktop (tablet + phone). */
    isNarrow: boolean
    /** Submissions table at full column set (≥1440). */
    isWideTable: boolean
    /** Submissions table compact columns and shorthand cells (<1440). */
    isCompactTable: boolean
}

export function useMonarchViewport(): MonarchViewport {
    const [width, setWidth] = useState(
        typeof window !== "undefined" ? window.innerWidth : MONARCH_DESKTOP_MIN_PX
    )

    useEffect(() => {
        if (typeof window === "undefined") return
        const update = () => setWidth(window.innerWidth)
        update()
        window.addEventListener("resize", update)
        return () => window.removeEventListener("resize", update)
    }, [])

    const isDesktop = width >= MONARCH_DESKTOP_MIN_PX
    const isMobile = width <= MONARCH_MOBILE_MAX_PX
    const isTablet = !isDesktop && !isMobile
    const isWideTable = width >= MONARCH_WIDE_TABLE_MIN_PX

    return {
        width,
        isDesktop,
        isTablet,
        isMobile,
        isNarrow: !isDesktop,
        isWideTable,
        isCompactTable: !isWideTable,
    }
}
