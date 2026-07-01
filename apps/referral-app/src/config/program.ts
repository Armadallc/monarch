/** Competency program constants for the Vercel referral app. */

export type AuthBucket = "staff" | "source"

export const STAFF_EMAIL_DOMAINS = ["monarchcompetency.com"] as const

export const DEFAULT_LOGOTYPE_URL =
    "https://esbmnympligtknhtkary.supabase.co/storage/v1/object/public/assets/AuthGateway_Logotype_390x75.png"

export function appOrigin(): string {
    if (typeof window !== "undefined") return window.location.origin
    return ""
}

export function referralPartnerLoginUrl(): string {
    return `${appOrigin()}/login?bucket=source`
}

export function staffLoginUrl(): string {
    return `${appOrigin()}/admin?bucket=staff`
}

export function loginUrlForBucket(bucket: AuthBucket): string {
    return bucket === "source" ? referralPartnerLoginUrl() : staffLoginUrl()
}

export function staffLoginSwitchUrl(): string {
    return `${staffLoginUrl()}&switch=1`
}

export function dashboardRedirectUrl(): string {
    return `${appOrigin()}/dashboard`
}

export function shareLinkBase(): string {
    return `${appOrigin()}/r`
}

export function isStaffEmail(email: string | null | undefined): boolean {
    if (!email) return false
    const lower = email.toLowerCase()
    return STAFF_EMAIL_DOMAINS.some((d) => lower.endsWith(`@${d}`))
}
