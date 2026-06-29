/**
 * Monarch **Competency** deployment — canonical program constants for this repo.
 *
 * Other Monarch programs (Mental Health, Sober Living, Launch) should get a
 * sibling file (e.g. `monarchProgramMentalHealth.ts`) with the same shape, then
 * swap the import at the app shell (dashboard / auth) when that site ships.
 *
 * **Framer:** `Code/Framer/AuthGateway.tsx` and `Code/Framer/ReferralDashboard.tsx`
 * cannot import this file in isolation; they duplicate these values — update all
 * when domains, auth paths (`referralPartnerLoginPath`, `staffLoginPath`), or export labels change.
 *
 * DB program rows / `staff_program_memberships` are described in
 * `docs/CROSS_PROGRAM_REFERRAL_MIGRATION_CHECKLIST_V1.md` (M1–M2); this module
 * stays the **UI + auth gate** template until those tables drive runtime.
 */

export const MONARCH_COMPETENCY = {
    /** Stable slug; align with future `programs.slug`. */
    slug: "competency",
    displayName: "Monarch Competency",
    shortName: "Competency",
    /** Set true when a legible mark is ready (light-background asset). */
    dashboardLogoEnabled: false,
    /** Admissions dashboard header mark (public Storage — see repo `docs/printable/assets/monarch-competency-dashboard-logo.png`). */
    dashboardLogoUrl:
        "https://esbmnympligtknhtkary.supabase.co/storage/v1/object/public/assets/monarch-competency-dashboard-logo.png",
    dashboardLogoAlt: "Monarch Competency",
    dashboardLogoWidthPx: 70,
    dashboardLogoHeightPx: 50,
    /**
     * Staff may open the admissions dashboard if their sign-in email matches
     * any of these domains (lowercase host after @).
     */
    staffEmailDomains: ["monarchcompetency.com"] as const,
    /**
     * Option B — platform super admins (v1). Seeded in SQL (`is_platform_super_admin()`);
     * keep in sync when adding a backup break-glass contact.
     */
    platformSuperAdminEmails: ["sbrown@monarchcompetency.com"] as const,
    /**
     * Google `hd` hint — one hosted domain per OAuth request.
     * Use `staffEmailDomains[0]` when all staff share one Workspace.
     */
    get googleWorkspaceHintDomain(): string {
        return this.staffEmailDomains[0]
    },
    admissionsSupportEmail: "admissions@monarchcompetency.com",
    /** CSV export filename tokens (see Ritten checklist). */
    exportFilenamePrefixes: { full: "MC-FULL", ritten: "MC-RITTEN" } as const,
    /** Human-facing prefix for internal ref IDs (DB uses `REF-MC-` + sequence). */
    adminRefPrefixLabel: "REF-MC",
    /** Framer site base (staging). Production domain may differ when cutover ships. */
    siteBaseUrl: "https://monarchy.framer.website",
    /** Referral partners — public nav “Sign in”; default AuthGateway bucket on `/login`. */
    referralPartnerLoginPath: "/login?bucket=source",
    /** Admissions staff — not in public nav; bookmark / internal link only. */
    staffLoginPath: "/admin?bucket=staff",
    admissionsDashboardPath: "/dashboard",
} as const

export type MonarchProgramDeployment = typeof MONARCH_COMPETENCY

/** Active program for this codebase = Competency until a second app shell exists. */
export const ACTIVE_MONARCH_PROGRAM: MonarchProgramDeployment = MONARCH_COMPETENCY

/** Full URLs for Supabase `redirectTo` / `emailRedirectTo` allowlists. */
export function referralPartnerLoginUrl(
    program: MonarchProgramDeployment = ACTIVE_MONARCH_PROGRAM
): string {
    return `${program.siteBaseUrl}${program.referralPartnerLoginPath}`
}

export function staffLoginUrl(program: MonarchProgramDeployment = ACTIVE_MONARCH_PROGRAM): string {
    return `${program.siteBaseUrl}${program.staffLoginPath}`
}

export function isStaffEmailForProgram(
    email: string | null | undefined,
    program: MonarchProgramDeployment = ACTIVE_MONARCH_PROGRAM
): boolean {
    if (!email) return false
    const lower = email.toLowerCase()
    return program.staffEmailDomains.some((d) => lower.endsWith(`@${d}`))
}

/** e.g. `@monarchcompetency.com` or `@a.com, @b.com` for error copy */
export function staffEmailDomainsUiList(program: MonarchProgramDeployment = ACTIVE_MONARCH_PROGRAM): string {
    return program.staffEmailDomains.map((d) => `@${d}`).join(", ")
}

export function isPlatformSuperAdmin(
    email: string | null | undefined,
    program: MonarchProgramDeployment = ACTIVE_MONARCH_PROGRAM
): boolean {
    if (!email) return false
    const normalized = email.trim().toLowerCase()
    return program.platformSuperAdminEmails.some((e) => e.toLowerCase() === normalized)
}
