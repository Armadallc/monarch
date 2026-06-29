// Monarch Snap Scroll — page-level snap-scroll controller for selected sections.
//
// Usage: drop ONE instance at the root of any page. No visible footprint required.
// Sections are selected via a CSS selector (default: `[data-snap]`). Mark sections
// in Framer by adding the `data-snap` attribute (or any selector you configure).
//
// Phase 1 (this version): native CSS scroll-snap + optional wheel cooldown so a
// single wheel/trackpad gesture advances exactly one section. Smooth scrolling
// honours `prefers-reduced-motion`.
//
// Phase 2 (later): subtle enter/exit transitions via IntersectionObserver-driven
// CSS classes (`mn-snap-active`, `mn-snap-entering`, `mn-snap-leaving`).

import { useEffect, useRef, type CSSProperties } from "react"
import { addPropertyControls, ControlType, RenderTarget } from "framer"

interface MonarchSnapScrollProps {
    enabled: boolean
    sectionSelector: string
    snapStrictness: "mandatory" | "proximity"
    snapAlign: "start" | "center" | "end"
    smooth: boolean
    respectReducedMotion: boolean
    wheelSnap: boolean
    wheelCooldownMs: number
    wheelThreshold: number
    scrollPaddingTop: number
    excludeSelector: string
    debugOverlay: boolean
    style?: CSSProperties
}

/** Stable id so we can cleanup our injected stylesheet between mounts. */
const STYLE_TAG_ID = "monarch-snap-scroll-style"
/** Marker added to <html> while controller is active — used for CSS scoping. */
const ROOT_ACTIVE_ATTR = "data-monarch-snap-scroll"

function buildCssRules(props: {
    sectionSelector: string
    excludeSelector: string
    snapStrictness: "mandatory" | "proximity"
    snapAlign: "start" | "center" | "end"
    smooth: boolean
    scrollPaddingTop: number
    reducedMotion: boolean
}): string {
    const {
        sectionSelector,
        excludeSelector,
        snapStrictness,
        snapAlign,
        smooth,
        scrollPaddingTop,
        reducedMotion,
    } = props

    const safeSection = sectionSelector.trim() || "[data-snap]"
    const safeExclude = excludeSelector.trim()

    const effectiveBehavior = reducedMotion ? "auto" : smooth ? "smooth" : "auto"

    const sectionRule = safeExclude
        ? `html[${ROOT_ACTIVE_ATTR}] ${safeSection}:not(${safeExclude})`
        : `html[${ROOT_ACTIVE_ATTR}] ${safeSection}`

    return `
        html[${ROOT_ACTIVE_ATTR}] {
            scroll-snap-type: y ${snapStrictness};
            scroll-padding-top: ${scrollPaddingTop}px;
            scroll-behavior: ${effectiveBehavior};
        }
        ${sectionRule} {
            scroll-snap-align: ${snapAlign};
            scroll-snap-stop: always;
        }
    `
}

function prefersReducedMotion(): boolean {
    if (typeof window === "undefined" || !window.matchMedia) return false
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function collectSections(
    selector: string,
    excludeSelector: string
): HTMLElement[] {
    if (typeof document === "undefined") return []
    let nodes: HTMLElement[] = []
    try {
        nodes = Array.from(document.querySelectorAll<HTMLElement>(selector))
    } catch {
        return []
    }
    if (excludeSelector.trim()) {
        try {
            const excluded = new Set(
                Array.from(
                    document.querySelectorAll<HTMLElement>(excludeSelector)
                )
            )
            nodes = nodes.filter((n) => !excluded.has(n))
        } catch {
            /* ignore bad exclude selector */
        }
    }
    return nodes.filter((n) => !!n.offsetParent || n === document.body)
}

function nearestSectionIndex(
    sections: HTMLElement[],
    scrollPaddingTop: number
): number {
    if (!sections.length) return -1
    const probeY = scrollPaddingTop + 4
    let best = 0
    let bestDist = Infinity
    for (let i = 0; i < sections.length; i++) {
        const rect = sections[i].getBoundingClientRect()
        const dist = Math.abs(rect.top - probeY)
        if (dist < bestDist) {
            best = i
            bestDist = dist
        }
    }
    return best
}

/**
 * Monarch Snap Scroll
 *
 * Drop a single instance at the page root. Configure which sections snap via
 * a CSS selector (default `[data-snap]`).
 *
 * @framerIntrinsicWidth 240
 * @framerIntrinsicHeight 1
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function MonarchSnapScroll(props: MonarchSnapScrollProps) {
    const {
        enabled,
        sectionSelector,
        snapStrictness,
        snapAlign,
        smooth,
        respectReducedMotion,
        wheelSnap,
        wheelCooldownMs,
        wheelThreshold,
        scrollPaddingTop,
        excludeSelector,
        debugOverlay,
        style,
    } = props

    const isCanvas =
        RenderTarget.current() === RenderTarget.canvas ||
        RenderTarget.current() === RenderTarget.thumbnail

    const wheelLockUntilRef = useRef<number>(0)

    useEffect(() => {
        if (isCanvas) return
        if (!enabled) return
        if (typeof document === "undefined") return

        const reduced = respectReducedMotion && prefersReducedMotion()

        const css = buildCssRules({
            sectionSelector,
            excludeSelector,
            snapStrictness,
            snapAlign,
            smooth,
            scrollPaddingTop,
            reducedMotion: reduced,
        })

        let tag = document.getElementById(STYLE_TAG_ID) as HTMLStyleElement | null
        if (!tag) {
            tag = document.createElement("style")
            tag.id = STYLE_TAG_ID
            document.head.appendChild(tag)
        }
        tag.textContent = css
        document.documentElement.setAttribute(ROOT_ACTIVE_ATTR, "")

        return () => {
            document.documentElement.removeAttribute(ROOT_ACTIVE_ATTR)
            const existing = document.getElementById(STYLE_TAG_ID)
            if (existing) existing.remove()
        }
    }, [
        isCanvas,
        enabled,
        sectionSelector,
        excludeSelector,
        snapStrictness,
        snapAlign,
        smooth,
        respectReducedMotion,
        scrollPaddingTop,
    ])

    useEffect(() => {
        if (isCanvas) return
        if (!enabled || !wheelSnap) return
        if (typeof window === "undefined") return

        const reduced = respectReducedMotion && prefersReducedMotion()
        const behavior: ScrollBehavior = reduced || !smooth ? "auto" : "smooth"

        function onWheel(e: WheelEvent) {
            const now =
                typeof performance !== "undefined" ? performance.now() : Date.now()
            if (now < wheelLockUntilRef.current) {
                e.preventDefault()
                return
            }
            const absY = Math.abs(e.deltaY)
            const absX = Math.abs(e.deltaX)
            if (absY < wheelThreshold || absY <= absX) return

            const sections = collectSections(
                sectionSelector || "[data-snap]",
                excludeSelector
            )
            if (sections.length < 2) return

            const current = nearestSectionIndex(sections, scrollPaddingTop)
            const dir = e.deltaY > 0 ? 1 : -1
            const next = Math.max(
                0,
                Math.min(sections.length - 1, current + dir)
            )
            if (next === current) return

            e.preventDefault()
            wheelLockUntilRef.current = now + wheelCooldownMs

            const target = sections[next]
            const top =
                target.getBoundingClientRect().top +
                window.scrollY -
                scrollPaddingTop
            window.scrollTo({ top, behavior })
        }

        window.addEventListener("wheel", onWheel, { passive: false })
        return () => {
            window.removeEventListener("wheel", onWheel)
        }
    }, [
        isCanvas,
        enabled,
        wheelSnap,
        wheelCooldownMs,
        wheelThreshold,
        sectionSelector,
        excludeSelector,
        scrollPaddingTop,
        smooth,
        respectReducedMotion,
    ])

    const baseWrapper: CSSProperties = {
        position: "relative",
        width: style?.width || 1,
        height: style?.height || 1,
        pointerEvents: "none",
        ...style,
    }

    if (isCanvas) {
        return (
            <div
                style={{
                    ...baseWrapper,
                    pointerEvents: "none",
                    minWidth: 200,
                    height: "auto",
                    padding: "6px 10px",
                    background: "rgba(43,40,40,0.85)",
                    color: "rgb(233,237,246)",
                    borderRadius: 8,
                    font: "500 11px/1.2 -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif",
                    letterSpacing: "0.02em",
                    whiteSpace: "nowrap",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
                }}
                aria-hidden
            >
                Snap: {enabled ? "on" : "off"} · {sectionSelector || "[data-snap]"}
            </div>
        )
    }

    if (!debugOverlay) {
        return (
            <span
                style={{
                    display: "block",
                    width: 0,
                    height: 0,
                    overflow: "hidden",
                    pointerEvents: "none",
                }}
                aria-hidden
            />
        )
    }

    return (
        <div
            style={{
                position: "fixed",
                top: 12,
                right: 12,
                zIndex: 999999,
                padding: "6px 10px",
                background: "rgba(43,40,40,0.85)",
                color: "rgb(233,237,246)",
                borderRadius: 8,
                font: "500 11px/1.2 -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif",
                letterSpacing: "0.02em",
                pointerEvents: "none",
                boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
            }}
            aria-hidden
        >
            Snap: {enabled ? "on" : "off"} · {sectionSelector || "[data-snap]"}
        </div>
    )
}

addPropertyControls(MonarchSnapScroll, {
    enabled: {
        type: ControlType.Boolean,
        title: "Enabled",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    sectionSelector: {
        type: ControlType.String,
        title: "Sections",
        defaultValue: "[data-snap]",
        placeholder: "[data-snap]",
    },
    excludeSelector: {
        type: ControlType.String,
        title: "Exclude",
        defaultValue: "",
        placeholder: "[data-no-snap]",
    },
    snapStrictness: {
        type: ControlType.Enum,
        title: "Strictness",
        defaultValue: "proximity",
        options: ["proximity", "mandatory"],
        optionTitles: ["Proximity", "Mandatory"],
        displaySegmentedControl: true,
    },
    snapAlign: {
        type: ControlType.Enum,
        title: "Align",
        defaultValue: "start",
        options: ["start", "center", "end"],
        optionTitles: ["Start", "Center", "End"],
        displaySegmentedControl: true,
    },
    scrollPaddingTop: {
        type: ControlType.Number,
        title: "Top Offset",
        defaultValue: 0,
        min: 0,
        max: 240,
        step: 1,
        unit: "px",
    },
    smooth: {
        type: ControlType.Boolean,
        title: "Smooth",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    respectReducedMotion: {
        type: ControlType.Boolean,
        title: "Reduced Motion",
        defaultValue: true,
        enabledTitle: "Respect",
        disabledTitle: "Ignore",
    },
    wheelSnap: {
        type: ControlType.Boolean,
        title: "Wheel Snap",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    wheelCooldownMs: {
        type: ControlType.Number,
        title: "Cooldown",
        defaultValue: 650,
        min: 200,
        max: 1500,
        step: 50,
        unit: "ms",
        hidden: ({ wheelSnap }) => !wheelSnap,
    },
    wheelThreshold: {
        type: ControlType.Number,
        title: "Threshold",
        defaultValue: 8,
        min: 1,
        max: 80,
        step: 1,
        unit: "px",
        hidden: ({ wheelSnap }) => !wheelSnap,
    },
    debugOverlay: {
        type: ControlType.Boolean,
        title: "Debug",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
})
