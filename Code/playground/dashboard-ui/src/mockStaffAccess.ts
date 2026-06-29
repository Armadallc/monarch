import type { BlockedPortalSource, StaffAccessRecord } from "./staffAccess"

export const INITIAL_STAFF_ACCESS_RECORDS: StaffAccessRecord[] = [
    {
        id: "spm-claire-comp",
        email: "claire@monarchcompetency.com",
        display_name: "Claire Baldwin",
        program: "Competency",
        role: "admin",
        status: "active",
        invited_at: "2026-04-01",
    },
    {
        id: "spm-christina-comp",
        email: "cfleishman@monarchcompetency.com",
        display_name: "Christina Fleishman",
        staff_id: "staff-1",
        program: "Competency",
        role: "user",
        status: "active",
        invited_at: "2026-03-15",
    },
    {
        id: "spm-christina-mh",
        email: "cfleishman@monarchcompetency.com",
        display_name: "Christina Fleishman",
        staff_id: "staff-1",
        program: "Mental Health",
        role: "user",
        status: "active",
        invited_at: "2026-03-15",
    },
    {
        id: "spm-alex-comp",
        email: "acorte@monarchcompetency.com",
        display_name: "Alex Corte",
        staff_id: "staff-2",
        program: "Competency",
        role: "user",
        status: "active",
        invited_at: "2026-05-01",
    },
    {
        id: "spm-driver-blocked",
        email: "driver@monarchcompetency.com",
        display_name: "Fleet Driver (example)",
        program: "Competency",
        role: "user",
        status: "blocked",
        invited_at: null,
        blocked_at: "2026-05-10",
        blocked_reason: "Not admissions — @monarch account without dashboard need",
    },
]

export const INITIAL_BLOCKED_PORTAL_SOURCES: BlockedPortalSource[] = [
    {
        id: "bps-1",
        email: "fake.referrer@example.com",
        display_name: "Suspicious Signup",
        blocked_at: "2026-05-20",
        blocked_by_email: "claire@monarchcompetency.com",
        reason: "Spam referrals — multiple invalid submissions",
        related_referral_id: "99",
    },
]

export type PlaygroundStaffPersona = {
    id: string
    label: string
    email: string
    description: string
}

/** Switch personas in the playground header to demo access gates. */
export const PLAYGROUND_STAFF_PERSONAS: PlaygroundStaffPersona[] = [
    {
        id: "super",
        label: "Super admin",
        email: "sbrown@monarchcompetency.com",
        description: "Platform owner — full access + assign admins",
    },
    {
        id: "claire",
        label: "Claire (admin)",
        email: "claire@monarchcompetency.com",
        description: "Admissions admin — manage staff allowlist",
    },
    {
        id: "christina",
        label: "Christina (staff)",
        email: "cfleishman@monarchcompetency.com",
        description: "Admissions staff — full dashboard",
    },
    {
        id: "blocked",
        label: "Blocked @monarch",
        email: "driver@monarchcompetency.com",
        description: "Valid domain but blocked in allowlist",
    },
    {
        id: "unapproved",
        label: "Unapproved @monarch",
        email: "temp.hire@monarchcompetency.com",
        description: "Google auth works; no dashboard row",
    },
]

const SESSION_KEY = "monarch-playground-staff-email"

export function loadPlaygroundStaffEmail(): string {
    if (typeof window === "undefined") return PLAYGROUND_STAFF_PERSONAS[2].email
    const stored = window.localStorage.getItem(SESSION_KEY)
    if (stored && stored.includes("@")) return stored
    return PLAYGROUND_STAFF_PERSONAS[2].email
}

export function savePlaygroundStaffEmail(email: string): void {
    if (typeof window === "undefined") return
    window.localStorage.setItem(SESSION_KEY, email.trim().toLowerCase())
}
