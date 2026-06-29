/**
 * TS token map → CSS custom properties (dashboard-theme.css).
 * Legacy names (moonstone, ash, …) kept for Framer/dashboard components.
 */
import { BRAND_FALLBACK as F } from "./brandFallbacks"

const v = (token: string, fallback: string) => `var(${token}, ${fallback})`

export const COLORS = {
    ash: v("--foreground", F.foreground),
    ashDark: v("--foreground", F.foregroundDark),
    ashMuted: v("--muted-foreground", F.mutedForeground),
    ashSubtle: v("--border", F.borderSubtle),
    ash50: v("--muted-foreground", F.mutedForeground),
    coconut: v("--background", F.background),
    coconut50: v("--muted", F.muted),
    coconut25: v("--accent-subtle", F.accentSubtle),
    shell: v("--background", F.backgroundShell),
    white: v("--card", F.card),
    stoneCloud: v("--muted-foreground", F.mutedForeground),
    gunmetal: v("--sidebar", F.secondary),
    onChrome: v("--sidebar-foreground", F.foreground),
    moonstone: v("--primary", F.moonstone),
    moonstoneLight: v("--primary-muted", F.moonstoneLight),
    tangerine: v("--destructive", F.tangerine),
    tangerineLight: v("--destructive-bg", F.tangerineLight),
    champagne: v("--status-pending-bg", F.champagne),
    champagneLight: v("--status-pending-bg", F.champagneLight),
    success: v("--success", F.success),
    successBg: v("--success-bg", F.successBg),
    successText: v("--success-foreground", F.success),
    error: v("--destructive", F.error),
    errorBg: v("--destructive-bg", F.errorBg),
    errorText: v("--destructive-foreground", F.redText),
    warning: v("--warning", F.warning),
    warningBg: v("--warning-bg", F.warningBg),
    warningBorder: v("--warning-border", F.warningBorder),
    warningText: v("--warning-foreground", F.warningText),
    infoBg: v("--info-bg", F.infoBg),
    infoBorder: v("--info-border", F.infoBorder),
    infoText: v("--info-text", `var(--info-foreground, ${F.infoText})`),
    messageSentBg: v("--info-foreground", F.messageSentBg),
    border: v("--border", F.border),
    borderLight: v("--border", "#E2E8F0"),
    input: v("--input", F.input),
    inputBackground: v("--input-background", F.inputBackground),
    checkboxBackground: v("--checkbox-background", "transparent"),
    textMuted: v("--muted-foreground", F.mutedForeground),
    overlay: v("--overlay", F.overlay),
    green: v("--success-bg", F.successBg),
    greenText: v("--success-foreground", F.success),
    redText: v("--destructive-foreground", F.redText),
    primary: v("--primary", F.moonstone),
    primaryForeground: v("--primary-foreground", F.primaryForeground),
    sidebar: v("--sidebar", F.sidebar),
    sidebarForeground: v("--sidebar-foreground", F.foreground),
    sidebarAccent: v("--sidebar-accent", F.sidebarAccent),
    sidebarAccentForeground: v("--sidebar-accent-foreground", F.foreground),
    sidebarBorder: v("--sidebar-border", F.sidebarBorder),
    statusPendingBg: v("--status-pending-bg", F.champagne),
    statusPendingText: v("--status-pending-text", F.foreground),
    statusReviewBg: v("--status-review-bg", F.moonstoneLight),
    statusReviewText: v("--status-review-text", F.statusReviewText),
    statusWaitlistBg: v("--status-waitlist-bg", F.statusWaitlistBg),
    statusWaitlistText: v("--status-waitlist-text", F.statusWaitlistText),
    statusAcceptedBg: v("--status-accepted-bg", F.successBg),
    statusAcceptedText: v("--status-accepted-text", F.success),
    statusDeclinedBg: v("--status-declined-bg", F.errorBg),
    statusDeclinedText: v("--status-declined-text", F.redText),
} as const

export const RADIUS = {
    card: v("--radius", F.radius),
    input: v("--radius", F.radius),
    section: v("--radius", F.radius),
    modal: `calc(var(--radius, ${F.radius}) * 1.25)`,
    container: `calc(var(--radius, ${F.radius}) * 1.25)`,
    pill: "9999px",
    small: `calc(var(--radius, ${F.radius}) * 0.85)`,
} as const

export const FONT = v("--font-sans", F.fontSans)
export const FONT_HEADING = v("--font-heading", F.fontHeading)

export const SHADOWS = {
    card: v("--shadow-card", F.shadowCard),
    cardHover: v("--shadow-card-hover", F.shadowCardHover),
    modal: v("--shadow-modal", F.shadowModal),
} as const

export const TRANSITION = "all 0.2s ease"
