// Sefe Rolling Text — per-character hover roll with stagger.
// Paste into Framer as a code component (Assets → Code → new file).

import * as React from "react"
import { useState } from "react"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"
import { motion } from "framer-motion"

type TextTransform = "none" | "uppercase" | "lowercase" | "capitalize"
type HtmlTag = "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "span"
type TransitionEase =
    | "linear"
    | "easeIn"
    | "easeOut"
    | "easeInOut"
    | [number, number, number, number]

const EASE_MAP: Record<string, TransitionEase> = {
    linear: "linear",
    easeIn: "easeIn",
    easeOut: "easeOut",
    easeInOut: "easeInOut",
    smooth: [0.44, 0, 0.22, 1],
    snappy: [0.22, 1, 0.36, 1],
}

function resolveColor(value: unknown, fallback: string): string {
    if (typeof value === "string" && value.trim()) return value
    if (value && typeof value === "object") {
        const c = value as Record<string, number>
        if (typeof c.r === "number" && typeof c.g === "number" && typeof c.b === "number") {
            const a = typeof c.a === "number" ? c.a : 1
            return `rgba(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)}, ${a})`
        }
    }
    return fallback
}

function splitDisplayChars(text: string): string[] {
    return Array.from(text)
}

function staggerDelayMs(index: number, total: number, staggerMs: number, reverse: boolean): number {
    const order = reverse ? total - 1 - index : index
    return Math.max(0, order) * staggerMs
}

interface RollingCharProps {
    char: string
    index: number
    total: number
    hovered: boolean
    color: string
    staggerMs: number
    reverse: boolean
    duration: number
    ease: TransitionEase
    letterSpacingEm: number
}

function RollingChar({
    char,
    index,
    total,
    hovered,
    color,
    staggerMs,
    reverse,
    duration,
    ease,
    letterSpacingEm,
}: RollingCharProps) {
    const display = char === " " ? "\u00A0" : char
    const delay = staggerDelayMs(index, total, staggerMs, reverse) / 1000

    return (
        <span
            style={{
                display: "inline-block",
                overflow: "hidden",
                height: "1em",
                verticalAlign: "bottom",
                color,
                marginRight: letterSpacingEm ? `${letterSpacingEm}em` : undefined,
            }}
        >
            <motion.span
                animate={{ y: hovered ? "-50%" : "0%" }}
                transition={{
                    duration,
                    delay,
                    ease,
                }}
                style={{
                    display: "flex",
                    flexDirection: "column",
                    willChange: "transform",
                }}
            >
                <span style={{ display: "block" }}>{display}</span>
                <span style={{ display: "block" }} aria-hidden="true">
                    {display}
                </span>
            </motion.span>
        </span>
    )
}

type FillAlign = "start" | "center" | "end"

interface SefeRollingTextProps {
    text: string
    font: React.CSSProperties
    color: string
    transitionDuration: number
    transitionEase: keyof typeof EASE_MAP
    stagger: number
    padding: string
    reverse: boolean
    textTransform: TextTransform
    tag: HtmlTag
    letterSpacing: number
    fillContainer: boolean
    fillAlign: FillAlign
    style?: React.CSSProperties
}

const FILL_ALIGN_TO_JUSTIFY: Record<FillAlign, React.CSSProperties["justifyContent"]> = {
    start: "flex-start",
    center: "center",
    end: "flex-end",
}

/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 120
 * @framerIntrinsicHeight 24
 */
export default function SefeRollingText(props: SefeRollingTextProps) {
    const {
        text,
        font,
        color,
        transitionDuration,
        transitionEase,
        stagger,
        padding,
        reverse,
        textTransform,
        tag,
        letterSpacing,
        fillContainer,
        fillAlign,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const [hovered, setHovered] = useState(false)
    const isHovered = !isStatic && hovered

    const resolvedColor = resolveColor(color, "#1A1A1A")
    const ease = EASE_MAP[transitionEase] ?? EASE_MAP.easeInOut
    const duration = Math.max(0.05, transitionDuration)
    const chars = splitDisplayChars(text)
    const total = chars.length
    const Tag = tag

    const { letterSpacing: _fontLetterSpacing, ...fontRest } = font || {}

    const textRow = (
        <>
            {chars.map((char, index) => (
                <RollingChar
                    key={`${index}-${char}`}
                    char={char}
                    index={index}
                    total={total}
                    hovered={isHovered}
                    color={resolvedColor}
                    staggerMs={stagger}
                    reverse={reverse}
                    duration={duration}
                    ease={ease}
                    letterSpacingEm={letterSpacing}
                />
            ))}
        </>
    )

    const textRowStyle: React.CSSProperties = {
        ...fontRest,
        margin: 0,
        color: resolvedColor,
        textTransform,
        display: "inline-flex",
        flexDirection: "row",
        flexWrap: "nowrap",
        whiteSpace: "nowrap",
        alignItems: "center",
        boxSizing: "border-box",
        userSelect: "none",
    }

    const pointerHandlers = {
        onPointerEnter: () => setHovered(true),
        onPointerLeave: () => setHovered(false),
    }

    // Fill mode: stretch to parent bounds for hover hit area. Parent must have
    // explicit size (Fill or fixed) — not fit-content, or 100% has nothing to fill.
    if (fillContainer) {
        return (
            <Tag
                {...pointerHandlers}
                style={{
                    ...style,
                    margin: 0,
                    padding,
                    display: "flex",
                    flexDirection: "row",
                    flexWrap: "nowrap",
                    alignItems: "center",
                    justifyContent: FILL_ALIGN_TO_JUSTIFY[fillAlign],
                    alignSelf: "stretch",
                    width: "100%",
                    height: "100%",
                    minWidth: 0,
                    boxSizing: "border-box",
                    cursor: "inherit",
                    userSelect: "none",
                }}
            >
                <span style={textRowStyle}>{textRow}</span>
            </Tag>
        )
    }

    return (
        <Tag
            {...pointerHandlers}
            style={{
                ...style,
                ...textRowStyle,
                padding,
                cursor: "inherit",
            }}
        >
            {textRow}
        </Tag>
    )
}

SefeRollingText.defaultProps = {
    text: "Home",
    font: {
        fontSize: "14px",
        variant: "Medium",
        lineHeight: "1em",
        letterSpacing: "0.04em",
    },
    color: "#1A1A1A",
    transitionDuration: 0.4,
    transitionEase: "smooth",
    stagger: 35,
    padding: "0px",
    reverse: false,
    textTransform: "uppercase",
    tag: "p",
    letterSpacing: 0,
    fillContainer: false,
    fillAlign: "start",
}

addPropertyControls(SefeRollingText, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Home",
    },

    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Medium",
            lineHeight: "1em",
            letterSpacing: "0.04em",
        },
        description:
            "Pick family and weight via the variant menu. Loads the correct font file from the project.",
    },

    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#1A1A1A",
    },

    transitionDuration: {
        type: ControlType.Number,
        title: "Transition",
        defaultValue: 0.4,
        min: 0.05,
        max: 2,
        step: 0.05,
        unit: "s",
        displayStepper: true,
        description: "Duration of each character roll.",
    },

    transitionEase: {
        type: ControlType.Enum,
        title: "Easing",
        options: ["easeInOut", "easeIn", "easeOut", "linear", "smooth", "snappy"],
        optionTitles: ["Ease In Out", "Ease In", "Ease Out", "Linear", "Smooth", "Snappy"],
        defaultValue: "smooth",
    },

    stagger: {
        type: ControlType.Number,
        title: "Stagger",
        defaultValue: 35,
        min: 0,
        max: 200,
        step: 1,
        unit: "ms",
        displayStepper: true,
        description: "Delay between each character. Enable Reverse to stagger from the end.",
    },

    padding: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: "0px",
        description:
            "Expand the hover hit area. When inside a button, put padding here (not on the button) so hover triggers across the full control.",
    },

    reverse: {
        type: ControlType.Boolean,
        title: "Reverse",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Stagger from the last character first.",
    },

    textTransform: {
        type: ControlType.Enum,
        title: "Transform",
        options: ["none", "uppercase", "lowercase", "capitalize"],
        optionTitles: ["None", "Uppercase", "Lowercase", "Capitalize"],
        defaultValue: "uppercase",
    },

    tag: {
        type: ControlType.Enum,
        title: "Tag",
        options: ["p", "h1", "h2", "h3", "h4", "h5", "h6", "span"],
        optionTitles: ["P", "H1", "H2", "H3", "H4", "H5", "H6", "Span"],
        defaultValue: "p",
    },

    letterSpacing: {
        type: ControlType.Number,
        title: "Letter Spacing",
        defaultValue: 0,
        min: -0.2,
        max: 0.5,
        step: 0.005,
        unit: "em",
        displayStepper: true,
        description:
            "Extra tracking between characters (per-character margin). Font panel letter-spacing also applies.",
    },

    fillContainer: {
        type: ControlType.Boolean,
        title: "Fill Container",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        description:
            "Fill the parent frame for hover (parent needs Fill or fixed size — not fit-content). For most nav links, leave Off and use Padding instead.",
    },

    fillAlign: {
        type: ControlType.Enum,
        title: "Fill Align",
        options: ["start", "center", "end"],
        optionTitles: ["Start", "Center", "End"],
        defaultValue: "start",
        displaySegmentedControl: true,
        hidden: (p) => !p.fillContainer,
        description: "Horizontal position of the text row inside the filled area.",
    },
})
