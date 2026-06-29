import type { CSSProperties } from "react"
import { COLORS, FONT, RADIUS } from "@design"
import { KanbanArchiveColumnToggle } from "./KanbanArchiveColumnToggle"
import { ReferralViewToggle } from "./ReferralViewToggle"
import {
    DEFAULT_REFERRAL_SORT,
    REFERRAL_SORT_OPTIONS,
    hasActiveReferralFilters,
    sortValueFromConfig,
    type ReferralFilters,
    type ReferralSort,
    type ReferralViewMode,
} from "../referralFilters"

type FilterOptions = {
    assignees: string[]
    organizations: string[]
    sourceTypes: { value: string; label: string }[]
}

type Props = {
    filters: ReferralFilters
    sort: ReferralSort
    viewMode: ReferralViewMode
    options: FilterOptions
    resultCount: number
    totalCount: number
    onFiltersChange: (filters: ReferralFilters) => void
    onSortChange: (sort: ReferralSort) => void
    onViewModeChange: (mode: ReferralViewMode) => void
    onClear: () => void
    archiveColumnVisible?: boolean
    onArchiveColumnVisibleChange?: (visible: boolean) => void
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
    flex: "1 1 180px",
    minWidth: 160,
    maxWidth: 280,
}

export function ReferralFiltersBar({
    filters,
    sort,
    viewMode,
    options,
    resultCount,
    totalCount,
    onFiltersChange,
    onSortChange,
    onViewModeChange,
    onClear,
    archiveColumnVisible,
    onArchiveColumnVisibleChange,
}: Props) {
    const filtersActive = hasActiveReferralFilters(filters)
    const sortActive =
        sort.field !== DEFAULT_REFERRAL_SORT.field || sort.direction !== DEFAULT_REFERRAL_SORT.direction
    const showClear = filtersActive || sortActive

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
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    flexWrap: "wrap",
                }}
            >
                <input
                    type="search"
                    placeholder="Search referrals…"
                    value={filters.search}
                    onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
                    aria-label="Search referrals"
                    style={inputStyle}
                />

                <select
                    aria-label="Filter by assignee"
                    value={filters.assignee}
                    onChange={(e) => onFiltersChange({ ...filters, assignee: e.target.value })}
                    style={{ ...selectStyle, flex: "0 1 150px", minWidth: 130 }}
                >
                    <option value="all">All assignees</option>
                    <option value="unassigned">Unassigned</option>
                    {options.assignees.map((name) => (
                        <option key={name} value={name}>
                            {name}
                        </option>
                    ))}
                </select>

                <select
                    aria-label="Filter by organization"
                    value={filters.organization}
                    onChange={(e) => onFiltersChange({ ...filters, organization: e.target.value })}
                    style={{ ...selectStyle, flex: "0 1 170px", minWidth: 140 }}
                >
                    <option value="all">All organizations</option>
                    {options.organizations.map((org) => (
                        <option key={org} value={org}>
                            {org}
                        </option>
                    ))}
                </select>

                <select
                    aria-label="Filter by referral source type"
                    value={filters.sourceType}
                    onChange={(e) =>
                        onFiltersChange({
                            ...filters,
                            sourceType: e.target.value as ReferralFilters["sourceType"],
                        })
                    }
                    style={{ ...selectStyle, flex: "0 1 200px", minWidth: 160 }}
                >
                    <option value="all">All types</option>
                    {options.sourceTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                            {type.label}
                        </option>
                    ))}
                </select>

                <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto", flexWrap: "wrap" }}>
                    <ReferralViewToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />

                    {viewMode === "column" &&
                        archiveColumnVisible !== undefined &&
                        onArchiveColumnVisibleChange && (
                            <KanbanArchiveColumnToggle
                                visible={archiveColumnVisible}
                                onChange={onArchiveColumnVisibleChange}
                            />
                        )}

                    {showClear && (
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

                    {viewMode === "column" && (
                        <label
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                fontSize: 13,
                                fontWeight: 500,
                                color: COLORS.ashMuted,
                                fontFamily: FONT,
                            }}
                        >
                            <span style={{ whiteSpace: "nowrap" }}>Sort by</span>
                            <select
                                aria-label="Sort referrals"
                                value={sortValueFromConfig(sort)}
                                onChange={(e) => {
                                    const option = REFERRAL_SORT_OPTIONS.find((o) => o.value === e.target.value)
                                    if (option) onSortChange({ field: option.field, direction: option.direction })
                                }}
                                style={{ ...selectStyle, minWidth: 200 }}
                            >
                                {REFERRAL_SORT_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    )}
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
