import { MOCK_STAFF_USER_ID } from "./types"

/** Mirrors `admissions_staff_profiles` (playground mock; wire to Supabase in production). */
export type StaffNotificationPreferences = {
    sms_opt_in?: boolean
    email_new_referral?: boolean
    email_new_inquiry?: boolean
    email_new_message?: boolean
    email_assignment?: boolean
    email_document_upload?: boolean
    email_roi_signed?: boolean
    email_daily_digest?: boolean
}

export type AdmissionsStaffProfile = {
    user_id: string
    display_name: string | null
    phone: string | null
    contact_email: string | null
    title: string | null
    notification_preferences: StaffNotificationPreferences
}

export type StaffProfileTab = "profile" | "notifications"

export const STAFF_EMAIL_NOTIFICATION_TOGGLES = [
    { key: "email_new_referral", label: "New referral submissions" },
    { key: "email_new_inquiry", label: "New public inquiries" },
    { key: "email_new_message", label: "New messages from referral sources" },
    { key: "email_assignment", label: "When I am assigned to a referral" },
    { key: "email_document_upload", label: "Document uploads on my referrals" },
    { key: "email_roi_signed", label: "ROI signed on my referrals" },
    { key: "email_daily_digest", label: "Daily digest of program activity" },
] as const satisfies ReadonlyArray<{ key: keyof StaffNotificationPreferences; label: string }>

const STORAGE_KEY = "monarch-playground-staff-profile-v1"

const DEFAULT_PROFILE: AdmissionsStaffProfile = {
    user_id: MOCK_STAFF_USER_ID,
    display_name: "Christina Fleishman",
    title: "Admissions Coordinator",
    phone: "",
    contact_email: "",
    notification_preferences: {},
}

export function staffNotificationPref(
    prefs: StaffNotificationPreferences | null | undefined,
    key: keyof StaffNotificationPreferences
): boolean {
    if (key === "sms_opt_in") return !!prefs?.sms_opt_in
    if (!prefs || typeof prefs[key] !== "boolean") return true
    return !!prefs[key]
}

export function loadStaffProfile(): AdmissionsStaffProfile {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return { ...DEFAULT_PROFILE, notification_preferences: { ...DEFAULT_PROFILE.notification_preferences } }
        const parsed = JSON.parse(raw) as Partial<AdmissionsStaffProfile>
        return {
            user_id: parsed.user_id ?? DEFAULT_PROFILE.user_id,
            display_name: parsed.display_name ?? DEFAULT_PROFILE.display_name,
            title: parsed.title ?? DEFAULT_PROFILE.title,
            phone: parsed.phone ?? DEFAULT_PROFILE.phone,
            contact_email: parsed.contact_email ?? DEFAULT_PROFILE.contact_email,
            notification_preferences: {
                ...DEFAULT_PROFILE.notification_preferences,
                ...(parsed.notification_preferences ?? {}),
            },
        }
    } catch {
        return { ...DEFAULT_PROFILE, notification_preferences: { ...DEFAULT_PROFILE.notification_preferences } }
    }
}

export function saveStaffProfile(profile: AdmissionsStaffProfile): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
}

export function staffDisplayNameFromProfile(profile: AdmissionsStaffProfile): string {
    const name = profile.display_name?.trim()
    return name || DEFAULT_PROFILE.display_name || "Staff"
}
