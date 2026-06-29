import type { CSSProperties, ReactNode } from "react"
import { COLORS } from "@design"
import { formatTargetDateMmDd } from "../utils"

const iconWrap: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    flexShrink: 0,
}

function StrokeIcon({
    size = 14,
    color,
    title,
    children,
}: {
    size?: number
    color: string
    title: string
    children: ReactNode
}) {
    return (
        <span style={iconWrap} title={title} aria-label={title} role="img">
            <svg
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
            >
                {children}
            </svg>
        </span>
    )
}

/** Step 12 — expedited placement; circled when conditional timeline is also selected. */
export function ExpeditedPlacementIcon({
    mode,
    size = 14,
}: {
    mode: "lightning" | "lightning_circled"
    size?: number
}) {
    const color = COLORS.ash
    const title = mode === "lightning_circled" ? "Expedited — conditional timeline" : "Expedited placement"
    return (
        <span style={{ ...iconWrap, opacity: 1 }} title={title} aria-label={title} role="img">
            <svg
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
            >
                {mode === "lightning_circled" ? (
                    <circle cx="12" cy="12" r="9" />
                ) : null}
                <path
                    d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"
                    transform={mode === "lightning_circled" ? "translate(12 12) scale(0.55) translate(-12 -12)" : undefined}
                />
            </svg>
        </span>
    )
}

export function ExpeditedBadge({ variant = "default" }: { variant?: "default" | "compact" | "kanban" }) {
    const kanban = variant === "kanban"
    const compact = variant === "compact" || kanban
    const color = kanban ? COLORS.ash : COLORS.errorText
    return (
        <span style={{ ...iconWrap, opacity: compact && !kanban ? 0.75 : 1 }}>
            <StrokeIcon color={color} title="Expedited">
                <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
            </StrokeIcon>
        </span>
    )
}

export function TimeBoundBadge({
    targetDateIso,
    variant = "default",
}: {
    targetDateIso?: string | null
    variant?: "default" | "compact" | "kanban"
}) {
    const kanban = variant === "kanban"
    const compact = variant === "compact" || kanban
    const mmdd = formatTargetDateMmDd(targetDateIso)
    const title = mmdd ? `Time-bound — ${mmdd}` : "Time-bound"
    const color = kanban ? COLORS.ash : COLORS.warningText
    return (
        <span
            style={{ ...iconWrap, opacity: compact && !kanban ? 0.75 : 1 }}
            title={title}
            aria-label={title}
            role="img"
        >
            <svg
                width={14}
                height={14}
                viewBox="0 0 24 24"
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
            >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
            </svg>
            {mmdd ? (
                <span style={{ fontSize: compact ? 8 : 10, fontWeight: 600, color, lineHeight: 1 }}>
                    {mmdd}
                </span>
            ) : null}
        </span>
    )
}
