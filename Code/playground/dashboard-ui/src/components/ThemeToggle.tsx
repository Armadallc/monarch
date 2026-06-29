import { useEffect, useState } from "react"
import { COLORS, FONT, RADIUS } from "@design"
import { applyThemeMode, getStoredThemeMode, resolveThemeMode, type ThemeMode } from "../theme/themeMode"

type Props = {
    collapsed?: boolean
}

function SunIcon() {
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" />
            <path d="m19.07 4.93-1.41 1.41" />
        </svg>
    )
}

function MoonIcon() {
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
    )
}

export function ThemeToggle({ collapsed = false }: Props) {
    const [resolved, setResolved] = useState<"light" | "dark">(() =>
        resolveThemeMode(getStoredThemeMode())
    )

    useEffect(() => {
        const mq = window.matchMedia("(prefers-color-scheme: dark)")
        const sync = () => setResolved(resolveThemeMode(getStoredThemeMode()))
        mq.addEventListener("change", sync)
        return () => mq.removeEventListener("change", sync)
    }, [])

    const isDark = resolved === "dark"
    const nextMode: ThemeMode = isDark ? "light" : "dark"

    const toggle = () => {
        applyThemeMode(nextMode)
        setResolved(nextMode)
    }

    return (
        <button
            type="button"
            onClick={toggle}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Light mode" : "Dark mode"}
            style={{
                width: collapsed ? "100%" : "auto",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: collapsed ? "center" : "flex-start",
                gap: 10,
                padding: collapsed ? "12px" : "10px 14px",
                fontSize: 13,
                fontWeight: 600,
                fontFamily: FONT,
                border: "none",
                borderRadius: RADIUS.small,
                background: "transparent",
                color: COLORS.onChrome,
                cursor: "pointer",
                boxSizing: "border-box",
            }}
        >
            {isDark ? <SunIcon /> : <MoonIcon />}
        </button>
    )
}
