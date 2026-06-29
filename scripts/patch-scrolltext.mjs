import fs from "node:fs"
import path from "node:path"

const srcPath = process.argv[2]
const destPath =
    process.argv[3] ||
    path.join("Code", "Framer", "Workshop", "ScrollText.tsx")

let out = fs.readFileSync(srcPath, "utf8")

out = out.replace(
    /^\/\/ User requirements:[^\n]*\n/m,
    "// Scroll Text — link Monarch project text styles (Heading 3, Body M, etc.) or configure typography manually.\n// Legacy useTextPreset/textPreset props still resolve for existing instances.\n"
)

const insertAfter =
    'type TextPreset = "heading1" | "heading2" | "heading3" | "heading4" | "paragraph" | "button"\n'

const typeBlock = `type TypographyMode = "projectStyle" | "manual"

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

`

if (!out.includes(insertAfter)) {
    console.error("TextPreset anchor not found")
    process.exit(1)
}
out = out.replace(insertAfter, insertAfter + typeBlock)

out = out.replace(
    `interface ScrollTextProps {
    text: string
    textColor: string
    font: any
    badgeFont: any

    useTextPreset: boolean
    textPreset: TextPreset`,
    `interface ScrollTextProps {
    text: string
    textColor: string
    font: any
    badgeFont: any

    typographyMode?: TypographyMode
    /** @deprecated use typographyMode + font instead */
    useTextPreset?: boolean
    /** @deprecated use typographyMode + font instead */
    textPreset?: TextPreset

    manualFontFamily: string
    manualFontSize: number
    manualFontWeight: number
    manualFontStyle: "normal" | "italic"
    manualLetterSpacing: string
    manualLineHeight: string`
)

out = out.replace(
    `        font,
        badgeFont,
        useTextPreset,
        textPreset,
        alignment,`,
    `        font,
        badgeFont,
        typographyMode,
        useTextPreset,
        textPreset,
        manualFontFamily,
        manualFontSize,
        manualFontWeight,
        manualFontStyle,
        manualLetterSpacing,
        manualLineHeight,
        alignment,`
)

const oldComputedStart = "    const computedFont = React.useMemo(() => {"
const oldComputedEnd =
    "    }, [font, useTextPreset, textPreset, responsiveText, minContainerWidth, maxContainerWidth, minFontSize, maxFontSize, width])"

const startIdx = out.indexOf(oldComputedStart)
const endIdx = out.indexOf(oldComputedEnd)
if (startIdx === -1 || endIdx === -1) {
    console.error("computedFont block not found", startIdx, endIdx)
    process.exit(1)
}

const newComputed = `    const mode = React.useMemo(
        () => effectiveTypographyMode({ typographyMode, useTextPreset }),
        [typographyMode, useTextPreset]
    )

    const computedFont = React.useMemo(() => {
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
    ])`

out = out.slice(0, startIdx) + newComputed + out.slice(endIdx + oldComputedEnd.length)

const oldControls = `    font: {
        title: "Text",
        type: ControlType.Font,
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "36px",
            variant: "Regular",
            lineHeight: "1.1em",
            letterSpacing: "-0.01em",
            textAlign: "left",
        },
        hidden: (p) => !!p.useTextPreset,
    },

    useTextPreset: {
        type: ControlType.Boolean,
        title: "Text Style",
        defaultValue: true,
        enabledTitle: "Preset",
        disabledTitle: "Custom",
    },
    textPreset: {
        type: ControlType.Enum,
        title: "Preset",
        options: ["heading1", "heading2", "heading3", "heading4", "paragraph", "button"],
        optionTitles: ["Heading 1", "Heading 2", "Heading 3", "Heading 4", "Body", "Button"],
        defaultValue: "paragraph",
        hidden: (p) => !p.useTextPreset,
    },`

const newControls = `    typographyMode: {
        type: ControlType.Enum,
        title: "Typography",
        options: ["projectStyle", "manual"],
        optionTitles: ["Project Style", "Manual"],
        defaultValue: "projectStyle",
        displaySegmentedControl: true,
    },
    font: {
        title: "Text Style",
        description:
            "Open the style menu (⋯) to link project text styles: Heading 3, Body M, NavLink, etc.",
        type: ControlType.Font,
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "36px",
            variant: "Regular",
            lineHeight: "1.1em",
            letterSpacing: "-0.01em",
            textAlign: "left",
        },
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
    },`

if (!out.includes(oldControls)) {
    console.error("property controls block not found")
    process.exit(1)
}
out = out.replace(oldControls, newControls)

fs.mkdirSync(path.dirname(destPath), { recursive: true })
fs.writeFileSync(destPath, out)
console.log("Wrote", destPath, "bytes:", out.length)
