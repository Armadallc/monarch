import { useMemo, useState, type CSSProperties, type ReactNode } from "react"
import { COLORS, FONT, RADIUS, SHADOWS, formatDisplayDate } from "@design"
import { ConfirmStatusDialog } from "./ConfirmStatusDialog"
import { referralHasSafetyFlag } from "../referralSafetyFlag"
import {
    ReferralCardIndicators,
    ReferralSafetyFlagIcon,
    hasReferralInfoIndicators,
} from "./ReferralCardIndicators"
import { toggleReferralSort, type ReferralSort, type ReferralSortField } from "../referralFilters"
import type { MockReferral, ReferralStatus } from "../types"
import { ReferralProgramLabel } from "./ReferralProgramLabel"
import { ReferralStatusBadge } from "./ReferralStatusBadge"
import { KANBAN_COLUMNS } from "../types"
import { clientDisplayId, expeditedLabel } from "../utils"
import { ClientName } from "./ClientName"
import { ExpeditedBadge, TimeBoundBadge } from "./ReferralUrgencyBadges"

export type ReferralTableMode = "staff" | "portal" | "portal-archive" | "staff-archive"

type Props = {
    referrals: MockReferral[]
    sort: ReferralSort
    onSortChange: (sort: ReferralSort) => void
    tableMode?: ReferralTableMode
    onStatusChange?: (id: string, status: ReferralStatus) => void
    onOpenReferral?: (referral: MockReferral) => void
    onEdit?: (referral: MockReferral) => void
    onArchive?: (referral: MockReferral) => void
    onRecover?: (referral: MockReferral) => void
    selectedIds?: Set<string>
    onSelectedIdsChange?: (ids: Set<string>) => void
}

type PendingMove = {
    referralId: string
    from: ReferralStatus
    to: ReferralStatus
}

const STAFF_TABLE_GRID =
    "40px minmax(140px, 1.2fr) 108px 96px 120px 88px 108px minmax(120px, 1fr) minmax(120px, 1fr) 96px 96px 76px minmax(108px, auto)"
const PORTAL_TABLE_GRID =
    "minmax(140px, 1.2fr) 108px 96px 120px 88px 108px minmax(120px, 1fr) minmax(120px, 1fr) 96px 96px 76px minmax(108px, auto)"
const PORTAL_ARCHIVE_TABLE_GRID =
    "40px minmax(140px, 1.2fr) 108px 96px 120px 88px 108px minmax(120px, 1fr) minmax(120px, 1fr) 96px 96px 76px minmax(88px, auto)"

const cellStyle: CSSProperties = {
    padding: "10px 10px",
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
}

type HeaderDef = {
    field: ReferralSortField | null
    label: string
    title?: string
}

const HEADERS: HeaderDef[] = [
    { field: null, label: "" },
    { field: "client_name", label: "Case name" },
    { field: "ref_id", label: "REF ID" },
    { field: "urgency", label: "Urgency", title: "Expedited placement urgency" },
    { field: "status", label: "Status" },
    { field: "program", label: "Program" },
    { field: "assignee", label: "Assignee" },
    { field: "referral_source", label: "Source" },
    { field: "organization", label: "Organization" },
    { field: "created_at", label: "Submitted" },
    { field: "activity", label: "Activity" },
    { field: null, label: "Info", title: "Attachments, unread messages, and safety flags" },
    { field: null, label: "Actions" },
]

function HeaderCell({
    def,
    sort,
    onSort,
}: {
    def: HeaderDef
    sort: ReferralSort
    onSort: (field: ReferralSortField) => void
}) {
    const sortable = def.field !== null
    return (
        <div
            style={{
                ...cellStyle,
                padding: "12px 10px",
                cursor: sortable ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                gap: 4,
                userSelect: "none",
                whiteSpace: "nowrap",
            }}
            title={def.title}
            onClick={() => def.field && onSort(def.field)}
        >
            {def.label}
            {sortable && sort.field === def.field && (
                <span style={{ color: COLORS.moonstone, fontSize: 12, fontWeight: 700 }}>
                    {sort.direction === "asc" ? "↑" : "↓"}
                </span>
            )}
        </div>
    )
}

const actionIconWrap: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
}

function EyeIcon({ size = 16, color = COLORS.ash }: { size?: number; color?: string }) {
    return (
        <span style={actionIconWrap} aria-hidden>
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
            </svg>
        </span>
    )
}

function EditIcon({ size = 16, color = COLORS.ash }: { size?: number; color?: string }) {
    return (
        <span style={actionIconWrap} aria-hidden>
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
        </span>
    )
}

function RecoverIcon({ size = 16, color = COLORS.ash }: { size?: number; color?: string }) {
    return (
        <span style={actionIconWrap} aria-hidden>
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7v6h6" />
                <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6.7 3" />
                <path d="M21 7v6h-6" />
            </svg>
        </span>
    )
}

function ArchiveIcon({ size = 16, color = COLORS.ash }: { size?: number; color?: string }) {
    return (
        <span style={actionIconWrap} aria-hidden>
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="4" rx="1" />
                <path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8" />
                <path d="M10 12h4" />
            </svg>
        </span>
    )
}

function IconActionButton({
    onClick,
    icon,
    title,
}: {
    onClick: () => void
    icon: ReactNode
    title: string
}) {
    return (
        <button
            type="button"
            title={title}
            aria-label={title}
            onClick={onClick}
            style={{
                padding: 6,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                border: `1px solid ${COLORS.ashSubtle}`,
                borderRadius: RADIUS.small,
                background: COLORS.white,
                cursor: "pointer",
            }}
        >
            {icon}
        </button>
    )
}

function UrgencyCell({ referral }: { referral: MockReferral }) {
    const priority = expeditedLabel(referral.urgent_placement, referral.urgency_level)

    if (!priority) {
        return <span style={{ color: COLORS.ashMuted, fontSize: 13 }}>—</span>
    }

    if (priority === "EXPEDITED") {
        return <ExpeditedBadge />
    }

    return <TimeBoundBadge targetDateIso={referral.urgency_target_date} />
}

export function ReferralTableView({
    referrals,
    sort,
    onSortChange,
    tableMode = "staff",
    onStatusChange,
    onOpenReferral,
    onEdit,
    onArchive,
    onRecover,
    selectedIds: selectedIdsProp,
    onSelectedIdsChange,
}: Props) {
    const [internalSelectedIds, setInternalSelectedIds] = useState<Set<string>>(() => new Set())
    const [pendingMove, setPendingMove] = useState<PendingMove | null>(null)

    const selectedIds = selectedIdsProp ?? internalSelectedIds
    const setSelectedIds = onSelectedIdsChange ?? setInternalSelectedIds

    const pendingReferral = pendingMove ? referrals.find((r) => r.id === pendingMove.referralId) : null

    const allSelected = referrals.length > 0 && selectedIds.size === referrals.length
    const showCheckbox = tableMode === "staff" || tableMode === "portal-archive" || tableMode === "staff-archive"
    const showStatusLabel =
        tableMode === "portal" || tableMode === "portal-archive" || tableMode === "staff-archive"
    const tableGrid =
        tableMode === "staff" || tableMode === "staff-archive"
            ? STAFF_TABLE_GRID
            : tableMode === "portal-archive"
              ? PORTAL_ARCHIVE_TABLE_GRID
              : PORTAL_TABLE_GRID
    const tableMinWidth =
        tableMode === "staff" || tableMode === "staff-archive" || tableMode === "portal-archive" ? 1380 : 1340

    const toggleSelectAll = () => {
        if (allSelected) setSelectedIds(new Set())
        else setSelectedIds(new Set(referrals.map((r) => r.id)))
    }

    const toggleSelect = (id: string) => {
        const next = new Set(selectedIds)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        setSelectedIds(next)
    }

    const handleSort = (field: ReferralSortField) => {
        onSortChange(toggleReferralSort(sort, field))
    }

    const statusOptions = useMemo(() => KANBAN_COLUMNS.map((c) => ({ value: c.status, label: c.title })), [])

    return (
        <div
            style={{
                flex: 1,
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
                background: COLORS.white,
                borderRadius: RADIUS.container,
                boxShadow: SHADOWS.card,
                overflow: "hidden",
                fontFamily: FONT,
            }}
        >
            <div style={{ flexShrink: 0, overflowX: "auto", overflowY: "hidden" }}>
                <div style={{ minWidth: tableMinWidth }}>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: tableGrid,
                            background: COLORS.sidebar,
                            fontSize: 11,
                            fontWeight: 600,
                            color: COLORS.onChrome,
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                        }}
                    >
                        {showCheckbox && (
                            <div style={{ ...cellStyle, display: "flex", justifyContent: "center", alignItems: "center" }}>
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={toggleSelectAll}
                                    aria-label="Select all referrals"
                                    style={{ width: 16, height: 16 }}
                                />
                            </div>
                        )}
                        {HEADERS.slice(1).map((def) => (
                            <HeaderCell key={def.label} def={def} sort={sort} onSort={handleSort} />
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ flex: 1, minHeight: 0, overflow: "auto", WebkitOverflowScrolling: "touch" }}>
                <div style={{ minWidth: tableMinWidth }}>
                    {referrals.length === 0 ? (
                        <div
                            style={{
                                padding: "48px 20px",
                                textAlign: "center",
                                color: COLORS.ashMuted,
                                fontSize: 14,
                            }}
                        >
                            No referrals match your filters
                        </div>
                    ) : (
                        referrals.map((referral, index) => {
                            const selected = showCheckbox && selectedIds.has(referral.id)
                            const declined = referral.status === "declined"
                            const activityDate = referral.last_activity_at || referral.created_at

                            return (
                                <div
                                    key={referral.id}
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: tableGrid,
                                        alignItems: "center",
                                        fontSize: 14,
                                        color: COLORS.ash,
                                        borderBottom: `1px solid ${COLORS.ashSubtle}`,
                                        background: selected
                                            ? COLORS.champagneLight
                                            : index % 2 === 1
                                              ? COLORS.coconut
                                              : COLORS.white,
                                        opacity: declined ? 0.72 : 1,
                                        transition: "background 0.15s ease",
                                    }}
                                >
                                    {showCheckbox && (
                                        <div style={{ ...cellStyle, display: "flex", justifyContent: "center" }}>
                                            <input
                                                type="checkbox"
                                                checked={selected}
                                                onChange={() => toggleSelect(referral.id)}
                                                aria-label={`Select ${referral.client_first_name} ${referral.client_last_name}`}
                                                style={{ width: 16, height: 16 }}
                                            />
                                        </div>
                                    )}

                                    <ClientName
                                        as="div"
                                        size="md"
                                        style={cellStyle}
                                        title={`${referral.client_first_name} ${referral.client_last_name}`}
                                    >
                                        {referral.client_first_name} {referral.client_last_name}
                                    </ClientName>

                                    <div style={{ ...cellStyle, fontSize: 12, color: COLORS.ashMuted }}>
                                        {clientDisplayId(referral)}
                                    </div>

                                    <div style={cellStyle}>
                                        <UrgencyCell referral={referral} />
                                    </div>

                                    <div style={cellStyle}>
                                        {showStatusLabel ? (
                                            <ReferralStatusBadge status={referral.status} />
                                        ) : (
                                            <select
                                                value={referral.status}
                                                aria-label={`Status for ${referral.client_first_name} ${referral.client_last_name}`}
                                                onChange={(e) => {
                                                    const to = e.target.value as ReferralStatus
                                                    if (to === referral.status) return
                                                    setPendingMove({ referralId: referral.id, from: referral.status, to })
                                                }}
                                                style={{
                                                    width: "100%",
                                                    maxWidth: 140,
                                                    padding: "6px 8px",
                                                    fontSize: 12,
                                                    fontFamily: FONT,
                                                    border: `1px solid ${COLORS.ashSubtle}`,
                                                    borderRadius: RADIUS.small,
                                                    background: COLORS.white,
                                                    color: COLORS.ash,
                                                    cursor: "pointer",
                                                }}
                                            >
                                                {statusOptions.map((o) => (
                                                    <option key={o.value} value={o.value}>
                                                        {o.label}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>

                                    <div style={cellStyle}>
                                        <ReferralProgramLabel program={referral.program} />
                                    </div>

                                    <div
                                        style={{ ...cellStyle, fontSize: 13 }}
                                        title={referral.assignee_name || undefined}
                                    >
                                        {referral.assignee_name || "—"}
                                    </div>

                                    <div style={{ ...cellStyle, fontSize: 13 }} title={referral.referral_source_name}>
                                        {referral.referral_source_name}
                                    </div>

                                    <div style={{ ...cellStyle, fontSize: 13 }} title={referral.organization}>
                                        {referral.organization}
                                    </div>

                                    <div style={{ ...cellStyle, fontSize: 13 }}>
                                        {formatDisplayDate(referral.created_at)}
                                    </div>

                                    <div
                                        style={{ ...cellStyle, fontSize: 13 }}
                                        title={
                                            referral.last_activity_at
                                                ? undefined
                                                : "Falls back to submitted date until first substantive update"
                                        }
                                    >
                                        {formatDisplayDate(activityDate)}
                                    </div>

                                    <div
                                        style={{
                                            ...cellStyle,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "flex-start",
                                            gap: 6,
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        {hasReferralInfoIndicators(referral) ? (
                                            <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                                                {referralHasSafetyFlag(referral) ? (
                                                    <ReferralSafetyFlagIcon size={12} />
                                                ) : null}
                                                <ReferralCardIndicators
                                                    referral={referral}
                                                    variant="info"
                                                    includeUrgency
                                                    dense
                                                />
                                            </div>
                                        ) : (
                                            <span style={{ color: COLORS.ashMuted, fontSize: 13 }}>—</span>
                                        )}
                                    </div>

                                    <div
                                        style={{
                                            ...cellStyle,
                                            display: "flex",
                                            gap: 4,
                                            justifyContent: "flex-end",
                                            flexWrap: "nowrap",
                                        }}
                                    >
                                        <IconActionButton
                                            title="View referral"
                                            icon={<EyeIcon />}
                                            onClick={() => onOpenReferral?.(referral)}
                                        />
                                        {tableMode === "portal-archive" || tableMode === "staff-archive" ? (
                                            <IconActionButton
                                                title="Recover to dashboard"
                                                icon={<RecoverIcon />}
                                                onClick={() => onRecover?.(referral)}
                                            />
                                        ) : (
                                            <>
                                                <IconActionButton
                                                    title="Edit referral"
                                                    icon={<EditIcon />}
                                                    onClick={() => (onEdit ?? onOpenReferral)?.(referral)}
                                                />
                                                <IconActionButton
                                                    title="Archive referral"
                                                    icon={<ArchiveIcon />}
                                                    onClick={() => onArchive?.(referral)}
                                                />
                                            </>
                                        )}
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>

            {pendingReferral && pendingMove && (
                <ConfirmStatusDialog
                    referral={pendingReferral}
                    nextStatus={pendingMove.to}
                    onConfirm={() => {
                        onStatusChange?.(pendingMove.referralId, pendingMove.to)
                        setPendingMove(null)
                    }}
                    onCancel={() => setPendingMove(null)}
                />
            )}
        </div>
    )
}
