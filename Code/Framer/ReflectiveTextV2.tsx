/**
 * ReflectiveTextV2 — Per-word reflection (duplicate layer)
 *
 * Skew / shift apply only to the mirrored copy. Main text is never transformed.
 *
 * Gap: space between the main line box and the reflection clip. Can go negative
 * to pull the mirror up (tighten). Extra line-box air below glyphs is reduced
 * with “Tight line box” and optional “Reflect pull”.
 */
import * as React from "react"
import { addPropertyControls, ControlType } from "framer"

const DESCENDER_RE = /[gjpqy]/i

function parseFontSizePx(font: React.CSSProperties | undefined): number {
    const raw = font?.fontSize
    if (typeof raw === "number" && Number.isFinite(raw)) return raw
    if (typeof raw === "string") {
        const n = parseFloat(raw.replace(/px\s*$/i, ""))
        return Number.isFinite(n) ? n : 48
    }
    return 48
}

const DEFAULTS = {
    text: "funding support",
    font: {
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: 48,
        fontWeight: 600,
        letterSpacing: "-0.02em",
        lineHeight: "1.1em",
    } as React.CSSProperties,
    color: "#2B2828",
    textAlign: "center" as const,
    /** Margin from main line box bottom → reflection clip (px). Negative tightens. */
    gapPx: 0,
    reflectClipPx: 96,
    descenderExtraClipPx: 12,
    autoDescenderDetect: true,
    reflectionOpacity: 0.45,
    fadeStrongAtPercent: 0,
    fadeOutAtPercent: 70,
    lightSkewDeg: 0,
    reflectionOffsetXPx: 0,
    useGradientMask: true,
    /** Shrink line-height / padding on main text to reduce built-in gap under glyphs. */
    tightLineBox: true,
    /**
     * 0 = auto vertical align (~−22% font size). Non-zero replaces that baseline nudge (px).
     */
    reflectPullUpPx: 0,
    reserveBelowPx: 120,
}

type Token = { kind: "space"; text: string } | { kind: "word"; text: string }

function tokenizeLine(line: string): Token[] {
    const raw = line.split(/(\s+)/)
    const out: Token[] = []
    for (const chunk of raw) {
        if (!chunk) continue
        if (/^\s+$/.test(chunk)) out.push({ kind: "space", text: chunk })
        else out.push({ kind: "word", text: chunk })
    }
    return out
}

function splitLines(text: string): string[] {
    return text.split(/\r\n|\n|\r/)
}

export type ReflectiveTextV2Props = {
    text?: string
    font?: React.CSSProperties
    color?: string
    textAlign?: "start" | "center" | "end"
    gapPx?: number
    reflectClipPx?: number
    descenderExtraClipPx?: number
    autoDescenderDetect?: boolean
    reflectionOpacity?: number
    fadeStrongAtPercent?: number
    fadeOutAtPercent?: number
    lightSkewDeg?: number
    reflectionOffsetXPx?: number
    useGradientMask?: boolean
    tightLineBox?: boolean
    reflectPullUpPx?: number
    reserveBelowPx?: number
}

function ReflectedWord(props: {
    word: string
    textStyle: React.CSSProperties
    mainTextStyle: React.CSSProperties
    color: string
    gapPx: number
    clipH: number
    maskGradient: string | null
    useGradientMask: boolean
    reflectionOpacity: number
    lightSkewDeg: number
    reflectionOffsetXPx: number
    reflectPullPx: number
}) {
    const {
        word,
        textStyle,
        mainTextStyle,
        color,
        gapPx,
        clipH,
        maskGradient,
        useGradientMask,
        reflectionOpacity,
        lightSkewDeg,
        reflectionOffsetXPx,
        reflectPullPx,
    } = props

    return (
        <span
            style={{
                display: "inline-block",
                verticalAlign: "top",
                margin: 0,
                padding: 0,
                position: "relative",
                overflow: "visible",
            }}
        >
            <span
                style={{
                    display: "block",
                    textAlign: "center",
                    ...mainTextStyle,
                    color,
                }}
            >
                {word}
            </span>
            <div
                style={{
                    marginTop: gapPx,
                    height: clipH,
                    overflow: "hidden",
                    width: "100%",
                    boxSizing: "border-box",
                    position: "relative",
                    pointerEvents: "none",
                    ...(useGradientMask && maskGradient
                        ? {
                              WebkitMaskImage: maskGradient,
                              maskImage: maskGradient,
                              WebkitMaskSize: "100% 100%",
                              maskSize: "100% 100%",
                              WebkitMaskRepeat: "no-repeat",
                              maskRepeat: "no-repeat",
                          }
                        : {}),
                }}
            >
                <div
                    aria-hidden
                    style={{
                        display: "block",
                        textAlign: "center",
                        ...textStyle,
                        color,
                        opacity: useGradientMask ? 1 : reflectionOpacity,
                        transform: `translateX(${reflectionOffsetXPx}px) skewX(${lightSkewDeg}deg) scaleY(-1) translateY(${reflectPullPx}px)`,
                        transformOrigin: "center top",
                    }}
                >
                    {word}
                </div>
            </div>
        </span>
    )
}

export default function ReflectiveTextV2(props: ReflectiveTextV2Props) {
    const {
        text = DEFAULTS.text,
        font = DEFAULTS.font,
        color = DEFAULTS.color,
        textAlign = DEFAULTS.textAlign,
        gapPx = DEFAULTS.gapPx,
        reflectClipPx = DEFAULTS.reflectClipPx,
        descenderExtraClipPx = DEFAULTS.descenderExtraClipPx,
        autoDescenderDetect = DEFAULTS.autoDescenderDetect,
        reflectionOpacity = DEFAULTS.reflectionOpacity,
        fadeStrongAtPercent = DEFAULTS.fadeStrongAtPercent,
        fadeOutAtPercent = DEFAULTS.fadeOutAtPercent,
        lightSkewDeg = DEFAULTS.lightSkewDeg,
        reflectionOffsetXPx = DEFAULTS.reflectionOffsetXPx,
        useGradientMask = DEFAULTS.useGradientMask,
        tightLineBox = DEFAULTS.tightLineBox,
        reflectPullUpPx = DEFAULTS.reflectPullUpPx,
        reserveBelowPx = DEFAULTS.reserveBelowPx,
    } = props

    const lines = splitLines(text.length ? text : " ")
    const fs = parseFontSizePx(font)
    /** 0 in controls = use auto; non-zero replaces. */
    const autoPullPx = -Math.round(fs * 0.22)
    const reflectPullPx = reflectPullUpPx === 0 ? autoPullPx : reflectPullUpPx

    const maskGradient = React.useMemo(() => {
        const start = Math.max(0, Math.min(100, fadeStrongAtPercent))
        const end = Math.max(0, Math.min(100, fadeOutAtPercent))
        const t0 = Math.min(start, end)
        const t1 = Math.max(start, end)
        const peak = Math.max(0, Math.min(1, reflectionOpacity))
        // `to top`: 0% = bottom of reflection strip, 100% = top (adjacent to main text).
        // Strongest mask near the text, fading toward the bottom — matches expected reflection.
        if (t0 >= t1) {
            return `linear-gradient(to top, rgba(255,255,255,0) 0%, rgba(255,255,255,${peak}) 100%)`
        }
        const pFadeEnd = 100 - t1
        const pFadeStart = 100 - t0
        return `linear-gradient(to top, rgba(255,255,255,0) ${pFadeEnd}%, rgba(255,255,255,${peak}) ${pFadeStart}%, rgba(255,255,255,${peak}) 100%)`
    }, [fadeStrongAtPercent, fadeOutAtPercent, reflectionOpacity])

    const justifyContent =
        textAlign === "center" ? "center" : textAlign === "end" ? "flex-end" : "flex-start"

    const textStyle: React.CSSProperties = {
        ...font,
        margin: 0,
        padding: 0,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
    }

    const mainTextStyle: React.CSSProperties = tightLineBox
        ? {
              ...textStyle,
              lineHeight: 1.05,
              paddingBottom: 0,
              marginBottom: 0,
          }
        : textStyle

    const paddingBottom = Math.max(0, reserveBelowPx)

    return (
        <div
            style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: textAlign === "center" ? "center" : textAlign === "end" ? "flex-end" : "flex-start",
                boxSizing: "border-box",
                overflow: "visible",
                paddingBottom,
            }}
        >
            {lines.map((line, lineIndex) => {
                const tokens = tokenizeLine(line)
                return (
                    <div
                        key={lineIndex}
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            justifyContent,
                            alignItems: "flex-start",
                            width: "100%",
                            margin: 0,
                            padding: 0,
                            overflow: "visible",
                        }}
                    >
                        {tokens.map((tok, i) => {
                            if (tok.kind === "space") {
                                return (
                                    <span
                                        key={`s-${lineIndex}-${i}`}
                                        style={{
                                            ...mainTextStyle,
                                            whiteSpace: "pre",
                                            display: "inline",
                                        }}
                                    >
                                        {tok.text}
                                    </span>
                                )
                            }

                            const hasDesc = autoDescenderDetect && DESCENDER_RE.test(tok.text)
                            const clipH = reflectClipPx + (hasDesc ? descenderExtraClipPx : 0)

                            return (
                                <ReflectedWord
                                    key={`w-${lineIndex}-${i}`}
                                    word={tok.text}
                                    textStyle={textStyle}
                                    mainTextStyle={mainTextStyle}
                                    color={color}
                                    gapPx={gapPx}
                                    clipH={clipH}
                                    maskGradient={maskGradient}
                                    useGradientMask={useGradientMask}
                                    reflectionOpacity={reflectionOpacity}
                                    lightSkewDeg={lightSkewDeg}
                                    reflectionOffsetXPx={reflectionOffsetXPx}
                                    reflectPullPx={reflectPullPx}
                                />
                            )
                        })}
                    </div>
                )
            })}
        </div>
    )
}

addPropertyControls(ReflectiveTextV2, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: DEFAULTS.text,
        displayTextArea: true,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: DEFAULTS.font as Record<string, unknown>,
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: DEFAULTS.color,
    },
    textAlign: {
        type: ControlType.Enum,
        title: "Align",
        options: ["start", "center", "end"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: DEFAULTS.textAlign,
    },
    tightLineBox: {
        type: ControlType.Boolean,
        title: "Tight line box",
        defaultValue: DEFAULTS.tightLineBox,
        description: "Less line-height on main text to shrink gap above reflection.",
    },
    gapPx: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: DEFAULTS.gapPx,
        min: -48,
        max: 48,
        step: 1,
        displayStepper: true,
        description: "Space before reflection clip. Negative pulls mirror closer to text.",
    },
    reflectPullUpPx: {
        type: ControlType.Number,
        title: "Reflect pull",
        defaultValue: 0,
        min: -120,
        max: 80,
        step: 1,
        displayStepper: true,
        description:
            "Reflection only (px), after flip. 0 = auto (~−22% font size). More negative = tighter to letters.",
    },
    reflectClipPx: {
        type: ControlType.Number,
        title: "Reflect clip height",
        defaultValue: DEFAULTS.reflectClipPx,
        min: 32,
        max: 280,
        step: 1,
        displayStepper: true,
        description: "Height of the faded reflection strip.",
    },
    descenderExtraClipPx: {
        type: ControlType.Number,
        title: "Descender +clip",
        defaultValue: DEFAULTS.descenderExtraClipPx,
        min: 0,
        max: 80,
        step: 1,
        displayStepper: true,
        description: "Extra clip height for words with g, j, p, q, y.",
    },
    autoDescenderDetect: {
        type: ControlType.Boolean,
        title: "Auto descenders",
        defaultValue: DEFAULTS.autoDescenderDetect,
    },
    reserveBelowPx: {
        type: ControlType.Number,
        title: "Reserve below",
        defaultValue: DEFAULTS.reserveBelowPx,
        min: 0,
        max: 400,
        step: 4,
        displayStepper: true,
        description: "Padding under the block so the reflection isn’t clipped by the frame.",
    },
    useGradientMask: {
        type: ControlType.Boolean,
        title: "Gradient fade",
        defaultValue: DEFAULTS.useGradientMask,
        description: "Off = uniform opacity (Reflect strength).",
    },
    reflectionOpacity: {
        type: ControlType.Number,
        title: "Reflect strength",
        defaultValue: DEFAULTS.reflectionOpacity,
        min: 0,
        max: 1,
        step: 0.02,
        displayStepper: true,
    },
    fadeStrongAtPercent: {
        type: ControlType.Number,
        title: "Fade from %",
        defaultValue: DEFAULTS.fadeStrongAtPercent,
        min: 0,
        max: 100,
        step: 1,
        displayStepper: true,
    },
    fadeOutAtPercent: {
        type: ControlType.Number,
        title: "Fade out by %",
        defaultValue: DEFAULTS.fadeOutAtPercent,
        min: 0,
        max: 100,
        step: 1,
        displayStepper: true,
    },
    lightSkewDeg: {
        type: ControlType.Number,
        title: "Light skew °",
        defaultValue: DEFAULTS.lightSkewDeg,
        min: -24,
        max: 24,
        step: 0.5,
        displayStepper: true,
        description: "Reflection only (main text stays put).",
    },
    reflectionOffsetXPx: {
        type: ControlType.Number,
        title: "Shift X",
        defaultValue: DEFAULTS.reflectionOffsetXPx,
        min: -80,
        max: 80,
        step: 1,
        displayStepper: true,
        description: "Reflection only (main text stays put).",
    },
})
