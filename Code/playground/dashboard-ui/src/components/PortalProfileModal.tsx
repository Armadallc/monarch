import { useEffect, useState } from "react"
import { BUTTON_PRIMARY, COLORS, FONT, FONT_HEADING, RADIUS } from "@design"
import { DashboardPanelModal } from "./DashboardPanelModal"
import {
    PORTAL_EMAIL_NOTIFICATION_TOGGLES,
    PORTAL_PREFERRED_CONTACT_OPTIONS,
    portalNotificationPref,
    type PortalNotificationPreferences,
    type PortalProfileTab,
    type ReferralSourceProfile,
} from "../portalSourceProfile"

type Props = {
    open: boolean
    initialTab?: PortalProfileTab
    profile: ReferralSourceProfile
    onClose: () => void
    onSave: (profile: ReferralSourceProfile) => void
}

const profileTextInputStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 14px",
    borderRadius: RADIUS.input,
    border: `1px solid ${COLORS.input}`,
    fontFamily: FONT,
    fontSize: 14,
    color: COLORS.ash,
    background: COLORS.inputBackground,
}

const TABS: { id: PortalProfileTab; label: string }[] = [
    { id: "profile", label: "Profile" },
    { id: "notifications", label: "Notifications" },
]

const fieldLabel: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: COLORS.ashMuted,
    fontFamily: FONT,
}

function sectionCard(children: React.ReactNode) {
    return (
        <div
            style={{
                padding: "16px 18px",
                borderRadius: RADIUS.section,
                border: `1px solid ${COLORS.ashSubtle}`,
                background: COLORS.coconut,
            }}
        >
            {children}
        </div>
    )
}

export function PortalProfileModal({ open, initialTab = "profile", profile, onClose, onSave }: Props) {
    const [tab, setTab] = useState<PortalProfileTab>(initialTab)
    const [displayName, setDisplayName] = useState("")
    const [organization, setOrganization] = useState("")
    const [title, setTitle] = useState("")
    const [phone, setPhone] = useState("")
    const [fax, setFax] = useState("")
    const [preferredContact, setPreferredContact] = useState("")
    const [notificationPrefs, setNotificationPrefs] = useState<PortalNotificationPreferences>({})
    const [saving, setSaving] = useState(false)
    const [saveMsg, setSaveMsg] = useState<string | null>(null)

    useEffect(() => {
        if (!open) return
        setTab(initialTab)
        setDisplayName(profile.display_name ?? "")
        setOrganization(profile.organization ?? "")
        setTitle(profile.title ?? "")
        setPhone(profile.phone ?? "")
        setFax(profile.fax ?? "")
        setPreferredContact(profile.preferred_contact_method ?? "")
        setNotificationPrefs({ ...profile.notification_preferences })
        setSaveMsg(null)
    }, [open, initialTab, profile])

    if (!open) return null

    const setEmailPref = (key: keyof PortalNotificationPreferences, checked: boolean) => {
        setNotificationPrefs((prev) => ({ ...prev, [key]: checked }))
    }

    const handleSave = async () => {
        setSaving(true)
        setSaveMsg(null)
        await new Promise((r) => window.setTimeout(r, 280))
        const next: ReferralSourceProfile = {
            ...profile,
            display_name: displayName.trim() || null,
            organization: organization.trim() || null,
            title: title.trim() || null,
            phone: phone.trim() || null,
            fax: fax.trim() || null,
            preferred_contact_method: preferredContact || null,
            notification_preferences: { ...notificationPrefs },
        }
        onSave(next)
        setSaving(false)
        setSaveMsg("Profile saved.")
        window.setTimeout(() => setSaveMsg(null), 5000)
    }

    const tabBar = (
        <nav
            aria-label="Profile sections"
            style={{
                flexShrink: 0,
                display: "flex",
                gap: 4,
                padding: "0 16px",
                borderBottom: `1px solid ${COLORS.ashSubtle}`,
                background: COLORS.coconut,
            }}
        >
            {TABS.map((t) => {
                const active = tab === t.id
                return (
                    <button
                        key={t.id}
                        type="button"
                        onClick={() => setTab(t.id)}
                        style={{
                            flexShrink: 0,
                            padding: "12px 14px",
                            fontSize: 13,
                            fontWeight: active ? 700 : 600,
                            fontFamily: FONT_HEADING,
                            color: active ? COLORS.ash : COLORS.ashMuted,
                            background: "transparent",
                            border: "none",
                            borderBottom: active ? `2px solid ${COLORS.primary}` : "2px solid transparent",
                            marginBottom: -1,
                            cursor: "pointer",
                        }}
                    >
                        {t.label}
                    </button>
                )
            })}
        </nav>
    )

    return (
        <DashboardPanelModal
            title="My profile"
            onClose={onClose}
            maxWidth={680}
            headerBelow={tabBar}
            footer={
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    style={{ ...BUTTON_PRIMARY, opacity: saving ? 0.7 : 1 }}
                >
                    {saving ? "Saving…" : "Save"}
                </button>
            }
        >
            {saveMsg ? (
                <div
                    style={{
                        marginBottom: 16,
                        padding: "12px 14px",
                        borderRadius: RADIUS.section,
                        background: COLORS.successBg,
                        color: COLORS.successText,
                        fontSize: 13,
                        fontFamily: FONT,
                    }}
                >
                    {saveMsg}
                </div>
            ) : null}

            {tab === "profile" ? (
                <>
                    <p style={{ margin: "0 0 20px", fontSize: 14, lineHeight: 1.55, color: COLORS.ashMuted, fontFamily: FONT }}>
                        Contact information shown to admissions with your referrals. Sign-in email is managed separately.
                    </p>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                            gap: 16,
                        }}
                    >
                        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span style={fieldLabel}>Display name</span>
                            <input
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                style={profileTextInputStyle}
                                autoComplete="name"
                            />
                        </label>
                        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span style={fieldLabel}>Organization</span>
                            <input
                                value={organization}
                                onChange={(e) => setOrganization(e.target.value)}
                                style={profileTextInputStyle}
                                autoComplete="organization"
                            />
                        </label>
                        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span style={fieldLabel}>Title</span>
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                style={profileTextInputStyle}
                                autoComplete="organization-title"
                            />
                        </label>
                        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span style={fieldLabel}>Preferred contact</span>
                            <select
                                value={preferredContact}
                                onChange={(e) => setPreferredContact(e.target.value)}
                                style={profileTextInputStyle}
                            >
                                {PORTAL_PREFERRED_CONTACT_OPTIONS.map((o) => (
                                    <option key={o.value || "none"} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span style={fieldLabel}>Phone</span>
                            <input
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                style={profileTextInputStyle}
                                autoComplete="tel"
                            />
                        </label>
                        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span style={fieldLabel}>Fax</span>
                            <input
                                value={fax}
                                onChange={(e) => setFax(e.target.value)}
                                style={profileTextInputStyle}
                            />
                        </label>
                    </div>
                    <p style={{ margin: "12px 0 0", fontSize: 12, lineHeight: 1.45, color: COLORS.ashMuted, fontFamily: FONT }}>
                        Phone is shown to admissions with your referrals. Not used for sign-in or OTP.
                    </p>
                </>
            ) : (
                <>
                    <p style={{ margin: "0 0 20px", fontSize: 14, lineHeight: 1.55, color: COLORS.ashMuted, fontFamily: FONT }}>
                        Choose which emails you want to receive from Monarch. Notifications use your sign-in email.
                    </p>
                    {sectionCard(
                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            {PORTAL_EMAIL_NOTIFICATION_TOGGLES.map(({ key, label }) => (
                                <label
                                    key={key}
                                    style={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        gap: 10,
                                        cursor: "pointer",
                                        fontFamily: FONT,
                                        fontSize: 14,
                                        color: COLORS.ash,
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        className="checkbox-lg"
                                        checked={portalNotificationPref(notificationPrefs, key)}
                                        onChange={(e) => setEmailPref(key, e.target.checked)}
                                        style={{ marginTop: 2 }}
                                    />
                                    <span>{label}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </>
            )}
        </DashboardPanelModal>
    )
}
