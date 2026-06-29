// Sefe Scroll Revealer — per-character scroll color reveal (light → dark).
// Paste into Framer as a code component. See docs/SEFE_SCROLL_REVEALER.md.

import * as React from "react"
import { addPropertyControls, ControlType, RenderTarget, useIsStaticRenderer } from "framer"
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion"

type TypographyMode = "projectStyle" | "manual"
type Alignment = "left" | "center" | "right"
type BlurLeadMode = "unit" | "percent"
type BlurLeadUnit = "character" | "word" | "sentence"

/** Monarch Assets → Typography → published preset classes. */
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

function buildManualFontStyle(font: any): React.CSSProperties {
    const { letterSpacing: _drop, ...rest } = font || {}
    return {
        ...rest,
        fontSynthesis: "none",
    }
}

function formatLetterSpacing(em: number): string {
    if (!Number.isFinite(em)) return "0em"
    return `${em}em`
}

const ALIGN_TO_JUSTIFY: Record<Alignment, React.CSSProperties["justifyContent"]> = {
    left: "flex-start",
    center: "center",
    right: "flex-end",
}

function computeTextStats(lines: string[]) {
    let totalChars = 0
    let totalWords = 0
    for (const line of lines) {
        const words = line.trim() ? line.split(/\s+/).filter(Boolean) : []
        totalWords += words.length
        for (const word of words) totalChars += word.length
    }
    return {
        totalChars: Math.max(totalChars, 1),
        totalWords: Math.max(totalWords, 1),
        totalLines: Math.max(lines.length, 1),
    }
}

function computeBlurLeadChars(p: {
    blurLeadMode: BlurLeadMode
    blurLeadUnit: BlurLeadUnit
    blurLeadAmount: number
    blurLeadPercent: number | string
    totalChars: number
    totalWords: number
    totalLines: number
}): number {
    if (p.blurLeadMode === "percent") {
        const pct = Number(p.blurLeadPercent) || 25
        return Math.max(1, p.totalChars * (pct / 100))
    }

    const amount = Math.max(1, p.blurLeadAmount)
    if (p.blurLeadUnit === "character") return amount
    if (p.blurLeadUnit === "word") {
        return Math.max(1, amount * (p.totalChars / p.totalWords))
    }
    return Math.max(1, amount * (p.totalChars / p.totalLines))
}

interface SefeScrollRevealerProps {
    text: string

    revealFromColor: string
    revealToColor: string

    typographyMode: TypographyMode
    textStylePath: MonarchTextStylePath

    /** Manual typography — Framer Font control loads the correct weight file. */
    font: any

    letterSpacing: number

    alignment: Alignment
    transitionStartIndex: number

    offsetStart: number
    offsetEnd: number

    blur: boolean
    blurAmount: number
    blurLeadMode: BlurLeadMode
    blurLeadUnit: BlurLeadUnit
    blurLeadAmount: number
    blurLeadPercent: number | string

    style?: React.CSSProperties
}

function blurForRevealProgress(
    p: number,
    progressStart: number,
    progressEnd: number,
    blurAmount: number,
    blurLeadChars: number,
    totalChars: number
): number {
    if (blurAmount <= 0) return 0

    const clamped = Math.min(Math.max(p, 0), 1)
    if (clamped >= progressEnd) return 0

    const leadProgress = blurLeadChars / totalChars
    const zoneStart = progressStart - leadProgress

    if (clamped <= zoneStart) return blurAmount

    const span = progressEnd - zoneStart
    if (span <= 0.00001) return clamped < progressEnd ? blurAmount : 0

    const t = (clamped - zoneStart) / span
    return blurAmount * (1 - Math.min(1, Math.max(0, t)))
}

interface RevealCharacterProps {
    char: string
    charIndex: number
    progressStart: number
    progressEnd: number
    progress: MotionValue<number>
    revealFromColor: string
    revealToColor: string
    transitionStartIndex: number
    isCanvas: boolean
    blur: boolean
    blurAmount: number
    blurLeadChars: number
    totalChars: number
    letterSpacingCss: string
    isLastInWord: boolean
}

function RevealCharacter(props: RevealCharacterProps) {
    const {
        char,
        charIndex,
        progressStart,
        progressEnd,
        progress,
        revealFromColor,
        revealToColor,
        transitionStartIndex,
        isCanvas,
        blur,
        blurAmount,
        blurLeadChars,
        totalChars,
        letterSpacingCss,
        isLastInWord,
    } = props

    const charSpacing =
        !isLastInWord && letterSpacingCss !== "0em" ? { marginRight: letterSpacingCss } : undefined

    const colorMv = useTransform(progress, [progressStart, progressEnd], [revealFromColor, revealToColor])

    const blurPx = useTransform(progress, (p) =>
        blur
            ? blurForRevealProgress(p, progressStart, progressEnd, blurAmount, blurLeadChars, totalChars)
            : 0
    )
    const filterMv = useTransform(blurPx, (v) => `blur(${v}px)`)
    const isPreRevealed = charIndex < transitionStartIndex

    if (isPreRevealed || isCanvas) {
        return (
            <span style={{ display: "inline-block", color: revealToColor, ...charSpacing }}>{char}</span>
        )
    }

    return (
        <motion.span
            style={{
                display: "inline-block",
                color: colorMv,
                filter: blur ? filterMv : undefined,
                ...charSpacing,
            }}
        >
            {char}
        </motion.span>
    )
}

interface RevealWordProps {
    word: string
    wordStart: number
    wordEnd: number
    charIndexStart: number
    progress: MotionValue<number>
    revealFromColor: string
    revealToColor: string
    transitionStartIndex: number
    isCanvas: boolean
    blur: boolean
    blurAmount: number
    blurLeadChars: number
    totalChars: number
    letterSpacingCss: string
}

function RevealWord(props: RevealWordProps) {
    const {
        word,
        wordStart,
        wordEnd,
        charIndexStart,
        progress,
        revealFromColor,
        revealToColor,
        transitionStartIndex,
        isCanvas,
        blur,
        blurAmount,
        blurLeadChars,
        totalChars,
        letterSpacingCss,
    } = props

    const chars = word.split("")
    const span = Math.max(wordEnd - wordStart, 0.0001)
    const step = span / Math.max(chars.length, 1)

    return (
        <span style={{ display: "inline-block", whiteSpace: "pre" }}>
            {chars.map((char, idx) => {
                const charStart = wordStart + step * idx
                const charEnd = wordStart + step * (idx + 1)
                return (
                    <RevealCharacter
                        key={`${charIndexStart}-${idx}`}
                        char={char}
                        charIndex={charIndexStart + idx}
                        progressStart={charStart}
                        progressEnd={charEnd}
                        progress={progress}
                        revealFromColor={revealFromColor}
                        revealToColor={revealToColor}
                        transitionStartIndex={transitionStartIndex}
                        isCanvas={isCanvas}
                        blur={blur}
                        blurAmount={blurAmount}
                        blurLeadChars={blurLeadChars}
                        totalChars={totalChars}
                        letterSpacingCss={letterSpacingCss}
                        isLastInWord={idx === chars.length - 1}
                    />
                )
            })}
        </span>
    )
}

function splitLines(raw: string): string[] {
    const normalized = (raw ?? "").replace(/\r\n/g, "\n")
    const lines = normalized.split("\n")
    return lines.length ? lines : [""]
}

/**
 * Sefe Scroll Revealer
 *
 * @framerIntrinsicWidth 640
 * @framerIntrinsicHeight 120
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function SefeScrollRevealer(props: SefeScrollRevealerProps) {
    const {
        text,
        revealFromColor,
        revealToColor,
        typographyMode,
        textStylePath,
        font,
        letterSpacing,
        alignment,
        transitionStartIndex,
        offsetStart,
        offsetEnd,
        blur,
        blurAmount,
        blurLeadMode,
        blurLeadUnit,
        blurLeadAmount,
        blurLeadPercent,
        style,
    } = props

    const rootRef = React.useRef<HTMLParagraphElement>(null)
    const isStatic = useIsStaticRenderer()
    const isCanvas = RenderTarget.current() === RenderTarget.canvas || isStatic

    const usesProjectStyle = typographyMode === "projectStyle"

    const fromColor = React.useMemo(
        () => resolveColor(revealFromColor, "#ACABA9"),
        [revealFromColor]
    )
    const toColor = React.useMemo(() => resolveColor(revealToColor, "#20201F"), [revealToColor])

    const projectStyleClass = React.useMemo(
        () => monarchTextStylePresetClass(textStylePath),
        [textStylePath]
    )

    const manualTypography = React.useMemo(() => buildManualFontStyle(font), [font])

    const letterSpacingCss = React.useMemo(
        () => formatLetterSpacing(letterSpacing),
        [letterSpacing]
    )

    const lines = React.useMemo(() => splitLines(text), [text])

    const textStats = React.useMemo(() => computeTextStats(lines), [lines])

    const blurLeadChars = React.useMemo(
        () =>
            computeBlurLeadChars({
                blurLeadMode,
                blurLeadUnit,
                blurLeadAmount,
                blurLeadPercent,
                ...textStats,
            }),
        [blurLeadMode, blurLeadUnit, blurLeadAmount, blurLeadPercent, textStats]
    )

    const lineWordData = React.useMemo(() => {
        const totalWords = lines.reduce((n, line) => {
            const words = line.trim() ? line.split(/\s+/).filter(Boolean) : []
            return n + words.length
        }, 0)

        let globalWordIndex = 0
        let globalCharIndex = 0

        return lines.map((line, lineIndex) => {
            const words = line.trim() ? line.split(/\s+/).filter(Boolean) : []
            const entries = words.map((word) => {
                const wordStart = totalWords > 0 ? globalWordIndex / totalWords : 0
                const wordEnd = totalWords > 0 ? (globalWordIndex + 1) / totalWords : 1
                const charIndexStart = globalCharIndex
                globalCharIndex += word.length
                globalWordIndex += 1
                return { word, wordStart, wordEnd, charIndexStart, globalWordIndex: globalWordIndex - 1 }
            })
            return { lineIndex, entries, isEmpty: entries.length === 0 }
        })
    }, [lines])

    const { scrollYProgress } = useScroll({
        target: rootRef,
        offset: [`start ${offsetStart}`, `start ${offsetEnd}`],
    })

    const rootClassName = usesProjectStyle ? `framer-text ${projectStyleClass}` : undefined

    return (
        <p
            ref={rootRef}
            className={rootClassName}
            style={{
                ...(style || {}),
                margin: 0,
                padding: 0,
                width: style?.width === "100%" ? "100%" : undefined,
                minWidth: "5px",
                minHeight: "5px",
                display: "flex",
                flexDirection: "column",
                gap: "0.15em",
                ...(usesProjectStyle ? {} : manualTypography),
                letterSpacing: "normal",
            }}
        >
            {lineWordData.map(({ lineIndex, entries, isEmpty }) => (
                    <span
                        key={`line-${lineIndex}`}
                        className={usesProjectStyle ? "framer-text" : undefined}
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            justifyContent: ALIGN_TO_JUSTIFY[alignment],
                            width: "100%",
                        }}
                    >
                        {isEmpty ? (
                            <span style={{ display: "inline-block", minHeight: "0.5em" }}>&nbsp;</span>
                        ) : (
                            entries.map((entry, wordIdx) => (
                                <React.Fragment key={`w-${lineIndex}-${entry.globalWordIndex}`}>
                                    <RevealWord
                                        word={entry.word}
                                        wordStart={entry.wordStart}
                                        wordEnd={entry.wordEnd}
                                        charIndexStart={entry.charIndexStart}
                                        progress={scrollYProgress}
                                        revealFromColor={fromColor}
                                        revealToColor={toColor}
                                        transitionStartIndex={transitionStartIndex}
                                        isCanvas={isCanvas}
                                        blur={blur}
                                        blurAmount={blurAmount}
                                        blurLeadChars={blurLeadChars}
                                        totalChars={textStats.totalChars}
                                        letterSpacingCss={letterSpacingCss}
                                    />
                                    {wordIdx < entries.length - 1 ? (
                                        <span style={{ whiteSpace: "pre" }}> </span>
                                    ) : null}
                                </React.Fragment>
                            ))
                        )}
                    </span>
            ))}
        </p>
    )
}

addPropertyControls(SefeScrollRevealer, {
    text: {
        title: "Text",
        type: ControlType.String,
        defaultValue:
            "Every person needs a foundation, structure, and the chance to reach their potential.",
        displayTextArea: true,
        description: "Use line breaks for multiple lines.",
    },

    revealFromColor: {
        title: "Reveal From",
        type: ControlType.Color,
        defaultValue: "#ACABA9",
        description: "Initial lighter color before scroll reveals each character.",
    },
    revealToColor: {
        title: "Reveal To",
        type: ControlType.Color,
        defaultValue: "#20201F",
        description: "Final darker color after a character is revealed.",
    },

    blur: {
        type: ControlType.Boolean,
        title: "Blur",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Blur unrevealed text ahead of the scroll reveal front.",
    },
    blurAmount: {
        type: ControlType.Number,
        title: "Blur Intensity",
        defaultValue: 10,
        min: 0,
        max: 24,
        step: 0.5,
        unit: "px",
        hidden: (p) => !p.blur,
    },
    blurLeadMode: {
        type: ControlType.Enum,
        title: "Blur Lead",
        options: ["unit", "percent"],
        optionTitles: ["By unit", "By % ahead"],
        defaultValue: "unit",
        displaySegmentedControl: true,
        hidden: (p) => !p.blur,
        description: "How far ahead of the reveal front blur ramps up to full intensity.",
    },
    blurLeadUnit: {
        type: ControlType.Enum,
        title: "Lead Unit",
        options: ["character", "word", "sentence"],
        optionTitles: ["Character", "Word", "Sentence"],
        defaultValue: "word",
        hidden: (p) => !p.blur || p.blurLeadMode !== "unit",
    },
    blurLeadAmount: {
        type: ControlType.Number,
        title: "Lead Amount",
        defaultValue: 1,
        min: 1,
        max: 20,
        step: 1,
        hidden: (p) => !p.blur || p.blurLeadMode !== "unit",
        description: "e.g. 1 word ahead, 2 characters ahead, 1 sentence (line) ahead.",
    },
    blurLeadPercent: {
        type: ControlType.Enum,
        title: "Lead %",
        options: ["10", "25", "50", "100"],
        optionTitles: ["10%", "25%", "50%", "100%"],
        defaultValue: "25",
        hidden: (p) => !p.blur || p.blurLeadMode !== "percent",
        description: "Blur zone as a percentage of total characters ahead of the reveal front.",
    },

    typographyMode: {
        type: ControlType.Enum,
        title: "Typography",
        options: ["projectStyle", "manual"],
        optionTitles: ["Project Style", "Manual"],
        defaultValue: "projectStyle",
        displaySegmentedControl: true,
        description:
            "Project Style uses Assets → Typography. Manual configures font fields below.",
    },
    textStylePath: {
        type: ControlType.Enum,
        title: "Style",
        options: [...MONARCH_TEXT_STYLE_PATHS],
        optionTitles: [...MONARCH_TEXT_STYLE_LABELS],
        defaultValue: "/Body/Body ML",
        hidden: (p) => p.typographyMode !== "projectStyle",
    },

    font: {
        title: "Font",
        type: ControlType.Font,
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "44px",
            variant: "Medium",
            lineHeight: "1.15em",
            textAlign: "left",
        },
        hidden: (p) => p.typographyMode !== "manual",
        description:
            "Pick family and weight via the variant menu (Regular, Medium, SemiBold…). Loads the correct font file from the project.",
    },

    letterSpacing: {
        type: ControlType.Number,
        title: "Letter Spacing",
        defaultValue: -0.01,
        min: -0.2,
        max: 0.5,
        step: 0.005,
        unit: "em",
        displayStepper: true,
        description:
            "Tracking between characters. Works in Project Style and Manual (per-character spacing for scroll reveal).",
    },

    alignment: {
        type: ControlType.Enum,
        title: "Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "left",
    },

    transitionStartIndex: {
        title: "Pre-revealed Chars",
        type: ControlType.Number,
        defaultValue: 0,
        min: 0,
        max: 5000,
        step: 1,
        description:
            "Characters before this index start at Reveal To color (already revealed).",
    },

    offsetStart: {
        title: "Scroll Start",
        type: ControlType.Number,
        defaultValue: 0.85,
        min: 0,
        max: 1,
        step: 0.01,
        description: "When reveal begins (viewport intersection, 0–1).",
    },
    offsetEnd: {
        title: "Scroll End",
        type: ControlType.Number,
        defaultValue: 0.35,
        min: 0,
        max: 1,
        step: 0.01,
        description: "When reveal finishes (viewport intersection, 0–1).",
    },
})
