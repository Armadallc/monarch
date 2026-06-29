import type { MockReferral, ReferralMessage, ReferralStatus } from "./types"
import { clientDisplayId } from "./utils"

const ACTIVE_STATUSES: ReferralStatus[] = ["pending_review", "under_review", "waitlisted", "accepted"]

export type ReferralThreadSummary = {
    referralId: string
    referral: MockReferral
    lastMessage: ReferralMessage | null
    messageCount: number
    unread: boolean
}

export function formatMessageTime(iso: string): string {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ""
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays}d ago`
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

export function formatMessageDayLabel(iso: string): string {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ""
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    const diffDays = Math.round((today.getTime() - msgDay.getTime()) / 86400000)
    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })
}

export function buildThreadSummaries(
    referrals: MockReferral[],
    messagesByReferral: Record<string, ReferralMessage[]>,
    options?: { portalSourceName?: string; referralIds?: Set<string> }
): ReferralThreadSummary[] {
    let list = referrals

    if (options?.portalSourceName) {
        list = list.filter(
            (r) => r.referral_source_name.trim().toLowerCase() === options.portalSourceName!.trim().toLowerCase()
        )
    }

    const summaries: ReferralThreadSummary[] = []

    for (const referral of list) {
        const messages = messagesByReferral[referral.id] ?? []
        const hasMessages = messages.length > 0
        const forceInclude = options?.referralIds?.has(referral.id)

        if (!hasMessages && !forceInclude) continue

        const lastMessage = hasMessages ? messages[messages.length - 1]! : null
        summaries.push({
            referralId: referral.id,
            referral,
            lastMessage,
            messageCount: messages.length,
            unread: !!referral.has_unread_messages,
        })
    }

    return summaries.sort((a, b) => {
        if (a.unread !== b.unread) return a.unread ? -1 : 1
        const aTime = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0
        const bTime = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0
        return bTime - aTime
    })
}

export function searchReferralsForMessaging(
    referrals: MockReferral[],
    query: string,
    options?: { mineOnly?: boolean; staffAssignee?: string }
): MockReferral[] {
    const q = query.trim().toLowerCase()
    let result = referrals.filter((r) => ACTIVE_STATUSES.includes(r.status))

    if (options?.mineOnly && options.staffAssignee) {
        const assignee = options.staffAssignee.toLowerCase()
        result = result.filter((r) => (r.assignee_name ?? "").toLowerCase().includes(assignee.split(" ")[0]!))
    }

    if (!q) return result.sort((a, b) => a.client_last_name.localeCompare(b.client_last_name))

    return result
        .filter((r) => {
            const haystack = [
                r.client_first_name,
                r.client_last_name,
                r.admin_ref_id,
                r.referral_code,
                r.referral_source_name,
                r.organization,
                r.program,
            ]
                .join(" ")
                .toLowerCase()
            return haystack.includes(q)
        })
        .sort((a, b) => a.client_last_name.localeCompare(b.client_last_name))
}

export function clientThreadTitle(r: MockReferral): string {
    return `${r.client_first_name} ${r.client_last_name}`.trim()
}

export function threadSubtitle(r: MockReferral): string {
    return `${clientDisplayId(r)} · ${r.referral_source_name}`
}
