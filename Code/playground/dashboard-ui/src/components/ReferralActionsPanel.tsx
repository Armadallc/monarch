import { useMemo, useState, type CSSProperties } from "react"
import { COLORS, FONT, FONT_HEADING, RADIUS, SHADOWS, formatDisplayDate } from "@design"
import { ClientName } from "./ClientName"
import { staffMemberById } from "../referralAssignmentUtils"
import { transferableProgramsForReferral } from "../referralTransferUtils"
import { ConfirmAssigneeDialog } from "./ConfirmAssigneeDialog"
import { ConfirmStatusDialog } from "./ConfirmStatusDialog"
import { ConfirmTransferDialog } from "./ConfirmTransferDialog"
import { ReferralMetaBadges } from "./ReferralMetaBadges"
import { ReferralStaffAssignmentFields } from "./ReferralStaffAssignmentFields"
import {
    KANBAN_COLUMNS,
    type MockReferral,
    type MockReferralTransfer,
    type ReferralStatus,
    type StaffMember,
} from "../types"
import { clientDisplayId, clientInitials } from "../utils"
import { EdgePanelCollapseFooter } from "./EdgePanelCollapseToggle"

export type ActionsPanelShell = "staff" | "portal"

type Props = {
    referral: MockReferral
    shell: ActionsPanelShell
    mode?: "view" | "edit"
    collapsed: boolean
    onToggleCollapse: () => void
    onClose: () => void
    onStatusChange?: (id: string, status: ReferralStatus) => void
    onArchive?: () => void
    onRecover?: () => void
    onEdit?: () => void
    onOpenMessageThread?: () => void
    onOpenFullRecord?: () => void
    staffDirectory?: StaffMember[]
    currentStaffId?: string
    pendingTransfer?: MockReferralTransfer
    onAssignmentChange?: (referralId: string, staffId: string | null) => void
    onRequestTransfer?: (
        referralId: string,
        input: { toProgram: MockReferral["program"]; toAssigneeId: string | null; notes: string }
    ) => void
}

const EXPANDED_WIDTH = 320
const COLLAPSED_WIDTH = 52

const actionBtn: CSSProperties = {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    fontSize: 13,
    fontWeight: 600,
    fontFamily: FONT_HEADING,
    border: `1px solid ${COLORS.ashSubtle}`,
    borderRadius: RADIUS.small,
    background: COLORS.white,
    color: COLORS.ash,
    cursor: "pointer",
    textAlign: "left",
}

const iconOnlyBtn: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    padding: 0,
    border: `1px solid ${COLORS.ashSubtle}`,
    borderRadius: RADIUS.small,
    background: COLORS.white,
    color: COLORS.ash,
    cursor: "pointer",
    flexShrink: 0,
}

/** Collapsed rail when no referral is selected — toggle still works for manual expand. */
export function ReferralActionsPanelShell({
    collapsed,
    onToggleCollapse,
}: {
    collapsed: boolean
    onToggleCollapse: () => void
}) {
    const width = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH

    return (
        <aside
            style={{
                width,
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                background: COLORS.white,
                borderLeft: `1px solid ${COLORS.ashSubtle}`,
                boxShadow: SHADOWS.card,
                fontFamily: FONT,
                transition: "width 0.2s ease",
                minHeight: 0,
                overflow: "hidden",
            }}
            aria-label="Referral actions"
        >
            <div
                style={{
                    flex: 1,
                    minHeight: 0,
                    display: "flex",
                    flexDirection: "column",
                    padding: collapsed ? "12px 8px 0" : "16px 16px 0",
                }}
            >
                {!collapsed ? (
                    <div
                        style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "24px 8px",
                        }}
                    >
                        <p
                            style={{
                                margin: 0,
                                fontSize: 13,
                                color: COLORS.ashMuted,
                                textAlign: "center",
                                lineHeight: 1.5,
                            }}
                        >
                            Select a referral to view actions.
                        </p>
                    </div>
                ) : (
                    <div style={{ flex: 1 }} />
                )}
                <EdgePanelCollapseFooter
                    collapsed={collapsed}
                    onToggleCollapse={onToggleCollapse}
                    edge="right"
                    panelLabel="actions panel"
                />
            </div>
        </aside>
    )
}

function PanelIcon({ children }: { children: React.ReactNode }) {
    return (
        <span style={{ display: "inline-flex", width: 18, height: 18, flexShrink: 0 }} aria-hidden>
            <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                {children}
            </svg>
        </span>
    )
}

export function ReferralActionsPanel({
    referral,
    shell,
    mode = "view",
    collapsed,
    onToggleCollapse,
    onClose,
    onStatusChange,
    onArchive,
    onRecover,
    onEdit,
    onOpenMessageThread,
    onOpenFullRecord,
    staffDirectory = [],
    currentStaffId = "",
    pendingTransfer,
    onAssignmentChange,
    onRequestTransfer,
}: Props) {
    const [pendingStatus, setPendingStatus] = useState<ReferralStatus | null>(null)
    const [pendingAssigneeId, setPendingAssigneeId] = useState<string | null | undefined>(undefined)
    const [transferDialogOpen, setTransferDialogOpen] = useState(false)
    const statusOptions = useMemo(() => KANBAN_COLUMNS.map((c) => ({ value: c.status, label: c.title })), [])
    const isStaff = shell === "staff"
    const width = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH
    const currentStaff = staffMemberById(staffDirectory, currentStaffId)
    const transferablePrograms = useMemo(
        () => (currentStaff ? transferableProgramsForReferral(currentStaff, referral) : []),
        [currentStaff, referral]
    )

    const stub = (label: string) => () => window.alert(`${label} (mock — wire to production modal)`)

    const handleAssigneeSelect = (staffId: string | null) => {
        if (!onAssignmentChange) return
        const current = referral.assigned_to_user_id ?? null
        if (staffId === current) return
        const fromStaff = staffMemberById(staffDirectory, current)
        const needsConfirm =
            fromStaff &&
            staffId !== null &&
            staffId !== currentStaffId &&
            current !== null
        if (needsConfirm) {
            setPendingAssigneeId(staffId)
            return
        }
        onAssignmentChange(referral.id, staffId)
    }

    const pendingFromLabel = referral.assignee_name ?? "Unassigned"
    const pendingToLabel = pendingAssigneeId
        ? (staffMemberById(staffDirectory, pendingAssigneeId)?.display_name ?? "Selected staff")
        : "Unassigned"

    const actionItems = isStaff
        ? [
              { id: "full", label: "View full record", icon: <PanelIcon><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></PanelIcon>, onClick: onOpenFullRecord ?? stub("View full record") },
              { id: "message", label: "Message thread", icon: <PanelIcon><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></PanelIcon>, onClick: onOpenMessageThread ?? stub("Messages") },
              { id: "docs", label: "Request documents", icon: <PanelIcon><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></PanelIcon>, onClick: stub("Request documents") },
              { id: "share", label: "Share link", icon: <PanelIcon><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></PanelIcon>, onClick: stub("Share link") },
              { id: "export", label: "Export options", icon: <PanelIcon><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></PanelIcon>, onClick: stub("Export options (Print / PDF, Export text)") },
              ...(onArchive
                  ? [{ id: "archive", label: "Archive", icon: <PanelIcon><rect x="2" y="4" width="20" height="5" rx="1" /><path d="M4 9v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9" /><path d="M10 13h4" /></PanelIcon>, onClick: onArchive }]
                  : []),
          ]
        : [
              { id: "full", label: "View full record", icon: <PanelIcon><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></PanelIcon>, onClick: onOpenFullRecord ?? stub("View full record") },
              ...(onEdit
                  ? [{ id: "edit", label: "Edit submission", icon: <PanelIcon><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></PanelIcon>, onClick: onEdit }]
                  : []),
              { id: "message", label: "Message staff", icon: <PanelIcon><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></PanelIcon>, onClick: onOpenMessageThread ?? stub("Message staff") },
              ...(onRecover
                  ? [{ id: "recover", label: "Recover to dashboard", icon: <PanelIcon><path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6.7 3" /></PanelIcon>, onClick: onRecover }]
                  : onArchive
                    ? [{ id: "archive", label: "Archive", icon: <PanelIcon><rect x="2" y="4" width="20" height="5" rx="1" /><path d="M4 9v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9" /><path d="M10 13h4" /></PanelIcon>, onClick: onArchive }]
                    : []),
          ]

    return (
        <>
            <aside
                style={{
                    width,
                    flexShrink: 0,
                    display: "flex",
                    flexDirection: "column",
                    background: COLORS.white,
                    borderLeft: `1px solid ${COLORS.ashSubtle}`,
                    boxShadow: SHADOWS.card,
                    fontFamily: FONT,
                    transition: "width 0.2s ease",
                    minHeight: 0,
                    overflow: "hidden",
                }}
                aria-label="Referral actions"
            >
                <div
                    style={{
                        flexShrink: 0,
                        padding: collapsed ? "14px 8px" : "16px 16px",
                        borderBottom: `1px solid ${COLORS.ashSubtle}`,
                        background: COLORS.sidebar,
                        color: COLORS.onChrome,
                        display: "flex",
                        alignItems: collapsed ? "center" : "flex-start",
                        justifyContent: collapsed ? "center" : "space-between",
                        gap: 10,
                    }}
                >
                    {collapsed ? (
                        <span
                            style={{
                                width: 32,
                                height: 32,
                                borderRadius: "50%",
                                background: COLORS.moonstone,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 12,
                                fontWeight: 700,
                                color: COLORS.ash,
                            }}
                            title={`${referral.client_first_name} ${referral.client_last_name}`}
                        >
                            {clientInitials(referral)}
                        </span>
                    ) : (
                        <>
                            <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.7, letterSpacing: "0.06em" }}>
                                    {mode === "edit" ? "EDITING" : "SELECTED CASE"}
                                </div>
                                <ClientName
                                    as="div"
                                    size="panel"
                                    style={{
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {referral.client_first_name} {referral.client_last_name}
                                </ClientName>
                                <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>{clientDisplayId(referral)}</div>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Close actions panel"
                                style={{
                                    ...iconOnlyBtn,
                                    border: "none",
                                    background: "rgba(255,255,255,0.12)",
                                    color: COLORS.onChrome,
                                }}
                            >
                                ×
                            </button>
                        </>
                    )}
                </div>

                <div
                    style={{
                        flex: 1,
                        minHeight: 0,
                        display: "flex",
                        flexDirection: "column",
                        padding: collapsed ? "12px 8px 0" : "16px 16px 0",
                    }}
                >
                    {collapsed ? (
                        <div
                            style={{
                                flex: 1,
                                minHeight: 0,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 8,
                                overflowY: "auto",
                            }}
                        >
                            {actionItems.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    title={item.label}
                                    aria-label={item.label}
                                    onClick={item.onClick}
                                    style={iconOnlyBtn}
                                >
                                    {item.icon}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div
                            style={{
                                flex: 1,
                                minHeight: 0,
                                overflowY: "auto",
                                display: "flex",
                                flexDirection: "column",
                                gap: 16,
                            }}
                        >
                        <ReferralMetaBadges referral={referral} layout="split" compact />

                        <div style={{ fontSize: 12, color: COLORS.ashMuted, lineHeight: 1.5 }}>
                            <div>
                                <strong style={{ color: COLORS.ash }}>Source:</strong> {referral.referral_source_name}
                            </div>
                            <div>
                                <strong style={{ color: COLORS.ash }}>Organization:</strong> {referral.organization}
                            </div>
                            <div>
                                <strong style={{ color: COLORS.ash }}>Submitted:</strong>{" "}
                                {formatDisplayDate(referral.created_at)}
                            </div>
                            {referral.assignee_name && (
                                <div>
                                    <strong style={{ color: COLORS.ash }}>Assignee:</strong> {referral.assignee_name}
                                </div>
                            )}
                        </div>

                        {isStaff && onStatusChange ? (
                            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: COLORS.ashMuted }}>
                                Status
                                <select
                                    value={referral.status}
                                    onChange={(e) => {
                                        const to = e.target.value as ReferralStatus
                                        if (to === referral.status) return
                                        setPendingStatus(to)
                                    }}
                                    style={{
                                        padding: "10px 12px",
                                        fontSize: 13,
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
                            </label>
                        ) : null}

                        {isStaff && onAssignmentChange && currentStaffId ? (
                            <ReferralStaffAssignmentFields
                                referral={referral}
                                staffDirectory={staffDirectory}
                                currentStaffId={currentStaffId}
                                transferablePrograms={transferablePrograms}
                                pendingTransfer={pendingTransfer}
                                onAssigneeSelect={handleAssigneeSelect}
                                onOpenTransferDialog={() => setTransferDialogOpen(true)}
                            />
                        ) : null}

                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: COLORS.ashMuted }}>
                                ACTIONS
                            </div>
                            {actionItems.map((item) => (
                                <button key={item.id} type="button" onClick={item.onClick} style={actionBtn}>
                                    {item.icon}
                                    {item.label}
                                </button>
                            ))}
                        </div>

                        {mode === "edit" && !isStaff && (
                            <p style={{ margin: 0, fontSize: 12, color: COLORS.ashMuted, lineHeight: 1.5 }}>
                                Edit mode — production will load the editable referral form fields here.
                            </p>
                        )}
                        </div>
                    )}

                    <EdgePanelCollapseFooter
                    collapsed={collapsed}
                    onToggleCollapse={onToggleCollapse}
                    edge="right"
                    panelLabel="actions panel"
                />
                </div>
            </aside>

            {pendingStatus && isStaff && onStatusChange && (
                <ConfirmStatusDialog
                    referral={referral}
                    nextStatus={pendingStatus}
                    onConfirm={() => {
                        onStatusChange(referral.id, pendingStatus)
                        setPendingStatus(null)
                    }}
                    onCancel={() => setPendingStatus(null)}
                />
            )}
            {pendingAssigneeId !== undefined && onAssignmentChange && (
                <ConfirmAssigneeDialog
                    referral={referral}
                    fromLabel={pendingFromLabel}
                    toLabel={pendingToLabel}
                    onConfirm={() => {
                        onAssignmentChange(referral.id, pendingAssigneeId)
                        setPendingAssigneeId(undefined)
                    }}
                    onCancel={() => setPendingAssigneeId(undefined)}
                />
            )}
            {transferDialogOpen && onRequestTransfer && (
                <ConfirmTransferDialog
                    referral={referral}
                    programs={transferablePrograms}
                    staffDirectory={staffDirectory}
                    onConfirm={(input) => {
                        onRequestTransfer(referral.id, input)
                        setTransferDialogOpen(false)
                    }}
                    onCancel={() => setTransferDialogOpen(false)}
                />
            )}
        </>
    )
}
