import type { MockReferral } from "./types"

export type DashboardProgram = MockReferral["program"]

export type ProgramSidebarBranding = {
    /** Logo on light backgrounds (default sidebar). */
    logoUrl: string
    /** Optional logo on dark backgrounds; falls back to logoUrl when omitted. */
    logoUrlDark?: string
    /** Collapsed rail — light mode (34×34). Falls back to logoUrl when omitted. */
    collapsedLogoUrl?: string
    /** Collapsed rail — dark mode (34×34). Falls back to logoUrlDark or logoUrl when omitted. */
    collapsedLogoUrlDark?: string
    logoAlt: string
    fallbackMonogram: string
    /** Expanded sidebar — logo area uses full inner width up to this cap. */
    logoMaxWidthPx: number
    logoMaxHeightPx: number
}

const STORAGE_BASE = "https://esbmnympligtknhtkary.supabase.co/storage/v1/object/public/assets"

export const PROGRAM_SIDEBAR_BRANDING: Record<DashboardProgram, ProgramSidebarBranding> = {
    Competency: {
        logoUrl: `${STORAGE_BASE}/mc-logo-foreground-dark_1.svg`,
        logoUrlDark: `${STORAGE_BASE}/mc-logo-muted-foreground-dark_1.svg`,
        collapsedLogoUrl: `${STORAGE_BASE}/mc-logo-foreground-dark_2.svg`,
        collapsedLogoUrlDark: `${STORAGE_BASE}/mc-logo-muted-foreground-light_3.svg`,
        logoAlt: "Monarch Competency",
        fallbackMonogram: "MC",
        logoMaxWidthPx: 220,
        logoMaxHeightPx: 86,
    },
    "Mental Health": {
        logoUrl: `${STORAGE_BASE}/monarch-logo.png`,
        logoAlt: "Monarch Mental Health",
        fallbackMonogram: "MH",
        logoMaxWidthPx: 220,
        logoMaxHeightPx: 86,
    },
    "Sober Living": {
        logoUrl: `${STORAGE_BASE}/monarch-logo.png`,
        logoAlt: "Monarch Sober Living",
        fallbackMonogram: "SL",
        logoMaxWidthPx: 220,
        logoMaxHeightPx: 86,
    },
    Launch: {
        logoUrl: `${STORAGE_BASE}/monarch-logo.png`,
        logoAlt: "Monarch Launch",
        fallbackMonogram: "LA",
        logoMaxWidthPx: 220,
        logoMaxHeightPx: 86,
    },
}

export const SIDEBAR_WIDTH_EXPANDED = 240
export const SIDEBAR_WIDTH_COLLAPSED = 50
