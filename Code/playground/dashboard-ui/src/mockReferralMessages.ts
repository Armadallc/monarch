import type { ReferralMessage } from "./types"

/** Playground portal user — threads filtered to this referral source. */
export const PORTAL_MOCK_SOURCE_NAME = "Såtta Brunar"

const STAFF_NAME = "Christina Fleishman"

function seedMessages(): ReferralMessage[] {
    const byRef = new Map<string, ReferralMessage[]>()

    const add = (
        referralId: string,
        author_role: ReferralMessage["author_role"],
        author_name: string,
        body: string,
        created_at: string
    ) => {
        const list = byRef.get(referralId) ?? []
        list.push({
            id: `msg-${referralId}-${list.length + 1}`,
            referral_id: referralId,
            author_role,
            author_name,
            body,
            created_at,
        })
        byRef.set(referralId, list)
    }

    // John Doe — unread thread (portal source Såtta Brunar)
    add("1", "source", PORTAL_MOCK_SOURCE_NAME, "Can you confirm ROI was received?", "2026-05-28T14:20:00")
    add("1", "staff", STAFF_NAME, "Yes — ROI is on file. We'll follow up if anything else is needed.", "2026-05-28T15:05:00")
    add("1", "source", PORTAL_MOCK_SOURCE_NAME, "Thank you. Court date is June 12.", "2026-05-28T16:10:00")

    // Jane Doe — Alex Rivera (staff view)
    add("2", "source", "Alex Rivera", "Uploading court order today.", "2026-05-27T09:15:00")
    add("2", "staff", STAFF_NAME, "Received — thank you. Under review now.", "2026-05-27T11:40:00")

    // Michael Smith
    add("3", "source", "Pat Nguyen", "Thanks — noted on urgency.", "2026-05-26T10:00:00")

    // Sophia Martinez — unread
    add("13", "source", "Jamie Ortiz", "Do you need anything else from probation?", "2026-05-29T08:30:00")

    // Olivia Nguyen — unread
    add("15", "source", "Chris Park", "Weld County can fax records if helpful.", "2026-05-28T13:00:00")
    add("15", "staff", STAFF_NAME, "That would help — please use our secure upload when ready.", "2026-05-28T13:45:00")

    // Hannah Wilson
    add("19", "source", "Alex Rivera", "Following up on Denver Courts referral.", "2026-05-25T16:20:00")

    return [...byRef.values()].flat()
}

export const INITIAL_REFERRAL_MESSAGES: ReferralMessage[] = seedMessages()

export function buildInitialMessagesByReferral(): Record<string, ReferralMessage[]> {
    const map: Record<string, ReferralMessage[]> = {}
    for (const msg of INITIAL_REFERRAL_MESSAGES) {
        if (!map[msg.referral_id]) map[msg.referral_id] = []
        map[msg.referral_id].push(msg)
    }
    for (const id of Object.keys(map)) {
        map[id].sort((a, b) => a.created_at.localeCompare(b.created_at))
    }
    return map
}

/** Referral ids that have at least one message in the playground seed. */
export function referralIdsWithMessages(): Set<string> {
    return new Set(INITIAL_REFERRAL_MESSAGES.map((m) => m.referral_id))
}
