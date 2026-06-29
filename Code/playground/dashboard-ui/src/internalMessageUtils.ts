import { CURRENT_STAFF_USERNAME, MOCK_STAFF_DIRECTORY, staffByUsername } from "./mockStaffDirectory"
import { formatMessageTime } from "./messageUtils"
import type { InternalConversation, InternalMessage, MessageInboxFilter, StaffMember } from "./types"
import type { ReferralThreadSummary } from "./messageUtils"

export type InternalThreadSummary = {
    conversationId: string
    conversation: InternalConversation
    lastMessage: InternalMessage | null
    messageCount: number
    unread: boolean
}

export type InboxThreadItem =
    | { kind: "referral"; referralId: string; summary: ReferralThreadSummary; sortTime: number; unread: boolean }
    | { kind: "internal"; conversationId: string; summary: InternalThreadSummary; sortTime: number; unread: boolean }

export function parseMentionUsernames(text: string): string[] {
    const matches = text.match(/@([a-zA-Z0-9._-]+)/g) ?? []
    const names = matches.map((m) => m.slice(1).toLowerCase())
    return [...new Set(names)]
}

export function filterStaffForMention(query: string, excludeUsername?: string): StaffMember[] {
    const q = query.trim().toLowerCase().replace(/^@/, "")
    let list = MOCK_STAFF_DIRECTORY
    if (excludeUsername) {
        list = list.filter((s) => s.username.toLowerCase() !== excludeUsername.toLowerCase())
    }
    if (!q) return list
    return list.filter(
        (s) => s.username.toLowerCase().includes(q) || s.display_name.toLowerCase().includes(q)
    )
}

export function resolveParticipantUsernames(raw: string, creatorUsername: string): string[] {
    const parsed = parseMentionUsernames(raw)
    const valid = parsed.filter((u) => staffByUsername(u))
    const set = new Set([creatorUsername.toLowerCase(), ...valid])
    return [...set]
}

export function formatParticipantHandles(usernames: string[]): string {
    return usernames.map((u) => `@${u}`).join(", ")
}

export function buildInternalSummaries(
    conversations: InternalConversation[],
    messagesByConversation: Record<string, InternalMessage[]>,
    currentUsername: string = CURRENT_STAFF_USERNAME
): InternalThreadSummary[] {
    return conversations
        .filter((c) => c.participant_usernames.map((u) => u.toLowerCase()).includes(currentUsername.toLowerCase()))
        .map((conversation) => {
            const messages = messagesByConversation[conversation.id] ?? []
            const lastMessage = messages.length > 0 ? messages[messages.length - 1]! : null
            return {
                conversationId: conversation.id,
                conversation,
                lastMessage,
                messageCount: messages.length,
                unread: conversation.unread,
            }
        })
        .sort((a, b) => {
            if (a.unread !== b.unread) return a.unread ? -1 : 1
            const aTime = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0
            const bTime = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0
            return bTime - aTime
        })
}

export function mergeInboxThreads(
    referralThreads: ReferralThreadSummary[],
    internalThreads: InternalThreadSummary[]
): InboxThreadItem[] {
    const items: InboxThreadItem[] = [
        ...referralThreads.map((summary) => ({
            kind: "referral" as const,
            referralId: summary.referralId,
            summary,
            sortTime: summary.lastMessage ? new Date(summary.lastMessage.created_at).getTime() : 0,
            unread: summary.unread,
        })),
        ...internalThreads.map((summary) => ({
            kind: "internal" as const,
            conversationId: summary.conversationId,
            summary,
            sortTime: summary.lastMessage ? new Date(summary.lastMessage.created_at).getTime() : 0,
            unread: summary.unread,
        })),
    ]
    return items.sort((a, b) => {
        if (a.unread !== b.unread) return a.unread ? -1 : 1
        return b.sortTime - a.sortTime
    })
}

export function filterInboxThreads(items: InboxThreadItem[], filter: MessageInboxFilter): InboxThreadItem[] {
    switch (filter) {
        case "referrals":
            return items.filter((i) => i.kind === "referral")
        case "internal":
            return items.filter((i) => i.kind === "internal")
        case "unread":
            return items.filter((i) => i.unread)
        default:
            return items
    }
}

export function inboxItemTimeLabel(item: InboxThreadItem): string {
    const iso =
        item.kind === "referral"
            ? item.summary.lastMessage?.created_at
            : item.summary.lastMessage?.created_at
    return iso ? formatMessageTime(iso) : ""
}

export function inboxItemPreview(item: InboxThreadItem): string {
    if (item.kind === "referral") {
        return item.summary.lastMessage?.body ?? "No messages yet — say hello"
    }
    return item.summary.lastMessage?.body ?? "No messages yet"
}

export function inboxItemTitle(item: InboxThreadItem): string {
    if (item.kind === "referral") {
        const r = item.summary.referral
        return `${r.client_first_name} ${r.client_last_name}`.trim()
    }
    return item.summary.conversation.subject
}

export function inboxItemSubtitle(item: InboxThreadItem): string {
    if (item.kind === "referral") {
        const r = item.summary.referral
        return `${r.admin_ref_id || r.referral_code} · ${r.referral_source_name}`
    }
    return formatParticipantHandles(item.summary.conversation.participant_usernames)
}
