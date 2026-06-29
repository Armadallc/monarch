import type { DashboardProgram } from "./programBranding"

export type StaffMembershipRole = "user" | "admin"
export type StaffMembershipStatus = "active" | "blocked"

/** Mirrors `staff_program_memberships` + invite metadata for the playground. */
export type StaffAccessRecord = {
    id: string
    email: string
    display_name: string
    /** Optional link to `StaffMember.id` for assignee/message mocks. */
    staff_id?: string
    program: DashboardProgram
    role: StaffMembershipRole
    status: StaffMembershipStatus
    invited_at: string | null
    blocked_at?: string | null
    blocked_reason?: string | null
}

export type BlockedPortalSource = {
    id: string
    email: string
    display_name?: string
    blocked_at: string
    blocked_by_email: string
    reason?: string
    related_referral_id?: string
}

/**
 * Option B — seeded super-admin allowlist (v1).
 * Production: migration seed + optional env override; only these emails may assign admins.
 */
export const PLATFORM_SUPER_ADMIN_EMAILS: readonly string[] = [
    "sbrown@monarchcompetency.com",
]

export const STAFF_EMAIL_DOMAIN = "monarchcompetency.com"

export function normalizeStaffEmail(email: string): string {
    return email.trim().toLowerCase()
}

export function isMonarchStaffEmail(email: string): boolean {
    return normalizeStaffEmail(email).endsWith(`@${STAFF_EMAIL_DOMAIN}`)
}

export function isSuperAdmin(email: string): boolean {
    const normalized = normalizeStaffEmail(email)
    return PLATFORM_SUPER_ADMIN_EMAILS.some((e) => normalizeStaffEmail(e) === normalized)
}

export function membershipForProgram(
    records: StaffAccessRecord[],
    email: string,
    program: DashboardProgram
): StaffAccessRecord | undefined {
    const normalized = normalizeStaffEmail(email)
    return records.find(
        (r) => normalizeStaffEmail(r.email) === normalized && r.program === program && r.status === "active"
    )
}

export function hasActiveMembershipAnyProgram(records: StaffAccessRecord[], email: string): boolean {
    const normalized = normalizeStaffEmail(email)
    return records.some((r) => normalizeStaffEmail(r.email) === normalized && r.status === "active")
}

/** Dashboard gate — domain + approved allowlist (or super-admin break-glass). */
export function hasDashboardAccess(
    records: StaffAccessRecord[],
    email: string,
    program: DashboardProgram
): boolean {
    if (!isMonarchStaffEmail(email)) return false
    if (isSuperAdmin(email)) return true
    return !!membershipForProgram(records, email, program)
}

/** Admissions admin GUI — manage staff `user` rows; super admin assigns `admin`. */
export function canManageStaffAllowlist(
    records: StaffAccessRecord[],
    email: string,
    program: DashboardProgram
): boolean {
    if (isSuperAdmin(email)) return true
    const m = membershipForProgram(records, email, program)
    return m?.role === "admin"
}

export function canAssignAdminRole(email: string): boolean {
    return isSuperAdmin(email)
}

export function staffRoleLabel(
    records: StaffAccessRecord[],
    email: string,
    program: DashboardProgram
): string {
    if (isSuperAdmin(email)) return "Super admin"
    const m = membershipForProgram(records, email, program)
    if (!m) return "No program access"
    if (m.role === "admin") return "Admissions admin"
    return "Admissions staff"
}

export function staffRecordsForProgram(
    records: StaffAccessRecord[],
    program: DashboardProgram
): StaffAccessRecord[] {
    return records.filter((r) => r.program === program)
}

export function uniqueStaffEmails(records: StaffAccessRecord[]): string[] {
    return [...new Set(records.map((r) => normalizeStaffEmail(r.email)))]
}

export type DashboardAccessDeniedReason = "not_monarch" | "not_approved" | "blocked"

export function dashboardAccessDeniedReason(
    records: StaffAccessRecord[],
    email: string,
    program: DashboardProgram
): DashboardAccessDeniedReason | null {
    if (hasDashboardAccess(records, email, program)) return null
    if (!isMonarchStaffEmail(email)) return "not_monarch"
    const normalized = normalizeStaffEmail(email)
    if (records.some((r) => normalizeStaffEmail(r.email) === normalized && r.status === "blocked")) {
        return "blocked"
    }
    return "not_approved"
}

export function displayNameForStaffEmail(records: StaffAccessRecord[], email: string): string {
    const normalized = normalizeStaffEmail(email)
    const row = records.find((r) => normalizeStaffEmail(r.email) === normalized)
    if (row?.display_name) return row.display_name
    if (isSuperAdmin(email)) return "Platform admin"
    const local = email.split("@")[0] ?? email
    return local.charAt(0).toUpperCase() + local.slice(1)
}

export function staffIdForEmail(records: StaffAccessRecord[], email: string): string {
    const normalized = normalizeStaffEmail(email)
    const row = records.find((r) => normalizeStaffEmail(r.email) === normalized && r.staff_id)
    if (row?.staff_id) return row.staff_id
    return "staff-1"
}

export function staffUsernameForEmail(email: string): string {
    return normalizeStaffEmail(email).split("@")[0] ?? email
}
