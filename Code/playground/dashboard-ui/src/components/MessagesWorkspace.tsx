import { useEffect, useMemo } from "react"
import { FONT } from "@design"
import {
    buildInternalSummaries,
    mergeInboxThreads,
} from "../internalMessageUtils"
import { PORTAL_MOCK_SOURCE_NAME } from "../mockReferralMessages"
import { CURRENT_STAFF_USERNAME } from "../mockStaffDirectory"
import { buildThreadSummaries } from "../messageUtils"
import type {
    ActiveMessageSelection,
    InternalConversation,
    InternalMessage,
    MessageInboxFilter,
    MockReferral,
    ReferralMessage,
} from "../types"
import { MessagesChatPanel } from "./MessagesChatPanel"
import { MessagesComposeInternalPanel } from "./MessagesComposeInternalPanel"
import { MessagesInternalChatPanel } from "./MessagesInternalChatPanel"
import { MessagesReferralSearchRail } from "./MessagesReferralSearchRail"
import { MessagesThreadList } from "./MessagesThreadList"

type Props = {
    shell: "staff" | "portal"
    referrals: MockReferral[]
    messagesByReferral: Record<string, ReferralMessage[]>
    internalConversations: InternalConversation[]
    messagesByInternal: Record<string, InternalMessage[]>
    selection: ActiveMessageSelection
    onSelectionChange: (selection: ActiveMessageSelection) => void
    inboxFilter: MessageInboxFilter
    onInboxFilterChange: (filter: MessageInboxFilter) => void
    onSendReferralMessage: (referralId: string, body: string) => void
    onSendInternalMessage: (conversationId: string, body: string) => void
    onCreateInternalThread: (payload: {
        subject: string
        recipientInput: string
        firstMessage: string
    }) => string
    onMarkReferralRead: (referralId: string) => void
    onMarkInternalRead: (conversationId: string) => void
    onOpenReferral?: (referral: MockReferral) => void
    staffDisplayName?: string
    openThreadIds?: Set<string>
}

export function MessagesWorkspace({
    shell,
    referrals,
    messagesByReferral,
    internalConversations,
    messagesByInternal,
    selection,
    onSelectionChange,
    inboxFilter,
    onInboxFilterChange,
    onSendReferralMessage,
    onSendInternalMessage,
    onCreateInternalThread,
    onMarkReferralRead,
    onMarkInternalRead,
    onOpenReferral,
    staffDisplayName = "Christina Fleishman",
    openThreadIds,
}: Props) {
    const referralThreads = useMemo(
        () =>
            buildThreadSummaries(referrals, messagesByReferral, {
                portalSourceName: shell === "portal" ? PORTAL_MOCK_SOURCE_NAME : undefined,
                referralIds: openThreadIds,
            }),
        [referrals, messagesByReferral, shell, openThreadIds]
    )

    const internalThreads = useMemo(
        () =>
            shell === "staff"
                ? buildInternalSummaries(internalConversations, messagesByInternal, CURRENT_STAFF_USERNAME)
                : [],
        [shell, internalConversations, messagesByInternal]
    )

    const inboxItems = useMemo(
        () => mergeInboxThreads(referralThreads, internalThreads),
        [referralThreads, internalThreads]
    )

    const selectedReferral =
        selection?.kind === "referral"
            ? referrals.find((r) => r.id === selection.id) ?? null
            : null

    const selectedInternal =
        selection?.kind === "internal"
            ? internalConversations.find((c) => c.id === selection.id) ?? null
            : null

    const selectedReferralMessages =
        selection?.kind === "referral" ? messagesByReferral[selection.id] ?? [] : []

    const selectedInternalMessages =
        selection?.kind === "internal" ? messagesByInternal[selection.id] ?? [] : []

    useEffect(() => {
        if (selection?.kind === "referral") onMarkReferralRead(selection.id)
        if (selection?.kind === "internal") onMarkInternalRead(selection.id)
    }, [selection, onMarkReferralRead, onMarkInternalRead])

    useEffect(() => {
        if (selection || inboxItems.length === 0) return
        const first = inboxItems[0]!
        onSelectionChange(
            first.kind === "referral"
                ? { kind: "referral", id: first.referralId }
                : { kind: "internal", id: first.conversationId }
        )
    }, [selection, inboxItems, onSelectionChange])

    const handleSelectFromSearch = (referralId: string) => {
        onSelectionChange({ kind: "referral", id: referralId })
    }

    return (
        <div style={{ display: "flex", flex: 1, minHeight: 0, fontFamily: FONT }}>
            <MessagesThreadList
                items={inboxItems}
                filter={inboxFilter}
                onFilterChange={onInboxFilterChange}
                selection={selection}
                onSelect={onSelectionChange}
                shell={shell}
                onNewInternal={
                    shell === "staff" ? () => onSelectionChange({ kind: "compose-internal" }) : undefined
                }
            />

            {selection?.kind === "compose-internal" && shell === "staff" ? (
                <MessagesComposeInternalPanel
                    currentUsername={CURRENT_STAFF_USERNAME}
                    onCreate={(payload) => {
                        const id = onCreateInternalThread(payload)
                        onSelectionChange({ kind: "internal", id })
                    }}
                    onCancel={() => {
                        const first = inboxItems[0]
                        if (first) {
                            onSelectionChange(
                                first.kind === "referral"
                                    ? { kind: "referral", id: first.referralId }
                                    : { kind: "internal", id: first.conversationId }
                            )
                        } else {
                            onSelectionChange(null)
                        }
                    }}
                />
            ) : selection?.kind === "internal" ? (
                <MessagesInternalChatPanel
                    conversation={selectedInternal}
                    messages={selectedInternalMessages}
                    currentUsername={CURRENT_STAFF_USERNAME}
                    onSend={(body) => onSendInternalMessage(selection.id, body)}
                />
            ) : (
                <MessagesChatPanel
                    referral={selectedReferral}
                    messages={selectedReferralMessages}
                    shell={shell}
                    staffDisplayName={staffDisplayName}
                    onSend={(body) => {
                        if (selection?.kind === "referral") onSendReferralMessage(selection.id, body)
                    }}
                    onOpenReferral={
                        selectedReferral && onOpenReferral
                            ? () => onOpenReferral(selectedReferral)
                            : undefined
                    }
                />
            )}

            {shell === "staff" && selection?.kind !== "compose-internal" && (
                <MessagesReferralSearchRail
                    referrals={referrals}
                    messagesByReferral={messagesByReferral}
                    selectedReferralId={selection?.kind === "referral" ? selection.id : null}
                    onSelectReferral={handleSelectFromSearch}
                    staffAssigneeName={staffDisplayName}
                />
            )}
        </div>
    )
}
