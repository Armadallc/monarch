/** Monarch Mental Health program constants for the referral app. */

export const MH_PROGRAM_ID = "prog_mental_health" as const

export const MH_COLORS = {
    blue: "#7c9aaa",
    dark: "#1d1d1b",
    blueMuted: "rgba(124, 154, 170, 0.14)",
    blueBorder: "rgba(124, 154, 170, 0.45)",
} as const

export const MH_MARKETING_SITE_URL = "https://www.monarchmentalhealth.org"

export function submitMentalHealthReferralsPath(): string {
    return "/submit-referrals/mental-health"
}

export function submitMentalHealthReferralsDocumentsPath(code?: string): string {
    const base = "/submit-referrals/documents"
    const params = new URLSearchParams()
    if (code) params.set("code", code)
    params.set("program", "mental_health")
    const q = params.toString()
    return q ? `${base}?${q}` : base
}
