import type { CSSProperties } from "react"
import { COLORS, FONT, RADIUS, SHADOWS, TRANSITION } from "./designTokens"

export const FROSTED_GLASS: CSSProperties = {
    background: COLORS.coconut25,
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    border: `1px solid ${COLORS.ashSubtle}`,
    borderRadius: RADIUS.card,
    boxSizing: "border-box",
}

export const FROSTED_GLASS_STRONG: CSSProperties = {
    ...FROSTED_GLASS,
    background: COLORS.coconut50,
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
}

export const BUTTON_PRIMARY: CSSProperties = {
    padding: "12px 24px",
    fontSize: "15px",
    fontWeight: 600,
    fontFamily: FONT,
    color: COLORS.primaryForeground,
    backgroundColor: COLORS.primary,
    border: "none",
    borderRadius: RADIUS.input,
    cursor: "pointer",
    letterSpacing: "-0.01em",
    transition: TRANSITION,
}

export const BUTTON_SECONDARY: CSSProperties = {
    padding: "12px 24px",
    fontSize: "15px",
    fontWeight: 600,
    fontFamily: FONT,
    color: COLORS.ash,
    backgroundColor: "transparent",
    border: `2px solid ${COLORS.ashSubtle}`,
    borderRadius: RADIUS.input,
    cursor: "pointer",
    letterSpacing: "-0.01em",
    transition: TRANSITION,
}

export const INPUT_BASE: CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    fontSize: "15px",
    fontFamily: FONT,
    color: COLORS.ash,
    border: `1px solid ${COLORS.ashSubtle}`,
    borderRadius: RADIUS.input,
    backgroundColor: COLORS.white,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s ease",
}

export const LABEL: CSSProperties = {
    display: "block",
    marginBottom: "8px",
    fontSize: "12px",
    fontWeight: 600,
    fontFamily: FONT,
    color: COLORS.ash,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
}

export const CARD_HOVER = {
    transition: TRANSITION,
    boxShadow: SHADOWS.card,
}

export const CARD_HOVER_STYLE: CSSProperties = {
    ...CARD_HOVER,
}
