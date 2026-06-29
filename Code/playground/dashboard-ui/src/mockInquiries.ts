export type InquiryStatus = "new" | "contacted" | "closed"

export interface MockInquiry {
    id: string
    name: string
    email: string
    phone?: string
    message_preview: string
    status: InquiryStatus
    created_at: string
}

export const INITIAL_MOCK_INQUIRIES: MockInquiry[] = [
    {
        id: "iq1",
        name: "Maria Lopez",
        email: "maria.l@example.com",
        phone: "(303) 555-0142",
        message_preview: "Interested in competency evaluation for a family member…",
        status: "new",
        created_at: "2026-05-26",
    },
    {
        id: "iq2",
        name: "James Chen",
        email: "jchen@example.org",
        message_preview: "General question about admission criteria and insurance.",
        status: "contacted",
        created_at: "2026-05-24",
    },
    {
        id: "iq3",
        name: "Anonymous",
        email: "hello@mail.com",
        message_preview: "Please call me back about your program.",
        status: "new",
        created_at: "2026-05-22",
    },
]
