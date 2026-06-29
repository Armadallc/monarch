/** Mirrors `referral_source_profiles` (playground mock; wire to Supabase in production). */

export type PortalNotificationPreferences = {
    email_status_changes?: boolean
    email_new_messages?: boolean
    email_roi_signed?: boolean
    email_document_upload?: boolean
    email_weekly_summary?: boolean
}

export type ReferralSourceProfile = {
    user_id: string
    display_name: string | null
    organization: string | null
    title: string | null
    phone: string | null
    fax: string | null
    preferred_contact_method: string | null
    notification_preferences: PortalNotificationPreferences
}

export type PortalProfileTab = "profile" | "notifications"

export const PORTAL_EMAIL_NOTIFICATION_TOGGLES = [
    { key: "email_status_changes", label: "Referral status changes" },
    { key: "email_new_messages", label: "New messages from Monarch" },
    { key: "email_roi_signed", label: "ROI signed notifications" },
    { key: "email_document_upload", label: "Document upload notifications" },
    { key: "email_weekly_summary", label: "Weekly summary of referrals" },
] as const satisfies ReadonlyArray<{ key: keyof PortalNotificationPreferences; label: string }>

export const PORTAL_PREFERRED_CONTACT_OPTIONS = [
    { value: "", label: "—" },
    { value: "email", label: "Email" },
    { value: "phone", label: "Phone" },
    { value: "fax", label: "Fax" },
] as const

const STORAGE_KEY = "monarch-playground-portal-profile-v1"
const MOCK_PORTAL_USER_ID = "user-portal-satta"

const DEFAULT_PROFILE: ReferralSourceProfile = {
    user_id: MOCK_PORTAL_USER_ID,
    display_name: "Såtta Brunar",
    organization: "Colorado Bridges",
    title: "Case Manager",
    phone: "",
    fax: "",
    preferred_contact_method: "email",
    notification_preferences: {},
}

export function portalNotificationPref(
    prefs: PortalNotificationPreferences | null | undefined,
    key: keyof PortalNotificationPreferences
): boolean {
    if (!prefs || typeof prefs[key] !== "boolean") return true
    return !!prefs[key]
}

export function loadPortalProfile(): ReferralSourceProfile {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) {
            return {
                ...DEFAULT_PROFILE,
                notification_preferences: { ...DEFAULT_PROFILE.notification_preferences },
            }
        }
        const parsed = JSON.parse(raw) as Partial<ReferralSourceProfile>
        return {
            user_id: parsed.user_id ?? DEFAULT_PROFILE.user_id,
            display_name: parsed.display_name ?? DEFAULT_PROFILE.display_name,
            organization: parsed.organization ?? DEFAULT_PROFILE.organization,
            title: parsed.title ?? DEFAULT_PROFILE.title,
            phone: parsed.phone ?? DEFAULT_PROFILE.phone,
            fax: parsed.fax ?? DEFAULT_PROFILE.fax,
            preferred_contact_method:
                parsed.preferred_contact_method ?? DEFAULT_PROFILE.preferred_contact_method,
            notification_preferences: {
                ...DEFAULT_PROFILE.notification_preferences,
                ...(parsed.notification_preferences ?? {}),
            },
        }
    } catch {
        return {
            ...DEFAULT_PROFILE,
            notification_preferences: { ...DEFAULT_PROFILE.notification_preferences },
        }
    }
}

export function savePortalProfile(profile: ReferralSourceProfile): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
}

export function portalDisplayNameFromProfile(profile: ReferralSourceProfile): string {
    const name = profile.display_name?.trim()
    return name || DEFAULT_PROFILE.display_name || "Referral Source"
}
