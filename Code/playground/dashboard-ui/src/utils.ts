import { formatDisplayDate } from "@design"
import type { MockReferral } from "./types"

export function clientInitials(r: Pick<MockReferral, "client_first_name" | "client_last_name">): string {
    const f = (r.client_first_name || "").trim().charAt(0)
    const l = (r.client_last_name || "").trim().charAt(0)
    return (f + l).toUpperCase() || "?"
}

export function clientDisplayId(r: MockReferral): string {
    return r.admin_ref_id || r.referral_code
}

export function expeditedLabel(
    urgentPlacement: boolean,
    urgencyLevel?: string | null
): "EXPEDITED" | "TIME-BOUND" | null {
    if (!urgentPlacement) return null
    const level = (urgencyLevel || "").trim().toLowerCase()
    if (level === "conditional_timeline") return "TIME-BOUND"
    return "EXPEDITED"
}

/** Kanban / card header — Step 12 expedited placement icon mode. */
export type ExpeditedPlacementDisplay = "none" | "lightning" | "lightning_circled"

export function expeditedPlacementDisplay(
    urgentPlacement: boolean,
    urgencyLevel?: string | null
): ExpeditedPlacementDisplay {
    if (!urgentPlacement) return "none"
    if ((urgencyLevel || "").trim().toLowerCase() === "conditional_timeline") return "lightning_circled"
    return "lightning"
}

export function formatTargetDate(iso: string | null | undefined): string | null {
    if (!iso) return null
    const d = formatDisplayDate(iso)
    return d === "—" ? null : d
}

/** mm/dd for time-bound badges (no year). */
export function formatTargetDateMmDd(iso: string | null | undefined): string | null {
    if (!iso) return null
    const s = String(iso).trim()
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (m) return `${m[2]}/${m[3]}`
    const d = formatDisplayDate(iso)
    if (d === "—") return null
    const parts = d.replace(",", "").split(" ")
    if (parts.length >= 2) {
        const monthMap: Record<string, string> = {
            Jan: "01",
            Feb: "02",
            Mar: "03",
            Apr: "04",
            May: "05",
            Jun: "06",
            Jul: "07",
            Aug: "08",
            Sep: "09",
            Oct: "10",
            Nov: "11",
            Dec: "12",
        }
        const mm = monthMap[parts[0]]
        const dd = parts[1]?.padStart(2, "0")
        if (mm && dd) return `${mm}/${dd}`
    }
    return null
}
