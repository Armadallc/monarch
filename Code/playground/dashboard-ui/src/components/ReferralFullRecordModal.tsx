import { useMemo, useState, type CSSProperties } from "react"
import { COLORS, FONT, RADIUS, SHADOWS, formatDisplayDate } from "@design"
import { staffMemberById } from "../referralAssignmentUtils"
import { transferableProgramsForReferral } from "../referralTransferUtils"
import { ClientName } from "./ClientName"
import { ConfirmAssigneeDialog } from "./ConfirmAssigneeDialog"
import { ConfirmStatusDialog } from "./ConfirmStatusDialog"
import { ConfirmTransferDialog } from "./ConfirmTransferDialog"
import { ReferralMetaBadges } from "./ReferralMetaBadges"
import { ReferralStaffAssignmentFields } from "./ReferralStaffAssignmentFields"
import {
    KANBAN_COLUMNS,
    STATUS_LABELS,
    type MockReferral,
    type MockReferralTransfer,
    type ReferralMessage,
    type ReferralStatus,
    type StaffMember,
} from "../types"
import { clientDisplayId } from "../utils"

export type FullRecordShell = "staff" | "portal"

type TabId = "record" | "messages" | "attachments" | "activity" | "actions"

type Props = {
    referral: MockReferral
    shell: FullRecordShell
    messages?: ReferralMessage[]
    onClose: () => void
    staffDirectory?: StaffMember[]
    currentStaffId?: string
    pendingTransfer?: MockReferralTransfer
    onStatusChange?: (id: string, status: ReferralStatus) => void
    onAssignmentChange?: (referralId: string, staffId: string | null) => void
    onRequestTransfer?: (
        referralId: string,
        input: { toProgram: MockReferral["program"]; toAssigneeId: string | null; notes: string }
    ) => void
}

const TABS: { id: TabId; label: string }[] = [
    { id: "record", label: "Record" },
    { id: "messages", label: "Messages" },
    { id: "attachments", label: "Attachments" },
    { id: "activity", label: "Activity" },
    { id: "actions", label: "Actions" },
]

const sectionTitle: CSSProperties = {
    margin: "0 0 10px",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.08em",
    color: COLORS.ashMuted,
    textTransform: "uppercase",
}

const fieldRow = (label: string, value: string) => (
    <div key={label} style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 12, fontSize: 13 }}>
        <span style={{ color: COLORS.ashMuted, fontWeight: 600 }}>{label}</span>
        <span style={{ color: COLORS.ash }}>{value}</span>
    </div>
)

export function ReferralFullRecordModal({
    referral,
    shell,
    messages = [],
    onClose,
    staffDirectory = [],
    currentStaffId = "",
    pendingTransfer,
    onStatusChange,
    onAssignmentChange,
    onRequestTransfer,
}: Props) {
    const [tab, setTab] = useState<TabId>("record")
    const [pendingStatus, setPendingStatus] = useState<ReferralStatus | null>(null)
    const [pendingAssigneeId, setPendingAssigneeId] = useState<string | null | undefined>(undefined)
    const [transferDialogOpen, setTransferDialogOpen] = useState(false)
    const isStaff = shell === "staff"
    const currentStaff = staffMemberById(staffDirectory, currentStaffId)
    const transferablePrograms = useMemo(
        () => (currentStaff ? transferableProgramsForReferral(currentStaff, referral) : []),
        [currentStaff, referral]
    )

    const handleAssigneeSelect = (staffId: string | null) => {
        if (!onAssignmentChange) return
        const current = referral.assigned_to_user_id ?? null
        if (staffId === current) return
        const fromStaff = staffMemberById(staffDirectory, current)
        const needsConfirm =
            fromStaff && staffId !== null && staffId !== currentStaffId && current !== null
        if (needsConfirm) {
            setPendingAssigneeId(staffId)
            return
        }
        onAssignmentChange(referral.id, staffId)
    }

    const mockActivity = useMemo(
        () => [
            { at: referral.created_at, text: "Referral submitted" },
            {
                at: referral.last_activity_at ?? referral.created_at,
                text: `Status: ${STATUS_LABELS[referral.status]}`,
            },
            ...(messages.length > 0
                ? [{ at: messages[messages.length - 1].created_at, text: "Message thread updated" }]
                : []),
        ],
        [referral, messages]
    )

    const mockAttachments = referral.has_attachments
        ? ["Court_Order.pdf", "ROI_Signed.pdf", "Psych_Eval_Summary.pdf"]
        : []

    const staffActionStubs = ["Request documents", "Share link", "Export (Print / PDF)"]
    const portalActionStubs = ["Edit submission", "Message staff", "Upload documents", "Archive"]

    return (
        <>
        <div
            role="dialog"
            aria-modal
            aria-labelledby="full-record-title"
            style={{
                position: "fixed",
                inset: 0,
                background: COLORS.overlay,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 2000,
                padding: 24,
                backdropFilter: "blur(8px)",
            }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                style={{
                    width: "min(920px, 100%)",
                    maxHeight: "min(88vh, 900px)",
                    display: "flex",
                    flexDirection: "column",
                    background: COLORS.white,
                    borderRadius: RADIUS.modal,
                    boxShadow: SHADOWS.modal,
                    fontFamily: FONT,
                    overflow: "hidden",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <header
                    style={{
                        flexShrink: 0,
                        padding: "20px 24px",
                        borderBottom: `1px solid ${COLORS.ashSubtle}`,
                        background: COLORS.sidebar,
                        color: COLORS.onChrome,
                    }}
                >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                        <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.75, letterSpacing: "0.06em" }}>
                                FULL RECORD
                            </div>
                            <ClientName as="h2" id="full-record-title" size="modal" style={{ margin: "4px 0 0" }}>
                                {referral.client_first_name} {referral.client_last_name}
                            </ClientName>
                            <div style={{ fontSize: 13, opacity: 0.8, marginTop: 6 }}>{clientDisplayId(referral)}</div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close full record"
                            style={{
                                flexShrink: 0,
                                width: 36,
                                height: 36,
                                border: "none",
                                borderRadius: RADIUS.small,
                                background: "rgba(255,255,255,0.12)",
                                color: COLORS.white,
                                fontSize: 22,
                                lineHeight: 1,
                                cursor: "pointer",
                            }}
                        >
                            ×
                        </button>
                    </div>
                    <div style={{ marginTop: 14 }}>
                        <ReferralMetaBadges referral={referral} />
                    </div>
                </header>

                <nav
                    style={{
                        flexShrink: 0,
                        display: "flex",
                        gap: 4,
                        padding: "0 16px",
                        borderBottom: `1px solid ${COLORS.ashSubtle}`,
                        background: COLORS.coconut,
                        overflowX: "auto",
                    }}
                    aria-label="Full record sections"
                >
                    {TABS.map((t) => {
                        const active = tab === t.id
                        return (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setTab(t.id)}
                                style={{
                                    flexShrink: 0,
                                    padding: "12px 14px",
                                    fontSize: 13,
                                    fontWeight: active ? 700 : 600,
                                    fontFamily: FONT,
                                    color: active ? COLORS.ash : COLORS.ashMuted,
                                    background: "transparent",
                                    border: "none",
                                    borderBottom: active ? `2px solid ${COLORS.gunmetal}` : "2px solid transparent",
                                    cursor: "pointer",
                                    marginBottom: -1,
                                }}
                            >
                                {t.label}
                            </button>
                        )
                    })}
                </nav>

                <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
                    {tab === "record" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                            <section>
                                <h3 style={sectionTitle}>Client</h3>
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    {fieldRow("Name", `${referral.client_first_name} ${referral.client_last_name}`)}
                                    {fieldRow("Referral ID", clientDisplayId(referral))}
                                    {fieldRow("Program", referral.program)}
                                </div>
                            </section>
                            <section>
                                <h3 style={sectionTitle}>Referral source</h3>
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    {fieldRow("Contact", referral.referral_source_name)}
                                    {fieldRow("Organization", referral.organization)}
                                    {fieldRow("Source type", referral.referral_source_type.replace(/_/g, " "))}
                                </div>
                            </section>
                            <section>
                                <h3 style={sectionTitle}>Case management</h3>
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    {fieldRow("Status", STATUS_LABELS[referral.status])}
                                    {fieldRow("Assignee", referral.assignee_name ?? "Unassigned")}
                                    {fieldRow("Submitted", formatDisplayDate(referral.created_at))}
                                    {fieldRow(
                                        "Last activity",
                                        formatDisplayDate(referral.last_activity_at ?? referral.created_at)
                                    )}
                                </div>
                            </section>
                            <p style={{ margin: 0, fontSize: 12, color: COLORS.ashMuted, lineHeight: 1.5 }}>
                                Mock full record — production SubmissionDetailModal includes all referral form fields,
                                section workflows, notes, and HIPAA audit.
                            </p>
                        </div>
                    )}

                    {tab === "messages" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {messages.length === 0 ? (
                                <p style={{ margin: 0, fontSize: 14, color: COLORS.ashMuted }}>No messages yet.</p>
                            ) : (
                                messages.map((m) => (
                                    <div
                                        key={m.id}
                                        style={{
                                            padding: "12px 14px",
                                            borderRadius: RADIUS.small,
                                            background: m.author_role === "staff" ? COLORS.moonstoneLight : COLORS.coconut,
                                            border: `1px solid ${COLORS.ashSubtle}`,
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: 11,
                                                fontWeight: 700,
                                                color: COLORS.ashMuted,
                                                marginBottom: 6,
                                            }}
                                        >
                                            {m.author_name} · {formatDisplayDate(m.created_at)}
                                        </div>
                                        <div style={{ fontSize: 14, color: COLORS.ash, lineHeight: 1.5 }}>{m.body}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {tab === "attachments" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {mockAttachments.length === 0 ? (
                                <p style={{ margin: 0, fontSize: 14, color: COLORS.ashMuted }}>No attachments on file.</p>
                            ) : (
                                mockAttachments.map((name) => (
                                    <div
                                        key={name}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            padding: "12px 14px",
                                            border: `1px solid ${COLORS.ashSubtle}`,
                                            borderRadius: RADIUS.small,
                                            fontSize: 13,
                                            color: COLORS.ash,
                                        }}
                                    >
                                        <span>{name}</span>
                                        <button
                                            type="button"
                                            onClick={() => window.alert(`Preview ${name} (mock)`)}
                                            style={{
                                                padding: "6px 12px",
                                                fontSize: 12,
                                                fontWeight: 600,
                                                fontFamily: FONT,
                                                border: `1px solid ${COLORS.ashSubtle}`,
                                                borderRadius: RADIUS.small,
                                                background: COLORS.white,
                                                cursor: "pointer",
                                            }}
                                        >
                                            View
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {tab === "activity" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {mockActivity.map((item, i) => (
                                <div
                                    key={`${item.at}-${i}`}
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "120px 1fr",
                                        gap: 12,
                                        fontSize: 13,
                                        paddingBottom: 10,
                                        borderBottom:
                                            i < mockActivity.length - 1 ? `1px solid ${COLORS.ashSubtle}` : undefined,
                                    }}
                                >
                                    <span style={{ color: COLORS.ashMuted }}>{formatDisplayDate(item.at)}</span>
                                    <span style={{ color: COLORS.ash }}>{item.text}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {tab === "actions" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            <p style={{ margin: 0, fontSize: 13, color: COLORS.ashMuted, lineHeight: 1.5 }}>
                                Same controls as the actions panel — use either surface while reviewing this record.
                            </p>
                            {isStaff && onStatusChange ? (
                                <label style={{ fontSize: 13, color: COLORS.ash, display: "flex", flexDirection: "column", gap: 6 }}>
                                    Status
                                    <select
                                        value={referral.status}
                                        onChange={(e) => {
                                            const to = e.target.value as ReferralStatus
                                            if (to !== referral.status) setPendingStatus(to)
                                        }}
                                        style={{
                                            padding: "8px 10px",
                                            fontSize: 13,
                                            fontFamily: FONT,
                                            border: `1px solid ${COLORS.ashSubtle}`,
                                            borderRadius: RADIUS.small,
                                        }}
                                    >
                                        {KANBAN_COLUMNS.map((c) => (
                                            <option key={c.status} value={c.status}>
                                                {c.title}
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
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                {(isStaff ? staffActionStubs : portalActionStubs).map((label) => (
                                    <button
                                        key={label}
                                        type="button"
                                        onClick={() => window.alert(`${label} (mock)`)}
                                        style={{
                                            padding: "8px 14px",
                                            fontSize: 13,
                                            fontWeight: 600,
                                            fontFamily: FONT,
                                            border: `1px solid ${COLORS.ashSubtle}`,
                                            borderRadius: RADIUS.small,
                                            background: COLORS.white,
                                            color: COLORS.ash,
                                            cursor: "pointer",
                                        }}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
            {pendingStatus && onStatusChange && (
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
                    fromLabel={referral.assignee_name ?? "Unassigned"}
                    toLabel={
                        pendingAssigneeId
                            ? (staffMemberById(staffDirectory, pendingAssigneeId)?.display_name ?? "Selected staff")
                            : "Unassigned"
                    }
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
