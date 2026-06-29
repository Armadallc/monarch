/**
 * Expandable “motion cards” accordion — up to 10 rows.
 * Spring feel matches ScrollStepsCards / site motion (stiffness + damping + mass).
 * Renders on the Framer canvas with the same defaults as the previewer (zero / empty
 * padding from a fresh drop is coerced to fallbacks; no “force first card open” on canvas).
 *
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 520
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */

import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import { AnimatePresence, motion, useReducedMotion, type Transition } from "framer-motion"

type FontLike = {
    fontSize?: string | number
    lineHeight?: string | number
    letterSpacing?: string | number
    textAlign?: React.CSSProperties["textAlign"]
    fontFamily?: string
    fontWeight?: React.CSSProperties["fontWeight"]
    fontStyle?: React.CSSProperties["fontStyle"]
    fontVariant?: React.CSSProperties["fontVariant"]
}

type CardItem = {
    numberLabel: string
    title: string
    body: string
    showLink: boolean
    linkLabel: string
    linkUrl: string
}

type VisualVariant = "frosted" | "solid" | "minimal"

type LinkPlacement = "right" | "below"

type Props = {
    items: CardItem[]
    allowMultipleOpen: boolean

    cardMaxWidth: number
    cardGap: number
    /** Padding for the collapsed / header row (#, title, toggle). */
    closedRowPadding: string
    /** Padding inside the expanded region (below the header). */
    openContentPadding: string
    cornerRadius: string
    borderWidth: number
    borderColor: string
    cardBackground: string
    headerHoverBackground: string
    visualVariant: VisualVariant

    numberFont: FontLike
    titleFont: FontLike
    bodyFont: FontLike
    linkFont: FontLike
    numberColor: string
    titleColor: string
    bodyColor: string
    linkColor: string
    linkUnderline: boolean

    /** Higher = snappier open/close (spring stiffness). */
    openCloseSpeed: number
    /** Lower = more overshoot / “bounce” on height. */
    bounceDamping: number
    springMass: number
    linkPlacement: LinkPlacement
    chevronColor: string

    style?: React.CSSProperties
}

const defaultItems: CardItem[] = [
    {
        numberLabel: "01",
        title: "Program overview",
        body: "Brief details about this program pillar appear here when the card is open. Keep copy concise for scanning.",
        showLink: true,
        linkLabel: "Learn more",
        linkUrl: "https://example.com",
    },
    {
        numberLabel: "02",
        title: "Clinical support",
        body: "Describe services, eligibility, or what families should expect.",
        showLink: false,
        linkLabel: "Details",
        linkUrl: "",
    },
    {
        numberLabel: "03",
        title: "Next steps",
        body: "Use the optional link for intake, PDFs, or external resources.",
        showLink: true,
        linkLabel: "Get started",
        linkUrl: "https://example.com",
    },
]

/**
 * Framer padding on a new instance can be:
 * - `""` (invalid CSS if applied as-is)
 * - `{ top: 0, right: 0, bottom: 0, left: 0 }` from the padding control UI → looks “unstyled”
 * Treat all-zero / empty as “unset” and use code defaults so canvas matches the previewer.
 */
function paddingTokenToPx(token: string): number {
    const t = token.trim().toLowerCase()
    if (t === "" || t === "auto") return NaN
    const m = t.match(/^(-?\d*\.?\d+)/)
    if (m) return parseFloat(m[1])
    return NaN
}

function isAllZeroPadding(css: string): boolean {
    const parts = css.trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return true
    return parts.every((p) => {
        const n = paddingTokenToPx(p)
        return !Number.isFinite(n) || n === 0
    })
}

function normalizePadding(value: unknown, fallback: string): string {
    if (value == null) return fallback
    if (typeof value === "number" && !Number.isNaN(value)) {
        if (value === 0) return fallback
        return `${value}px`
    }
    if (typeof value === "string") {
        const t = value.trim()
        if (t.length === 0) return fallback
        if (isAllZeroPadding(t)) return fallback
        return value
    }
    if (typeof value === "object" && value !== null) {
        const o = value as Record<string, unknown>
        const pick = (k: string) => o[k]
        if (typeof pick("padding") === "string") {
            const p = (pick("padding") as string).trim()
            if (p.length === 0) return fallback
            if (isAllZeroPadding(p)) return fallback
            return pick("padding") as string
        }
        const top = pick("top")
        const right = pick("right")
        const bottom = pick("bottom")
        const left = pick("left")
        if (top !== undefined || right !== undefined || bottom !== undefined || left !== undefined) {
            const asLen = (v: unknown) => {
                if (typeof v === "number" && !Number.isNaN(v)) return `${v}px`
                if (typeof v === "string" && v.trim().length > 0) return v.trim()
                return "0px"
            }
            const built = `${asLen(top)} ${asLen(right)} ${asLen(bottom)} ${asLen(left)}`
            if (isAllZeroPadding(built)) return fallback
            return built
        }
    }
    return fallback
}

function normalizeRadius(value: unknown, fallback: string): string {
    if (value == null) return fallback
    if (typeof value === "number" && !Number.isNaN(value)) return `${value}px`
    if (typeof value === "string") {
        const t = value.trim()
        return t.length > 0 ? value : fallback
    }
    return fallback
}

function prefersReducedMotionNow(): boolean {
    if (typeof window === "undefined" || !window.matchMedia) return false
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function buildTransition(
    reduced: boolean,
    speed: number,
    bounceDamping: number,
    mass: number
): Transition {
    if (reduced) {
        const d = Math.max(0.12, 0.42 - (speed / 600) * 0.25)
        return { type: "tween", duration: d, ease: "easeOut" }
    }
    const stiffness = Math.round(70 + (speed / 500) * 380)
    const damping = Math.round(Math.max(8, Math.min(52, bounceDamping)))
    const m = Math.max(0.35, Math.min(2.4, mass))
    return {
        type: "spring",
        stiffness,
        damping,
        mass: m,
        /** Cuts micro-oscillation at the end (reduces border “jitter” with strokes). */
        restDelta: 0.45,
        restSpeed: 0.22,
    }
}

/** Slightly more damped than the panel so the icon settles without fighting height. */
function iconSpringTransition(t: Transition): Transition {
    if (typeof t === "object" && t && "type" in t && (t as { type?: string }).type === "spring") {
        const s = t as { damping?: number; restDelta?: number; restSpeed?: number }
        const d = Math.min(52, Math.round((s.damping ?? 24) * 1.12 + 2))
        return {
            ...t,
            damping: d,
            restDelta: Math.max(s.restDelta ?? 0.45, 0.5),
            restSpeed: Math.max(s.restSpeed ?? 0.22, 0.28),
        }
    }
    return t
}

function variantSurface(v: VisualVariant, baseBg: string, blurPx: number): React.CSSProperties {
    if (v === "minimal") {
        return {
            background: "transparent",
            backdropFilter: "none",
        }
    }
    if (v === "frosted") {
        return {
            background: baseBg,
            backdropFilter: `blur(${blurPx}px)`,
            WebkitBackdropFilter: `blur(${blurPx}px)`,
        }
    }
    return {
        background: baseBg,
        backdropFilter: "none",
    }
}

function expandPanelTransition(t: Transition): Transition {
    if (typeof t === "object" && t && "type" in t && (t as { type?: string }).type === "spring") {
        return { height: t }
    }
    return t
}

const linkRevealTransition: Transition = {
    type: "tween",
    duration: 0.22,
    ease: [0.22, 1, 0.36, 1],
}

/** + when closed (vertical stroke), − when open (horizontal only); uses same transition as the panel. */
function PlusMinusIcon(props: { open: boolean; transition: Transition; color: string }) {
    const { open, transition, color } = props
    const arm = 12
    const thickness = 2
    const halfArm = arm / 2
    const halfT = thickness / 2

    return (
        <span
            aria-hidden
            style={{
                flexShrink: 0,
                width: 22,
                height: 22,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                color,
            }}
        >
            <span
                style={{
                    position: "relative",
                    width: 14,
                    height: 14,
                    display: "block",
                    overflow: "hidden",
                }}
            >
                <span
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        width: arm,
                        height: thickness,
                        marginLeft: -halfArm,
                        marginTop: -halfT,
                        borderRadius: 1,
                        backgroundColor: "currentColor",
                        boxSizing: "border-box",
                    }}
                />
                <motion.span
                    initial={false}
                    animate={{ scaleY: open ? 0 : 1 }}
                    transition={transition}
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        width: thickness,
                        height: arm,
                        marginLeft: -halfT,
                        marginTop: -halfArm,
                        borderRadius: 1,
                        backgroundColor: "currentColor",
                        transformOrigin: "center center",
                        boxSizing: "border-box",
                        willChange: "transform",
                    }}
                />
            </span>
        </span>
    )
}

function ExpandPanel(props: {
    open: boolean
    transition: Transition
    children: React.ReactNode
}) {
    const { open, transition, children } = props
    const innerRef = React.useRef<HTMLDivElement | null>(null)
    const [h, setH] = React.useState(0)

    React.useLayoutEffect(() => {
        const el = innerRef.current
        if (!el) return
        const measure = () => {
            requestAnimationFrame(() => {
                const inner = innerRef.current
                if (!inner) return
                setH(Math.max(0, Math.round(inner.scrollHeight)))
            })
        }
        measure()
        const ro = new ResizeObserver(() => measure())
        ro.observe(el)
        return () => ro.disconnect()
    }, [children, open])

    return (
        <motion.div
            initial={false}
            animate={{ height: open ? h : 0 }}
            transition={expandPanelTransition(transition)}
            style={{
                overflow: "hidden",
                pointerEvents: open ? "auto" : "none",
                width: "100%",
                minWidth: 0,
                boxSizing: "border-box",
                willChange: open ? "height" : "auto",
            }}
        >
            <div ref={innerRef} style={{ width: "100%", minWidth: 0, boxSizing: "border-box" }}>
                {children}
            </div>
        </motion.div>
    )
}

/**
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 520
 */
export default function MotionCardsAccordion(props: Props) {
    const {
        items = defaultItems,
        allowMultipleOpen = false,
        cardMaxWidth = 720,
        cardGap = 12,
        closedRowPadding: closedRowPaddingProp = "18px 24px",
        openContentPadding: openContentPaddingProp = "12px 22px 22px 22px",
        cornerRadius: cornerRadiusProp = "16px",
        borderWidth = 1,
        borderColor = "rgba(43, 40, 40, 0.12)",
        cardBackground = "rgba(255, 255, 255, 0.88)",
        headerHoverBackground = "rgba(0, 0, 0, 0.04)",
        visualVariant = "frosted",
        numberFont,
        titleFont,
        bodyFont,
        linkFont,
        numberColor = "rgba(43, 40, 40, 0.55)",
        titleColor = "#2b2828",
        bodyColor = "rgba(43, 40, 40, 0.85)",
        linkColor = "#4f666a",
        linkUnderline = true,
        openCloseSpeed = 340,
        bounceDamping = 28,
        springMass = 0.95,
        linkPlacement = "right",
        chevronColor = "rgba(43, 40, 40, 0.45)",
        style,
    } = props

    const closedRowPadding = normalizePadding(closedRowPaddingProp, "18px 24px")
    const openContentPadding = normalizePadding(openContentPaddingProp, "12px 22px 22px 22px")
    const cornerRadius = normalizeRadius(cornerRadiusProp, "16px")

    const reducedMotionHook = useReducedMotion()
    const [reducedMotion, setRm] = React.useState(false)
    React.useEffect(() => {
        setRm(Boolean(reducedMotionHook) || prefersReducedMotionNow())
    }, [reducedMotionHook])

    const list = (items && items.length > 0 ? items : defaultItems).slice(0, 10)
    const [openIds, setOpenIds] = React.useState<Record<number, boolean>>({})

    const transition = React.useMemo(
        () => buildTransition(Boolean(reducedMotion), openCloseSpeed, bounceDamping, springMass),
        [reducedMotion, openCloseSpeed, bounceDamping, springMass]
    )
    const iconTransition = React.useMemo(() => iconSpringTransition(transition), [transition])

    const surface = variantSurface(visualVariant, cardBackground, visualVariant === "frosted" ? 12 : 0)

    const toggle = (index: number) => {
        setOpenIds((prev) => {
            const next = { ...prev }
            const isOpen = !!prev[index]
            if (allowMultipleOpen) {
                next[index] = !isOpen
                return next
            }
            if (isOpen) {
                next[index] = false
                return next
            }
            Object.keys(next).forEach((k) => {
                next[Number(k)] = false
            })
            next[index] = true
            return next
        })
    }

    return (
        <div
            style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                boxSizing: "border-box",
                ...style,
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: cardMaxWidth,
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: cardGap,
                    boxSizing: "border-box",
                }}
            >
                {list.map((item, index) => {
                    const open = !!openIds[index]
                    const hasLink = item.showLink && item.linkUrl && item.linkUrl.trim().length > 0

                    return (
                        <article
                            key={`${item.numberLabel}-${index}`}
                            style={{
                                borderRadius: cornerRadius,
                                borderWidth,
                                borderStyle: "solid",
                                borderColor,
                                boxSizing: "border-box",
                                overflow: "hidden",
                                minWidth: 0,
                                maxWidth: "100%",
                                contain: "layout",
                                WebkitFontSmoothing: "antialiased",
                                ...surface,
                            }}
                        >
                            <button
                                type="button"
                                onClick={() => toggle(index)}
                                aria-expanded={open}
                                style={{
                                    width: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 14,
                                    padding: closedRowPadding,
                                    border: "none",
                                    background: open ? headerHoverBackground : "transparent",
                                    cursor: "pointer",
                                    textAlign: "left",
                                    font: "inherit",
                                    color: "inherit",
                                    boxSizing: "border-box",
                                }}
                            >
                                <span
                                    style={{
                                        ...numberFont,
                                        color: numberColor,
                                        flexShrink: 0,
                                        minWidth: "2.25em",
                                    }}
                                >
                                    {item.numberLabel}
                                </span>
                                <span
                                    style={{
                                        ...titleFont,
                                        color: titleColor,
                                        flex: 1,
                                        minWidth: 0,
                                    }}
                                >
                                    {item.title}
                                </span>
                                <PlusMinusIcon open={open} transition={iconTransition} color={chevronColor} />
                            </button>

                            <ExpandPanel open={open} transition={transition}>
                                <div
                                    style={{
                                        padding: openContentPadding,
                                        boxSizing: "border-box",
                                        width: "100%",
                                        minWidth: 0,
                                        overflow: "hidden",
                                    }}
                                >
                                    {linkPlacement === "right" ? (
                                        <div
                                            style={{
                                                display: "flex",
                                                flexDirection: "row",
                                                flexWrap: "wrap",
                                                alignItems: "flex-start",
                                                justifyContent: "space-between",
                                                gap: 16,
                                                width: "100%",
                                                minWidth: 0,
                                                boxSizing: "border-box",
                                            }}
                                        >
                                            <p
                                                style={{
                                                    ...bodyFont,
                                                    color: bodyColor,
                                                    margin: 0,
                                                    flex: "1 1 0",
                                                    minWidth: 0,
                                                    maxWidth: "100%",
                                                    overflowWrap: "break-word",
                                                    wordBreak: "break-word",
                                                }}
                                            >
                                                {item.body}
                                            </p>
                                            <AnimatePresence>
                                                {open && hasLink ? (
                                                    <motion.div
                                                        key="link"
                                                        initial={{ opacity: 0, y: 4 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: 2 }}
                                                        transition={linkRevealTransition}
                                                        style={{
                                                            flex: "0 1 auto",
                                                            minWidth: 0,
                                                            maxWidth: "100%",
                                                            alignSelf: "flex-start",
                                                            textAlign: "right" as const,
                                                        }}
                                                    >
                                                        <a
                                                            href={item.linkUrl}
                                                            style={{
                                                                ...linkFont,
                                                                color: linkColor,
                                                                textDecoration: linkUnderline ? "underline" : "none",
                                                                textUnderlineOffset: 3,
                                                                display: "inline-block",
                                                                maxWidth: "100%",
                                                                overflowWrap: "anywhere",
                                                                wordBreak: "break-word",
                                                                whiteSpace: "normal",
                                                            }}
                                                        >
                                                            {item.linkLabel || "Learn more"}
                                                        </a>
                                                    </motion.div>
                                                ) : null}
                                            </AnimatePresence>
                                        </div>
                                    ) : (
                                        <>
                                            <p
                                                style={{
                                                    ...bodyFont,
                                                    color: bodyColor,
                                                    margin: 0,
                                                    marginBottom: hasLink ? 12 : 0,
                                                    maxWidth: "100%",
                                                    overflowWrap: "break-word",
                                                    wordBreak: "break-word",
                                                }}
                                            >
                                                {item.body}
                                            </p>
                                            <AnimatePresence>
                                                {open && hasLink ? (
                                                    <motion.div
                                                        key="link-below"
                                                        initial={{ opacity: 0, y: 4 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: 2 }}
                                                        transition={linkRevealTransition}
                                                        style={{ maxWidth: "100%", minWidth: 0 }}
                                                    >
                                                        <a
                                                            href={item.linkUrl}
                                                            style={{
                                                                ...linkFont,
                                                                color: linkColor,
                                                                textDecoration: linkUnderline ? "underline" : "none",
                                                                textUnderlineOffset: 3,
                                                                display: "inline-block",
                                                                maxWidth: "100%",
                                                                overflowWrap: "anywhere",
                                                                wordBreak: "break-word",
                                                            }}
                                                        >
                                                            {item.linkLabel || "Learn more"}
                                                        </a>
                                                    </motion.div>
                                                ) : null}
                                            </AnimatePresence>
                                        </>
                                    )}
                                </div>
                            </ExpandPanel>
                        </article>
                    )
                })}
            </div>
        </div>
    )
}

addPropertyControls(MotionCardsAccordion, {
    items: {
        type: ControlType.Array,
        title: "Cards",
        maxCount: 10,
        defaultValue: defaultItems,
        control: {
            type: ControlType.Object,
            controls: {
                numberLabel: { type: ControlType.String, title: "#", defaultValue: "01" },
                title: { type: ControlType.String, title: "Title", defaultValue: "Card title" },
                body: {
                    type: ControlType.String,
                    title: "Details",
                    defaultValue: "Paragraph shown when open.",
                    displayTextArea: true,
                },
                showLink: { type: ControlType.Boolean, title: "Show link (when open)", defaultValue: false },
                linkLabel: { type: ControlType.String, title: "Link label", defaultValue: "Learn more" },
                linkUrl: { type: ControlType.Link, title: "Link URL", defaultValue: "https://example.com" },
            },
        },
    },
    allowMultipleOpen: {
        type: ControlType.Boolean,
        title: "Multi-open",
        defaultValue: false,
        enabledTitle: "Allow",
        disabledTitle: "Single",
    },

    cardMaxWidth: {
        type: ControlType.Number,
        title: "Card width (max)",
        defaultValue: 720,
        min: 320,
        max: 1200,
        step: 4,
        unit: "px",
    },
    cardGap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 12,
        min: 0,
        max: 48,
        step: 1,
        unit: "px",
    },
    closedRowPadding: {
        type: ControlType.Padding,
        title: "Closed row padding",
        defaultValue: "18px 24px",
    },
    openContentPadding: {
        type: ControlType.Padding,
        title: "Open content padding",
        defaultValue: "12px 22px 22px 22px",
    },
    cornerRadius: {
        type: ControlType.BorderRadius,
        title: "Radius",
        defaultValue: "16px",
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border",
        defaultValue: 1,
        min: 0,
        max: 4,
        step: 1,
        unit: "px",
    },
    borderColor: { type: ControlType.Color, title: "Border color", defaultValue: "rgba(43, 40, 40, 0.12)" },
    cardBackground: { type: ControlType.Color, title: "Card BG", defaultValue: "rgba(255, 255, 255, 0.88)" },
    headerHoverBackground: {
        type: ControlType.Color,
        title: "Header hover / open tint",
        defaultValue: "rgba(0, 0, 0, 0.04)",
    },
    visualVariant: {
        type: ControlType.Enum,
        title: "Variant",
        options: ["frosted", "solid", "minimal"],
        optionTitles: ["Frosted", "Solid", "Minimal"],
        defaultValue: "frosted",
        displaySegmentedControl: true,
    },

    numberFont: {
        type: ControlType.Font,
        title: "# Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "13px",
            variant: "Semibold",
            letterSpacing: "0.04em",
            lineHeight: "1.2em",
        },
    },
    titleFont: {
        type: ControlType.Font,
        title: "Row title font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "18px",
            variant: "Semibold",
            letterSpacing: "-0.02em",
            lineHeight: "1.25em",
        },
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.45em",
        },
    },
    linkFont: {
        type: ControlType.Font,
        title: "Link font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Semibold",
            letterSpacing: "0.01em",
            lineHeight: "1.2em",
        },
    },
    numberColor: { type: ControlType.Color, title: "# Color", defaultValue: "rgba(43, 40, 40, 0.55)" },
    titleColor: { type: ControlType.Color, title: "Row title color", defaultValue: "#2b2828" },
    bodyColor: { type: ControlType.Color, title: "Body color", defaultValue: "rgba(43, 40, 40, 0.85)" },
    linkColor: { type: ControlType.Color, title: "Link color", defaultValue: "#4f666a" },
    linkUnderline: {
        type: ControlType.Boolean,
        title: "Link underline",
        defaultValue: true,
    },
    linkPlacement: {
        type: ControlType.Enum,
        title: "Link placement",
        options: ["right", "below"],
        optionTitles: ["Right of body", "Below body"],
        defaultValue: "right",
        displaySegmentedControl: true,
    },
    chevronColor: {
        type: ControlType.Color,
        title: "Plus / minus",
        defaultValue: "rgba(43, 40, 40, 0.45)",
    },

    openCloseSpeed: {
        type: ControlType.Number,
        title: "Open/close speed",
        defaultValue: 340,
        min: 120,
        max: 520,
        step: 4,
        description: "Spring stiffness — higher opens and closes faster.",
    },
    bounceDamping: {
        type: ControlType.Number,
        title: "Bounce (damping)",
        defaultValue: 28,
        min: 6,
        max: 44,
        step: 1,
        description: "Lower = more overshoot / bounce on expand and collapse.",
    },
    springMass: {
        type: ControlType.Number,
        title: "Spring mass",
        defaultValue: 0.95,
        min: 0.3,
        max: 2,
        step: 0.05,
    },
})
