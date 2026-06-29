// Scroll Text — uses Monarch project text styles (Assets → Typography) via framer-styles-preset classes.
// Legacy useTextPreset/textPreset props still resolve for existing instances.

import * as React from "react"
import { addPropertyControls, ControlType, RenderTarget, useIsStaticRenderer } from "framer"
import {
    motion,
    useInView,
    useMotionValue,
    useScroll,
    useSpring,
    useTransform,
    type MotionValue,
} from "framer-motion"

type AnimationStyle = "fade" | "slideUp" | "slideInLeft" | "slideInRight"

type TextTransform = "inherit" | "capitalize" | "uppercase" | "lowercase"

type Alignment = "auto" | "left" | "center" | "right" | "justify"
type TextDecoration = "none" | "underline" | "line-through" | "overline"

type TextPreset = "heading1" | "heading2" | "heading3" | "heading4" | "paragraph" | "button"
type TypographyMode = "projectStyle" | "manual"

/** Monarch Assets → Typography styles → published Framer preset classes. */
const MONARCH_TEXT_STYLE_PRESETS = [
    { path: "/Body/Body ML", label: "Body ML (L)", preset: "framer-styles-preset-1eiqni7" },
    { path: "/Body/Body M", label: "Body M", preset: "framer-styles-preset-1npcijn" },
    { path: "/Headings/Heading 3", label: "Heading 3", preset: "framer-styles-preset-eqw9rx" },
    { path: "/Headings/Heading 4", label: "Heading 4", preset: "framer-styles-preset-ps8un5" },
    { path: "/Headings/Eyebrow", label: "Eyebrow", preset: "framer-styles-preset-2bo2e8" },
    {
        path: "/Headings/Subheading 6L",
        label: "Subheading 6L",
        preset: "framer-styles-preset-1if9fch",
    },
] as const

type MonarchTextStylePath = (typeof MONARCH_TEXT_STYLE_PRESETS)[number]["path"]

const MONARCH_TEXT_STYLE_PATHS = MONARCH_TEXT_STYLE_PRESETS.map((s) => s.path)
const MONARCH_TEXT_STYLE_LABELS = MONARCH_TEXT_STYLE_PRESETS.map((s) => s.label)

const presetByPath = Object.fromEntries(
    MONARCH_TEXT_STYLE_PRESETS.map((s) => [s.path, s.preset])
) as Record<MonarchTextStylePath, string>

function monarchTextStylePresetClass(path: string | undefined): string {
    if (!path) return MONARCH_TEXT_STYLE_PRESETS[0].preset
    return presetByPath[path as MonarchTextStylePath] ?? MONARCH_TEXT_STYLE_PRESETS[0].preset
}

function effectiveTypographyMode(p: {
    typographyMode?: TypographyMode
    useTextPreset?: boolean
}): TypographyMode | "legacyPreset" {
    if (p.typographyMode === "projectStyle" || p.typographyMode === "manual") {
        return p.typographyMode
    }
    if (p.useTextPreset === true) return "legacyPreset"
    if (p.useTextPreset === false) return "manual"
    return "projectStyle"
}

const legacyPresetMap: Record<TextPreset, React.CSSProperties> = {
    heading1: {
        fontSize: "40px",
        fontWeight: 700,
        letterSpacing: "-0.04em",
        lineHeight: "1em",
    },
    heading2: {
        fontSize: "32px",
        fontWeight: 600,
        letterSpacing: "-0.03em",
        lineHeight: "1em",
    },
    heading3: {
        fontSize: "22px",
        fontWeight: 600,
        letterSpacing: "-0.01em",
        lineHeight: "1.2em",
    },
    heading4: {
        fontSize: "15px",
        fontWeight: 500,
        letterSpacing: "-0.01em",
        lineHeight: "1em",
    },
    paragraph: {
        fontSize: "15px",
        fontWeight: 500,
        letterSpacing: "-0.01em",
        lineHeight: "1.3em",
    },
    button: {
        fontSize: "14px",
        fontWeight: 600,
        letterSpacing: "-0.01em",
        lineHeight: "1em",
    },
}

function buildManualFont(p: {
    manualFontFamily: string
    manualFontSize: number
    manualFontWeight: number
    manualFontStyle: "normal" | "italic"
    manualLetterSpacing: string
    manualLineHeight: string
}): React.CSSProperties {
    const s: React.CSSProperties = {}
    const ff = p.manualFontFamily.trim()
    if (ff) s.fontFamily = ff
    if (p.manualFontSize > 0) s.fontSize = p.manualFontSize
    if (p.manualFontWeight >= 100 && p.manualFontWeight <= 900) {
        s.fontWeight = p.manualFontWeight
    }
    if (p.manualFontStyle === "italic") s.fontStyle = "italic"
    const ls = p.manualLetterSpacing.trim()
    if (ls) s.letterSpacing = ls
    const lh = p.manualLineHeight.trim()
    if (lh) s.lineHeight = lh
    return s
}

function resolveTextColor(value: unknown): string {
    if (typeof value === "string" && value.trim()) return value
    if (value && typeof value === "object") {
        const c = value as Record<string, number>
        if (typeof c.r === "number" && typeof c.g === "number" && typeof c.b === "number") {
            const a = typeof c.a === "number" ? c.a : 1
            return `rgba(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)}, ${a})`
        }
    }
    return "#FFFFFF"
}

/** Override Framer preset text color vars so the property control wins over stylesheet presets. */
function framerTextColorStyle(color: string): React.CSSProperties {
    return {
        color,
        ["--framer-text-color" as string]: color,
    }
}


type InlineToken =
    | { type: "word"; content: string }
    | { type: "space" }
    | { type: "lineBreak" }

interface ScrollTextProps {
    text: string
    textColor: string

    typographyMode?: TypographyMode
    textStylePath?: MonarchTextStylePath
    /** @deprecated use typographyMode + textStylePath instead */
    useTextPreset?: boolean
    /** @deprecated use typographyMode + textStylePath instead */
    textPreset?: TextPreset
    /** @deprecated legacy custom font object */
    font?: any

    manualFontFamily: string
    manualFontSize: number
    manualFontWeight: number
    manualFontStyle: "normal" | "italic"
    manualLetterSpacing: string
    manualLineHeight: string

    alignment: Alignment
    textDecoration: TextDecoration

    textTransform: TextTransform
    paragraphSpacing: number

    textShadow: string
    strokeWidth: number
    strokeColor: string
    opacity: number

    responsiveText: boolean
    minFontSize: number
    maxFontSize: number
    minContainerWidth: number
    maxContainerWidth: number

    animationStyle: AnimationStyle
    smooth: boolean
    blur: boolean

    startOpacity: number
    endOpacity: number

    startOffset: number
    endOffset: number

    style?: React.CSSProperties
}

function clamp(n: number, min: number, max: number) {
    return Math.min(max, Math.max(min, n))
}

function splitParagraphs(raw: string) {
    const normalized = (raw ?? "")
        .replace(/\r\n/g, "\n")
        .replace(/<br\s*\/?>(?![^<]*<\/pre>)/gi, "\n")

    const parts = normalized.split(/\n\n+/g)
    return parts.length ? parts : [""]
}

function tokenizeInline(text: string): InlineToken[] {
    const parts = (text ?? "").split(/(\n)/g).filter(Boolean)
    const out: InlineToken[] = []

    for (const part of parts) {
        if (part === "\n") {
            out.push({ type: "lineBreak" })
            continue
        }

        const chunks = part.split(/(\s+)/).filter(Boolean)
        for (const c of chunks) {
            if (/^\s+$/.test(c)) out.push({ type: "space" })
            else out.push({ type: "word", content: c })
        }
    }

    return out.length ? out : [{ type: "word", content: "" }]
}

function useElementWidth(ref: React.RefObject<HTMLElement>) {
    const [width, setWidth] = React.useState(0)

    React.useEffect(() => {
        if (typeof window === "undefined") return
        const el = ref.current
        if (!el) return

        const update = () => {
            const next = el.getBoundingClientRect().width
            if (!Number.isFinite(next)) return
            React.startTransition(() => setWidth(next))
        }

        update()

        const RO = (window as any).ResizeObserver
        if (!RO) {
            const id = window.setInterval(update, 500)
            return () => window.clearInterval(id)
        }

        const ro = new RO(() => update())
        ro.observe(el)
        return () => ro.disconnect()
    }, [ref])

    return width
}

interface AnimatedInlineProps {
    i: number
    total: number
    progress: MotionValue<number>
    isCanvas: boolean

    animationStyle: AnimationStyle
    smooth: boolean
    blur: boolean
    startOpacity: number
    endOpacity: number

    children: React.ReactNode
}

function AnimatedInline(props: AnimatedInlineProps) {
    const { i, total, progress, isCanvas, animationStyle, smooth, blur, startOpacity, endOpacity, children } = props

    const a = i / total
    const b = (i + 1) / total

    const opacityMv = useTransform(progress, [a, b], [startOpacity, endOpacity])

    const xRange: [number, number] =
        animationStyle === "slideInLeft" ? [-24, 0] : animationStyle === "slideInRight" ? [24, 0] : [0, 0]
    const yRange: [number, number] = animationStyle === "slideUp" ? [24, 0] : [0, 0]

    const xMv = useTransform(progress, [a, b], xRange)
    const yMv = useTransform(progress, [a, b], yRange)
    const blurMv = useTransform(progress, [a, b], blur ? [10, 0] : [0, 0])

    const spring = React.useMemo(() => ({ stiffness: 140, damping: 24, mass: 0.9 }), [])

    const opacityS = useSpring(opacityMv, spring)
    const xS = useSpring(xMv, spring)
    const yS = useSpring(yMv, spring)
    const blurS = useSpring(blurMv, spring)

    const finalOpacity = isCanvas ? 1 : smooth ? opacityS : opacityMv
    const finalX = isCanvas ? 0 : smooth ? xS : xMv
    const finalY = isCanvas ? 0 : smooth ? yS : yMv

    const filterMv = useTransform(smooth ? blurS : blurMv, (v) => `blur(${v}px)`) as any

    const willChange = animationStyle === "fade" ? "opacity" : "opacity, transform"

    return (
        <motion.span
            style={{
                display: "inline-block",
                opacity: finalOpacity,
                x: finalX,
                y: finalY,
                filter: blur ? filterMv : undefined,
                willChange,
            }}
        >
            {children}
        </motion.span>
    )
}

/**
 * Scroll Text
 *
 * @framerIntrinsicWidth 480
 * @framerIntrinsicHeight 180
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ScrollText(props: ScrollTextProps) {
    const {
        text,
        textColor,
        typographyMode,
        textStylePath,
        useTextPreset,
        textPreset,
        font,
        manualFontFamily,
        manualFontSize,
        manualFontWeight,
        manualFontStyle,
        manualLetterSpacing,
        manualLineHeight,
        alignment,
        textDecoration,
        textTransform,
        paragraphSpacing,
        textShadow,
        strokeWidth,
        strokeColor,
        opacity,
        responsiveText,
        minFontSize,
        maxFontSize,
        minContainerWidth,
        maxContainerWidth,
        animationStyle,
        smooth,
        blur,
        startOpacity,
        endOpacity,
        startOffset,
        endOffset,
        style,
    } = props

    const rootRef = React.useRef<HTMLDivElement>(null)
    const isStatic = useIsStaticRenderer()
    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    const width = useElementWidth(rootRef)

    const mode = React.useMemo(
        () => effectiveTypographyMode({ typographyMode, useTextPreset }),
        [typographyMode, useTextPreset]
    )

    const usesProjectStyle = mode === "projectStyle"

    const projectStyleClass = React.useMemo(
        () => monarchTextStylePresetClass(textStylePath),
        [textStylePath]
    )

    const computedFont = React.useMemo(() => {
        if (usesProjectStyle) return {}

        let base: React.CSSProperties = {}
        if (mode === "legacyPreset") {
            base = legacyPresetMap[textPreset ?? "paragraph"] ?? legacyPresetMap.paragraph
        } else if (mode === "manual") {
            base = buildManualFont({
                manualFontFamily,
                manualFontSize,
                manualFontWeight,
                manualFontStyle,
                manualLetterSpacing,
                manualLineHeight,
            })
        } else {
            base = { ...(font || {}) }
        }

        if (!responsiveText) return base

        const minW = Math.max(1, minContainerWidth)
        const maxW = Math.max(minW + 1, maxContainerWidth)
        const minS = Math.max(1, minFontSize)
        const maxS = Math.max(minS + 1, maxFontSize)

        const w = width || minW
        const t = clamp((w - minW) / (maxW - minW), 0, 1)
        const size = minS + (maxS - minS) * t

        return { ...base, fontSize: size }
    }, [
        usesProjectStyle,
        mode,
        font,
        textPreset,
        manualFontFamily,
        manualFontSize,
        manualFontWeight,
        manualFontStyle,
        manualLetterSpacing,
        manualLineHeight,
        responsiveText,
        minContainerWidth,
        maxContainerWidth,
        minFontSize,
        maxFontSize,
        width,
    ])

    const fontTextAlign = ((computedFont?.textAlign as any) || "left") as "left" | "center" | "right" | "justify"
    const textAlign = (alignment === "auto" ? fontTextAlign : alignment) as "left" | "center" | "right" | "justify"
    const rootClassName = usesProjectStyle ? `framer-text ${projectStyleClass}` : undefined

    const resolvedTextColor = React.useMemo(() => resolveTextColor(textColor), [textColor])
    const textColorStyle = React.useMemo(
        () => (usesProjectStyle ? framerTextColorStyle(resolvedTextColor) : { color: resolvedTextColor }),
        [usesProjectStyle, resolvedTextColor]
    )

    const paragraphs = React.useMemo(() => splitParagraphs(text), [text])
    const paragraphTokens = React.useMemo(() => paragraphs.map((p) => tokenizeInline(p)), [paragraphs])

    const animatedCount = React.useMemo(() => {
        let count = 0
        for (const tokens of paragraphTokens) {
            for (const t of tokens) if (t.type === "word") count += 1
        }
        return Math.max(1, count)
    }, [paragraphTokens])

    const inView = useInView(rootRef, { margin: "-10% 0px -10% 0px" })

    const start = clamp(startOffset, 0, 1)
    const end = clamp(endOffset, 0, 1)

    const { scrollYProgress } = useScroll(
        isStatic
            ? undefined
            : {
                  target: rootRef,
                  offset: [`start ${1 - start}`, `end ${end}`],
              }
    )

    const staticProgress = useMotionValue(1)
    const progress = isStatic || !inView ? staticProgress : scrollYProgress

    let animIndex = -1

    return (
        <div
            ref={rootRef}
            className={rootClassName}
            style={{
                ...(style || {}),
                position: "relative",
                boxSizing: "border-box",

                // Only force 100% sizing when the instance is explicitly set to stretch.
                // This prevents the component from collapsing to 1px in auto-layout contexts.
                width: style?.width === "100%" ? "100%" : undefined,
                height: style?.height === "100%" ? "100%" : undefined,

                // Ensure a minimum visible/selectable box on the canvas.
                minWidth: "5px",
                minHeight: "5px",

                // Keep intrinsic sizing based on content while respecting min size.
                display: style?.width === "100%" || style?.height === "100%" ? "block" : "inline-block",

                // Text behavior
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                overflowWrap: "break-word",

                ...(usesProjectStyle ? {} : computedFont),
                ...textColorStyle,
                opacity: clamp(opacity, 0, 1),
                textAlign,
                textTransform,
                textDecoration,
                textShadow: textShadow === "none" ? "none" : textShadow,
                WebkitTextStrokeWidth: strokeWidth > 0 ? `${strokeWidth}px` : undefined,
                WebkitTextStrokeColor: strokeWidth > 0 ? strokeColor : undefined,
            }}
        >
            {paragraphTokens.map((tokens, pIndex) => {
                const mb = pIndex === paragraphTokens.length - 1 ? 0 : clamp(paragraphSpacing, 0, 10)

                return (
                    <p
                        key={`p-${pIndex}`}
                        className={usesProjectStyle ? "framer-text" : undefined}
                        style={{
                            margin: 0,
                            padding: 0,
                            marginBottom: `${mb}em`,
                            textAlign,
                            textTransform,
                            textDecoration,
                            ...(usesProjectStyle ? textColorStyle : { color: resolvedTextColor }),
                        }}
                    >
                        {tokens.map((t, tIndex) => {
                            if (t.type === "lineBreak") return <br key={`br-${pIndex}-${tIndex}`} />
                            if (t.type === "space") return <span key={`sp-${pIndex}-${tIndex}`}> </span>

                            animIndex += 1
                            const i = animIndex

                            return (
                                <AnimatedInline
                                    key={`w-${pIndex}-${tIndex}`}
                                    i={i}
                                    total={animatedCount}
                                    progress={progress}
                                    isCanvas={isCanvas}
                                    animationStyle={animationStyle}
                                    smooth={smooth}
                                    blur={blur}
                                    startOpacity={startOpacity}
                                    endOpacity={endOpacity}
                                >
                                    {t.content}
                                </AnimatedInline>
                            )
                        })}
                    </p>
                )
            })}
        </div>
    )
}

addPropertyControls(ScrollText, {
    text: {
        title: "Text",
        type: ControlType.String,
        defaultValue:
            "Successful restoration begins with a foundation people can trust.\n\nWe create that foundation by treating every resident as an individual.",
        displayTextArea: true,
    },
    textColor: {
        title: "Text Color",
        type: ControlType.Color,
        defaultValue: "#FFFFFF",
    },
    typographyMode: {
        type: ControlType.Enum,
        title: "Typography",
        options: ["projectStyle", "manual"],
        optionTitles: ["Project Style", "Manual"],
        defaultValue: "projectStyle",
        displaySegmentedControl: true,
        description:
            "Project Style uses Assets → Typography styles and updates when those styles change.",
    },
    textStylePath: {
        type: ControlType.Enum,
        title: "Style",
        options: [...MONARCH_TEXT_STYLE_PATHS],
        optionTitles: [...MONARCH_TEXT_STYLE_LABELS],
        defaultValue: "/Body/Body ML",
        hidden: (p) => effectiveTypographyMode(p) !== "projectStyle",
    },
    manualFontFamily: {
        type: ControlType.String,
        title: "Font Family",
        defaultValue: "",
        placeholder: "e.g. Inter, sans-serif",
        hidden: (p) => effectiveTypographyMode(p) !== "manual",
    },
    manualFontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 18,
        min: 1,
        max: 300,
        step: 1,
        unit: "px",
        hidden: (p) => effectiveTypographyMode(p) !== "manual",
    },
    manualFontWeight: {
        type: ControlType.Number,
        title: "Font Weight",
        defaultValue: 500,
        min: 100,
        max: 900,
        step: 100,
        hidden: (p) => effectiveTypographyMode(p) !== "manual",
    },
    manualFontStyle: {
        type: ControlType.Enum,
        title: "Font Style",
        options: ["normal", "italic"],
        optionTitles: ["Normal", "Italic"],
        defaultValue: "normal",
        hidden: (p) => effectiveTypographyMode(p) !== "manual",
    },
    manualLetterSpacing: {
        type: ControlType.String,
        title: "Letter Spacing",
        defaultValue: "",
        placeholder: "e.g. -0.01em",
        hidden: (p) => effectiveTypographyMode(p) !== "manual",
    },
    manualLineHeight: {
        type: ControlType.String,
        title: "Line Height",
        defaultValue: "",
        placeholder: "e.g. 1.3em",
        hidden: (p) => effectiveTypographyMode(p) !== "manual",
    },

    alignment: {
        type: ControlType.Enum,
        title: "Align",
        options: ["auto", "left", "center", "right", "justify"],
        optionTitles: ["Auto", "L", "C", "R", "J"],
        defaultValue: "auto",
    },

    textDecoration: {
        type: ControlType.Enum,
        title: "Decoration",
        options: ["none", "underline", "line-through", "overline"],
        optionTitles: ["None", "Underline", "Line Through", "Overline"],
        defaultValue: "none",
    },

    textTransform: {
        type: ControlType.Enum,
        title: "Case",
        options: ["inherit", "capitalize", "uppercase", "lowercase"],
        optionTitles: ["Inh", "Cap", "UP", "low"],
        defaultValue: "inherit",
        displaySegmentedControl: true,
    },

    paragraphSpacing: {
        type: ControlType.Number,
        title: "Paragraph Spacing",
        defaultValue: 0.8,
        min: 0,
        max: 5,
        step: 0.05,
        unit: "em",
    },

    textShadow: {
        type: ControlType.String,
        title: "Text Shadow",
        defaultValue: "none",
        placeholder: "e.g. 0px 2px 12px rgba(0,0,0,0.15)",
    },
    strokeWidth: {
        type: ControlType.Number,
        title: "Stroke Width",
        defaultValue: 0,
        min: 0,
        max: 12,
        step: 0.5,
        unit: "px",
    },
    strokeColor: {
        type: ControlType.Color,
        title: "Stroke Color",
        defaultValue: "#000000",
        hidden: (p) => (p.strokeWidth ?? 0) <= 0,
    },
    opacity: {
        type: ControlType.Number,
        title: "Opacity",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.01,
    },

    responsiveText: {
        type: ControlType.Boolean,
        title: "Responsive Text",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    minFontSize: {
        type: ControlType.Number,
        title: "Min Size",
        defaultValue: 18,
        min: 1,
        max: 300,
        step: 1,
        hidden: (p) => !p.responsiveText,
    },
    maxFontSize: {
        type: ControlType.Number,
        title: "Max Size",
        defaultValue: 48,
        min: 1,
        max: 400,
        step: 1,
        hidden: (p) => !p.responsiveText,
    },
    minContainerWidth: {
        type: ControlType.Number,
        title: "Min Width",
        defaultValue: 320,
        min: 1,
        max: 2000,
        step: 1,
        hidden: (p) => !p.responsiveText,
    },
    maxContainerWidth: {
        type: ControlType.Number,
        title: "Max Width",
        defaultValue: 1200,
        min: 1,
        max: 4000,
        step: 1,
        hidden: (p) => !p.responsiveText,
    },

    animationStyle: {
        type: ControlType.Enum,
        title: "Animation",
        options: ["fade", "slideUp", "slideInLeft", "slideInRight"],
        optionTitles: ["Fade", "Slide Up", "Slide In Left", "Slide In Right"],
        defaultValue: "fade",
    },
    smooth: {
        type: ControlType.Boolean,
        title: "Smooth",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    blur: {
        type: ControlType.Boolean,
        title: "Blur",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },

    startOffset: {
        title: "Start Offset",
        type: ControlType.Number,
        defaultValue: 0.5,
        min: 0,
        max: 1,
        step: 0.01,
    },
    endOffset: {
        title: "End Offset",
        type: ControlType.Number,
        defaultValue: 0.5,
        min: 0,
        max: 1,
        step: 0.01,
    },

    startOpacity: {
        title: "Start Opacity",
        type: ControlType.Number,
        defaultValue: 0,
        min: 0,
        max: 1,
        step: 0.01,
    },
    endOpacity: {
        title: "End Opacity",
        type: ControlType.Number,
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.01,
    },
})
