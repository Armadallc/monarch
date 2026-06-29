/** Monarch project text styles → published Framer preset classes (sync when styles are added). */
export const MONARCH_TEXT_STYLE_PRESETS = [
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

export type MonarchTextStylePath = (typeof MONARCH_TEXT_STYLE_PRESETS)[number]["path"]

const presetByPath = Object.fromEntries(
    MONARCH_TEXT_STYLE_PRESETS.map((s) => [s.path, s.preset])
) as Record<MonarchTextStylePath, string>

export function monarchTextStylePresetClass(path: string | undefined): string {
    if (!path) return MONARCH_TEXT_STYLE_PRESETS[0].preset
    return presetByPath[path as MonarchTextStylePath] ?? MONARCH_TEXT_STYLE_PRESETS[0].preset
}

export const MONARCH_TEXT_STYLE_PATHS = MONARCH_TEXT_STYLE_PRESETS.map((s) => s.path)
export const MONARCH_TEXT_STYLE_LABELS = MONARCH_TEXT_STYLE_PRESETS.map((s) => s.label)
