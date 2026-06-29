const DATE_ONLY_ISO = /^\d{4}-\d{2}-\d{2}$/

export function formatDisplayDate(value: string | null | undefined, fallback = "—"): string {
    if (!value) return fallback
    const s = String(value).trim()
    if (DATE_ONLY_ISO.test(s)) {
        const [y, mo, d] = s.split("-").map((part) => parseInt(part, 10))
        return new Date(y, mo - 1, d).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        })
    }
    const parsed = new Date(s)
    if (Number.isNaN(parsed.getTime())) return fallback
    return parsed.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    })
}

export function normalizeCalendarDateIso(value: string | null | undefined): string | null {
    if (!value) return null
    const s = String(value).trim()
    if (!s) return null
    if (DATE_ONLY_ISO.test(s)) return s
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (m) return `${m[1]}-${m[2]}-${m[3]}`
    const parsed = new Date(s)
    if (Number.isNaN(parsed.getTime())) return null
    const y = parsed.getFullYear()
    const mo = String(parsed.getMonth() + 1).padStart(2, "0")
    const d = String(parsed.getDate()).padStart(2, "0")
    return `${y}-${mo}-${d}`
}
