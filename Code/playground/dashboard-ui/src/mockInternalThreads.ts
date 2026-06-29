import { CURRENT_STAFF_USERNAME } from "./mockStaffDirectory"
import type { InternalConversation, InternalMessage } from "./types"

export const INITIAL_INTERNAL_CONVERSATIONS: InternalConversation[] = [
    {
        id: "int-1",
        subject: "Weekend coverage — admissions",
        participant_usernames: [CURRENT_STAFF_USERNAME, "jhurd", "acorte"],
        created_by_username: CURRENT_STAFF_USERNAME,
        created_at: "2026-05-27T09:00:00",
        unread: true,
    },
    {
        id: "int-2",
        subject: "ROI template v2.2 rollout",
        participant_usernames: [CURRENT_STAFF_USERNAME, "mlee"],
        created_by_username: "mlee",
        created_at: "2026-05-24T14:30:00",
        unread: false,
    },
]

export const INITIAL_INTERNAL_MESSAGES: InternalMessage[] = [
    {
        id: "imsg-1-1",
        conversation_id: "int-1",
        author_username: CURRENT_STAFF_USERNAME,
        author_name: "Christina Fleishman",
        body: "Who can cover Saturday AM intake review?",
        created_at: "2026-05-27T09:05:00",
    },
    {
        id: "imsg-1-2",
        conversation_id: "int-1",
        author_username: "jhurd",
        author_name: "Jordan Hurst",
        body: "I can take 9–12. @acorte are you on for PM?",
        created_at: "2026-05-27T09:18:00",
    },
    {
        id: "imsg-1-3",
        conversation_id: "int-1",
        author_username: "acorte",
        author_name: "Alex Corte",
        body: "PM works — I'll watch the new referral queue.",
        created_at: "2026-05-27T10:02:00",
    },
    {
        id: "imsg-2-1",
        conversation_id: "int-2",
        author_username: "mlee",
        author_name: "Morgan Lee",
        body: "DocuSeal template is updated — please sanity-check field titles before we notify sources.",
        created_at: "2026-05-24T14:35:00",
    },
    {
        id: "imsg-2-2",
        conversation_id: "int-2",
        author_username: CURRENT_STAFF_USERNAME,
        author_name: "Christina Fleishman",
        body: "On it — I'll review this afternoon.",
        created_at: "2026-05-24T15:10:00",
    },
]

export function buildInitialInternalMessagesByConversation(): Record<string, InternalMessage[]> {
    const map: Record<string, InternalMessage[]> = {}
    for (const msg of INITIAL_INTERNAL_MESSAGES) {
        if (!map[msg.conversation_id]) map[msg.conversation_id] = []
        map[msg.conversation_id].push(msg)
    }
    for (const id of Object.keys(map)) {
        map[id].sort((a, b) => a.created_at.localeCompare(b.created_at))
    }
    return map
}
