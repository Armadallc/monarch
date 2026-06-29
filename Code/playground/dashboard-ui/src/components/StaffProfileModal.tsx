import { useEffect, useState } from "react"
import {
    ACTIVE_MONARCH_PROGRAM,
    isStaffEmailForProgram,
    staffEmailDomainsUiList,
} from "../../../../config/monarchProgramCompetency.ts"
import { BUTTON_PRIMARY, COLORS, FONT, FONT_HEADING, RADIUS } from "@design"
import { DashboardPanelModal } from "./DashboardPanelModal"
import {
    STAFF_EMAIL_NOTIFICATION_TOGGLES,
    staffNotificationPref,
    type AdmissionsStaffProfile,
    type StaffNotificationPreferences,
    type StaffProfileTab,
} from "../staffProfile"

type Props = {
    open: boolean
    initialTab?: StaffProfileTab
    profile: AdmissionsStaffProfile
    onClose: () => void
    onSave: (profile: AdmissionsStaffProfile) => void
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

const TABS: { id: StaffProfileTab; label: string }[] = [
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

export function StaffProfileModal({ open, initialTab = "profile", profile, onClose, onSave }: Props) {
    const [tab, setTab] = useState<StaffProfileTab>(initialTab)
    const [displayName, setDisplayName] = useState("")
    const [title, setTitle] = useState("")
    const [phone, setPhone] = useState("")
    const [contactEmail, setContactEmail] = useState("")
    const [notificationPrefs, setNotificationPrefs] = useState<StaffNotificationPreferences>({})
    const [saving, setSaving] = useState(false)
    const [saveMsg, setSaveMsg] = useState<string | null>(null)
    const [saveErr, setSaveErr] = useState<string | null>(null)

    useEffect(() => {
        if (!open) return
        setTab(initialTab)
        setDisplayName(profile.display_name ?? "")
        setTitle(profile.title ?? "")
        setPhone(profile.phone ?? "")
        setContactEmail(profile.contact_email ?? "")
        setNotificationPrefs({ ...profile.notification_preferences })
        setSaveMsg(null)
        setSaveErr(null)
    }, [open, initialTab, profile])

    if (!open) return null

    const setEmailPref = (key: keyof StaffNotificationPreferences, checked: boolean) => {
        setNotificationPrefs((prev) => ({ ...prev, [key]: checked }))
    }

    const handleSave = async () => {
        const ce = contactEmail.trim()
        if (ce && !isStaffEmailForProgram(ce)) {
            setSaveErr(`Work email must be empty or a ${staffEmailDomainsUiList()} address.`)
            return
        }
        setSaving(true)
        setSaveErr(null)
        setSaveMsg(null)
        await new Promise((r) => window.setTimeout(r, 280))
        const next: AdmissionsStaffProfile = {
            ...profile,
            display_name: displayName.trim() || null,
            title: title.trim() || null,
            phone: phone.trim() || null,
            contact_email: ce || null,
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
            maxWidth={640}
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
            {saveErr ? (
                <div
                    style={{
                        marginBottom: 16,
                        padding: "12px 14px",
                        borderRadius: RADIUS.section,
                        background: COLORS.errorBg,
                        color: COLORS.errorText,
                        fontSize: 13,
                        fontFamily: FONT,
                    }}
                >
                    {saveErr}
                </div>
            ) : null}
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
                    <p style={{ margin: "0 0 24px", fontSize: 14, lineHeight: 1.55, color: COLORS.ashMuted, fontFamily: FONT }}>
                        How you appear to referring sources when you are assigned to a referral. Sign-in email is not
                        shown here; use a program work address for published contact when you add one.
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span style={fieldLabel}>Full name</span>
                            <input
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                style={profileTextInputStyle}
                                autoComplete="name"
                            />
                        </label>
                        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span style={fieldLabel}>Position / title</span>
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                style={profileTextInputStyle}
                                autoComplete="organization-title"
                            />
                        </label>
                        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span style={fieldLabel}>Phone (published)</span>
                            <input
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                style={profileTextInputStyle}
                                autoComplete="tel"
                            />
                        </label>
                        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span style={fieldLabel}>Work email (published)</span>
                            <input
                                value={contactEmail}
                                onChange={(e) => setContactEmail(e.target.value)}
                                style={profileTextInputStyle}
                                autoComplete="email"
                                placeholder={`you@${ACTIVE_MONARCH_PROGRAM.staffEmailDomains[0]}`}
                            />
                        </label>
                    </div>
                </>
            ) : (
                <>
                    <p style={{ margin: "0 0 20px", fontSize: 14, lineHeight: 1.55, color: COLORS.ashMuted, fontFamily: FONT }}>
                        Choose which updates you receive. Email notifications use your sign-in address unless you set a
                        published work email on the Profile tab.
                    </p>

                    <h3
                        style={{
                            margin: "0 0 12px",
                            fontSize: 15,
                            fontWeight: 600,
                            fontFamily: FONT_HEADING,
                            color: COLORS.ash,
                        }}
                    >
                        Email
                    </h3>
                    {sectionCard(
                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            {STAFF_EMAIL_NOTIFICATION_TOGGLES.map(({ key, label }) => (
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
                                        checked={staffNotificationPref(notificationPrefs, key)}
                                        onChange={(e) => setEmailPref(key, e.target.checked)}
                                        style={{ marginTop: 2 }}
                                    />
                                    <span>{label}</span>
                                </label>
                            ))}
                        </div>
                    )}

                    <h3
                        style={{
                            margin: "24px 0 12px",
                            fontSize: 15,
                            fontWeight: 600,
                            fontFamily: FONT_HEADING,
                            color: COLORS.ash,
                        }}
                    >
                        SMS
                    </h3>
                    {sectionCard(
                        <label
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
                                checked={staffNotificationPref(notificationPrefs, "sms_opt_in")}
                                onChange={(e) => setEmailPref("sms_opt_in", e.target.checked)}
                                style={{ marginTop: 2 }}
                            />
                            <span>
                                SMS updates for urgent items
                                <span style={{ display: "block", marginTop: 4, fontSize: 13, color: COLORS.ashMuted }}>
                                    Optional — delivery is not wired in the playground yet.
                                </span>
                            </span>
                        </label>
                    )}
                </>
            )}
        </DashboardPanelModal>
    )
}
