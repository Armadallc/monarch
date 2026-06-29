/**
 * Monarch Design System — thin facade over Code/theme.
 *
 * - Runtime colors: Code/theme/dashboard-theme.css (CSS custom properties)
 * - TS tokens: Code/theme/designTokens.ts (legacy names → var(--token, fallback))
 * - Framer: synced via `node Code/theme/sync-framer-theme.mjs`
 */
export {
    BRAND_FALLBACK,
    COLORS,
    RADIUS,
    FONT,
    FONT_HEADING,
    SHADOWS,
    TRANSITION,
    FROSTED_GLASS,
    FROSTED_GLASS_STRONG,
    BUTTON_PRIMARY,
    BUTTON_SECONDARY,
    INPUT_BASE,
    LABEL,
    CARD_HOVER,
    CARD_HOVER_STYLE,
    MONARCH_THEME_STORAGE_KEY,
    MONARCH_THEME_INJECT_CSS,
    type MonarchThemeMode,
    getStoredMonarchThemeMode,
    resolveMonarchThemeMode,
    applyMonarchThemeMode,
    injectMonarchThemeCss,
    initMonarchThemeMode,
    useMonarchThemeBootstrap,
    formatDisplayDate,
    normalizeCalendarDateIso,
} from "./theme"
