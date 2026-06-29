import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { COLORS, FONT } from "@design"
import { AppSidebar, type SidebarView } from "./components/AppSidebar"
import { PortalSidebar, type PortalSidebarView } from "./components/PortalSidebar"
import { PortalFiltersBar, DEFAULT_PORTAL_REFERRAL_FILTERS } from "./components/PortalFiltersBar"
import { PortalSummaryBar, type PortalFilter } from "./components/PortalSummaryBar"
import { CasesTabBar, type CasesTabId } from "./components/CasesTabBar"
import { MessagesWorkspace } from "./components/MessagesWorkspace"
import { InquiriesPanel } from "./components/InquiriesPanel"
import { ContactActionsPanel, ContactActionsPanelShell, type ContactPanelMode } from "./components/ContactActionsPanel"
import { ContactsListView } from "./components/ContactsListView"
import { ContactsSummaryBar } from "./components/ContactsSummaryBar"
import { ContactsToolbar } from "./components/ContactsToolbar"
import { OrganizationActionsPanel } from "./components/OrganizationActionsPanel"
import { OrganizationsListView } from "./components/OrganizationsListView"
import { OrganizationsSummaryBar } from "./components/OrganizationsSummaryBar"
import { OrganizationsToolbar } from "./components/OrganizationsToolbar"
import { ReferralActionsPanel, ReferralActionsPanelShell } from "./components/ReferralActionsPanel"
import { ReferralFullRecordModal } from "./components/ReferralFullRecordModal"
import { ReferralFiltersBar } from "./components/ReferralFiltersBar"
import { StaffDashboardHeader } from "./components/StaffDashboardHeader"
import type { StaffDashboardTab } from "./components/StaffDashboardTabBar"
import { ReferralKanbanBoard } from "./components/ReferralKanbanBoard"
import { ReferralTableView } from "./components/ReferralTableView"
import { ActivityFeedWorkspace } from "./components/ActivityFeedWorkspace"
import { StaffArchiveWorkspace } from "./components/StaffArchiveWorkspace"
import { AdminUsersWorkspace } from "./components/AdminUsersWorkspace"
import { StaffAccessDenied } from "./components/StaffAccessDenied"
import { DashboardHelpModal } from "./components/DashboardHelpModal"
import { PortalHelpModal } from "./components/PortalHelpModal"
import { PortalProfileModal } from "./components/PortalProfileModal"
import { StaffProfileModal } from "./components/StaffProfileModal"
import {
    DEFAULT_CONTACT_FILTERS,
    contactListStats,
    contactOrganizationOptions,
    contactsVisibleToUser,
    filterContacts,
    type ContactFilters,
} from "./contactUtils"
import { buildInitialContacts } from "./mockContacts"
import { INITIAL_MOCK_INQUIRIES } from "./mockInquiries"
import { INITIAL_MOCK_ORGANIZATIONS } from "./mockOrganizations"
import { resolveParticipantUsernames } from "./internalMessageUtils"
import {
    buildInitialInternalMessagesByConversation,
    INITIAL_INTERNAL_CONVERSATIONS,
} from "./mockInternalThreads"
import { buildInitialMessagesByReferral, PORTAL_MOCK_SOURCE_NAME } from "./mockReferralMessages"
import { INITIAL_MOCK_REFERRAL_TRANSFERS } from "./mockReferralTransfers"
import { MOCK_STAFF_DIRECTORY, staffProgramMemberships } from "./mockStaffDirectory"
import {
    INITIAL_BLOCKED_PORTAL_SOURCES,
    INITIAL_STAFF_ACCESS_RECORDS,
    PLAYGROUND_STAFF_PERSONAS,
    loadPlaygroundStaffEmail,
    savePlaygroundStaffEmail,
} from "./mockStaffAccess"
import {
    canManageStaffAllowlist,
    dashboardAccessDeniedReason,
    displayNameForStaffEmail,
    staffIdForEmail,
    staffRoleLabel,
    staffUsernameForEmail,
} from "./staffAccess"
import { INITIAL_MOCK_REFERRALS } from "./mockReferrals"
import { assigneeFieldsFromStaff, staffMemberById } from "./referralAssignmentUtils"
import {
    buildAcceptedTransfer,
    buildDeclinedTransfer,
    buildPendingTransferRequest,
    incomingPendingTransfers,
    pendingTransferForReferral,
} from "./referralTransferUtils"
import { IncomingTransfersBar } from "./components/IncomingTransfersBar"
import { filterOrganizations, organizationListStats } from "./organizationUtils"
import {
    DEFAULT_REFERRAL_FILTERS,
    DEFAULT_REFERRAL_SORT,
    applyPortalReferralFilters,
    applyPortalStatusFilter,
    filterAndSortReferrals,
    portalReferralFilterOptions,
    referralFilterOptions,
    type PortalReferralFilters,
    type ReferralFilters,
    type ReferralSort,
    type ReferralViewMode,
} from "./referralFilters"
import type {
    ActiveMessageSelection,
    InternalConversation,
    InternalMessage,
    MessageInboxFilter,
    MockContact,
    MockOrganization,
    MockReferral,
    MockReferralTransfer,
    OrganizationType,
    ReferralMessage,
    ReferralStatus,
} from "./types"
import { MOCK_STAFF_USER_ID } from "./types"
import type { DashboardProgram } from "./programBranding"
import { useKanbanArchiveColumnVisible } from "./kanbanArchiveColumn"
import {
    loadPortalProfile,
    portalDisplayNameFromProfile,
    savePortalProfile,
    type PortalProfileTab,
} from "./portalSourceProfile"
import {
    loadStaffProfile,
    saveStaffProfile,
    staffDisplayNameFromProfile,
    type StaffProfileTab,
} from "./staffProfile"
import { clientDisplayId } from "./utils"
import { exportContactsCsv, exportOrganizationsCsv } from "./directoryExport"

type ShellMode = "staff" | "portal"

const STAFF_PROGRAMS: DashboardProgram[] = ["Competency", "Mental Health", "Sober Living", "Launch"]
/** Sidebar + cases tab state live here so collapse and Referrals/Inquiries persist across switches. */
export default function App() {
    const [mode, setMode] = useState<ShellMode>("staff")
    const [staffProgram, setStaffProgram] = useState<DashboardProgram>("Competency")
    const [referrals, setReferrals] = useState<MockReferral[]>(INITIAL_MOCK_REFERRALS)
    const [inquiries] = useState(INITIAL_MOCK_INQUIRIES)
    const [sidebarView, setSidebarView] = useState<SidebarView>("dashboard")
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [portalSidebarView, setPortalSidebarView] = useState<PortalSidebarView>("referrals")
    const [portalSidebarCollapsed, setPortalSidebarCollapsed] = useState(false)
    const [actionsPanelCollapsed, setActionsPanelCollapsed] = useState(true)
    const [staffDashboardTab, setStaffDashboardTab] = useState<StaffDashboardTab>("cases")
    const [casesTab, setCasesTab] = useState<CasesTabId>("referrals")
    const [organizations, setOrganizations] = useState<MockOrganization[]>(INITIAL_MOCK_ORGANIZATIONS)
    const [orgSearch, setOrgSearch] = useState("")
    const [orgTypeFilter, setOrgTypeFilter] = useState<OrganizationType | "all">("all")
    const [selectedOrgIds, setSelectedOrgIds] = useState<Set<string>>(() => new Set())
    const [contacts, setContacts] = useState<MockContact[]>(buildInitialContacts)
    const [contactFilters, setContactFilters] = useState<ContactFilters>(DEFAULT_CONTACT_FILTERS)
    const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(() => new Set())
    const [selectedReferral, setSelectedReferral] = useState<MockReferral | null>(null)
    const [fullRecordReferralId, setFullRecordReferralId] = useState<string | null>(null)
    const [selectedOrganization, setSelectedOrganization] = useState<MockOrganization | null>(null)
    const [selectedContact, setSelectedContact] = useState<MockContact | null>(null)
    const [contactPanelMode, setContactPanelMode] = useState<ContactPanelMode>("edit")
    const [detailPanelMode, setDetailPanelMode] = useState<"view" | "edit">("view")
    const [portalArchivedIds, setPortalArchivedIds] = useState<Set<string>>(() => new Set())
    const [staffArchivedIds, setStaffArchivedIds] = useState<Set<string>>(() => new Set())
    const [referralTransfers, setReferralTransfers] = useState<MockReferralTransfer[]>(
        () => INITIAL_MOCK_REFERRAL_TRANSFERS
    )
    const [messagesByReferral, setMessagesByReferral] = useState<Record<string, ReferralMessage[]>>(
        buildInitialMessagesByReferral
    )
    const [activeMessageSelection, setActiveMessageSelection] = useState<ActiveMessageSelection>(null)
    const [messageInboxFilter, setMessageInboxFilter] = useState<MessageInboxFilter>("all")
    const [messageThreadOpenIds, setMessageThreadOpenIds] = useState<Set<string>>(() => new Set())
    const [internalConversations, setInternalConversations] = useState<InternalConversation[]>(
        INITIAL_INTERNAL_CONVERSATIONS
    )
    const [messagesByInternal, setMessagesByInternal] = useState<Record<string, InternalMessage[]>>(
        buildInitialInternalMessagesByConversation
    )
    const [staffProfile, setStaffProfile] = useState(loadStaffProfile)
    const [staffProfileModalOpen, setStaffProfileModalOpen] = useState(false)
    const [staffProfileModalTab, setStaffProfileModalTab] = useState<StaffProfileTab>("profile")
    const [helpModalOpen, setHelpModalOpen] = useState(false)
    const [portalProfile, setPortalProfile] = useState(loadPortalProfile)
    const [portalProfileModalOpen, setPortalProfileModalOpen] = useState(false)
    const [portalProfileModalTab, setPortalProfileModalTab] = useState<PortalProfileTab>("profile")
    const [portalHelpModalOpen, setPortalHelpModalOpen] = useState(false)
    const [staffAccessRecords, setStaffAccessRecords] = useState(INITIAL_STAFF_ACCESS_RECORDS)
    const [blockedPortalSources, setBlockedPortalSources] = useState(INITIAL_BLOCKED_PORTAL_SOURCES)
    const [staffSessionEmail, setStaffSessionEmail] = useState(loadPlaygroundStaffEmail)
    const staffDisplayName = staffDisplayNameFromProfile(staffProfile)
    const portalDisplayName = portalDisplayNameFromProfile(portalProfile)

    const currentStaffId = useMemo(
        () => staffIdForEmail(staffAccessRecords, staffSessionEmail),
        [staffAccessRecords, staffSessionEmail]
    )
    const currentStaffUsername = useMemo(
        () => staffUsernameForEmail(staffSessionEmail),
        [staffSessionEmail]
    )
    const sessionDisplayName = useMemo(
        () => displayNameForStaffEmail(staffAccessRecords, staffSessionEmail),
        [staffAccessRecords, staffSessionEmail]
    )
    const sessionRoleLabel = useMemo(
        () => staffRoleLabel(staffAccessRecords, staffSessionEmail, staffProgram),
        [staffAccessRecords, staffSessionEmail, staffProgram]
    )
    const staffAccessDenied = useMemo(
        () => dashboardAccessDeniedReason(staffAccessRecords, staffSessionEmail, staffProgram),
        [staffAccessRecords, staffSessionEmail, staffProgram]
    )
    const staffHasDashboardAccess = staffAccessDenied === null
    const showAdminNav = useMemo(
        () => canManageStaffAllowlist(staffAccessRecords, staffSessionEmail, staffProgram),
        [staffAccessRecords, staffSessionEmail, staffProgram]
    )

    useEffect(() => {
        if (sidebarView === "admin" && !showAdminNav) {
            setSidebarView("dashboard")
        }
    }, [sidebarView, showAdminNav])

    const handleStaffPersonaChange = useCallback((email: string) => {
        const normalized = email.trim().toLowerCase()
        setStaffSessionEmail(normalized)
        savePlaygroundStaffEmail(normalized)
    }, [])

    const staffHasUnreadMessages = useMemo(
        () =>
            referrals.some((r) => r.has_unread_messages) ||
            internalConversations.some((c) => c.unread),
        [referrals, internalConversations]
    )

    const portalHasUnreadMessages = useMemo(
        () => referrals.some((r) => r.has_unread_messages),
        [referrals]
    )

    const clearDetailPanels = useCallback(() => {
        setSelectedReferral(null)
        setSelectedOrganization(null)
        setSelectedContact(null)
        setFullRecordReferralId(null)
    }, [])

    const switchShellMode = useCallback(
        (next: ShellMode) => {
            setMode(next)
            clearDetailPanels()
        },
        [clearDetailPanels]
    )

    const handleStatusChange = useCallback((id: string, status: ReferralStatus) => {
        setReferrals((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
        setSelectedReferral((prev) => (prev?.id === id ? { ...prev, status } : prev))
    }, [])

    const patchReferral = useCallback((id: string, patch: Partial<MockReferral>) => {
        setReferrals((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
        setSelectedReferral((prev) => (prev?.id === id ? { ...prev, ...patch } : prev))
    }, [])

    const handleAssignmentChange = useCallback(
        (id: string, staffId: string | null) => {
            const staff = staffMemberById(MOCK_STAFF_DIRECTORY, staffId)
            const fields = assigneeFieldsFromStaff(staff)
            const now = new Date().toISOString().slice(0, 10)
            patchReferral(id, { ...fields, last_activity_at: now })
        },
        [patchReferral]
    )

    const handleRequestTransfer = useCallback(
        (
            id: string,
            input: { toProgram: MockReferral["program"]; toAssigneeId: string | null; notes: string }
        ) => {
            const referral = referrals.find((r) => r.id === id)
            if (!referral) return
            const { transfer, referralPatch } = buildPendingTransferRequest({
                referral,
                toProgram: input.toProgram,
                toAssigneeId: input.toAssigneeId,
                notes: input.notes,
                requestedByStaffId: currentStaffId,
            })
            setReferralTransfers((prev) => [...prev, transfer])
            patchReferral(id, referralPatch)
        },
        [referrals, patchReferral, currentStaffId]
    )

    const handleAcceptTransfer = useCallback(
        (transferId: string) => {
            const transfer = referralTransfers.find((t) => t.id === transferId)
            if (!transfer || transfer.status !== "pending") return
            const { transferPatch, referralPatch } = buildAcceptedTransfer(transfer, MOCK_STAFF_DIRECTORY)
            setReferralTransfers((prev) =>
                prev.map((t) => (t.id === transferId ? { ...t, ...transferPatch } : t))
            )
            patchReferral(transfer.referral_id, referralPatch)
        },
        [referralTransfers, patchReferral]
    )

    const handleDeclineTransfer = useCallback(
        (transferId: string) => {
            const transfer = referralTransfers.find((t) => t.id === transferId)
            if (!transfer || transfer.status !== "pending") return
            const { transferPatch, referralPatch } = buildDeclinedTransfer()
            setReferralTransfers((prev) =>
                prev.map((t) => (t.id === transferId ? { ...t, ...transferPatch } : t))
            )
            patchReferral(transfer.referral_id, referralPatch)
        },
        [referralTransfers, patchReferral]
    )

    const referralsById = useMemo(
        () => Object.fromEntries(referrals.map((r) => [r.id, r])),
        [referrals]
    )

    const incomingTransfers = useMemo(
        () => incomingPendingTransfers(referralTransfers, staffProgramMemberships(currentStaffId)),
        [referralTransfers, currentStaffId]
    )

    const handleCloseReferral = useCallback(() => {
        setSelectedReferral(null)
        setActionsPanelCollapsed(true)
    }, [])

    const handleOpenContact = useCallback((contact: MockContact, panelMode: ContactPanelMode = "edit") => {
        setSelectedReferral(null)
        setSelectedOrganization(null)
        setSelectedContact(contact)
        setContactPanelMode(panelMode)
        setActionsPanelCollapsed(false)
    }, [])

    const handleCloseContact = useCallback(() => {
        if (selectedContact?.id.startsWith("contact-user-new-") && contactPanelMode === "create") {
            setContacts((prev) => prev.filter((c) => c.id !== selectedContact.id))
        }
        setSelectedContact(null)
    }, [selectedContact, contactPanelMode])

    const handleSaveContact = useCallback(
        (updated: MockContact) => {
            setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
            setSelectedContact(updated)
            if (contactPanelMode === "create") {
                setContactPanelMode("edit")
            }
        },
        [contactPanelMode]
    )

    /** Opening referral detail marks messages read (message icon clears on card). */
    const handleOpenReferral = useCallback((referral: MockReferral, mode: "view" | "edit" = "view") => {
        setDetailPanelMode(mode)
        setSelectedOrganization(null)
        setSelectedContact(null)
        setSelectedReferral(referral)
        setActionsPanelCollapsed(false)
        if (referral.has_unread_messages) {
            setReferrals((prev) =>
                prev.map((r) => (r.id === referral.id ? { ...r, has_unread_messages: false } : r))
            )
        }
    }, [])

    const handleOpenFullRecord = useCallback((referral: MockReferral) => {
        setFullRecordReferralId(referral.id)
    }, [])

    const fullRecordReferral = useMemo(
        () =>
            fullRecordReferralId
                ? (referrals.find((r) => r.id === fullRecordReferralId) ?? null)
                : null,
        [fullRecordReferralId, referrals]
    )

    const applyArchiveReferrals = useCallback(
        (ids: string[], shell: ShellMode) => {
            if (ids.length === 0) return
            if (shell === "portal") {
                setPortalArchivedIds((prev) => new Set([...prev, ...ids]))
            } else {
                setStaffArchivedIds((prev) => new Set([...prev, ...ids]))
            }
            if (selectedReferral && ids.includes(selectedReferral.id)) {
                setSelectedReferral(null)
                setFullRecordReferralId(null)
                setActionsPanelCollapsed(true)
            }
        },
        [selectedReferral]
    )

    const handleArchivePortalReferral = useCallback(
        (referral: MockReferral) => {
            const label = clientDisplayId(referral)
            if (
                !window.confirm(
                    `Archive ${label}? This hides the referral from your dashboard only — admissions still sees it. You can recover it from Archive anytime.`
                )
            ) {
                return
            }
            applyArchiveReferrals([referral.id], "portal")
        },
        [applyArchiveReferrals]
    )

    const staffActiveReferrals = useMemo(
        () => referrals.filter((r) => !staffArchivedIds.has(r.id)),
        [referrals, staffArchivedIds]
    )

    const handleRecoverPortalReferrals = useCallback((ids: string[]) => {
        if (ids.length === 0) return
        setPortalArchivedIds((prev) => {
            const next = new Set(prev)
            ids.forEach((id) => next.delete(id))
            return next
        })
    }, [])

    const handleRecoverStaffReferrals = useCallback((ids: string[]) => {
        if (ids.length === 0) return
        setStaffArchivedIds((prev) => {
            const next = new Set(prev)
            ids.forEach((id) => next.delete(id))
            return next
        })
        if (selectedReferral && ids.includes(selectedReferral.id)) {
            setSelectedReferral(null)
            setFullRecordReferralId(null)
            setActionsPanelCollapsed(true)
        }
    }, [selectedReferral])

    const handleMessageSelectionChange = useCallback((selection: ActiveMessageSelection) => {
        setActiveMessageSelection(selection)
        if (selection?.kind === "referral") {
            setMessageThreadOpenIds((prev) => new Set([...prev, selection.id]))
        }
    }, [])

    const handleMarkMessageThreadRead = useCallback((referralId: string) => {
        setReferrals((prev) =>
            prev.map((r) => (r.id === referralId ? { ...r, has_unread_messages: false } : r))
        )
    }, [])

    const handleMarkInternalRead = useCallback((conversationId: string) => {
        setInternalConversations((prev) =>
            prev.map((c) => (c.id === conversationId ? { ...c, unread: false } : c))
        )
    }, [])

    const handleOpenMessageThread = useCallback(
        (referral: MockReferral) => {
            setActiveMessageSelection({ kind: "referral", id: referral.id })
            setMessageThreadOpenIds((prev) => new Set([...prev, referral.id]))
            clearDetailPanels()
            setReferrals((prev) =>
                prev.map((r) => (r.id === referral.id ? { ...r, has_unread_messages: false } : r))
            )
            if (mode === "staff") setSidebarView("messages")
            else setPortalSidebarView("messages")
        },
        [mode, clearDetailPanels]
    )

    const handleSendReferralMessage = useCallback(
        (referralId: string, body: string) => {
            const authorRole = mode === "staff" ? ("staff" as const) : ("source" as const)
            const authorName = mode === "staff" ? staffDisplayName : PORTAL_MOCK_SOURCE_NAME
            const message: ReferralMessage = {
                id: `msg-${referralId}-${Date.now()}`,
                referral_id: referralId,
                author_role: authorRole,
                author_name: authorName,
                body,
                created_at: new Date().toISOString(),
            }
            setMessagesByReferral((prev) => ({
                ...prev,
                [referralId]: [...(prev[referralId] ?? []), message],
            }))
            setMessageThreadOpenIds((prev) => new Set([...prev, referralId]))
        },
        [mode, staffDisplayName]
    )

    const handleSendInternalMessage = useCallback((conversationId: string, body: string) => {
        const message: InternalMessage = {
            id: `imsg-${conversationId}-${Date.now()}`,
            conversation_id: conversationId,
            author_username: currentStaffUsername,
            author_name: sessionDisplayName,
            body,
            created_at: new Date().toISOString(),
        }
        setMessagesByInternal((prev) => ({
            ...prev,
            [conversationId]: [...(prev[conversationId] ?? []), message],
        }))
    }, [currentStaffUsername, sessionDisplayName])

    const handleCreateInternalThread = useCallback(
        (payload: { subject: string; recipientInput: string; firstMessage: string }): string => {
            const id = `int-new-${Date.now()}`
            const participants = resolveParticipantUsernames(payload.recipientInput, currentStaffUsername)
            const conversation: InternalConversation = {
                id,
                subject: payload.subject,
                participant_usernames: participants,
                created_by_username: currentStaffUsername,
                created_at: new Date().toISOString(),
                unread: false,
            }
            setInternalConversations((prev) => [conversation, ...prev])
            if (payload.firstMessage.trim()) {
                const message: InternalMessage = {
                    id: `imsg-${id}-1`,
                    conversation_id: id,
                    author_username: currentStaffUsername,
                    author_name: sessionDisplayName,
                    body: payload.firstMessage.trim(),
                    created_at: new Date().toISOString(),
                }
                setMessagesByInternal((prev) => ({
                    ...prev,
                    [id]: [message],
                }))
            } else {
                setMessagesByInternal((prev) => ({ ...prev, [id]: [] }))
            }
            return id
        },
        [currentStaffUsername, sessionDisplayName]
    )

    const handleOpenReferralFromMessages = useCallback(
        (referral: MockReferral) => {
            if (mode === "staff") {
                setSidebarView("dashboard")
                setStaffDashboardTab("cases")
                setCasesTab("referrals")
            } else {
                setPortalSidebarView("referrals")
            }
            handleOpenReferral(referral, "view")
        },
        [mode, handleOpenReferral]
    )

    const inquiryCount = inquiries.length

    const activeReferral = useMemo(
        () =>
            selectedReferral
                ? referrals.find((r) => r.id === selectedReferral.id) ?? selectedReferral
                : null,
        [referrals, selectedReferral]
    )

    const showContactActionsRail = useMemo(() => {
        return mode === "staff" && sidebarView === "dashboard" && staffDashboardTab === "contacts"
    }, [mode, sidebarView, staffDashboardTab])

    const showReferralActionsRail = useMemo(() => {
        if (selectedContact || selectedOrganization) return false
        if (showContactActionsRail) return false
        if (mode === "staff") {
            return (
                (sidebarView === "dashboard" && staffDashboardTab === "cases" && casesTab === "referrals") ||
                sidebarView === "archive"
            )
        }
        return mode === "portal" && (portalSidebarView === "referrals" || portalSidebarView === "archive")
    }, [
        mode,
        sidebarView,
        staffDashboardTab,
        casesTab,
        portalSidebarView,
        selectedContact,
        selectedOrganization,
        showContactActionsRail,
    ])

    const messagesWorkspace = (
        <div style={{ margin: "-20px -24px", flex: 1, minHeight: 0, display: "flex" }}>
            <MessagesWorkspace
                shell={mode === "staff" ? "staff" : "portal"}
                referrals={referrals}
                messagesByReferral={messagesByReferral}
                internalConversations={internalConversations}
                messagesByInternal={messagesByInternal}
                selection={activeMessageSelection}
                onSelectionChange={handleMessageSelectionChange}
                inboxFilter={messageInboxFilter}
                onInboxFilterChange={setMessageInboxFilter}
                onSendReferralMessage={handleSendReferralMessage}
                onSendInternalMessage={handleSendInternalMessage}
                onCreateInternalThread={handleCreateInternalThread}
                onMarkReferralRead={handleMarkMessageThreadRead}
                onMarkInternalRead={handleMarkInternalRead}
                onOpenReferral={handleOpenReferralFromMessages}
                staffDisplayName={mode === "staff" ? sessionDisplayName : staffDisplayName}
                openThreadIds={messageThreadOpenIds}
            />
        </div>
    )

    return (
        <div
            style={{
                minHeight: "100vh",
                height: "100vh",
                display: "flex",
                flexDirection: "column",
                fontFamily: FONT,
                background: COLORS.shell,
                color: COLORS.ash,
            }}
        >
            <header
                style={{
                    flexShrink: 0,
                    padding: "12px 20px",
                    background: COLORS.white,
                    borderBottom: `1px solid ${COLORS.ashSubtle}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                }}
            >
                <div>
                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", color: COLORS.ashMuted }}>
                        UI PLAYGROUND
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.ash }}>
                        Referral Dashboard & Portal — Kanban prototype
                    </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    {mode === "staff" && (
                        <label
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                fontSize: 12,
                                fontWeight: 600,
                                color: COLORS.ashMuted,
                            }}
                            title="Simulate signed-in @monarchcompetency.com staff"
                        >
                            Staff session
                            <select
                                value={staffSessionEmail}
                                onChange={(e) => handleStaffPersonaChange(e.target.value)}
                                style={{
                                    padding: "8px 12px",
                                    fontSize: 13,
                                    fontFamily: FONT,
                                    border: `1px solid ${COLORS.ashSubtle}`,
                                    borderRadius: 8,
                                    background: COLORS.white,
                                    color: COLORS.ash,
                                    cursor: "pointer",
                                    maxWidth: 280,
                                }}
                            >
                                {PLAYGROUND_STAFF_PERSONAS.map((persona) => (
                                    <option key={persona.id} value={persona.email}>
                                        {persona.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    )}
                    {mode === "staff" && (
                        <label
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                fontSize: 12,
                                fontWeight: 600,
                                color: COLORS.ashMuted,
                            }}
                        >
                            Program
                            <select
                                value={staffProgram}
                                onChange={(e) => setStaffProgram(e.target.value as DashboardProgram)}
                                style={{
                                    padding: "8px 12px",
                                    fontSize: 13,
                                    fontFamily: FONT,
                                    border: `1px solid ${COLORS.ashSubtle}`,
                                    borderRadius: 8,
                                    background: COLORS.white,
                                    color: COLORS.ash,
                                    cursor: "pointer",
                                }}
                            >
                                {STAFF_PROGRAMS.map((program) => (
                                    <option key={program} value={program}>
                                        {program}
                                    </option>
                                ))}
                            </select>
                        </label>
                    )}
                    <ModeButton active={mode === "staff"} onClick={() => switchShellMode("staff")}>
                        Admissions (staff)
                    </ModeButton>
                    <ModeButton active={mode === "portal"} onClick={() => switchShellMode("portal")}>
                        Referral source portal
                    </ModeButton>
                </div>
            </header>

            <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
                {mode === "staff" && staffHasDashboardAccess && (
                    <AppSidebar
                        active={sidebarView}
                        onNavigate={setSidebarView}
                        collapsed={sidebarCollapsed}
                        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
                        program={staffProgram}
                        userName={sessionDisplayName}
                        userRole={sessionRoleLabel}
                        onLogout={() => {
                            // Playground stub — wire to Supabase signOut in production
                            window.alert("Logout (mock)")
                        }}
                        onOpenProfileModal={(tab) => {
                            setStaffProfileModalTab(tab)
                            setStaffProfileModalOpen(true)
                        }}
                        onOpenHelpModal={() => setHelpModalOpen(true)}
                        hasUnreadMessages={staffHasUnreadMessages}
                        showAdminNav={showAdminNav}
                    />
                )}

                {mode === "portal" && (
                    <PortalSidebar
                        active={portalSidebarView}
                        onNavigate={setPortalSidebarView}
                        collapsed={portalSidebarCollapsed}
                        onToggleCollapse={() => setPortalSidebarCollapsed((c) => !c)}
                        userName={portalDisplayName}
                        userRole="Referral Source"
                        onLogout={() => window.alert("Logout (mock)")}
                        onOpenProfileModal={(tab) => {
                            setPortalProfileModalTab(tab)
                            setPortalProfileModalOpen(true)
                        }}
                        onOpenHelpModal={() => setPortalHelpModalOpen(true)}
                        hasUnreadMessages={portalHasUnreadMessages}
                    />
                )}

                <main
                    style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        minWidth: 0,
                        minHeight: 0,
                        padding: "20px 24px",
                        overflow: "hidden",
                    }}
                >
                    {mode === "portal" && portalSidebarView === "referrals" && (
                        <PortalReferralsWorkspace
                            referrals={referrals}
                            archivedIds={portalArchivedIds}
                            onOpenReferral={(r) => handleOpenReferral(r, "view")}
                            onEditReferral={(r) => handleOpenReferral(r, "edit")}
                            onArchiveReferral={handleArchivePortalReferral}
                            onArchiveReferrals={(ids) => applyArchiveReferrals(ids, "portal")}
                        />
                    )}

                    {mode === "portal" && portalSidebarView === "archive" && (
                        <PortalArchiveWorkspace
                            referrals={referrals}
                            archivedIds={portalArchivedIds}
                            onOpenReferral={(r) => handleOpenReferral(r, "view")}
                            onRecoverReferrals={handleRecoverPortalReferrals}
                        />
                    )}

                    {mode === "portal" && portalSidebarView === "messages" && messagesWorkspace}

                    {mode === "staff" && !staffHasDashboardAccess && staffAccessDenied && (
                        <StaffAccessDenied
                            email={staffSessionEmail}
                            program={staffProgram}
                            reason={staffAccessDenied}
                        />
                    )}

                    {mode === "staff" && staffHasDashboardAccess && sidebarView === "dashboard" && (
                        <StaffDashboardWorkspace
                            dashboardTab={staffDashboardTab}
                            onDashboardTabChange={setStaffDashboardTab}
                            casesTab={casesTab}
                            onCasesTabChange={setCasesTab}
                            inquiryCount={inquiryCount}
                            referrals={staffActiveReferrals}
                            inquiries={inquiries}
                            onArchiveReferrals={(ids) => applyArchiveReferrals(ids, "staff")}
                            organizations={organizations}
                            orgSearch={orgSearch}
                            orgTypeFilter={orgTypeFilter}
                            selectedOrgIds={selectedOrgIds}
                            onOrgSearchChange={setOrgSearch}
                            onOrgTypeFilterChange={setOrgTypeFilter}
                            onSelectedOrgIdsChange={setSelectedOrgIds}
                            onOrganizationsChange={setOrganizations}
                            contacts={contacts}
                            contactFilters={contactFilters}
                            selectedContactIds={selectedContactIds}
                            onContactFiltersChange={setContactFilters}
                            onSelectedContactIdsChange={setSelectedContactIds}
                            onContactsChange={setContacts}
                            onOpenOrganization={(org) => {
                                setSelectedReferral(null)
                                setSelectedContact(null)
                                setSelectedOrganization(org)
                            }}
                            onOpenContact={handleOpenContact}
                            onStatusChange={handleStatusChange}
                            onOpenReferral={handleOpenReferral}
                            incomingTransfers={incomingTransfers}
                            referralsById={referralsById}
                            onAcceptTransfer={handleAcceptTransfer}
                            onDeclineTransfer={handleDeclineTransfer}
                        />
                    )}

                    {mode === "staff" && staffHasDashboardAccess && sidebarView === "messages" && messagesWorkspace}

                    {mode === "staff" && staffHasDashboardAccess && sidebarView === "activity" && (
                        <ActivityFeedWorkspace
                            referrals={referrals}
                            transfers={referralTransfers}
                            messagesByReferral={messagesByReferral}
                            staffDirectory={MOCK_STAFF_DIRECTORY}
                            currentStaffId={currentStaffId}
                            onOpenReferral={(r) => handleOpenReferral(r, "view")}
                        />
                    )}

                    {mode === "staff" && staffHasDashboardAccess && sidebarView === "archive" && (
                        <StaffArchiveWorkspace
                            referrals={referrals}
                            archivedIds={staffArchivedIds}
                            onOpenReferral={(r) => handleOpenReferral(r, "view")}
                            onRecoverReferrals={handleRecoverStaffReferrals}
                        />
                    )}

                    {mode === "staff" && staffHasDashboardAccess && sidebarView === "admin" && (
                        <AdminUsersWorkspace
                            program={staffProgram}
                            actorEmail={staffSessionEmail}
                            memberships={staffAccessRecords}
                            onMembershipsChange={setStaffAccessRecords}
                            blockedPortalSources={blockedPortalSources}
                            onBlockedPortalSourcesChange={setBlockedPortalSources}
                            referrals={referrals}
                        />
                    )}
                </main>

                {showContactActionsRail &&
                    (selectedContact ? (
                        <ContactActionsPanel
                            key={selectedContact.id}
                            contact={selectedContact}
                            mode={contactPanelMode}
                            referrals={referrals}
                            collapsed={actionsPanelCollapsed}
                            onToggleCollapse={() => setActionsPanelCollapsed((c) => !c)}
                            onClose={handleCloseContact}
                            onSave={handleSaveContact}
                        />
                    ) : (
                        <ContactActionsPanelShell
                            collapsed={actionsPanelCollapsed}
                            onToggleCollapse={() => setActionsPanelCollapsed((c) => !c)}
                        />
                    ))}

                {selectedOrganization && mode === "staff" && sidebarView !== "messages" && !selectedContact && !showContactActionsRail && (
                    <OrganizationActionsPanel
                        key={selectedOrganization.id}
                        organization={selectedOrganization}
                        referrals={referrals}
                        collapsed={actionsPanelCollapsed}
                        onToggleCollapse={() => setActionsPanelCollapsed((c) => !c)}
                        onClose={() => setSelectedOrganization(null)}
                        onSave={(updated) => {
                            setOrganizations((prev) =>
                                prev.map((o) => (o.id === updated.id ? updated : o))
                            )
                            setSelectedOrganization(updated)
                        }}
                    />
                )}

                {showReferralActionsRail &&
                    (activeReferral ? (
                        <ReferralActionsPanel
                            referral={activeReferral}
                            shell={mode === "staff" ? "staff" : "portal"}
                            mode={detailPanelMode}
                            collapsed={actionsPanelCollapsed}
                            onToggleCollapse={() => setActionsPanelCollapsed((c) => !c)}
                            onClose={handleCloseReferral}
                            onStatusChange={mode === "staff" ? handleStatusChange : undefined}
                            onEdit={
                                mode === "portal"
                                    ? () => setDetailPanelMode("edit")
                                    : undefined
                            }
                            onArchive={
                                mode === "portal" && portalSidebarView !== "archive"
                                    ? () => handleArchivePortalReferral(activeReferral)
                                    : mode === "staff" && sidebarView !== "archive"
                                      ? () => {
                                            const label = clientDisplayId(activeReferral)
                                            if (
                                                window.confirm(
                                                    `Archive ${label}? This hides the referral from your admissions dashboard. The record is not deleted.`
                                                )
                                            ) {
                                                applyArchiveReferrals([activeReferral.id], "staff")
                                            }
                                        }
                                      : undefined
                            }
                            onRecover={
                                mode === "portal" && portalSidebarView === "archive"
                                    ? () => handleRecoverPortalReferrals([activeReferral.id])
                                    : mode === "staff" && sidebarView === "archive"
                                      ? () => handleRecoverStaffReferrals([activeReferral.id])
                                      : undefined
                            }
                            onOpenMessageThread={() => handleOpenMessageThread(activeReferral)}
                            onOpenFullRecord={() => handleOpenFullRecord(activeReferral)}
                            staffDirectory={MOCK_STAFF_DIRECTORY}
                            currentStaffId={currentStaffId}
                            pendingTransfer={pendingTransferForReferral(referralTransfers, activeReferral.id)}
                            onAssignmentChange={
                                mode === "staff" ? handleAssignmentChange : undefined
                            }
                            onRequestTransfer={mode === "staff" ? handleRequestTransfer : undefined}
                        />
                    ) : (
                        <ReferralActionsPanelShell
                            collapsed={actionsPanelCollapsed}
                            onToggleCollapse={() => setActionsPanelCollapsed((c) => !c)}
                        />
                    ))}

                {fullRecordReferral && (
                    <ReferralFullRecordModal
                        referral={fullRecordReferral}
                        shell={mode}
                        messages={messagesByReferral[fullRecordReferral.id]}
                        onClose={() => setFullRecordReferralId(null)}
                        staffDirectory={MOCK_STAFF_DIRECTORY}
                        currentStaffId={currentStaffId}
                        pendingTransfer={pendingTransferForReferral(referralTransfers, fullRecordReferral.id)}
                        onStatusChange={mode === "staff" ? handleStatusChange : undefined}
                        onAssignmentChange={mode === "staff" ? handleAssignmentChange : undefined}
                        onRequestTransfer={mode === "staff" ? handleRequestTransfer : undefined}
                    />
                )}

                {mode === "staff" && (
                    <>
                        <StaffProfileModal
                            open={staffProfileModalOpen}
                            initialTab={staffProfileModalTab}
                            profile={staffProfile}
                            onClose={() => setStaffProfileModalOpen(false)}
                            onSave={(next) => {
                                saveStaffProfile(next)
                                setStaffProfile(next)
                            }}
                        />
                        <DashboardHelpModal open={helpModalOpen} onClose={() => setHelpModalOpen(false)} />
                    </>
                )}

                {mode === "portal" && (
                    <>
                        <PortalProfileModal
                            open={portalProfileModalOpen}
                            initialTab={portalProfileModalTab}
                            profile={portalProfile}
                            onClose={() => setPortalProfileModalOpen(false)}
                            onSave={(next) => {
                                savePortalProfile(next)
                                setPortalProfile(next)
                            }}
                        />
                        <PortalHelpModal
                            open={portalHelpModalOpen}
                            onClose={() => setPortalHelpModalOpen(false)}
                        />
                    </>
                )}
            </div>
        </div>
    )
}

function PortalReferralsWorkspace({
    referrals,
    archivedIds,
    onOpenReferral,
    onEditReferral,
    onArchiveReferral,
    onArchiveReferrals,
}: {
    referrals: MockReferral[]
    archivedIds: Set<string>
    onOpenReferral: (r: MockReferral) => void
    onEditReferral: (r: MockReferral) => void
    onArchiveReferral: (r: MockReferral) => void
    onArchiveReferrals: (ids: string[]) => void
}) {
    const [portalFilter, setPortalFilter] = useState<PortalFilter>("all")
    const [portalReferralFilters, setPortalReferralFilters] = useState<PortalReferralFilters>(
        DEFAULT_PORTAL_REFERRAL_FILTERS
    )
    const [referralSort, setReferralSort] = useState<ReferralSort>(DEFAULT_REFERRAL_SORT)
    const [referralViewMode, setReferralViewMode] = useState<ReferralViewMode>("column")
    const activeReferrals = useMemo(
        () => referrals.filter((r) => !archivedIds.has(r.id)),
        [referrals, archivedIds]
    )
    const filterOptions = useMemo(() => portalReferralFilterOptions(activeReferrals), [activeReferrals])

    const filteredReferrals = useMemo(() => {
        const statusFiltered = applyPortalStatusFilter(activeReferrals, portalFilter)
        const filterBarApplied = applyPortalReferralFilters(statusFiltered, portalReferralFilters)
        return filterAndSortReferrals(filterBarApplied, DEFAULT_REFERRAL_FILTERS, referralSort)
    }, [activeReferrals, portalFilter, portalReferralFilters, referralSort])

    const clearPortalFilters = () => {
        setPortalReferralFilters(DEFAULT_PORTAL_REFERRAL_FILTERS)
        setPortalFilter("all")
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
            <div style={{ flexShrink: 0, marginBottom: 4 }}>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: COLORS.ash }}>My referrals</h1>
                <p style={{ margin: "6px 0 0", fontSize: 13, color: COLORS.ashMuted }}>
                    Track status, edit submissions, or archive from your view — admissions still sees archived referrals
                </p>
            </div>

            <PortalSummaryBar
                referrals={activeReferrals}
                filter={portalFilter}
                onFilterChange={setPortalFilter}
            />

            <PortalFiltersBar
                filters={portalReferralFilters}
                viewMode={referralViewMode}
                options={filterOptions}
                resultCount={filteredReferrals.length}
                totalCount={activeReferrals.length}
                onFiltersChange={setPortalReferralFilters}
                onViewModeChange={setReferralViewMode}
                onClear={clearPortalFilters}
            />

            <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
                {referralViewMode === "column" ? (
                    <ReferralKanbanBoard
                        referrals={filteredReferrals}
                        readOnly
                        showPortalSummaryBar={false}
                        portalFilter="all"
                        onOpenReferral={onOpenReferral}
                        onArchiveReferrals={onArchiveReferrals}
                        archiveShell="portal"
                    />
                ) : (
                    <ReferralTableView
                        referrals={filteredReferrals}
                        sort={referralSort}
                        onSortChange={setReferralSort}
                        tableMode="portal"
                        onOpenReferral={onOpenReferral}
                        onEdit={onEditReferral}
                        onArchive={onArchiveReferral}
                    />
                )}
            </div>
        </div>
    )
}

function PortalArchiveWorkspace({
    referrals,
    archivedIds,
    onOpenReferral,
    onRecoverReferrals,
}: {
    referrals: MockReferral[]
    archivedIds: Set<string>
    onOpenReferral: (r: MockReferral) => void
    onRecoverReferrals: (ids: string[]) => void
}) {
    const [portalReferralFilters, setPortalReferralFilters] = useState<PortalReferralFilters>(
        DEFAULT_PORTAL_REFERRAL_FILTERS
    )
    const [referralSort, setReferralSort] = useState<ReferralSort>(DEFAULT_REFERRAL_SORT)
    const [referralViewMode, setReferralViewMode] = useState<ReferralViewMode>("row")
    const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())

    const archivedReferrals = useMemo(
        () => referrals.filter((r) => archivedIds.has(r.id)),
        [referrals, archivedIds]
    )
    const filterOptions = useMemo(() => portalReferralFilterOptions(archivedReferrals), [archivedReferrals])

    const filteredReferrals = useMemo(() => {
        const filterBarApplied = applyPortalReferralFilters(archivedReferrals, portalReferralFilters)
        return filterAndSortReferrals(filterBarApplied, DEFAULT_REFERRAL_FILTERS, referralSort)
    }, [archivedReferrals, portalReferralFilters, referralSort])

    const clearPortalFilters = () => setPortalReferralFilters(DEFAULT_PORTAL_REFERRAL_FILTERS)

    const recoverSelected = () => {
        onRecoverReferrals([...selectedIds])
        setSelectedIds(new Set())
    }

    const recoverOne = (referral: MockReferral) => {
        onRecoverReferrals([referral.id])
        setSelectedIds((prev) => {
            const next = new Set(prev)
            next.delete(referral.id)
            return next
        })
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
            <div style={{ flexShrink: 0, marginBottom: 4 }}>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: COLORS.ash }}>Archive</h1>
                <p style={{ margin: "6px 0 0", fontSize: 13, color: COLORS.ashMuted }}>
                    Referrals hidden from your dashboard — recover any time to restore them to My Referrals
                </p>
            </div>

            {selectedIds.size > 0 && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        marginBottom: 12,
                        padding: "10px 14px",
                        background: COLORS.moonstoneLight,
                        borderRadius: 8,
                        flexShrink: 0,
                    }}
                >
                    <span style={{ fontSize: 13, color: COLORS.ash, fontWeight: 600 }}>
                        {selectedIds.size} selected
                    </span>
                    <button
                        type="button"
                        onClick={recoverSelected}
                        style={{
                            padding: "8px 14px",
                            fontSize: 13,
                            fontWeight: 600,
                            fontFamily: FONT,
                            border: "none",
                            borderRadius: 8,
                            background: COLORS.ash,
                            color: COLORS.shell,
                            cursor: "pointer",
                        }}
                    >
                        Recover to dashboard
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedIds(new Set())}
                        style={{
                            padding: "8px 14px",
                            fontSize: 13,
                            fontWeight: 600,
                            fontFamily: FONT,
                            border: `1px solid ${COLORS.ashSubtle}`,
                            borderRadius: 8,
                            background: COLORS.white,
                            color: COLORS.ashMuted,
                            cursor: "pointer",
                        }}
                    >
                        Clear selection
                    </button>
                </div>
            )}

            <PortalFiltersBar
                filters={portalReferralFilters}
                viewMode={referralViewMode}
                options={filterOptions}
                resultCount={filteredReferrals.length}
                totalCount={archivedReferrals.length}
                onFiltersChange={setPortalReferralFilters}
                onViewModeChange={setReferralViewMode}
                onClear={clearPortalFilters}
            />

            <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
                {archivedReferrals.length === 0 ? (
                    <div
                        style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: COLORS.ashMuted,
                            fontSize: 14,
                        }}
                    >
                        No archived referrals — use Archive on a row in My Referrals to hide one from your dashboard
                    </div>
                ) : referralViewMode === "column" ? (
                    <ReferralKanbanBoard
                        referrals={filteredReferrals}
                        readOnly
                        showPortalSummaryBar={false}
                        portalFilter="all"
                        onOpenReferral={onOpenReferral}
                    />
                ) : (
                    <ReferralTableView
                        referrals={filteredReferrals}
                        sort={referralSort}
                        onSortChange={setReferralSort}
                        tableMode="portal-archive"
                        onOpenReferral={onOpenReferral}
                        onRecover={recoverOne}
                        selectedIds={selectedIds}
                        onSelectedIdsChange={setSelectedIds}
                    />
                )}
            </div>
        </div>
    )
}

function StaffDashboardWorkspace({
    dashboardTab,
    onDashboardTabChange,
    casesTab,
    onCasesTabChange,
    inquiryCount,
    referrals,
    inquiries,
    organizations,
    orgSearch,
    orgTypeFilter,
    selectedOrgIds,
    onOrgSearchChange,
    onOrgTypeFilterChange,
    onSelectedOrgIdsChange,
    onOrganizationsChange,
    onOpenOrganization,
    contacts,
    contactFilters,
    selectedContactIds,
    onContactFiltersChange,
    onSelectedContactIdsChange,
    onContactsChange,
    onOpenContact,
    onStatusChange,
    onOpenReferral,
    onArchiveReferrals,
    incomingTransfers,
    referralsById,
    onAcceptTransfer,
    onDeclineTransfer,
}: {
    dashboardTab: StaffDashboardTab
    onDashboardTabChange: (tab: StaffDashboardTab) => void
    casesTab: CasesTabId
    onCasesTabChange: (tab: CasesTabId) => void
    inquiryCount: number
    referrals: MockReferral[]
    inquiries: typeof INITIAL_MOCK_INQUIRIES
    incomingTransfers: MockReferralTransfer[]
    referralsById: Record<string, MockReferral | undefined>
    onAcceptTransfer: (transferId: string) => void
    onDeclineTransfer: (transferId: string) => void
    organizations: MockOrganization[]
    orgSearch: string
    orgTypeFilter: OrganizationType | "all"
    selectedOrgIds: Set<string>
    onOrgSearchChange: (value: string) => void
    onOrgTypeFilterChange: (value: OrganizationType | "all") => void
    onSelectedOrgIdsChange: (ids: Set<string>) => void
    onOrganizationsChange: (orgs: MockOrganization[]) => void
    onOpenOrganization: (org: MockOrganization) => void
    contacts: MockContact[]
    contactFilters: ContactFilters
    selectedContactIds: Set<string>
    onContactFiltersChange: (filters: ContactFilters) => void
    onSelectedContactIdsChange: (ids: Set<string>) => void
    onContactsChange: (contacts: MockContact[]) => void
    onOpenContact: (contact: MockContact, panelMode?: ContactPanelMode) => void
    onStatusChange: (id: string, status: ReferralStatus) => void
    onOpenReferral: (r: MockReferral) => void
    onArchiveReferrals: (ids: string[]) => void
}) {
    return (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
            <StaffDashboardHeader active={dashboardTab} onChange={onDashboardTabChange} />

            {dashboardTab === "cases" && (
                <StaffCasesWorkspace
                    casesTab={casesTab}
                    onCasesTabChange={onCasesTabChange}
                    inquiryCount={inquiryCount}
                    referrals={referrals}
                    inquiries={inquiries}
                    incomingTransfers={incomingTransfers}
                    referralsById={referralsById}
                    onStatusChange={onStatusChange}
                    onOpenReferral={onOpenReferral}
                    onArchiveReferrals={onArchiveReferrals}
                    onAcceptTransfer={onAcceptTransfer}
                    onDeclineTransfer={onDeclineTransfer}
                />
            )}

            {dashboardTab === "organizations" && (
                <StaffOrganizationsWorkspace
                    organizations={organizations}
                    referrals={referrals}
                    search={orgSearch}
                    typeFilter={orgTypeFilter}
                    selectedIds={selectedOrgIds}
                    onSearchChange={onOrgSearchChange}
                    onTypeFilterChange={onOrgTypeFilterChange}
                    onSelectedIdsChange={onSelectedOrgIdsChange}
                    onOrganizationsChange={onOrganizationsChange}
                    onOpenOrganization={onOpenOrganization}
                />
            )}

            {dashboardTab === "contacts" && (
                <StaffContactsWorkspace
                    contacts={contacts}
                    contactFilters={contactFilters}
                    selectedIds={selectedContactIds}
                    onFiltersChange={onContactFiltersChange}
                    onSelectedIdsChange={onSelectedContactIdsChange}
                    onContactsChange={onContactsChange}
                    onOpenContact={onOpenContact}
                />
            )}
        </div>
    )
}

function StaffContactsWorkspace({
    contacts,
    contactFilters,
    selectedIds,
    onFiltersChange,
    onSelectedIdsChange,
    onContactsChange,
    onOpenContact,
}: {
    contacts: MockContact[]
    contactFilters: ContactFilters
    selectedIds: Set<string>
    onFiltersChange: (filters: ContactFilters) => void
    onSelectedIdsChange: (ids: Set<string>) => void
    onContactsChange: (contacts: MockContact[]) => void
    onOpenContact: (contact: MockContact, panelMode?: ContactPanelMode) => void
}) {
    const visibleContacts = useMemo(
        () => contactsVisibleToUser(contacts, MOCK_STAFF_USER_ID),
        [contacts]
    )
    const filtered = useMemo(
        () => filterContacts(visibleContacts, contactFilters),
        [visibleContacts, contactFilters]
    )
    const listStats = useMemo(() => contactListStats(visibleContacts), [visibleContacts])
    const organizationOptions = useMemo(() => contactOrganizationOptions(visibleContacts), [visibleContacts])

    const toggleSelect = (id: string) => {
        onSelectedIdsChange(
            (() => {
                const next = new Set(selectedIds)
                if (next.has(id)) next.delete(id)
                else next.add(id)
                return next
            })()
        )
    }

    const toggleSelectAll = () => {
        if (filtered.length > 0 && filtered.every((c) => selectedIds.has(c.id))) {
            onSelectedIdsChange(new Set())
        } else {
            onSelectedIdsChange(new Set(filtered.map((c) => c.id)))
        }
    }

    const handleNewContact = () => {
        const id = `contact-user-new-${Date.now()}`
        const newContact: MockContact = {
            id,
            name: "New Contact",
            organization: "",
            organization_type: "community_center",
            phone: "",
            email: "",
            url: "",
            notes: "",
            source: "user",
            owner_user_id: MOCK_STAFF_USER_ID,
            referral_count: 0,
            last_active_at: null,
            created_at: new Date().toISOString().slice(0, 10),
        }
        onContactsChange([newContact, ...contacts])
        onOpenContact(newContact, "create")
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
            <ContactsSummaryBar stats={listStats} />
            <ContactsToolbar
                filters={contactFilters}
                organizationOptions={organizationOptions}
                selectedCount={selectedIds.size}
                visibleCount={filtered.length}
                onFiltersChange={onFiltersChange}
                onNewContact={handleNewContact}
                onExportSelected={() =>
                    exportContactsCsv(filtered.filter((c) => selectedIds.has(c.id)))
                }
                onExportVisible={() => exportContactsCsv(filtered)}
            />
            <ContactsListView
                contacts={filtered}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onToggleSelectAll={toggleSelectAll}
                onOpen={onOpenContact}
            />
        </div>
    )
}

function StaffOrganizationsWorkspace({
    organizations,
    referrals,
    search,
    typeFilter,
    selectedIds,
    onSearchChange,
    onTypeFilterChange,
    onSelectedIdsChange,
    onOrganizationsChange,
    onOpenOrganization,
}: {
    organizations: MockOrganization[]
    referrals: MockReferral[]
    search: string
    typeFilter: OrganizationType | "all"
    selectedIds: Set<string>
    onSearchChange: (value: string) => void
    onTypeFilterChange: (value: OrganizationType | "all") => void
    onSelectedIdsChange: (ids: Set<string>) => void
    onOrganizationsChange: (orgs: MockOrganization[]) => void
    onOpenOrganization: (org: MockOrganization) => void
}) {
    const filtered = useMemo(
        () => filterOrganizations(organizations, search, typeFilter),
        [organizations, search, typeFilter]
    )
    const listStats = useMemo(() => organizationListStats(organizations, referrals), [organizations, referrals])

    const toggleSelect = (id: string) => {
        onSelectedIdsChange(
            (() => {
                const next = new Set(selectedIds)
                if (next.has(id)) next.delete(id)
                else next.add(id)
                return next
            })()
        )
    }

    const toggleSelectAll = () => {
        if (filtered.length > 0 && filtered.every((o) => selectedIds.has(o.id))) {
            onSelectedIdsChange(new Set())
        } else {
            onSelectedIdsChange(new Set(filtered.map((o) => o.id)))
        }
    }

    const handleNewOrganization = () => {
        const id = `org-new-${Date.now()}`
        const newOrg: MockOrganization = {
            id,
            name: "New Organization",
            contact_name: "Primary Contact",
            phone: "",
            email: "",
            organization_type: "community_center",
            created_at: new Date().toISOString().slice(0, 10),
        }
        onOrganizationsChange([newOrg, ...organizations])
        onOpenOrganization(newOrg)
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
            <OrganizationsSummaryBar stats={listStats} />
            <OrganizationsToolbar
                search={search}
                typeFilter={typeFilter}
                selectedCount={selectedIds.size}
                visibleCount={filtered.length}
                onSearchChange={onSearchChange}
                onTypeFilterChange={onTypeFilterChange}
                onNewOrganization={handleNewOrganization}
                onExportSelected={() =>
                    exportOrganizationsCsv(
                        filtered.filter((o) => selectedIds.has(o.id)),
                        referrals
                    )
                }
                onExportVisible={() => exportOrganizationsCsv(filtered, referrals)}
            />
            <OrganizationsListView
                organizations={filtered}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onToggleSelectAll={toggleSelectAll}
                onOpen={onOpenOrganization}
            />
        </div>
    )
}

function StaffCasesWorkspace({
    casesTab,
    onCasesTabChange,
    inquiryCount,
    referrals,
    inquiries,
    incomingTransfers,
    referralsById,
    onStatusChange,
    onOpenReferral,
    onArchiveReferrals,
    onAcceptTransfer,
    onDeclineTransfer,
}: {
    casesTab: CasesTabId
    onCasesTabChange: (tab: CasesTabId) => void
    inquiryCount: number
    referrals: MockReferral[]
    inquiries: typeof INITIAL_MOCK_INQUIRIES
    incomingTransfers: MockReferralTransfer[]
    referralsById: Record<string, MockReferral | undefined>
    onStatusChange: (id: string, status: ReferralStatus) => void
    onOpenReferral: (r: MockReferral) => void
    onArchiveReferrals: (ids: string[]) => void
    onAcceptTransfer: (transferId: string) => void
    onDeclineTransfer: (transferId: string) => void
}) {
    const [referralFilters, setReferralFilters] = useState<ReferralFilters>(DEFAULT_REFERRAL_FILTERS)
    const [referralSort, setReferralSort] = useState<ReferralSort>(DEFAULT_REFERRAL_SORT)
    const [referralViewMode, setReferralViewMode] = useState<ReferralViewMode>("column")
    const [archiveColumnVisible, setArchiveColumnVisible] = useKanbanArchiveColumnVisible("staff")

    const filterOptions = useMemo(() => referralFilterOptions(referrals), [referrals])
    const filteredReferrals = useMemo(
        () => filterAndSortReferrals(referrals, referralFilters, referralSort),
        [referrals, referralFilters, referralSort]
    )

    const clearReferralFilters = () => {
        setReferralFilters(DEFAULT_REFERRAL_FILTERS)
        setReferralSort(DEFAULT_REFERRAL_SORT)
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
            <CasesTabBar
                activeTab={casesTab}
                onTabChange={onCasesTabChange}
                referralCount={filteredReferrals.length}
                inquiryCount={inquiryCount}
            />

            {casesTab === "referrals" && incomingTransfers.length > 0 && (
                <IncomingTransfersBar
                    transfers={incomingTransfers}
                    referralsById={referralsById}
                    onAccept={onAcceptTransfer}
                    onDecline={onDeclineTransfer}
                />
            )}

            {casesTab === "referrals" && (
                <ReferralFiltersBar
                    filters={referralFilters}
                    sort={referralSort}
                    viewMode={referralViewMode}
                    options={filterOptions}
                    resultCount={filteredReferrals.length}
                    totalCount={referrals.length}
                    onFiltersChange={setReferralFilters}
                    onSortChange={setReferralSort}
                    onViewModeChange={setReferralViewMode}
                    onClear={clearReferralFilters}
                    archiveColumnVisible={archiveColumnVisible}
                    onArchiveColumnVisibleChange={setArchiveColumnVisible}
                />
            )}

            <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
                {casesTab === "referrals" ? (
                    referralViewMode === "column" ? (
                        <ReferralKanbanBoard
                            referrals={filteredReferrals}
                            readOnly={false}
                            onStatusChange={onStatusChange}
                            onOpenReferral={onOpenReferral}
                            showArchiveColumn={archiveColumnVisible}
                            onArchiveReferrals={onArchiveReferrals}
                            archiveShell="staff"
                        />
                    ) : (
                        <ReferralTableView
                            referrals={filteredReferrals}
                            sort={referralSort}
                            onSortChange={setReferralSort}
                            tableMode="staff"
                            onStatusChange={onStatusChange}
                            onOpenReferral={onOpenReferral}
                            onArchive={(r) => {
                                const label = clientDisplayId(r)
                                if (
                                    window.confirm(
                                        `Archive ${label}? This hides the referral from your admissions dashboard. The record is not deleted.`
                                    )
                                ) {
                                    onArchiveReferrals([r.id])
                                }
                            }}
                        />
                    )
                ) : (
                    <InquiriesPanel inquiries={inquiries} />
                )}
            </div>
        </div>
    )
}

function ModeButton({
    active,
    onClick,
    children,
}: {
    active: boolean
    onClick: () => void
    children: ReactNode
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            style={{
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: 600,
                fontFamily: FONT,
                border: `1px solid ${active ? COLORS.ash : COLORS.ashSubtle}`,
                borderRadius: 8,
                background: active ? COLORS.primary : COLORS.white,
                color: active ? COLORS.primaryForeground : COLORS.ash,
                cursor: "pointer",
            }}
        >
            {children}
        </button>
    )
}

