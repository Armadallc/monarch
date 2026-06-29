import { useEffect } from "react"
import { MONARCH_THEME_INJECT_CSS } from "./monarchThemeInjectCss"

export const MONARCH_THEME_STORAGE_KEY = "monarch-dashboard-theme"
export const MONARCH_THEME_STYLE_ELEMENT_ID = "monarch-dashboard-theme-vars"

export type MonarchThemeMode = "light" | "dark" | "system"

export function getStoredMonarchThemeMode(): MonarchThemeMode {
    try {
        const stored = localStorage.getItem(MONARCH_THEME_STORAGE_KEY)
        if (stored === "light" || stored === "dark" || stored === "system") return stored
    } catch {
        /* ignore */
    }
    return "system"
}

export function resolveMonarchThemeMode(mode: MonarchThemeMode): "light" | "dark" {
    if (mode === "light" || mode === "dark") return mode
    return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export function applyMonarchThemeMode(mode: MonarchThemeMode): "light" | "dark" {
    const resolved = resolveMonarchThemeMode(mode)
    if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("dark", resolved === "dark")
        document.documentElement.dataset.theme = resolved
    }
    try {
        localStorage.setItem(MONARCH_THEME_STORAGE_KEY, mode)
    } catch {
        /* ignore */
    }
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("monarch-theme-change"))
    }
    return resolved
}

export function injectMonarchThemeCss(css: string = MONARCH_THEME_INJECT_CSS): void {
    if (typeof document === "undefined") return
    if (document.getElementById(MONARCH_THEME_STYLE_ELEMENT_ID)) return
    const el = document.createElement("style")
    el.id = MONARCH_THEME_STYLE_ELEMENT_ID
    el.textContent = css
    document.head.appendChild(el)
}

export function initMonarchThemeMode(): MonarchThemeMode {
    applyMonarchThemeMode(getStoredMonarchThemeMode())
    return getStoredMonarchThemeMode()
}

/** Inject theme CSS vars + apply stored light/dark/system mode (Framer dashboard & portal). */
export function useMonarchThemeBootstrap(): void {
    useEffect(() => {
        if (typeof document === "undefined") return
        injectMonarchThemeCss()
        applyMonarchThemeMode(getStoredMonarchThemeMode())
        const mq = window.matchMedia("(prefers-color-scheme: dark)")
        const onSystemChange = () => {
            if (getStoredMonarchThemeMode() === "system") applyMonarchThemeMode("system")
        }
        mq.addEventListener("change", onSystemChange)
        return () => mq.removeEventListener("change", onSystemChange)
    }, [])
}
