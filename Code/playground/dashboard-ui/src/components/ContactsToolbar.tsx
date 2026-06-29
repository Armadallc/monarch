import type { CSSProperties } from "react"
import { COLORS, FONT, RADIUS } from "@design"
import type { ContactFilters } from "../contactUtils"
import { ORGANIZATION_TYPE_LABELS, type OrganizationType } from "../types"
import { DirectoryExportMenu } from "./DirectoryExportMenu"

type Props = {
    filters: ContactFilters
    organizationOptions: string[]
    selectedCount: number
    visibleCount: number
    onFiltersChange: (filters: ContactFilters) => void
    onNewContact: () => void
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

function update<K extends keyof ContactFilters>(filters: ContactFilters, key: K, value: ContactFilters[K]): ContactFilters {
    return { ...filters, [key]: value }
}

export function ContactsToolbar({
    filters,
    organizationOptions,
    selectedCount,
    visibleCount,
    onFiltersChange,
    onNewContact,
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
                onClick={onNewContact}
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
                + New Contact
            </button>

            <input
                type="search"
                placeholder="Search contacts…"
                value={filters.search}
                onChange={(e) => onFiltersChange(update(filters, "search", e.target.value))}
                aria-label="Search contacts"
                style={{
                    ...selectStyle,
                    backgroundImage: "none",
                    paddingRight: 12,
                    flex: "1 1 180px",
                    minWidth: 160,
                    maxWidth: 280,
                }}
            />

            <select
                aria-label="Filter by organization"
                value={filters.organization}
                onChange={(e) => onFiltersChange(update(filters, "organization", e.target.value))}
                style={{ ...selectStyle, minWidth: 150 }}
            >
                <option value="all">All organizations</option>
                {organizationOptions.map((org) => (
                    <option key={org} value={org}>
                        {org}
                    </option>
                ))}
            </select>

            <select
                aria-label="Filter by organization type"
                value={filters.organizationType}
                onChange={(e) =>
                    onFiltersChange(update(filters, "organizationType", e.target.value as OrganizationType | "all"))
                }
                style={{ ...selectStyle, minWidth: 150 }}
            >
                <option value="all">All types</option>
                {(Object.entries(ORGANIZATION_TYPE_LABELS) as [OrganizationType, string][]).map(([value, label]) => (
                    <option key={value} value={value}>
                        {label}
                    </option>
                ))}
            </select>

            <select
                aria-label="Filter by referrals sent"
                value={filters.referralCount}
                onChange={(e) =>
                    onFiltersChange(update(filters, "referralCount", e.target.value as ContactFilters["referralCount"]))
                }
                style={{ ...selectStyle, minWidth: 140 }}
            >
                <option value="all">Any referrals</option>
                <option value="1plus">1+ referrals</option>
                <option value="2plus">2+ referrals</option>
                <option value="5plus">5+ referrals</option>
            </select>

            <select
                aria-label="Filter by last active date"
                value={filters.lastActive}
                onChange={(e) =>
                    onFiltersChange(update(filters, "lastActive", e.target.value as ContactFilters["lastActive"]))
                }
                style={{ ...selectStyle, minWidth: 140 }}
            >
                <option value="all">Any last active</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
            </select>

            <select
                aria-label="Filter by contact source"
                value={filters.source}
                onChange={(e) => onFiltersChange(update(filters, "source", e.target.value as ContactFilters["source"]))}
                style={{ ...selectStyle, minWidth: 130 }}
            >
                <option value="all">All contacts</option>
                <option value="referral">Has referred</option>
                <option value="personal">Personal only</option>
            </select>

            <DirectoryExportMenu
                selectedCount={selectedCount}
                visibleCount={visibleCount}
                onExportSelected={onExportSelected}
                onExportVisible={onExportVisible}
                entityLabel="contacts"
            />

            {selectedCount > 0 && (
                <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.ashMuted, fontFamily: FONT }}>
                    {selectedCount} selected
                </span>
            )}
        </div>
    )
}
