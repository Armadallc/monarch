import type { CSSProperties, ReactNode } from "react"
import { COLORS, FONT, RADIUS } from "@design"
import { ReferralViewToggle } from "./ReferralViewToggle"
import { KANBAN_COLUMNS } from "../types"
import {
    DEFAULT_PORTAL_REFERRAL_FILTERS,
    hasActivePortalReferralFilters,
    type PortalReferralFilters,
    type ReferralViewMode,
} from "../referralFilters"

type FilterOptions = {
    programs: string[]
}

type Props = {
    filters: PortalReferralFilters
    viewMode: ReferralViewMode
    options: FilterOptions
    resultCount: number
    totalCount: number
    onFiltersChange: (filters: PortalReferralFilters) => void
    onViewModeChange: (mode: ReferralViewMode) => void
    onClear: () => void
    trailing?: ReactNode
}

const selectStyle: CSSProperties = {
    padding: "8px 32px 8px 12px",
    fontSize: 13,
    fontFamily: FONT,
    border: `1px solid ${COLORS.ashSubtle}`,
    borderRadius: RADIUS.input,
    background: COLORS.inputBackground,
    color: COLORS.ash,
    cursor: "pointer",
    minWidth: 0,
    appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%232B2828' d='M3 5l3 3 3-3'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 10px center",
}

const inputStyle: CSSProperties = {
    ...selectStyle,
    backgroundImage: "none",
    paddingRight: 12,
    flex: "1 1 200px",
    minWidth: 180,
    maxWidth: 320,
}

export function PortalFiltersBar({
    filters,
    viewMode,
    options,
    resultCount,
    totalCount,
    onFiltersChange,
    onViewModeChange,
    onClear,
    trailing,
}: Props) {
    const filtersActive = hasActivePortalReferralFilters(filters)

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginBottom: 16,
                flexShrink: 0,
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <input
                    type="search"
                    placeholder="Search name, REF ID, program, status…"
                    value={filters.search}
                    onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
                    aria-label="Search referrals"
                    style={inputStyle}
                />

                <select
                    aria-label="Filter by urgency"
                    value={filters.urgent}
                    onChange={(e) =>
                        onFiltersChange({
                            ...filters,
                            urgent: e.target.value as PortalReferralFilters["urgent"],
                        })
                    }
                    style={{ ...selectStyle, flex: "0 1 140px", minWidth: 120 }}
                >
                    <option value="all">All urgency</option>
                    <option value="true">Urgent</option>
                    <option value="false">Not urgent</option>
                </select>

                <select
                    aria-label="Filter by status"
                    value={filters.status}
                    onChange={(e) =>
                        onFiltersChange({
                            ...filters,
                            status: e.target.value as PortalReferralFilters["status"],
                        })
                    }
                    style={{ ...selectStyle, flex: "0 1 160px", minWidth: 140 }}
                >
                    <option value="all">All statuses</option>
                    {KANBAN_COLUMNS.map((col) => (
                        <option key={col.status} value={col.status}>
                            {col.title}
                        </option>
                    ))}
                </select>

                <select
                    aria-label="Filter by program"
                    value={filters.program}
                    onChange={(e) => onFiltersChange({ ...filters, program: e.target.value })}
                    style={{ ...selectStyle, flex: "0 1 140px", minWidth: 120 }}
                >
                    <option value="all">All programs</option>
                    {options.programs.map((program) => (
                        <option key={program} value={program}>
                            {program}
                        </option>
                    ))}
                </select>

                <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto", flexWrap: "wrap" }}>
                    {trailing}
                    {filtersActive && (
                        <button
                            type="button"
                            onClick={onClear}
                            style={{
                                padding: "8px 14px",
                                fontSize: 13,
                                fontWeight: 600,
                                fontFamily: FONT,
                                border: `1px solid ${COLORS.ashSubtle}`,
                                borderRadius: RADIUS.input,
                                background: "transparent",
                                color: COLORS.ashMuted,
                                cursor: "pointer",
                            }}
                        >
                            Clear filters
                        </button>
                    )}
                    <ReferralViewToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
                </div>
            </div>

            {(filtersActive || resultCount !== totalCount) && (
                <div style={{ fontSize: 12, color: COLORS.ashMuted, fontFamily: FONT }}>
                    Showing {resultCount} of {totalCount} referral{totalCount !== 1 ? "s" : ""}
                </div>
            )}
        </div>
    )
}

export { DEFAULT_PORTAL_REFERRAL_FILTERS }
