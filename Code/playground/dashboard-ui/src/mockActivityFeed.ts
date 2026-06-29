import { STATUS_LABELS, type MockReferral, type MockReferralTransfer, type ReferralMessage } from "./types"
import { staffMemberById } from "./referralAssignmentUtils"
import type { StaffMember } from "./types"

export type ActivityFeedEventType =
    | "referral_submitted"
    | "status_changed"
    | "message_sent"
    | "assignment_changed"
    | "transfer_requested"
    | "document_uploaded"
    | "section_note"

export type ActivityFeedEvent = {
    id: string
    at: string
    type: ActivityFeedEventType
    referralId: string
    referralLabel: string
    clientName: string
    program: MockReferral["program"]
    assignedToUserId?: string | null
    actorName: string
    summary: string
}

export const ACTIVITY_FEED_TYPE_LABELS: Record<ActivityFeedEventType, string> = {
    referral_submitted: "Submitted",
    status_changed: "Status",
    message_sent: "Message",
    assignment_changed: "Assignment",
    transfer_requested: "Transfer",
    document_uploaded: "Document",
    section_note: "Note",
}

type BuildInput = {
    referrals: MockReferral[]
    transfers?: MockReferralTransfer[]
    messagesByReferral?: Record<string, ReferralMessage[]>
    staffDirectory?: StaffMember[]
}

function staffName(staffDirectory: StaffMember[] | undefined, staffId: string | null | undefined): string {
    if (!staffId) return "Admissions"
    return staffMemberById(staffDirectory ?? [], staffId)?.display_name ?? "Admissions staff"
}

/** Playground feed — shaped like `referral_activity_log` rows aggregated across cases. */
export function buildActivityFeedEvents({
    referrals,
    transfers = [],
    messagesByReferral = {},
    staffDirectory,
}: BuildInput): ActivityFeedEvent[] {
    const events: ActivityFeedEvent[] = []

    for (const referral of referrals) {
        const clientName = `${referral.client_first_name} ${referral.client_last_name}`.trim()
        const referralLabel = referral.admin_ref_id || referral.referral_code

        events.push({
            id: `${referral.id}-submitted`,
            at: referral.created_at,
            type: "referral_submitted",
            referralId: referral.id,
            referralLabel,
            clientName,
            program: referral.program,
            assignedToUserId: referral.assigned_to_user_id,
            actorName: referral.referral_source_name,
            summary: `Referral submitted by ${referral.referral_source_name} (${referral.organization})`,
        })

        if (referral.assigned_to_user_id) {
            events.push({
                id: `${referral.id}-assigned`,
                at: referral.last_activity_at ?? referral.created_at,
                type: "assignment_changed",
                referralId: referral.id,
                referralLabel,
                clientName,
                program: referral.program,
                assignedToUserId: referral.assigned_to_user_id,
                actorName: staffName(staffDirectory, referral.assigned_to_user_id),
                summary: `Assigned to ${referral.assignee_name ?? staffName(staffDirectory, referral.assigned_to_user_id)}`,
            })
        }

        events.push({
            id: `${referral.id}-status`,
            at: referral.last_activity_at ?? referral.created_at,
            type: "status_changed",
            referralId: referral.id,
            referralLabel,
            clientName,
            program: referral.program,
            assignedToUserId: referral.assigned_to_user_id,
            actorName: staffName(staffDirectory, referral.assigned_to_user_id),
            summary: `Status set to ${STATUS_LABELS[referral.status]}`,
        })

        if (referral.has_attachments) {
            events.push({
                id: `${referral.id}-doc`,
                at: referral.last_activity_at ?? referral.created_at,
                type: "document_uploaded",
                referralId: referral.id,
                referralLabel,
                clientName,
                program: referral.program,
                assignedToUserId: referral.assigned_to_user_id,
                actorName: referral.referral_source_name,
                summary: "Documents uploaded with referral",
            })
        }

        if (referral.has_unread_messages) {
            const thread = messagesByReferral[referral.id] ?? []
            const last = thread[thread.length - 1]
            events.push({
                id: `${referral.id}-msg`,
                at: last?.created_at ?? referral.last_activity_at ?? referral.created_at,
                type: "message_sent",
                referralId: referral.id,
                referralLabel,
                clientName,
                program: referral.program,
                assignedToUserId: referral.assigned_to_user_id,
                actorName: last?.author_name ?? referral.referral_source_name,
                summary: last ? `Message: ${last.body.slice(0, 80)}${last.body.length > 80 ? "…" : ""}` : "New message on thread",
            })
        }

        if (referral.id === "2") {
            events.push({
                id: `${referral.id}-note`,
                at: "2026-05-22",
                type: "section_note",
                referralId: referral.id,
                referralLabel,
                clientName,
                program: referral.program,
                assignedToUserId: referral.assigned_to_user_id,
                actorName: "Christina Fleishman",
                summary: "ROI section note — awaiting signed copy from court liaison",
            })
        }
    }

    for (const transfer of transfers) {
        const referral = referrals.find((r) => r.id === transfer.referral_id)
        if (!referral) continue
        const clientName = `${referral.client_first_name} ${referral.client_last_name}`.trim()
        const referralLabel = referral.admin_ref_id || referral.referral_code
        events.push({
            id: `xfer-${transfer.id}`,
            at: transfer.requested_at,
            type: "transfer_requested",
            referralId: referral.id,
            referralLabel,
            clientName,
            program: referral.program,
            assignedToUserId: transfer.from_assigned_user_id,
            actorName: staffName(staffDirectory, transfer.requested_by_staff_id),
            summary: `Transfer requested to ${transfer.to_program}${transfer.notes ? ` — ${transfer.notes}` : ""}`,
        })
    }

    return events.sort((a, b) => b.at.localeCompare(a.at))
}

export function groupActivityFeedByDay(events: ActivityFeedEvent[]): { day: string; events: ActivityFeedEvent[] }[] {
    const map = new Map<string, ActivityFeedEvent[]>()
    for (const event of events) {
        const day = event.at.slice(0, 10)
        const bucket = map.get(day) ?? []
        bucket.push(event)
        map.set(day, bucket)
    }
    return [...map.entries()]
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([day, dayEvents]) => ({ day, events: dayEvents }))
}
