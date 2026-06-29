import type { CSSProperties } from "react"
import { COLORS, FONT, RADIUS } from "@design"
import { ORGANIZATION_TYPE_LABELS, type OrganizationType } from "../types"
import { DirectoryExportMenu } from "./DirectoryExportMenu"

type Props = {
    search: string
    typeFilter: OrganizationType | "all"
    selectedCount: number
    visibleCount: number
    onSearchChange: (value: string) => void
    onTypeFilterChange: (value: OrganizationType | "all") => void
    onNewOrganization: () => void
    onExportSelected: () => void
    onExportVisible: () => void
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
    appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%232B2828' d='M3 5l3 3 3-3'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 10px center",
}

export function OrganizationsToolbar({
    search,
    typeFilter,
    selectedCount,
    visibleCount,
    onSearchChange,
    onTypeFilterChange,
    onNewOrganization,
    onExportSelected,
    onExportVisible,
}: Props) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
                marginBottom: 12,
                flexShrink: 0,
            }}
        >
            <button
                type="button"
                onClick={onNewOrganization}
                style={{
                    padding: "8px 16px",
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: FONT,
                    border: "none",
                    borderRadius: RADIUS.input,
                    background: COLORS.moonstone,
                    color: COLORS.white,
                    cursor: "pointer",
                }}
            >
                + New Organization
            </button>

            <input
                type="search"
                placeholder="Search organizations…"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                aria-label="Search organizations"
                style={{
                    ...selectStyle,
                    backgroundImage: "none",
                    paddingRight: 12,
                    flex: "1 1 200px",
                    minWidth: 180,
                    maxWidth: 320,
                }}
            />

            <select
                aria-label="Filter by organization type"
                value={typeFilter}
                onChange={(e) => onTypeFilterChange(e.target.value as OrganizationType | "all")}
                style={{ ...selectStyle, minWidth: 160 }}
            >
                <option value="all">All types</option>
                {(Object.entries(ORGANIZATION_TYPE_LABELS) as [OrganizationType, string][]).map(([value, label]) => (
                    <option key={value} value={value}>
                        {label}
                    </option>
                ))}
            </select>

            <DirectoryExportMenu
                selectedCount={selectedCount}
                visibleCount={visibleCount}
                onExportSelected={onExportSelected}
                onExportVisible={onExportVisible}
                entityLabel="organizations"
            />

            {selectedCount > 0 && (
                <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.ashMuted, fontFamily: FONT }}>
                    {selectedCount} selected
                </span>
            )}
        </div>
    )
}
