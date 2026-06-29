import { useEffect, useMemo, useRef, useState } from "react"
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
    useDroppable,
    type DragEndEvent,
    type DragStartEvent,
} from "@dnd-kit/core"
import { COLORS, FONT, FONT_HEADING, RADIUS, TRANSITION } from "@design"
import { ConfirmArchiveDialog } from "./ConfirmArchiveDialog"
import { ConfirmStatusDialog } from "./ConfirmStatusDialog"
import { KanbanArchiveColumn } from "./KanbanArchiveColumn"
import { PortalSummaryBar, type PortalFilter } from "./PortalSummaryBar"
import { ReferralKanbanCard } from "./ReferralKanbanCard"
import { KANBAN_ARCHIVE_COLUMN_LEADING_GAP, KANBAN_ARCHIVE_DROP_ID, type KanbanArchiveShell } from "../kanbanArchiveColumn"
import { KANBAN_COLUMNS, type MockReferral, type ReferralStatus } from "../types"

type PendingMove = {
    referralId: string
    from: ReferralStatus
    to: ReferralStatus
}

type PendingArchive = {
    ids: string[]
}

type Props = {
    referrals: MockReferral[]
    readOnly?: boolean
    onStatusChange?: (id: string, status: ReferralStatus) => void
    onOpenReferral?: (referral: MockReferral) => void
    portalFilter?: PortalFilter
    onPortalFilterChange?: (filter: PortalFilter) => void
    showPortalSummaryBar?: boolean
    showArchiveColumn?: boolean
    onArchiveReferrals?: (ids: string[]) => void
    archiveShell?: KanbanArchiveShell
}

const COLUMN_EXPANDED_MIN = 220
const COLUMN_EXPANDED_MAX = 320
const COLUMN_FILL_MIN = 160
const COLUMN_COLLAPSED_WIDTH = 40

function ColumnCollapseButton({
    collapsed,
    title,
    onClick,
}: {
    collapsed: boolean
    title: string
    onClick: () => void
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-expanded={!collapsed}
            aria-label={collapsed ? `Expand ${title} column` : `Collapse ${title} column`}
            title={collapsed ? `Expand ${title}` : `Collapse ${title}`}
            style={{
                flexShrink: 0,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 24,
                height: 24,
                padding: 0,
                border: "none",
                borderRadius: RADIUS.small,
                background: COLORS.sidebarAccent,
                color: COLORS.onChrome,
                fontFamily: FONT,
                fontSize: 14,
                fontWeight: 700,
                lineHeight: 1,
                cursor: "pointer",
                transition: TRANSITION,
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = COLORS.sidebarBorder
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = COLORS.sidebarAccent
            }}
        >
            {collapsed ? "→" : "←"}
        </button>
    )
}

function KanbanColumn({
    status,
    title,
    referrals,
    readOnly,
    selectable,
    cardDraggable,
    collapsed,
    fillWidth,
    onToggleCollapse,
    onOpen,
    selectedIds,
    onToggleSelect,
    onToggleSelectColumn,
}: {
    status: ReferralStatus
    title: string
    referrals: MockReferral[]
    readOnly: boolean
    selectable: boolean
    cardDraggable: boolean
    collapsed: boolean
    fillWidth: boolean
    onToggleCollapse: () => void
    onOpen: (r: MockReferral) => void
    selectedIds: Set<string>
    onToggleSelect: (id: string) => void
    onToggleSelectColumn: (columnReferrals: MockReferral[]) => void
}) {
    const { setNodeRef, isOver } = useDroppable({
        id: status,
        disabled: readOnly || collapsed,
    })

    const columnSelectAllRef = useRef<HTMLInputElement>(null)
    const columnIds = useMemo(() => referrals.map((r) => r.id), [referrals])
    const selectedInColumnCount = useMemo(
        () => columnIds.filter((id) => selectedIds.has(id)).length,
        [columnIds, selectedIds]
    )
    const allColumnSelected = columnIds.length > 0 && selectedInColumnCount === columnIds.length
    const someColumnSelected = selectedInColumnCount > 0 && !allColumnSelected

    useEffect(() => {
        if (columnSelectAllRef.current) {
            columnSelectAllRef.current.indeterminate = someColumnSelected
        }
    }, [someColumnSelected])

    const columnSize = collapsed
        ? {
              flex: `0 0 ${COLUMN_COLLAPSED_WIDTH}px`,
              minWidth: COLUMN_COLLAPSED_WIDTH,
              maxWidth: COLUMN_COLLAPSED_WIDTH,
          }
        : fillWidth
          ? {
                flex: "1 1 0%",
                minWidth: COLUMN_FILL_MIN,
            }
          : {
                flex: "1 1 220px",
                minWidth: COLUMN_EXPANDED_MIN,
                maxWidth: COLUMN_EXPANDED_MAX,
            }

    return (
        <div
            style={{
                ...columnSize,
                height: "100%",
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
                transition: TRANSITION,
            }}
        >
            <div
                style={{
                    flexShrink: 0,
                    padding: collapsed ? "12px 0" : "12px 14px",
                    ...(collapsed ? { marginBottom: 0 } : { margin: "5px 0 10px 12px" }),
                    borderRadius: collapsed ? RADIUS.small : 0,
                    background: COLORS.sidebar,
                    color: COLORS.ash,
                    fontFamily: FONT,
                    height: collapsed ? "100%" : undefined,
                    display: "flex",
                    flexDirection: "column",
                    border: "none",
                    borderBottom: collapsed ? undefined : "2px solid rgb(20, 71, 230)",
                }}
            >
                {collapsed ? (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "flex-start",
                            gap: 10,
                            height: "100%",
                            minWidth: COLUMN_COLLAPSED_WIDTH,
                        }}
                    >
                        <span
                            style={{
                                fontSize: 11,
                                fontWeight: 600,
                                background: COLORS.sidebarAccent,
                                padding: "2px 8px",
                                borderRadius: RADIUS.pill,
                                lineHeight: 1.3,
                                color: COLORS.onChrome,
                            }}
                        >
                            {referrals.length}
                        </span>
                        <ColumnCollapseButton collapsed={collapsed} title={title} onClick={onToggleCollapse} />
                        <span
                            title={title}
                            style={{
                                flex: 1,
                                fontSize: 11,
                                fontWeight: 600,
                                fontFamily: FONT_HEADING,
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                                writingMode: "vertical-rl",
                                textOrientation: "mixed",
                                transform: "rotate(180deg)",
                                lineHeight: 1.2,
                                opacity: 0.75,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                maxHeight: "100%",
                                textAlign: "right",
                                paddingBottom: 20,
                            }}
                        >
                            {title}
                        </span>
                    </div>
                ) : (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                minWidth: 0,
                                flex: 1,
                            }}
                        >
                            {selectable && referrals.length > 0 && (
                                <input
                                    ref={columnSelectAllRef}
                                    type="checkbox"
                                    checked={allColumnSelected}
                                    aria-label={`Select all in ${title}`}
                                    title={`Select all in ${title}`}
                                    onChange={() => onToggleSelectColumn(referrals)}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                        width: 12,
                                        height: 12,
                                        flexShrink: 0,
                                        cursor: "pointer",
                                    }}
                                />
                            )}
                            <span
                                style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    fontFamily: FONT_HEADING,
                                    color: COLORS.ash,
                                    letterSpacing: "0.04em",
                                    textTransform: "uppercase",
                                    opacity: 0.75,
                                    minWidth: 0,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {title}
                            </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                            <span
                                style={{
                                    fontSize: 12,
                                    fontWeight: 600,
                                    background: COLORS.sidebarAccent,
                                    padding: "2px 10px",
                                    borderRadius: RADIUS.pill,
                                    color: COLORS.onChrome,
                                }}
                            >
                                {referrals.length}
                            </span>
                            <ColumnCollapseButton collapsed={collapsed} title={title} onClick={onToggleCollapse} />
                        </div>
                    </div>
                )}
            </div>
            {!collapsed && (
                <div
                    ref={setNodeRef}
                    style={{
                        flex: 1,
                        minHeight: 0,
                        overflowY: "auto",
                        overflowX: "hidden",
                        WebkitOverflowScrolling: "touch",
                        padding: 8,
                        borderRadius: RADIUS.section,
                        background: isOver && !readOnly ? COLORS.moonstoneLight : COLORS.coconut25,
                        border: `1px dashed ${isOver && !readOnly ? COLORS.moonstone : COLORS.ashSubtle}`,
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                    }}
                >
                    {referrals.length === 0 ? (
                        <p
                            style={{
                                margin: 0,
                                padding: 12,
                                fontSize: 12,
                                color: COLORS.ashMuted,
                                fontFamily: FONT,
                                textAlign: "center",
                            }}
                        >
                            No referrals
                        </p>
                    ) : (
                        referrals.map((r) => (
                            <ReferralKanbanCard
                                key={r.id}
                                referral={r}
                                readOnly={readOnly}
                                draggable={cardDraggable}
                                onOpen={onOpen}
                                selected={selectedIds.has(r.id)}
                                onToggleSelect={selectable ? onToggleSelect : undefined}
                            />
                        ))
                    )}
                </div>
            )}
        </div>
    )
}

export function ReferralKanbanBoard({
    referrals,
    readOnly = false,
    onStatusChange,
    onOpenReferral,
    portalFilter: portalFilterProp,
    onPortalFilterChange,
    showPortalSummaryBar = true,
    showArchiveColumn = false,
    onArchiveReferrals,
    archiveShell = "staff",
}: Props) {
    const [activeId, setActiveId] = useState<string | null>(null)
    const [pendingMove, setPendingMove] = useState<PendingMove | null>(null)
    const [internalPortalFilter, setInternalPortalFilter] = useState<PortalFilter>("all")
    const portalFilter = portalFilterProp ?? internalPortalFilter
    const setPortalFilter = onPortalFilterChange ?? setInternalPortalFilter
    const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
    const [collapsedColumns, setCollapsedColumns] = useState<Set<ReferralStatus>>(() => new Set())
    const [pendingArchive, setPendingArchive] = useState<PendingArchive | null>(null)

    const enableDnD = !readOnly
    const archiveColumnEnabled = enableDnD && showArchiveColumn && !!onArchiveReferrals
    const portalBatchArchive = readOnly && !!onArchiveReferrals
    const cardDraggable = enableDnD
    const selectable = enableDnD || portalBatchArchive

    const toggleColumnCollapse = (status: ReferralStatus) => {
        setCollapsedColumns((prev) => {
            const next = new Set(prev)
            if (next.has(status)) next.delete(status)
            else next.add(status)
            return next
        })
    }

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const toggleSelectColumn = (columnReferrals: MockReferral[]) => {
        const ids = columnReferrals.map((r) => r.id)
        if (ids.length === 0) return
        setSelectedIds((prev) => {
            const next = new Set(prev)
            const allSelected = ids.every((id) => next.has(id))
            if (allSelected) ids.forEach((id) => next.delete(id))
            else ids.forEach((id) => next.add(id))
            return next
        })
    }

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    )

    const filteredReferrals = useMemo(() => {
        if (!readOnly || portalFilter === "all") return referrals
        if (portalFilter === "active") {
            return referrals.filter((r) => r.status === "pending_review" || r.status === "under_review")
        }
        return referrals.filter((r) => r.status === portalFilter)
    }, [referrals, readOnly, portalFilter])

    const byColumn = useMemo(() => {
        const map = new Map<ReferralStatus, MockReferral[]>()
        for (const col of KANBAN_COLUMNS) map.set(col.status, [])
        for (const r of filteredReferrals) {
            const list = map.get(r.status)
            if (list) list.push(r)
        }
        return map
    }, [filteredReferrals])

    const activeReferral = activeId ? referrals.find((r) => r.id === activeId) : null

    const handleDragStart = (e: DragStartEvent) => {
        setActiveId(String(e.active.id))
    }

    const handleDragEnd = (e: DragEndEvent) => {
        setActiveId(null)
        const overId = e.over?.id
        if (!overId) return

        const referralId = String(e.active.id)
        const referral = referrals.find((r) => r.id === referralId)
        if (!referral) return

        if (String(overId) === KANBAN_ARCHIVE_DROP_ID) {
            if (!archiveColumnEnabled) return
            const idsToArchive =
                selectedIds.has(referralId) && selectedIds.size > 0
                    ? [...selectedIds]
                    : [referralId]
            setPendingArchive({ ids: idsToArchive })
            return
        }

        if (readOnly) return

        const newStatus = String(overId) as ReferralStatus
        if (referral.status === newStatus) return
        if (!KANBAN_COLUMNS.some((c) => c.status === newStatus)) return
        setPendingMove({ referralId, from: referral.status, to: newStatus })
    }

    const handleOpen = (r: MockReferral) => {
        onOpenReferral?.(r)
    }

    const pendingReferral = pendingMove
        ? referrals.find((r) => r.id === pendingMove.referralId)
        : null

    const columnsFillWidth = enableDnD

    const board = (
        <div
            style={{
                display: "flex",
                overflowX: "auto",
                overflowY: "hidden",
                flex: 1,
                minHeight: 0,
                width: "100%",
                height: "100%",
                paddingBottom: 8,
                alignItems: "stretch",
                alignSelf: "stretch",
                border: `1px solid ${COLORS.ashSubtle}`,
                borderRadius: RADIUS.small,
                boxSizing: "border-box",
            }}
        >
            <div
                style={{
                    display: "flex",
                    flex: 1,
                    minWidth: columnsFillWidth ? 0 : undefined,
                    gap: 12,
                    height: "100%",
                    alignItems: "stretch",
                }}
            >
                {KANBAN_COLUMNS.map((col) => (
                    <KanbanColumn
                        key={col.status}
                        status={col.status}
                        title={col.title}
                        referrals={byColumn.get(col.status) ?? []}
                        readOnly={readOnly}
                        selectable={selectable}
                        cardDraggable={cardDraggable}
                        collapsed={collapsedColumns.has(col.status)}
                        fillWidth={columnsFillWidth}
                        onToggleCollapse={() => toggleColumnCollapse(col.status)}
                        onOpen={handleOpen}
                        selectedIds={selectedIds}
                        onToggleSelect={toggleSelect}
                        onToggleSelectColumn={toggleSelectColumn}
                    />
                ))}
            </div>
            {archiveColumnEnabled && (
                <>
                    <div
                        aria-hidden
                        style={{ flexShrink: 0, width: KANBAN_ARCHIVE_COLUMN_LEADING_GAP }}
                    />
                    <KanbanArchiveColumn disabled={!archiveColumnEnabled} isDragging={!!activeId} />
                </>
            )}
        </div>
    )

    return (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, fontFamily: FONT }}>
            {readOnly && showPortalSummaryBar && (
                <PortalSummaryBar
                    referrals={referrals}
                    filter={portalFilter}
                    onFilterChange={setPortalFilter}
                />
            )}
            {portalBatchArchive && selectedIds.size > 0 && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        flexWrap: "wrap",
                        marginBottom: 10,
                        padding: "8px 12px",
                        borderRadius: RADIUS.small,
                        background: COLORS.coconut,
                        border: `1px solid ${COLORS.ashSubtle}`,
                        fontFamily: FONT,
                        fontSize: 13,
                    }}
                >
                    <span style={{ color: COLORS.ashMuted }}>
                        {selectedIds.size} selected
                    </span>
                    <button
                        type="button"
                        onClick={() => setPendingArchive({ ids: [...selectedIds] })}
                        style={{
                            padding: "6px 14px",
                            fontSize: 13,
                            fontWeight: 600,
                            fontFamily: FONT,
                            border: "none",
                            borderRadius: RADIUS.small,
                            background: COLORS.warningBg,
                            color: COLORS.warningText,
                            cursor: "pointer",
                        }}
                    >
                        Archive
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedIds(new Set())}
                        style={{
                            padding: "6px 14px",
                            fontSize: 13,
                            fontWeight: 600,
                            fontFamily: FONT,
                            border: `1px solid ${COLORS.ashSubtle}`,
                            borderRadius: RADIUS.small,
                            background: "transparent",
                            color: COLORS.ashMuted,
                            cursor: "pointer",
                        }}
                    >
                        Clear
                    </button>
                </div>
            )}
            <DndContext
                sensors={enableDnD ? sensors : []}
                onDragStart={enableDnD ? handleDragStart : undefined}
                onDragEnd={enableDnD ? handleDragEnd : undefined}
            >
                {board}
                {enableDnD && (
                    <DragOverlay>
                        {activeReferral ? (
                            <ReferralKanbanCard
                                referral={activeReferral}
                                readOnly={readOnly}
                                draggable
                                onOpen={() => {}}
                                isDragging
                                selected={selectedIds.has(activeReferral.id)}
                            />
                        ) : null}
                    </DragOverlay>
                )}
            </DndContext>
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
            {pendingArchive && (
                <ConfirmArchiveDialog
                    referrals={referrals.filter((r) => pendingArchive.ids.includes(r.id))}
                    shell={archiveShell}
                    onConfirm={() => {
                        onArchiveReferrals?.(pendingArchive.ids)
                        setSelectedIds(new Set())
                        setPendingArchive(null)
                    }}
                    onCancel={() => setPendingArchive(null)}
                />
            )}
        </div>
    )
}
