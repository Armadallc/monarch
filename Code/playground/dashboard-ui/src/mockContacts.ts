import { buildContactsFromReferrals } from "./contactUtils"
import { INITIAL_MOCK_REFERRALS } from "./mockReferrals"
import { MOCK_STAFF_USER_ID, type MockContact } from "./types"

/** Personal contacts — visible only to the owning staff user in the playground. */
export const INITIAL_USER_ADDED_CONTACTS: MockContact[] = [
    {
        id: "contact-user-1",
        name: "Dr. Elena Morris",
        organization: "Front Range Behavioral",
        organization_type: "treatment_center",
        phone: "(303) 555-8820",
        email: "e.morris@frbehavioral.org",
        url: "https://frbehavioral.org",
        notes: "Met at regional conference — potential referral partner, not yet submitted.",
        source: "user",
        owner_user_id: MOCK_STAFF_USER_ID,
        referral_count: 0,
        last_active_at: null,
        created_at: "2026-04-12",
    },
    {
        id: "contact-user-2",
        name: "James Whitfield",
        organization: "Boulder County DHS",
        organization_type: "community_center",
        phone: "(720) 555-4412",
        email: "jwhitfield@bouldercounty.gov",
        url: "",
        notes: "Case manager — follow up Q2 outreach.",
        source: "user",
        owner_user_id: MOCK_STAFF_USER_ID,
        referral_count: 0,
        last_active_at: null,
        created_at: "2026-05-02",
    },
]

export function buildInitialContacts(): MockContact[] {
    const fromReferrals = buildContactsFromReferrals(INITIAL_MOCK_REFERRALS)
    return [...INITIAL_USER_ADDED_CONTACTS, ...fromReferrals]
}
