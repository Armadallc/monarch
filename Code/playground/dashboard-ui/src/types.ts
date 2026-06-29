export type ReferralStatus =
    | "pending_review"
    | "under_review"
    | "waitlisted"
    | "accepted"
    | "declined"

/** ReferralForm Step 1 — Organization / Agency Type (`referral_source_type`) */
export type ReferralSourceType =
    | "court"
    | "legal_representative"
    | "probation_parole"
    | "mental_health_facility"
    | "case_management"

export type DashboardProgram = "Competency" | "Mental Health" | "Sober Living" | "Launch"

/** Mirrors `referral_submissions.transfer_status` (M3). */
export type ReferralTransferStatus =
    | "none"
    | "pending_acceptance"
    | "accepted"
    | "declined"
    | "returned"

/** Mirrors `referral_transfers.status` (M4). */
export type ReferralTransferRecordStatus = "pending" | "accepted" | "declined" | "cancelled" | "returned"

export interface MockReferralTransfer {
    id: string
    referral_id: string
    from_program: DashboardProgram
    to_program: DashboardProgram
    from_assigned_user_id?: string | null
    to_assigned_user_id?: string | null
    requested_by_staff_id: string
    requested_at: string
    status: ReferralTransferRecordStatus
    reason?: string | null
    notes?: string | null
    resolved_at?: string | null
}

export interface MockReferral {
    id: string
    referral_code: string
    admin_ref_id: string
    status: ReferralStatus
    client_first_name: string
    client_last_name: string
    referral_source_name: string
    /** Organization / agency type from ReferralForm Step 1 Contact */
    referral_source_type: ReferralSourceType
    organization: string
    program: DashboardProgram
    /** Playground FK to `StaffMember.id` / `assigned_to_user_id`. */
    assigned_to_user_id?: string | null
    assignee_name?: string
    transfer_status?: ReferralTransferStatus
    /** Set while outbound transfer is pending — UI badge target program. */
    pending_transfer_to_program?: DashboardProgram | null
    created_at: string
    /** Most recent substantive update; falls back to created_at in UI when unset */
    last_activity_at?: string
    urgent_placement: boolean
    urgency_level?: string | null
    /** Optional target for TIME-BOUND badge (YYYY-MM-DD) */
    urgency_target_date?: string | null
    /** Unread message from referral source or staff — clears after thread is read */
    has_unread_messages?: boolean
    /** Files on record — persistent indicator (paperclip), not a transient alert */
    has_attachments?: boolean
    /** @deprecated Playground fallback — prefer form fields below; use referralHasSafetyFlag(). */
    has_safety_flags?: boolean
    /** @deprecated */
    safety_flag_count?: number
    /** Step 8 — Non-Compliant / Refusing triggers flag */
    medication_compliance?: string | null
    /** Step 9 — `yes` triggers flag */
    detox_required?: string | null
    /** Step 10 — `bedbound` / `wheelchair` trigger flag */
    mobility_needs?: string | null
    /** Step 10 — ADL (not IADL) triggers flag */
    adl_support_needed?: boolean | null
    /** Step 11 — any timeframe except `no_history` */
    suicide_risk?: string | null
    violence_risk?: string | null
    /** Step 11 — AMA / elopement risk */
    elopement_risk?: string | null
    arson_history?: string | null
    /** Step 11 — registered sex offender / pending sex-crime charges */
    rso_status?: string | null
}

export const KANBAN_COLUMNS: { status: ReferralStatus; title: string }[] = [
    { status: "pending_review", title: "New Referral" },
    { status: "under_review", title: "Under Review" },
    { status: "waitlisted", title: "Waitlisted" },
    { status: "accepted", title: "Accepted" },
    { status: "declined", title: "Declined" },
]

/** Display category for referring organizations (Organizations tab). */
export type OrganizationType =
    | "treatment_center"
    | "detention_center"
    | "community_center"
    | "health_wellness"
    | "county_jail"
    | "court"
    | "probation_parole"
    | "legal_representative"

export interface MockOrganization {
    id: string
    name: string
    contact_name: string
    phone: string
    email: string
    organization_type: OrganizationType
    created_at: string
}

/** Playground staff user — personal contacts are scoped to this id (wire to auth later). */
export const MOCK_STAFF_USER_ID = "user-christina"

/** Individual referral source contact (Contacts tab). */
export type ContactSource = "referral" | "user"

export interface MockContact {
    id: string
    name: string
    organization: string
    organization_type: OrganizationType
    phone: string
    email: string
    url: string
    notes: string
    /** Universal (from referrals) vs personal (user-added). */
    source: ContactSource
    /** Set when source === "user" — visible only to that staff member. */
    owner_user_id?: string
    referral_count: number
    /** Most recent referral or touch; null when never referred. */
    last_active_at: string | null
    created_at: string
}

export const ORGANIZATION_TYPE_LABELS: Record<OrganizationType, string> = {
    treatment_center: "Treatment Center",
    detention_center: "Detention Center",
    community_center: "Community Center",
    health_wellness: "Health & Wellness",
    county_jail: "County Jail",
    court: "Court",
    probation_parole: "Probation/Parole",
    legal_representative: "Legal Representative",
}

/** Referral thread message — one thread per referral (staff ↔ source). */
export type MessageAuthorRole = "staff" | "source"

export interface ReferralMessage {
    id: string
    referral_id: string
    author_role: MessageAuthorRole
    author_name: string
    body: string
    created_at: string
}

/** Staff directory entry — @username maps to this (playground; wire to admissions_staff_profiles). */
export interface StaffMember {
    id: string
    username: string
    display_name: string
    /** Active program memberships (`staff_program_memberships`). */
    program_ids: DashboardProgram[]
}

export const TRANSFER_STATUS_LABELS: Record<ReferralTransferStatus, string> = {
    none: "None",
    pending_acceptance: "Transfer pending",
    accepted: "Transfer accepted",
    declined: "Transfer declined",
    returned: "Returned",
}

/** Staff-only thread — not linked to referrals or sources. */
export interface InternalConversation {
    id: string
    subject: string
    /** @username handles, including creator. */
    participant_usernames: string[]
    created_by_username: string
    created_at: string
    /** Unread for the current playground user. */
    unread: boolean
}

export interface InternalMessage {
    id: string
    conversation_id: string
    author_username: string
    author_name: string
    body: string
    created_at: string
}

export type MessageInboxFilter = "all" | "referrals" | "internal" | "unread"

export type ActiveMessageSelection =
    | { kind: "referral"; id: string }
    | { kind: "internal"; id: string }
    | { kind: "compose-internal" }
    | null

export const STATUS_LABELS: Record<ReferralStatus, string> = {
    pending_review: "New Referral",
    under_review: "Under Review",
    waitlisted: "Waitlisted",
    accepted: "Accepted",
    declined: "Declined",
}
