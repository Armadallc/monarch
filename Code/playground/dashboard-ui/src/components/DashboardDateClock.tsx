import { useEffect, useState } from "react"
import { COLORS, FONT_HEADING } from "@design"

const TAB_TEXT = {
    fontSize: 12,
    fontWeight: 700,
    fontFamily: FONT_HEADING,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: COLORS.ash,
}

function formatHeaderDate(date: Date): string {
    const month = date.toLocaleString("en-US", { month: "long" })
    const day = String(date.getDate()).padStart(2, "0")
    const year = date.getFullYear()
    return `${month} ${day}/${year}`
}

function formatHeaderClock(date: Date): string {
    return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    })
}

export function DashboardDateClock() {
    const [now, setNow] = useState(() => new Date())

    useEffect(() => {
        const id = window.setInterval(() => setNow(new Date()), 1000)
        return () => window.clearInterval(id)
    }, [])

    return (
        <div
            aria-live="polite"
            style={{
                textAlign: "right",
                flexShrink: 0,
                paddingTop: 10,
                paddingBottom: 10,
                minWidth: 0,
                transition: "transform 0.2s ease",
            }}
        >
            <div style={TAB_TEXT}>{formatHeaderDate(now)}</div>
            <div
                style={{
                    ...TAB_TEXT,
                    fontSize: 48,
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    textTransform: "none",
                    lineHeight: 1,
                    marginTop: 4,
                    fontVariantNumeric: "tabular-nums",
                }}
            >
                {formatHeaderClock(now)}
            </div>
        </div>
    )
}
