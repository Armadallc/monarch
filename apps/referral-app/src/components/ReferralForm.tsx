import React, { useState, useEffect, useRef } from "react"
import type { CSSProperties } from "react"
import { createAuthGatewaySupabase } from "../lib/supabaseAuth"
import {
    MARKETING_SITE_URL,
    portalPath,
    publicReferralsPageUrl,
    submitReferralsDocumentsPath,
    submitReferralsPath,
} from "../config/program"

// ----- Inlined design system (Framer cannot resolve ../DesignSystem; keep in sync with Code/DesignSystem.ts) -----
const C = {
    ash: "#2B2828",
    ashDark: "#181818",
    ashMuted: "rgba(43, 40, 40, 0.6)",
    ashSubtle: "rgba(43, 40, 40, 0.15)",
    ash50: "rgba(43, 40, 40, 0.5)",
    coconut: "#E9EDF6",
    coconut50: "rgba(233, 237, 246, 0.5)",
    coconut25: "rgba(233, 237, 246, 0.25)",
    shell: "#F8F6F1",
    white: "#FFFFFF",
    stoneCloud: "#4F666A",
    gunmetal: "#45434c",
    moonstone: "#7EACB5",
    moonstoneLight: "rgba(126, 172, 181, 0.2)",
    tangerine: "#FFA089",
    tangerineLight: "rgba(255, 160, 137, 0.3)",
    champagne: "#F5E4C8",
    champagneLight: "rgba(245, 228, 200, 0.3)",
    success: "#059669",
    successBg: "#d1fae5",
    successText: "#059669",
    error: "#991B1B",
    errorBg: "#fee2e2",
    errorText: "#c0392b",
    warning: "#9A3412",
    warningBg: "#FFF7ED",
    warningBorder: "#FED7AA",
    warningText: "#9A3412",
    infoBg: "#EFF6FF",
    infoBorder: "#BFDBFE",
    infoText: "#1E40AF",
    border: "rgba(43, 40, 40, 0.12)",
    borderLight: "#E2E8F0",
    textMuted: "rgba(43, 40, 40, 0.6)",
    overlay: "rgba(27, 36, 42, 0.5)",
    green: "#d1fae5",
    greenText: "#059669",
    redText: "#c0392b",
} as const

const RADIUS = {
    card: "12px",
    input: "12px",
    section: "12px",
    modal: "16px",
    container: "16px",
    pill: "100px",
    small: "8px",
} as const

const FONT = `"Montserrat", sans-serif`

const SHADOWS = {
    card: "0 2px 12px rgba(43, 40, 40, 0.06)",
    cardHover: "0 4px 20px rgba(43, 40, 40, 0.08)",
    modal: "0 24px 48px -12px rgba(43, 40, 40, 0.15)",
} as const

const TRANSITION = "all 0.2s ease"

const FROSTED_GLASS: CSSProperties = {
    background: C.coconut25,
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    border: `1px solid ${C.ashSubtle}`,
    borderRadius: RADIUS.card,
    boxSizing: "border-box",
}

const BUTTON_PRIMARY: CSSProperties = {
    padding: "12px 24px",
    fontSize: "15px",
    fontWeight: 600,
    fontFamily: FONT,
    color: C.shell,
    backgroundColor: C.ash,
    border: "none",
    borderRadius: RADIUS.input,
    cursor: "pointer",
    letterSpacing: "-0.01em",
    transition: TRANSITION,
}

const BUTTON_SECONDARY: CSSProperties = {
    padding: "12px 24px",
    fontSize: "15px",
    fontWeight: 600,
    fontFamily: FONT,
    color: C.ash,
    backgroundColor: "transparent",
    border: `2px solid ${C.ashSubtle}`,
    borderRadius: RADIUS.input,
    cursor: "pointer",
    letterSpacing: "-0.01em",
    transition: TRANSITION,
}

const INPUT_BASE: CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    fontSize: "15px",
    fontFamily: FONT,
    color: C.ash,
    border: `1px solid ${C.ashSubtle}`,
    borderRadius: RADIUS.input,
    backgroundColor: C.white,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s ease",
}
// ----- End inlined design system -----

/** US `(XXX) XXX-XXXX` formatting for stored referral source phone digits (shared by profile prefill and tel input). */
function formatReferralSourcePhoneDisplay(digitsOnly: string): string {
    const limited = digitsOnly.replace(/\D/g, "").slice(0, 10)
    if (limited.length >= 6) {
        return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`
    }
    if (limited.length >= 3) {
        return `(${limited.slice(0, 3)}) ${limited.slice(3)}`
    }
    if (limited.length > 0) {
        return `(${limited}`
    }
    return ""
}

type DocumentInventoryStatus = "in_custody" | "can_obtain" | "unknown"

// ============================================================================
// INITIAL FORM STATE
// ============================================================================
const initialFormState = {
    // UI step 1 — Professional contact: organization/agency type (`referral_source_type`)
    referral_source_type: "",

    // Same step — name, org name, title, phone, email
    referral_source_name: "",
    referral_source_email: "",
    referral_source_phone: "",
    referral_source_organization: "",
    referral_source_title: "",
    urgent_placement: false,
    can_provide_collateral: "",
    previous_monarch_referral: "",

    // UI step 2 — Additional contacts
    emergency_contact_name: "",
    emergency_contact_relationship: "",
    emergency_contact_phone: "",
    emergency_contact_can_provide_info: false,
    additional_contacts: [] as any[],

    // UI step 3 — Demographics
    client_first_name: "",
    client_middle_name: "",
    client_last_name: "",
    client_preferred_name: "",
    client_dob: "",
    client_ssn: "",
    client_gender: "",
    client_sex_at_birth: "",
    client_pronouns: "",
    client_primary_language: "",
    client_english_proficiency: "",
    interpreter_needed: false,
    client_ethnicity: "",
    client_marital_status: "",
    client_phone: "",
    client_email: "",
    client_consents_to_referral: "",

    // UI step 4 — Documents inventory (snapshot → documents_available jsonb on submit)
    documents_inventory: {} as Record<string, DocumentInventoryStatus | "">,
    documents_notes: "",
    uploaded_documents: [] as any[],

    // UI step 5 — Insurance & benefits
    medicaid_status: "",
    medicaid_id: "",
    medicaid_number: "",
    medicare_status: "",
    medicare_number: "",
    has_private_insurance: false,
    private_insurance_details: "",
    ssdi_status: "",
    benefits_notes: "",

    // UI step 6 — Legal
    case_number: "",
    court_jurisdiction: "",
    judge_name: "",
    courtroom: "",
    next_court_date: "",
    charges: "",
    competency_status: "",
    competency_eval_date: "",
    competency_evaluator: "",
    attorney_name: "",
    attorney_phone: "",
    attorney_email: "",
    on_probation: false,
    probation_officer_contact: "",
    on_parole: false,
    parole_officer_contact: "",
    active_warrants: "",
    has_bond_holds: "",
    bond_holds_details: "",
    pr_bond_to_monarch: "",
    pr_bond_judge_contact: "",
    pr_bond_da_contact: "",
    pr_bond_other_contacts: "",

    // UI step 7 — Location
    current_location_type: "",
    facility_name: "",
    facility_address: "",
    inmate_id: "",
    facility_contact_person: "",
    facility_contact_phone: "",
    currently_incarcerated: false,
    expected_release_date: "",
    housing_prior: "",
    housing_post_program: "",
    housing_notes: "",

    // UI step 8 — Clinical
    current_diagnoses: "",
    medication_compliance: "",
    current_medications: "",
    medication_barriers: "",
    psychiatric_history: "",
    previous_treatment_programs: "",
    tbi_history: "",
    tbi_details: "",
    idd_status: "",
    idd_details: "",

    // UI step 9 — Substance use
    substance_use_pattern: "",
    substance_use_current: "",
    substance_use_history: "",
    detox_required: "",
    detox_details: "",

    // UI step 10 — Medical
    medical_conditions: "",
    medical_conditions_controlled: "",
    medications_non_psychiatric: "",
    medication_allergies: "",
    mobility_needs: "",
    adl_support_needed: false,
    adl_support_details: "",
    acute_medical_needs: "",

    // UI step 11 — Safety & risk
    suicide_risk: "",
    suicide_risk_details: "",
    violence_risk: "",
    violence_risk_details: "",
    elopement_risk: "",
    elopement_risk_details: "",
    arson_history: "",
    arson_details: "",
    rso_status: "",
    rso_details: "",
    medical_needs: false,
    safety_notes: "",

    // UI step 12 — Urgency & notes
    urgency_level: "",
    urgency_reason: "",
    additional_notes: "",
    referral_source_channel: "",

    // Legacy fields (kept for DB compat, dropped from form UI)
    medicaid_mco: "",
    expected_payer: "",
}

// ============================================================================
// EMPTY CONTACT TEMPLATE
// ============================================================================
const emptyContact = {
    name: "",
    organization: "",
    phone_email: "",
    role: "",
    can_provide_info: false,
}

// ============================================================================
// COLORADO JUDICIAL DISTRICTS
// ============================================================================
const CO_JUDICIAL_DISTRICTS = [
    "1st - Jefferson & Gilpin",
    "2nd - Denver",
    "3rd - Huerfano & Las Animas",
    "4th - El Paso & Teller",
    "5th - Clear Creek, Eagle, Lake, & Summit",
    "6th - Archuleta, La Plata, & San Juan",
    "7th - Delta, Gunnison, Hinsdale, Montrose, Ouray, & San Miguel",
    "8th - Jackson & Larimer",
    "9th - Garfield, Pitkin, & Rio Blanco",
    "10th - Pueblo",
    "11th - Chaffee, Custer, Fremont, & Park",
    "12th - Alamosa, Conejos, Costilla, Mineral, Rio Grande, & Saguache",
    "13th - Kit Carson, Logan, Morgan, Phillips, Sedgwick, Washington, & Yuma",
    "14th - Grand, Moffat, & Routt",
    "15th - Baca, Cheyenne, Kiowa, & Prowers",
    "16th - Bent, Crowley, & Otero",
    "17th - Adams & Broomfield",
    "18th - Arapahoe, Douglas, Elbert, & Lincoln",
    "19th - Weld",
    "20th - Boulder",
    "21st - Mesa",
    "22nd - Dolores & Montezuma",
]

// ============================================================================
// DOCUMENT TYPE OPTIONS
// ============================================================================
const DOCUMENT_OPTIONS = [
    { value: "valid_co_id", label: "Valid Colorado ID" },
    { value: "expired_co_id", label: "Expired Colorado ID" },
    { value: "out_of_state_id", label: "Out-of-State ID" },
    { value: "social_security_card", label: "Social Security Card" },
    { value: "birth_certificate", label: "Birth Certificate" },
    { value: "insurance_cards", label: "Insurance Card(s)" },
    { value: "court_order", label: "Court Order / Competency Order" },
    { value: "competency_eval", label: "Competency Evaluation Report" },
    { value: "psychiatric_records", label: "Psychiatric Records" },
    { value: "medical_records", label: "Medical Records" },
    { value: "medication_list", label: "Medication List (MAR)" },
    { value: "signed_roi", label: "Signed ROI(s)" },
]

const DOCUMENT_INVENTORY_STATUS_OPTIONS: { value: DocumentInventoryStatus; label: string }[] = [
    { value: "in_custody", label: "In my custody — available upon request" },
    { value: "can_obtain", label: "Exists — not in my custody, but I can help obtain it" },
    { value: "unknown", label: "Unknown" },
]

const DOCUMENT_INVENTORY_STATUS_LABELS: Record<DocumentInventoryStatus, string> = {
    in_custody: "In custody — available upon request",
    can_obtain: "Can help obtain",
    unknown: "Unknown",
}

function buildDocumentsInventorySnapshot(
    inventory: Record<string, DocumentInventoryStatus | "">
): { type: string; status: DocumentInventoryStatus }[] {
    return DOCUMENT_OPTIONS.map(({ value }) => ({
        type: value,
        status: inventory[value] || "unknown",
    }))
}

function formatDocumentsInventoryReview(
    raw: unknown,
    inventory: Record<string, DocumentInventoryStatus | "">
): string {
    if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === "object" && raw[0] !== null && "type" in raw[0]) {
        return (raw as { type: string; status: DocumentInventoryStatus }[])
            .map((e) => {
                const label = DOCUMENT_OPTIONS.find((o) => o.value === e.type)?.label ?? e.type
                return `${label}: ${DOCUMENT_INVENTORY_STATUS_LABELS[e.status] ?? e.status}`
            })
            .join("; ")
    }
    return DOCUMENT_OPTIONS.map(({ value, label }) => {
        const status = inventory[value] || "unknown"
        return `${label}: ${DOCUMENT_INVENTORY_STATUS_LABELS[status]}`
    }).join("; ")
}

// ============================================================================
// STEP TITLES
// ============================================================================
const STEP_TITLES = [
    "Your Contact Information",
    "Additional Contacts",
    "Individual Being Referred — Demographics",
    "Documents Inventory",
    "Insurance & Benefits",
    "Legal Status & Court Information",
    "Current Location & Situation",
    "Mental Health & Clinical Information",
    "Substance Use History",
    "Medical & Somatic Information",
    "Safety & Risk Assessment",
    "Additional Notes & Urgency",
    "Review & Submit",
]

/** Indices 0 … 12 (13 steps). Reuse this rail pattern on other program forms with their own labels. */
const REFERRAL_FORM_LAST_STEP = STEP_TITLES.length - 1
const REFERRAL_FORM_STEP_COUNT = STEP_TITLES.length
const REFERRAL_FORM_STEP_SHORT_LABELS = [
    "Contact",
    "Contacts",
    "Client",
    "Inventory",
    "Insurance",
    "Legal",
    "Location",
    "Clinical",
    "Substance",
    "Medical",
    "Safety",
    "Urgency",
    "Review",
] as const

/**
 * 0-based indices for `currentStep`. The rail and progress text show **UI step = index + 1**.
 */
const REFERRAL_FORM_STEP = {
    contact: 0,
    additionalContacts: 1,
    clientDemographics: 2,
    documents: 3,
    insurance: 4,
    legal: 5,
    location: 6,
    clinical: 7,
    substance: 8,
    medical: 9,
    safety: 10,
    urgency: 11,
    review: 12,
} as const

/** Pre-validation: green = steps before current; hollow = current + future (row highlight shows current). Red dots: add when step validation ships after staff workflow testing. */
function ReferralFormStepRailDot({ stepIndex, currentStep }: { stepIndex: number; currentStep: number }) {
    const base: React.CSSProperties = {
        width: "14px",
        height: "14px",
        borderRadius: "50%",
        boxSizing: "border-box",
        flexShrink: 0,
        marginTop: "3px",
        display: "block",
    }

    if (stepIndex < currentStep) {
        return <span aria-hidden style={{ ...base, border: `2px solid ${C.success}`, backgroundColor: C.success }} />
    }
    return <span aria-hidden style={{ ...base, border: `2px solid ${C.ashSubtle}`, backgroundColor: C.white }} />
}

function ReferralFormStepRail({
    currentStep,
    onSelectStep,
    variant,
}: {
    currentStep: number
    onSelectStep: (step: number) => void
    variant: "sidebar" | "horizontal"
}) {
    const indices = STEP_TITLES.map((_, i) => i)

    if (variant === "horizontal") {
        return (
            <nav
                aria-label="Form steps"
                style={{
                    width: "100%",
                    overflowX: "auto",
                    paddingBottom: "12px",
                    marginBottom: "8px",
                    WebkitOverflowScrolling: "touch",
                }}
            >
                <div style={{ display: "flex", gap: "10px", flexWrap: "nowrap", minWidth: "min-content" }}>
                    {indices.map((i) => {
                        const active = i === currentStep
                        return (
                            <button
                                key={i}
                                type="button"
                                onClick={() => onSelectStep(i)}
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    padding: "8px 12px",
                                    borderRadius: RADIUS.input,
                                    border: active ? `2px solid ${C.moonstone}` : `1px solid ${C.borderLight}`,
                                    background: active ? C.moonstoneLight : C.white,
                                    cursor: "pointer",
                                    fontFamily: "inherit",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                <ReferralFormStepRailDot stepIndex={i} currentStep={currentStep} />
                                <span style={{ fontSize: "12px", fontWeight: active ? 700 : 500, color: C.ash }}>
                                    {i + 1}. {REFERRAL_FORM_STEP_SHORT_LABELS[i]}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </nav>
        )
    }

    return (
        <nav
            aria-label="Form steps"
            style={{
                width: "200px",
                flexShrink: 0,
                position: "sticky",
                top: "16px",
                alignSelf: "flex-start",
            }}
        >
            <p
                style={{
                    margin: "0 0 12px 0",
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: C.textMuted,
                }}
            >
                Steps
            </p>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {indices.map((i) => {
                    const active = i === currentStep
                    return (
                        <li key={i} style={{ marginBottom: "4px" }}>
                            <button
                                type="button"
                                onClick={() => onSelectStep(i)}
                                style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "10px",
                                    width: "100%",
                                    textAlign: "left",
                                    padding: "8px 10px",
                                    borderRadius: RADIUS.input,
                                    border: "none",
                                    cursor: "pointer",
                                    fontFamily: "inherit",
                                    background: active ? C.moonstoneLight : "transparent",
                                    transition: "background 0.15s ease",
                                }}
                            >
                                <ReferralFormStepRailDot stepIndex={i} currentStep={currentStep} />
                                <span style={{ minWidth: 0 }}>
                                    <span
                                        style={{
                                            display: "block",
                                            fontSize: "11px",
                                            fontWeight: 600,
                                            color: C.textMuted,
                                            letterSpacing: "0.04em",
                                        }}
                                    >
                                        Step {i + 1}
                                    </span>
                                    <span
                                        style={{
                                            display: "block",
                                            fontSize: "13px",
                                            fontWeight: active ? 700 : 500,
                                            color: C.ash,
                                            lineHeight: 1.25,
                                        }}
                                    >
                                        {REFERRAL_FORM_STEP_SHORT_LABELS[i]}
                                    </span>
                                </span>
                            </button>
                        </li>
                    )
                })}
            </ul>
        </nav>
    )
}

// ============================================================================
// SUPABASE CLIENT & REDIRECT
// ============================================================================
const supabase = createAuthGatewaySupabase("source")!
const FORM_REDIRECT_URL = submitReferralsPath()
const PUBLIC_SITE_HOME_URL = MARKETING_SITE_URL
const PUBLIC_REFERRALS_PAGE_URL = publicReferralsPageUrl()
const REFERRAL_SOURCE_PORTAL_URL = portalPath()

/** One-time disclosure after first login (before submit-referrals menu). Legal may refine. */
const PORTAL_ACCESS_DISCLAIMER_PARAGRAPHS = [
    "Access to the referral source portal is optional. Whether or not you choose to use the portal now, the professional contact information you provide is kept so Monarch Competency admissions and referral staff can communicate with you about your cases.",
    "We use your contact details only for Monarch referral and admissions communication. We do not share or sell any of your information.",
    "A referral source portal is available for your convenience at any time. If you prefer not to use it right now, you can log out after submitting and return later with the same email address to track referrals and upload documents. Referrals you submitted with this account will appear there and reflect their current status in our admissions system (some may no longer be active).",
] as const

const PLACEMENT_TIMING_DISCLAIMER =
    "Referrals are handled on a case-by-case basis. We cannot guarantee placement for any referral."

async function upsertReferralSourceProfileFromReferralForm(args: {
    userId: string
    formData: typeof initialFormState
}) {
    const { userId, formData } = args
    const phoneDigits = (formData.referral_source_phone || "").replace(/\D/g, "") || null
    const { data: existing, error: exErr } = await supabase
        .from("referral_source_profiles")
        .select("fax, preferred_contact_method, notification_preferences, portal_access_preferred, portal_terms_acknowledged_at")
        .eq("user_id", userId)
        .maybeSingle()
    if (exErr) console.warn("[ReferralForm] referral_source_profiles read:", exErr)
    const prev = (existing || {}) as Record<string, unknown>
    const payload = {
        user_id: userId,
        referral_source_type: formData.referral_source_type?.trim() || null,
        display_name: formData.referral_source_name?.trim() || null,
        organization: formData.referral_source_organization?.trim() || null,
        title: formData.referral_source_title?.trim() || null,
        phone: phoneDigits,
        fax: (prev.fax as string | null | undefined) ?? null,
        preferred_contact_method: (prev.preferred_contact_method as string | null | undefined) ?? null,
        notification_preferences: (prev.notification_preferences as object | undefined) ?? {},
        portal_access_preferred: (prev.portal_access_preferred as boolean | null | undefined) ?? true,
        portal_terms_acknowledged_at: (prev.portal_terms_acknowledged_at as string | null | undefined) ?? null,
        updated_at: new Date().toISOString(),
    }
    const { error } = await supabase.from("referral_source_profiles").upsert(payload, { onConflict: "user_id" })
    if (error) console.warn("[ReferralForm] referral_source_profiles upsert:", error)
}

// ============================================================================
// SHARED STYLES
// ============================================================================
const S = {
    label: {
        display: "block",
        marginBottom: "6px",
        fontWeight: "600",
        fontSize: "14px",
        letterSpacing: "0.02em",
        color: C.ash,
    } as React.CSSProperties,
    input: { ...INPUT_BASE } as React.CSSProperties,
    select: { ...INPUT_BASE } as React.CSSProperties,
    textarea: { ...INPUT_BASE, resize: "vertical" as const, lineHeight: "1.5" } as React.CSSProperties,
    fieldGroup: {
        marginBottom: "20px",
    } as React.CSSProperties,
    sectionHeader: {
        fontSize: "16px",
        fontWeight: "700",
        color: C.stoneCloud,
        marginTop: "32px",
        marginBottom: "16px",
        paddingBottom: "8px",
        borderBottom: `2px solid ${C.moonstone}`,
        letterSpacing: "0.04em",
        textTransform: "uppercase" as const,
        borderRadius: RADIUS.section,
    } as React.CSSProperties,
    stepTitle: {
        fontSize: "22px",
        fontWeight: "700",
        marginBottom: "8px",
        color: C.ash,
    } as React.CSSProperties,
    stepDesc: {
        fontSize: "14px",
        color: C.textMuted,
        marginBottom: "24px",
    } as React.CSSProperties,
    callout: {
        padding: "16px",
        backgroundColor: C.infoBg,
        border: `1px solid ${C.infoBorder}`,
        borderRadius: RADIUS.card,
        marginBottom: "24px",
        fontSize: "14px",
        color: C.infoText,
        lineHeight: "1.5",
    } as React.CSSProperties,
    warningCallout: {
        padding: "16px",
        backgroundColor: C.warningBg,
        border: `1px solid ${C.warningBorder}`,
        borderRadius: RADIUS.card,
        marginBottom: "24px",
        fontSize: "14px",
        color: C.warning,
        lineHeight: "1.5",
    } as React.CSSProperties,
    btnPrimary: { ...BUTTON_PRIMARY } as React.CSSProperties,
    btnSecondary: { ...BUTTON_SECONDARY } as React.CSSProperties,
    btnSubmit: {
        ...BUTTON_PRIMARY,
        padding: "14px 32px",
        backgroundColor: C.success,
    } as React.CSSProperties,
    navRow: {
        display: "flex",
        justifyContent: "space-between",
        marginTop: "32px",
    } as React.CSSProperties,
    reviewBlock: {
        backgroundColor: C.shell,
        padding: "20px",
        borderRadius: RADIUS.card,
        marginBottom: "16px",
        border: `1px solid ${C.borderLight}`,
    } as React.CSSProperties,
    reviewTitle: {
        fontSize: "14px",
        fontWeight: "700",
        marginBottom: "12px",
        color: C.stoneCloud,
        letterSpacing: "0.04em",
        textTransform: "uppercase" as const,
    } as React.CSSProperties,
    checkboxRow: {
        display: "flex",
        alignItems: "center",
        cursor: "pointer",
        padding: "10px 12px",
        border: `1px solid ${C.borderLight}`,
        borderRadius: RADIUS.input,
        marginBottom: "8px",
    } as React.CSSProperties,
    checkboxInput: {
        marginRight: "10px",
        width: "18px",
        height: "18px",
        accentColor: C.stoneCloud,
    } as React.CSSProperties,
}

// ============================================================================
// FORMAT HELPERS
// ============================================================================
const fmt = (val: string) =>
    val
        ? val
              .replace(/_/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase())
        : ""

/** Professional referral source types only (ReferralForm — authenticated). Family/self use PublicInquiryForm on `/referrals`. */
const REFERRAL_SOURCE_TYPE_OPTIONS = [
    {
        value: "court",
        label: "Court System",
        desc: "Judge, court coordinator, or court-appointed professional",
    },
    {
        value: "legal_representative",
        label: "Legal Representative",
        desc: "Attorney, public defender, or legal advocate",
    },
    {
        value: "probation_parole",
        label: "Probation/Parole",
        desc: "Probation officer, parole officer, or corrections professional",
    },
    {
        value: "mental_health_facility",
        label: "Mental Health/Medical Facility",
        desc: "Hospital, psychiatric facility, or treatment center staff",
    },
    {
        value: "case_management",
        label: "Case Management/Social Services",
        desc: "Case manager, social worker, or community services professional",
    },
    {
        value: "other_professional",
        label: "Other Professional",
        desc: "Another professional not listed above (e.g., housing, advocacy, other agency)",
    },
] as const

const PROFESSIONAL_REFERRAL_SOURCE_TYPE_VALUES: string[] =
    REFERRAL_SOURCE_TYPE_OPTIONS.map((o) => o.value)

const formatCalendarDate = (value: string | null | undefined): string => {
    if (!value) return ""
    const s = String(value).trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        const [y, mo, d] = s.split("-").map((part) => parseInt(part, 10))
        return new Date(y, mo - 1, d).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        })
    }
    return s
}

function normalizeProfessionalReferralSourceType(
    raw: string | null | undefined
): string | null {
    const v = (raw ?? "").trim()
    if (!v) return null
    return PROFESSIONAL_REFERRAL_SOURCE_TYPE_VALUES.includes(v) ? v : null
}

const EXPEDITED_PLACEMENT_TIMING_LABELS: Record<string, string> = {
    asap: "ASAP — Soonest available",
    conditional_timeline: "Conditional timeline",
    immediate: "ASAP — Soonest available",
}

/** Urgent column / review: Requested | Conditional | ASAP | blank when not expedited */
function expeditedUrgentColumnLabel(
    urgentPlacement: boolean | undefined | null,
    urgencyLevel: string | null | undefined
): string | null {
    if (!urgentPlacement) return null
    const level = (urgencyLevel || "").trim().toLowerCase()
    if (!level) return "Requested"
    if (level === "conditional_timeline") return "Conditional"
    if (level === "asap" || level === "immediate") return "ASAP"
    return "Requested"
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function ReferralForm() {
    const [currentStep, setCurrentStep] = useState<number>(REFERRAL_FORM_STEP.contact)
    const [formData, setFormData] = useState(initialFormState)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitStatus, setSubmitStatus] = useState("idle")
    const [submitError, setSubmitError] = useState("")
    const [submittedReferralCode, setSubmittedReferralCode] = useState("")
    const [isMobile, setIsMobile] = useState(false)

    // Portal state
    const [showPortal, setShowPortal] = useState(true)

    const [codeCopied, setCodeCopied] = useState(false)

    // Session timeout state
    const [sessionTimeLeft, setSessionTimeLeft] = useState<number | null>(null)
    const [portalOnboardingReady, setPortalOnboardingReady] = useState(false)
    const [needsPortalOnboarding, setNeedsPortalOnboarding] = useState(false)
    const [portalTermsChecked, setPortalTermsChecked] = useState(false)
    const [portalOnboardingSaving, setPortalOnboardingSaving] = useState(false)
    const [expeditedRequiredByDate, setExpeditedRequiredByDate] = useState("")

    /** Saved profile row for contact autofill (authenticated). */
    const [savedReferralSourceProfile, setSavedReferralSourceProfile] = useState<{
        display_name: string | null
        organization: string | null
        title: string | null
        phone: string | null
        referral_source_type: string | null
    } | null>(null)
    /** Returning user: profile or prior submissions suggests showing confirm / update profile UX. */
    const [savedContactEligible, setSavedContactEligible] = useState(false)
    /** Returning user: checkbox — details still correct. */
    const [contactDetailsConfirmed, setContactDetailsConfirmed] = useState(false)
    /** After Update: fields cleared; Save writes profile from this step. */
    const [contactProfileEditing, setContactProfileEditing] = useState(false)
    const [contactProfileSaveBusy, setContactProfileSaveBusy] = useState(false)

    // Auth state
    const [authStatus, setAuthStatus] = useState<"checking" | "authenticated" | "unauthenticated">("checking")
    const [userEmail, setUserEmail] = useState("")
    const [showMagicLink, setShowMagicLink] = useState(false)
    const [magicLinkEmail, setMagicLinkEmail] = useState("")
    const [magicLinkSent, setMagicLinkSent] = useState(false)
    const [authError, setAuthError] = useState("")

    // Auth check on mount
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.user) {
                setAuthStatus("authenticated")
                const email = session.user.email || ""
                setUserEmail(email)
                setFormData((prev) => ({ ...prev, referral_source_email: email }))
            } else {
                setAuthStatus("unauthenticated")
            }
        }
        checkSession()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setAuthStatus("authenticated")
                const email = session.user.email || ""
                setUserEmail(email)
                setFormData((prev) => ({ ...prev, referral_source_email: email }))
            } else {
                setAuthStatus("unauthenticated")
                setUserEmail("")
            }
        })
        return () => subscription.unsubscribe()
    }, [])

    // Load saved professional contact from `referral_source_profiles` for hybrid prefill (UI contact step).
    useEffect(() => {
        if (authStatus !== "authenticated") {
            setSavedReferralSourceProfile(null)
            setSavedContactEligible(false)
            setContactDetailsConfirmed(false)
            setContactProfileEditing(false)
            return
        }
        let cancelled = false
        ;(async () => {
            const { data: { session } } = await supabase.auth.getSession()
            const uid = session?.user?.id
            if (!uid) return

            const { data: profile, error: pErr } = await supabase
                .from("referral_source_profiles")
                .select("display_name, organization, title, phone, referral_source_type")
                .eq("user_id", uid)
                .maybeSingle()
            if (pErr) console.warn("[ReferralForm] saved contact profile read:", pErr)

            let priorCount = 0
            const { count: byUser, error: c1 } = await supabase
                .from("referral_submissions")
                .select("id", { count: "exact", head: true })
                .eq("submitted_by_user_id", uid)
            if (!c1 && byUser != null) priorCount = byUser
            if (priorCount === 0) {
                const email = (session.user.email || "").trim().toLowerCase()
                if (email) {
                    const { count: byEmail, error: c2 } = await supabase
                        .from("referral_submissions")
                        .select("id", { count: "exact", head: true })
                        .ilike("referral_source_email", email)
                    if (!c2 && byEmail != null) priorCount = byEmail
                }
            }

            if (cancelled) return

            const prof = profile as {
                display_name: string | null
                organization: string | null
                title: string | null
                phone: string | null
                referral_source_type: string | null
            } | null

            setSavedReferralSourceProfile(prof)

            const hasProfileToken =
                !!(prof?.referral_source_type?.trim()) ||
                !!(prof?.display_name?.trim()) ||
                !!(prof?.organization?.trim()) ||
                !!(prof?.title?.trim()) ||
                String(prof?.phone ?? "").replace(/\D/g, "").length >= 10

            const eligible = !!prof && (hasProfileToken || priorCount > 0)
            setSavedContactEligible(eligible)

            if (!eligible || !prof) {
                return
            }

            const digits = String(prof.phone ?? "").replace(/\D/g, "")
            const phoneDisp = formatReferralSourcePhoneDisplay(digits)
            setFormData((prev) => ({
                ...prev,
                referral_source_type:
                    normalizeProfessionalReferralSourceType(prof.referral_source_type) || "",
                referral_source_name: prof.display_name?.trim() || "",
                referral_source_organization: prof.organization?.trim() || "",
                referral_source_title: prof.title?.trim() || "",
                referral_source_phone: phoneDisp,
            }))
        })()
        return () => {
            cancelled = true
        }
    }, [authStatus])

    // First-time referral sources: one-time portal disclosure before the submit-referrals menu.
    useEffect(() => {
        if (authStatus !== "authenticated") {
            setPortalOnboardingReady(false)
            setNeedsPortalOnboarding(false)
            return
        }
        let cancelled = false
        ;(async () => {
            const { data: { session } } = await supabase.auth.getSession()
            const uid = session?.user?.id
            if (!uid) {
                if (!cancelled) {
                    setNeedsPortalOnboarding(false)
                    setPortalOnboardingReady(true)
                }
                return
            }
            const { data: profile, error: profErr } = await supabase
                .from("referral_source_profiles")
                .select("portal_terms_acknowledged_at")
                .eq("user_id", uid)
                .maybeSingle()
            if (profErr) console.warn("[ReferralForm] portal onboarding profile read:", profErr)
            if (profile?.portal_terms_acknowledged_at) {
                if (!cancelled) {
                    setNeedsPortalOnboarding(false)
                    setPortalOnboardingReady(true)
                }
                return
            }
            const email = (session.user.email || "").trim().toLowerCase()
            let priorCount = 0
            const { count: byUser, error: c1 } = await supabase
                .from("referral_submissions")
                .select("id", { count: "exact", head: true })
                .eq("submitted_by_user_id", uid)
            if (!c1 && byUser != null) priorCount = byUser
            if (priorCount === 0 && email) {
                const { count: byEmail, error: c2 } = await supabase
                    .from("referral_submissions")
                    .select("id", { count: "exact", head: true })
                    .ilike("referral_source_email", email)
                if (!c2 && byEmail != null) priorCount = byEmail
            }
            if (!cancelled) {
                setNeedsPortalOnboarding(!(priorCount > 0))
                setPortalOnboardingReady(true)
            }
        })()
        return () => {
            cancelled = true
        }
    }, [authStatus, userEmail])

    // Referrer-facing login (same storage bucket as ReferralSourcePortal / AuthGateway `?bucket=source`)
    useEffect(() => {
        if (authStatus === "unauthenticated" && typeof window !== "undefined") {
            window.location.href = "/login?bucket=source"
        }
    }, [authStatus])

    // Responsive
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 810)
        check()
        window.addEventListener("resize", check)
        return () => window.removeEventListener("resize", check)
    }, [])

    // 10-minute idle timeout after submission
    useEffect(() => {
        if (submitStatus !== "success") {
            setSessionTimeLeft(null)
            return
        }
        setSessionTimeLeft(600) // 10 minutes
        const interval = setInterval(() => {
            setSessionTimeLeft((prev) => {
                if (prev === null) return null
                if (prev <= 1) {
                    clearInterval(interval)
                    void (async () => {
                        await supabase.auth.signOut()
                    })()
                    return 0
                }
                return prev - 1
            })
        }, 1000)
        return () => clearInterval(interval)
    }, [submitStatus])

    // ========================================================================
    // HANDLERS
    // ========================================================================
    const handleInputChange = (e: any) => {
        const { name, value, type, checked } = e.target
        if (name === "urgent_placement" && type === "checkbox") {
            const isChecked = checked
            setFormData((prev) => ({
                ...prev,
                urgent_placement: isChecked,
                ...(isChecked ? {} : { urgency_level: "", urgency_reason: "" }),
            }))
            if (!isChecked) setExpeditedRequiredByDate("")
            return
        }
        if (name === "urgency_level") {
            setFormData((prev) => ({ ...prev, urgency_level: value }))
            if (value !== "conditional_timeline") setExpeditedRequiredByDate("")
            return
        }
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }))
    }

    const handlePhoneChange = (e: any) => {
        const { name, value } = e.target
        const formatted = formatReferralSourcePhoneDisplay(value)
        setFormData((prev) => ({ ...prev, [name]: formatted }))
    }

    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
    }

    const handleEmailBlur = (e: any) => {
        const email = e.target.value
        if (email && !validateEmail(email)) {
            e.target.setCustomValidity("Please enter a valid email address (e.g., name@example.com)")
            e.target.reportValidity()
        } else {
            e.target.setCustomValidity("")
        }
    }

    const handlePortalTermsContinue = async () => {
        if (!portalTermsChecked) {
            window.alert("Please read and acknowledge the terms below to continue.")
            return
        }
        setPortalOnboardingSaving(true)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const uid = session?.user?.id
            if (!uid) return
            const now = new Date().toISOString()
            const { error } = await supabase.from("referral_source_profiles").upsert(
                {
                    user_id: uid,
                    portal_terms_acknowledged_at: now,
                    portal_access_preferred: true,
                    updated_at: now,
                },
                { onConflict: "user_id" }
            )
            if (error) {
                console.warn("[ReferralForm] portal terms ack:", error)
                window.alert("Could not save your acknowledgement. Please try again.")
                return
            }
            setNeedsPortalOnboarding(false)
            setPortalTermsChecked(false)
        } finally {
            setPortalOnboardingSaving(false)
        }
    }

    const setDocumentInventoryStatus = (docType: string, status: DocumentInventoryStatus) => {
        setFormData((prev) => ({
            ...prev,
            documents_inventory: { ...prev.documents_inventory, [docType]: status },
        }))
    }

    // Additional contacts
    const addContact = () => {
        setFormData((prev) => ({
            ...prev,
            additional_contacts: [...prev.additional_contacts, { ...emptyContact }],
        }))
    }

    const updateContact = (index: number, field: string, value: any) => {
        setFormData((prev) => {
            const updated = [...prev.additional_contacts]
            updated[index] = { ...updated[index], [field]: value }
            return { ...prev, additional_contacts: updated }
        })
    }

    const removeContact = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            additional_contacts: prev.additional_contacts.filter((_, i) => i !== index),
        }))
    }

    const copyReferralCode = async () => {
        try {
            await navigator.clipboard.writeText(submittedReferralCode)
            setCodeCopied(true)
            setTimeout(() => setCodeCopied(false), 2000)
        } catch (_e) {
            // Fallback for older browsers
            const el = document.createElement("textarea")
            el.value = submittedReferralCode
            document.body.appendChild(el)
            el.select()
            document.execCommand("copy")
            document.body.removeChild(el)
            setCodeCopied(true)
            setTimeout(() => setCodeCopied(false), 2000)
        }
    }

    const handleSignOut = async () => {
        setSessionTimeLeft(null)
        await supabase.auth.signOut()
    }

    // ========================================================================
    // SUBMIT
    // ========================================================================
    const handleSubmit = async () => {
        setIsSubmitting(true)
        setSubmitStatus("idle")
        setSubmitError("")

        try {
            const cleanedData: any = { ...formData }

            const sourceType = normalizeProfessionalReferralSourceType(
                cleanedData.referral_source_type
            )
            if (!sourceType) {
                setSubmitStatus("error")
                setSubmitError(
                    "Please select your Organization / Agency Type on the Professional contact step (Step 1), then submit again."
                )
                setCurrentStep(REFERRAL_FORM_STEP.contact)
                return
            }
            cleanedData.referral_source_type = sourceType

            // Clean date fields — empty string → null
            const dateFields = [
                "client_dob",
                "competency_eval_date",
                "next_court_date",
                "expected_release_date",
            ]
            dateFields.forEach((field) => {
                if (cleanedData[field] === "") cleanedData[field] = null
            })

            if (cleanedData.referral_source_channel === "") {
                cleanedData.referral_source_channel = null
            }

            // Clean jsonb text fields
            if (cleanedData.current_medications === "") cleanedData.current_medications = null

            cleanedData.documents_available = buildDocumentsInventorySnapshot(
                cleanedData.documents_inventory || {}
            )
            delete cleanedData.documents_inventory

            if (!Array.isArray(cleanedData.additional_contacts)) cleanedData.additional_contacts = []
            if (!Array.isArray(cleanedData.uploaded_documents)) cleanedData.uploaded_documents = []

            // Strip phone formatting before saving
            const phoneFields = [
                "referral_source_phone",
                "facility_contact_phone",
                "emergency_contact_phone",
                "attorney_phone",
                "client_phone",
            ]
            phoneFields.forEach((field) => {
                if (cleanedData[field]) {
                    cleanedData[field] = cleanedData[field].replace(/\D/g, "")
                }
            })

            if (typeof cleanedData.referral_source_email === "string") {
                cleanedData.referral_source_email = cleanedData.referral_source_email.trim().toLowerCase()
            }

            if (!cleanedData.urgent_placement) {
                cleanedData.urgency_level = null
                cleanedData.urgency_reason = null
            } else {
                if (cleanedData.urgency_level === "") cleanedData.urgency_level = null
                if (cleanedData.urgency_level === "conditional_timeline" && expeditedRequiredByDate) {
                    const prefix = `Must be placed by: ${expeditedRequiredByDate}`
                    const notes = (cleanedData.urgency_reason || "").trim()
                    cleanedData.urgency_reason = notes ? `${prefix}\n${notes}` : prefix
                } else if (cleanedData.urgency_reason === "") {
                    cleanedData.urgency_reason = null
                }
            }

            // Remove local-only fields not in DB
            // (none currently, but placeholder for future)

            const { data: { session } } = await supabase.auth.getSession()
            const submittedByUserId = session?.user?.id ?? null

            const { data, error } = await supabase
                .from("referral_submissions")
                .insert([
                    {
                        ...cleanedData,
                        is_priority_referral: false,
                        status: "pending_review",
                        submitted_by_user_id: submittedByUserId,
                        portal_access_opt_in: null,
                    },
                ])
                .select()

            if (error) throw error

            console.log("Success!", data)
            const referralId = data?.[0]?.id
            const referralCode = data?.[0]?.referral_code

            // Capture the referral code from the returned data
            if (referralCode) {
                setSubmittedReferralCode(referralCode)
            }

            if (submittedByUserId) {
                await upsertReferralSourceProfileFromReferralForm({
                    userId: submittedByUserId,
                    formData,
                })
            }

            setSubmitStatus("success")
        } catch (error) {
            console.error("Error submitting form:", error)
            const err = error as { code?: string; message?: string }
            if (err?.code === "23514" && err.message?.includes("referral_source_type")) {
                setSubmitError(
                    "Organization / Agency Type is missing or invalid. Open Step 1 (Professional contact), choose a type from the list, and submit again."
                )
            } else if (err?.message) {
                setSubmitError(err.message)
            } else {
                setSubmitError("Could not submit referral. Please try again.")
            }
            setSubmitStatus("error")
        } finally {
            setIsSubmitting(false)
        }
    }

    const resetForm = () => {
        const base = { ...initialFormState, referral_source_email: userEmail }
        let next = base
        if (savedContactEligible && savedReferralSourceProfile) {
            const prof = savedReferralSourceProfile
            const digits = String(prof.phone ?? "").replace(/\D/g, "")
            const phoneDisp = formatReferralSourcePhoneDisplay(digits)
            next = {
                ...base,
                referral_source_type:
                    normalizeProfessionalReferralSourceType(prof.referral_source_type) || "",
                referral_source_name: prof.display_name?.trim() || "",
                referral_source_organization: prof.organization?.trim() || "",
                referral_source_title: prof.title?.trim() || "",
                referral_source_phone: phoneDisp,
            }
        }
        setFormData(next)
        setExpeditedRequiredByDate("")
        setCurrentStep(REFERRAL_FORM_STEP.contact)
        setSubmitStatus("idle")
        setSubmitError("")
        setSubmittedReferralCode("")
        setCodeCopied(false)
        setShowPortal(true)
        setSessionTimeLeft(null)
        setPortalTermsChecked(false)
        setContactDetailsConfirmed(false)
        setContactProfileEditing(false)
    }

    const clearContactFieldsForProfileEdit = () => {
        setFormData((prev) => ({
            ...prev,
            referral_source_type: "",
            referral_source_name: "",
            referral_source_organization: "",
            referral_source_title: "",
            referral_source_phone: "",
        }))
        setContactProfileEditing(true)
        setContactDetailsConfirmed(false)
    }

    const saveContactProfileFromStep = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        const uid = session?.user?.id
        if (!uid) return
        setContactProfileSaveBusy(true)
        try {
            await upsertReferralSourceProfileFromReferralForm({ userId: uid, formData })
            const digits = (formData.referral_source_phone || "").replace(/\D/g, "")
            setSavedReferralSourceProfile({
                referral_source_type: formData.referral_source_type?.trim() || null,
                display_name: formData.referral_source_name?.trim() || null,
                organization: formData.referral_source_organization?.trim() || null,
                title: formData.referral_source_title?.trim() || null,
                phone: digits || null,
            })
            setSavedContactEligible(true)
            setContactProfileEditing(false)
            setContactDetailsConfirmed(false)
        } finally {
            setContactProfileSaveBusy(false)
        }
    }

    // ========================================================================
    // RENDER HELPERS
    // ========================================================================
    const renderField = (
        label: string,
        name: string,
        type: string = "text",
        opts?: {
            placeholder?: string
            rows?: number
            emptyOptionLabel?: string
            options?: { value: string; label: string }[]
            required?: boolean
        }
    ) => {
        if (type === "select" && opts?.options) {
            const emptyLabel = opts.emptyOptionLabel ?? "Select..."
            return (
                <div style={S.fieldGroup}>
                    <label style={S.label}>{label}</label>
                    <select
                        name={name}
                        value={(formData as any)[name]}
                        onChange={handleInputChange}
                        style={S.select}
                        required={opts?.required}
                    >
                        <option value="">{emptyLabel}</option>
                        {opts.options.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>
                </div>
            )
        }
        if (type === "textarea") {
            return (
                <div style={S.fieldGroup}>
                    <label style={S.label}>{label}</label>
                    <textarea
                        name={name}
                        value={(formData as any)[name]}
                        onChange={handleInputChange}
                        placeholder={opts?.placeholder || ""}
                        rows={opts?.rows || 3}
                        style={S.textarea}
                    />
                </div>
            )
        }
        if (type === "tel") {
            return (
                <div style={S.fieldGroup}>
                    <label style={S.label}>{label}</label>
                    <input
                        type="tel"
                        name={name}
                        value={(formData as any)[name]}
                        onChange={handlePhoneChange}
                        placeholder="(555) 555-5555"
                        style={S.input}
                    />
                </div>
            )
        }
        if (type === "email") {
            return (
                <div style={S.fieldGroup}>
                    <label style={S.label}>{label}</label>
                    <input
                        type="email"
                        name={name}
                        value={(formData as any)[name]}
                        onChange={handleInputChange}
                        onBlur={handleEmailBlur}
                        placeholder={opts?.placeholder || ""}
                        style={S.input}
                    />
                </div>
            )
        }
        return (
            <div style={S.fieldGroup}>
                <label style={S.label}>{label}</label>
                <input
                    type={type}
                    name={name}
                    value={(formData as any)[name]}
                    onChange={handleInputChange}
                    placeholder={opts?.placeholder || ""}
                    style={S.input}
                />
            </div>
        )
    }

    const renderCheckbox = (label: string, name: string) => (
        <div style={S.fieldGroup}>
            <label style={S.checkboxRow}>
                <input
                    type="checkbox"
                    name={name}
                    checked={(formData as any)[name]}
                    onChange={handleInputChange}
                    style={S.checkboxInput}
                />
                <span style={{ fontWeight: "500", fontSize: "15px" }}>{label}</span>
            </label>
        </div>
    )

    const renderNav = (back: number | null, next: number | null, nextLabel?: string) => (
        <div style={S.navRow}>
            {back !== null ? (
                <button onClick={() => setCurrentStep(back)} style={S.btnSecondary}>
                    ← Previous
                </button>
            ) : (
                <div />
            )}
            {next !== null && (
                <button onClick={() => setCurrentStep(next)} style={S.btnPrimary}>
                    {nextLabel || "Next →"}
                </button>
            )}
        </div>
    )

    const renderReviewLine = (label: string, value: any) => {
        if (!value && value !== false) return null
        if (typeof value === "boolean") {
            return (
                <p style={{ marginBottom: "6px", fontSize: "14px" }}>
                    <strong>{label}:</strong> {value ? "Yes" : "No"}
                </p>
            )
        }
        return (
            <p style={{ marginBottom: "6px", fontSize: "14px" }}>
                <strong>{label}:</strong> {value}
            </p>
        )
    }

    const renderEditButton = (stepNum: number) => (
        <button
            onClick={() => setCurrentStep(stepNum)}
            style={{
                fontSize: "12px",
                color: C.moonstone,
                background: "none",
                border: "none",
                cursor: "pointer",
                fontWeight: "600",
                float: "right" as const,
                letterSpacing: "0.04em",
                textTransform: "uppercase" as const,
            }}
        >
            EDIT
        </button>
    )

    // ========================================================================
    // RENDER
    // ========================================================================
    // ========================================================================
    // AUTH GATE — checking / unauthenticated
    // ========================================================================
    if (authStatus === "checking") {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px", width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
                <div style={{ textAlign: "center" }}>
                    <div style={{
                        width: "40px", height: "40px", border: `3px solid ${C.coconut}`,
                        borderTopColor: C.moonstone, borderRadius: "50%",
                        animation: "spin 0.8s linear infinite", margin: "0 auto 16px",
                    }} />
                    <p style={{ color: C.textMuted, fontSize: "14px" }}>Verifying session...</p>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            </div>
        )
    }

    if (authStatus === "unauthenticated") {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px", width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
                <div style={{ textAlign: "center", color: C.textMuted, fontSize: "14px" }}>
                    <div style={{
                        width: "40px", height: "40px", border: `3px solid ${C.coconut}`,
                        borderTopColor: C.moonstone, borderRadius: "50%",
                        animation: "spin 0.8s linear infinite", margin: "0 auto 16px",
                    }} />
                    Redirecting to sign in…
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            </div>
        )
    }

    // ========================================================================
    // AUTHENTICATED — RENDER FORM
    // ========================================================================
    const showFormStepRail = !showPortal && submitStatus !== "success"

    return (
        <div style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box", overflow: "auto" }}>
        <div
            style={{
                padding: isMobile ? "20px" : "40px",
                maxWidth: showFormStepRail && !isMobile ? "min(1120px, 100%)" : "800px",
                margin: "0 auto",
            }}
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: "row",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                    marginBottom: "8px",
                }}
            >
                <h1
                    style={{
                        color: C.stoneCloud,
                        margin: 0,
                        fontSize: isMobile ? "22px" : "28px",
                        fontWeight: "700",
                        letterSpacing: "0.02em",
                        flex: "1 1 auto",
                        minWidth: 0,
                    }}
                >
                    {showPortal && submitStatus !== "success" ? "Referral Portal" : "Monarch Competency Referral"}
                </h1>
                {showFormStepRail && (
                    <button
                        type="button"
                        onClick={() => {
                            try {
                                window.location.href = REFERRAL_SOURCE_PORTAL_URL
                            } catch (_e) {
                                // Fallback for constrained runtimes
                            }
                        }}
                        style={{
                            flex: "0 0 auto",
                            background: "none",
                            border: "none",
                            color: C.moonstone,
                            fontSize: "14px",
                            fontWeight: "600",
                            cursor: "pointer",
                            padding: "4px 0",
                            fontFamily: "inherit",
                            textDecoration: "underline",
                            textUnderlineOffset: "3px",
                            whiteSpace: "nowrap",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = C.ash
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = C.moonstone
                        }}
                    >
                        Return to Dashboard
                    </button>
                )}
            </div>

            {/* ============================================================ */}
            {/* PORTAL — Two-option landing after login                    */}
            {/* ============================================================ */}
            {showPortal && submitStatus !== "success" && portalOnboardingReady && needsPortalOnboarding && (
                <div>
                    <h2 style={{ ...S.stepTitle, marginBottom: "8px" }}>Referral source portal</h2>
                    <p style={S.stepDesc}>
                        Before you continue, please review how we use your contact information and how the optional portal works.
                    </p>
                    <div style={{ ...S.callout, marginBottom: "20px" }}>
                        {PORTAL_ACCESS_DISCLAIMER_PARAGRAPHS.map((p, idx) => (
                            <p key={idx} style={{ margin: idx === 0 ? 0 : "12px 0 0", lineHeight: 1.55 }}>
                                {p}
                            </p>
                        ))}
                    </div>
                    <label style={{ ...S.checkboxRow, marginBottom: "24px", alignItems: "flex-start" }}>
                        <input
                            type="checkbox"
                            checked={portalTermsChecked}
                            onChange={(e) => setPortalTermsChecked(e.target.checked)}
                            style={{ ...S.checkboxInput, marginTop: "3px" }}
                        />
                        <span style={{ fontSize: "14px", lineHeight: 1.55, color: C.ash }}>
                            I understand that information I transmit through Monarch systems is handled securely, that the referral
                            source portal is available to me at my convenience, and I agree to these terms before proceeding.
                        </span>
                    </label>
                    <button
                        type="button"
                        onClick={() => void handlePortalTermsContinue()}
                        disabled={!portalTermsChecked || portalOnboardingSaving}
                        style={{
                            ...S.btnPrimary,
                            opacity: !portalTermsChecked || portalOnboardingSaving ? 0.55 : 1,
                            cursor: !portalTermsChecked || portalOnboardingSaving ? "not-allowed" : "pointer",
                        }}
                    >
                        {portalOnboardingSaving ? "Saving…" : "Continue"}
                    </button>
                </div>
            )}

            {showPortal && submitStatus !== "success" && portalOnboardingReady && !needsPortalOnboarding && (
                <div>
                    <button
                        type="button"
                        onClick={() => { try { window.location.href = portalPath() } catch (_e) {} }}
                        style={{
                            background: "none",
                            border: "none",
                            color: C.textMuted,
                            fontSize: "14px",
                            fontWeight: "500",
                            cursor: "pointer",
                            padding: "0",
                            marginBottom: "24px",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            fontFamily: "inherit",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = C.ash }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = C.textMuted }}
                    >
                        {"\u2190"} Back to Dashboard
                    </button>
                    <p style={{ color: C.textMuted, fontSize: "15px", marginBottom: "32px", lineHeight: "1.5" }}>
                        What would you like to do?
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <div
                            onClick={() => setShowPortal(false)}
                            style={{
                                padding: "24px",
                                ...FROSTED_GLASS,
                                cursor: "pointer",
                                transition: TRANSITION,
                                boxShadow: SHADOWS.card,
                            }}
                            onMouseEnter={(e) => { const t = e.currentTarget as HTMLDivElement; t.style.boxShadow = SHADOWS.cardHover; t.style.borderColor = C.ash }}
                            onMouseLeave={(e) => { const t = e.currentTarget as HTMLDivElement; t.style.boxShadow = SHADOWS.card; t.style.borderColor = C.ashSubtle }}
                        >
                            <p style={{ fontSize: "20px", marginBottom: "10px" }}>&#x1F4CB;</p>
                            <h3 style={{ fontSize: "18px", fontWeight: "700", color: C.ash, marginBottom: "8px" }}>
                                Submit New Referral
                            </h3>
                            <p style={{ fontSize: "14px", color: C.textMuted, lineHeight: "1.5", margin: 0 }}>
                                Start a new professional referral for competency restoration services.
                            </p>
                        </div>

                        <div
                            onClick={() => {
                                try {
                                    window.location.href = submitReferralsDocumentsPath()
                                } catch (_e) {
                                    // Fallback for Framer preview
                                }
                            }}
                            style={{
                                padding: "24px",
                                ...FROSTED_GLASS,
                                cursor: "pointer",
                                transition: TRANSITION,
                                boxShadow: SHADOWS.card,
                            }}
                            onMouseEnter={(e) => { const t = e.currentTarget as HTMLDivElement; t.style.boxShadow = SHADOWS.cardHover; t.style.borderColor = C.ash }}
                            onMouseLeave={(e) => { const t = e.currentTarget as HTMLDivElement; t.style.boxShadow = SHADOWS.card; t.style.borderColor = C.ashSubtle }}
                        >
                            <p style={{ fontSize: "20px", marginBottom: "10px" }}>&#x1F4CE;</p>
                            <h3 style={{ fontSize: "18px", fontWeight: "700", color: C.ash, marginBottom: "8px" }}>
                                Upload Documents
                            </h3>
                            <p style={{ fontSize: "14px", color: C.textMuted, lineHeight: "1.5", margin: 0 }}>
                                Attach documents to an existing referral using your referral code.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div
                style={
                    showFormStepRail
                        ? {
                              display: "flex",
                              gap: isMobile ? 0 : 28,
                              flexDirection: isMobile ? "column" : "row",
                              alignItems: "flex-start",
                          }
                        : undefined
                }
            >
                {showFormStepRail && !isMobile && (
                    <ReferralFormStepRail
                        currentStep={currentStep}
                        onSelectStep={setCurrentStep}
                        variant="sidebar"
                    />
                )}
                <div
                    style={{
                        flex: showFormStepRail ? 1 : undefined,
                        minWidth: showFormStepRail ? 0 : undefined,
                        width: "100%",
                    }}
                >
                    {showFormStepRail && isMobile && (
                        <ReferralFormStepRail
                            currentStep={currentStep}
                            onSelectStep={setCurrentStep}
                            variant="horizontal"
                        />
                    )}

                    {showFormStepRail && (
                        <>
                            <p style={{ color: C.textMuted, fontSize: "14px", marginBottom: "16px" }}>
                                Step {currentStep + 1} of {REFERRAL_FORM_STEP_COUNT}
                            </p>
                            <div
                                style={{
                                    width: "100%",
                                    height: "6px",
                                    backgroundColor: C.coconut,
                                    borderRadius: "0px",
                                    marginBottom: "32px",
                                    overflow: "hidden",
                                }}
                            >
                                <div
                                    style={{
                                        width: `${Math.min(100, (currentStep / REFERRAL_FORM_LAST_STEP) * 100)}%`,
                                        height: "100%",
                                        backgroundColor: C.moonstone,
                                        transition: "width 0.3s ease",
                                    }}
                                />
                            </div>
                        </>
                    )}

                    {showFormStepRail && (
                    <div>
                {/* ============================================================ */}
                {/* REFERRAL_FORM_STEP.contact — UI step 1: Professional contact */}
                {/* ============================================================ */}
                {currentStep === REFERRAL_FORM_STEP.contact && (
                    <div>
                        <button
                            type="button"
                            onClick={() => setShowPortal(true)}
                            style={{
                                background: "none",
                                border: "none",
                                color: C.textMuted,
                                fontSize: "14px",
                                fontWeight: "500",
                                cursor: "pointer",
                                padding: "0",
                                marginBottom: "16px",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                fontFamily: "inherit",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.color = C.ash
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.color = C.textMuted
                            }}
                        >
                            {"\u2190"} Back
                        </button>

                        <h2 style={S.stepTitle}>{STEP_TITLES[REFERRAL_FORM_STEP.contact]}</h2>
                        <p style={S.stepDesc}>Your professional contact details for this referral</p>

                        {savedContactEligible && savedReferralSourceProfile && !contactProfileEditing && (
                            <div
                                style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    alignItems: "center",
                                    gap: "14px",
                                    justifyContent: "space-between",
                                    padding: "14px 16px",
                                    marginBottom: "20px",
                                    backgroundColor: C.shell,
                                    border: `1px solid ${C.borderLight}`,
                                    borderRadius: RADIUS.input,
                                    boxSizing: "border-box",
                                }}
                            >
                                <label
                                    style={{
                                        ...S.checkboxRow,
                                        flex: "1 1 260px",
                                        marginBottom: 0,
                                        border: "none",
                                        padding: 0,
                                        cursor: "pointer",
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={contactDetailsConfirmed}
                                        onChange={(e) => setContactDetailsConfirmed(e.target.checked)}
                                        style={S.checkboxInput}
                                    />
                                    <span style={{ fontWeight: 500, fontSize: "14px", lineHeight: 1.45 }}>
                                        Confirm your contact details are still correct; if not, please update them here.
                                    </span>
                                </label>
                                <button
                                    type="button"
                                    onClick={clearContactFieldsForProfileEdit}
                                    style={{
                                        ...S.btnSecondary,
                                        flexShrink: 0,
                                        padding: "10px 18px",
                                        fontSize: "14px",
                                        marginBottom: 0,
                                    }}
                                >
                                    Update
                                </button>
                            </div>
                        )}

                        {savedContactEligible && contactProfileEditing && (
                            <>
                                <div
                                    style={{
                                        ...S.callout,
                                        marginBottom: "12px",
                                        fontSize: "13px",
                                    }}
                                >
                                    Enter your updated contact details below, then click <strong>Save</strong> to update
                                    your saved portal profile for future referrals.
                                </div>
                                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
                                    <button
                                        type="button"
                                        disabled={contactProfileSaveBusy}
                                        onClick={() => void saveContactProfileFromStep()}
                                        style={{
                                            ...S.btnPrimary,
                                            padding: "10px 22px",
                                            fontSize: "14px",
                                        }}
                                    >
                                        {contactProfileSaveBusy ? "Saving…" : "Save"}
                                    </button>
                                </div>
                            </>
                        )}

                        <div style={S.callout}>
                            Collateral information is needed to support the referral and facilitate intake. In Step{" "}
                            {REFERRAL_FORM_STEP.documents + 1} (Documents Inventory) you will note which documents exist
                            and who holds them — uploads happen later in your portal when admissions requests them.
                        </div>

                        <div
                            style={{
                                marginBottom: "20px",
                                padding: "14px 16px",
                                backgroundColor: C.shell,
                                borderRadius: "0px",
                                fontSize: "13px",
                                color: C.textMuted,
                                lineHeight: 1.5,
                            }}
                        >
                            This signed-in form is for <strong>professional referrals</strong> only. Family members and
                            individuals should use our{" "}
                            <a
                                href={PUBLIC_REFERRALS_PAGE_URL}
                                style={{ color: C.moonstone, fontWeight: 600, textDecoration: "underline" }}
                            >
                                public referrals page
                            </a>{" "}
                            — no login required.
                        </div>

                        {renderField("Full Name", "referral_source_name")}
                        {renderField("Organization / Agency Type", "referral_source_type", "select", {
                            emptyOptionLabel: "Select one",
                            required: true,
                            options: REFERRAL_SOURCE_TYPE_OPTIONS.map((o) => ({
                                value: o.value,
                                label: o.label,
                            })),
                        })}
                        {renderField("Organization / Agency Name", "referral_source_organization")}
                        {renderField("Title / Position", "referral_source_title")}
                        {renderField("Phone Number", "referral_source_phone", "tel")}
                        {renderField("Email Address", "referral_source_email", "email")}
                        {renderField(
                            "Can you provide collateral information for this referral?",
                            "can_provide_collateral",
                            "select",
                            {
                                emptyOptionLabel: "Select one",
                                options: [
                                    { value: "yes", label: "Yes" },
                                    { value: "no", label: "No" },
                                    { value: "partial", label: "Partial" },
                                ],
                            }
                        )}
                        {renderField(
                            "Has this individual been referred to Monarch previously?",
                            "previous_monarch_referral",
                            "select",
                            {
                                emptyOptionLabel: "Select one",
                                options: [
                                    { value: "yes", label: "Yes" },
                                    { value: "no", label: "No" },
                                    { value: "unknown", label: "Unknown" },
                                ],
                            }
                        )}

                        {renderNav(null, REFERRAL_FORM_STEP.additionalContacts)}
                    </div>
                )}

                {/* ============================================================ */}
                {/* REFERRAL_FORM_STEP.additionalContacts — UI step 2 */}
                {/* ============================================================ */}
                {currentStep === REFERRAL_FORM_STEP.additionalContacts && (
                    <div>
                        <h2 style={S.stepTitle}>{STEP_TITLES[REFERRAL_FORM_STEP.additionalContacts]}</h2>
                        <p style={S.stepDesc}>
                            Emergency contact and other professionals involved in this individual's care
                        </p>

                        <h3 style={S.sectionHeader}>Emergency Contact</h3>
                        {renderField("Emergency Contact Name", "emergency_contact_name", "text", {
                            placeholder: "Family member or guardian",
                        })}
                        {renderField("Emergency Contact Phone", "emergency_contact_phone", "tel")}
                        {renderField("Relationship to Client", "emergency_contact_relationship", "text", {
                            placeholder: "e.g., Mother, Guardian, Spouse",
                        })}
                        {renderCheckbox(
                            "Emergency contact can provide collateral information",
                            "emergency_contact_can_provide_info"
                        )}

                        <h3 style={S.sectionHeader}>Additional Professional Contacts</h3>
                        <p style={{ fontSize: "14px", color: C.textMuted, marginBottom: "16px" }}>
                            Add any other professionals involved in this individual's care or case
                            (e.g., case managers, treatment providers, probation officers).
                        </p>

                        {formData.additional_contacts.map((contact, index) => (
                            <div
                                key={index}
                                style={{
                                    border: `1px solid ${C.border}`,
                                    padding: "16px",
                                    marginBottom: "16px",
                                    backgroundColor: C.shell,
                                    borderRadius: "0px",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        marginBottom: "12px",
                                    }}
                                >
                                    <span style={{ fontWeight: "600", fontSize: "14px", color: C.stoneCloud }}>
                                        Contact #{index + 1}
                                    </span>
                                    <button
                                        onClick={() => removeContact(index)}
                                        style={{
                                            background: "none",
                                            border: "none",
                                            color: C.error,
                                            cursor: "pointer",
                                            fontSize: "13px",
                                            fontWeight: "600",
                                        }}
                                    >
                                        REMOVE
                                    </button>
                                </div>
                                <div style={S.fieldGroup}>
                                    <label style={S.label}>Contact Name</label>
                                    <input
                                        type="text"
                                        value={contact.name}
                                        onChange={(e) => updateContact(index, "name", e.target.value)}
                                        style={S.input}
                                    />
                                </div>
                                <div style={S.fieldGroup}>
                                    <label style={S.label}>Organization & Title</label>
                                    <input
                                        type="text"
                                        value={contact.organization}
                                        onChange={(e) => updateContact(index, "organization", e.target.value)}
                                        placeholder="e.g., Public Defender's Office - Attorney"
                                        style={S.input}
                                    />
                                </div>
                                <div style={S.fieldGroup}>
                                    <label style={S.label}>Phone / Email</label>
                                    <input
                                        type="text"
                                        value={contact.phone_email}
                                        onChange={(e) => updateContact(index, "phone_email", e.target.value)}
                                        style={S.input}
                                    />
                                </div>
                                <div style={S.fieldGroup}>
                                    <label style={S.label}>Role / Affiliation</label>
                                    <input
                                        type="text"
                                        value={contact.role}
                                        onChange={(e) => updateContact(index, "role", e.target.value)}
                                        placeholder="e.g., Defense Attorney, Case Manager"
                                        style={S.input}
                                    />
                                </div>
                                <label style={S.checkboxRow}>
                                    <input
                                        type="checkbox"
                                        checked={contact.can_provide_info}
                                        onChange={(e) =>
                                            updateContact(index, "can_provide_info", e.target.checked)
                                        }
                                        style={S.checkboxInput}
                                    />
                                    <span style={{ fontWeight: "500", fontSize: "14px" }}>
                                        Can provide collateral information
                                    </span>
                                </label>
                            </div>
                        ))}

                        <button
                            onClick={addContact}
                            style={{
                                padding: "10px 20px",
                                fontSize: "14px",
                                fontWeight: "600",
                                color: C.stoneCloud,
                                backgroundColor: "transparent",
                                border: `1px dashed ${C.moonstone}`,
                                borderRadius: "0px",
                                cursor: "pointer",
                                width: "100%",
                            }}
                        >
                            + Add Another Contact
                        </button>

                        {renderNav(REFERRAL_FORM_STEP.contact, REFERRAL_FORM_STEP.clientDemographics)}
                    </div>
                )}

                {/* ============================================================ */}
                {/* REFERRAL_FORM_STEP.clientDemographics — UI step 3 */}
                {/* ============================================================ */}
                {currentStep === REFERRAL_FORM_STEP.clientDemographics && (
                    <div>
                                <h2 style={S.stepTitle}>{STEP_TITLES[REFERRAL_FORM_STEP.clientDemographics]}</h2>
                                <p style={S.stepDesc}>
                                    Basic identifying information about the individual being referred
                                </p>

                                <div style={S.callout}>
                                    While specific information is needed for intake processing, please provide
                                    what you have available. Our intake team will follow up if missing
                                    information is critical.
                                </div>

                                {renderField("Legal First Name", "client_first_name")}
                                {renderField("Legal Middle Name", "client_middle_name")}
                                {renderField("Legal Last Name", "client_last_name")}
                                {renderField("Aliases / Nicknames / Previous Names", "client_preferred_name", "text", {
                                    placeholder: "Any known aliases or previous names",
                                })}

                                {renderField("Date of Birth", "client_dob", "date")}
                                {renderField("SSN (if available)", "client_ssn", "text", {
                                    placeholder: "Optional — XXX-XX-XXXX",
                                })}

                                {renderField("Gender Identity", "client_gender", "select", {
                                    options: [
                                        { value: "male", label: "Male" },
                                        { value: "female", label: "Female" },
                                        { value: "non_binary", label: "Non-binary" },
                                        { value: "transgender_male", label: "Transgender Male" },
                                        { value: "transgender_female", label: "Transgender Female" },
                                        { value: "other", label: "Other" },
                                        { value: "prefer_not_to_say", label: "Prefer not to say" },
                                    ],
                                })}

                                {renderField("Sex Assigned at Birth", "client_sex_at_birth", "select", {
                                    options: [
                                        { value: "male", label: "Male" },
                                        { value: "female", label: "Female" },
                                    ],
                                })}

                                {renderField("Preferred Pronouns", "client_pronouns", "select", {
                                    options: [
                                        { value: "he_him", label: "He/Him" },
                                        { value: "she_her", label: "She/Her" },
                                        { value: "they_them", label: "They/Them" },
                                        { value: "other", label: "Other" },
                                    ],
                                })}

                                {renderField("Primary Language", "client_primary_language", "text", {
                                    placeholder: "e.g., English, Spanish",
                                })}

                                {renderField("English Proficiency", "client_english_proficiency", "select", {
                                    options: [
                                        { value: "fluent", label: "Fluent" },
                                        { value: "conversational", label: "Conversational" },
                                        { value: "limited", label: "Limited" },
                                        { value: "none", label: "None" },
                                        { value: "unknown", label: "Unknown" },
                                    ],
                                })}

                                {renderCheckbox("Interpreter Needed", "interpreter_needed")}

                                {renderField("Racial/Ethnic Background", "client_ethnicity", "select", {
                                    options: [
                                        { value: "american_indian_alaska_native", label: "American Indian / Alaska Native" },
                                        { value: "asian", label: "Asian" },
                                        { value: "black_african_american", label: "Black / African American" },
                                        { value: "hispanic_latino", label: "Hispanic / Latino" },
                                        { value: "native_hawaiian_pacific_islander", label: "Native Hawaiian / Pacific Islander" },
                                        { value: "white", label: "White" },
                                        { value: "two_or_more", label: "Two or More Races" },
                                        { value: "other", label: "Other" },
                                        { value: "prefer_not_to_say", label: "Prefer not to say" },
                                    ],
                                })}

                                {renderField("Marital Status", "client_marital_status", "select", {
                                    options: [
                                        { value: "single", label: "Single" },
                                        { value: "married", label: "Married" },
                                        { value: "divorced", label: "Divorced" },
                                        { value: "separated", label: "Separated" },
                                        { value: "widowed", label: "Widowed" },
                                        { value: "domestic_partnership", label: "Domestic Partnership" },
                                        { value: "unknown", label: "Unknown" },
                                    ],
                                })}

                                {renderField("Client Phone", "client_phone", "tel")}
                                {renderField("Client Email", "client_email", "email")}

                                {renderField(
                                    "Does the client consent to this referral?",
                                    "client_consents_to_referral",
                                    "select",
                                    {
                                        options: [
                                            { value: "yes", label: "Yes" },
                                            { value: "no", label: "No" },
                                            { value: "unable_to_consent", label: "Unable to consent / Unknown" },
                                        ],
                                    }
                                )}

                        {renderNav(REFERRAL_FORM_STEP.additionalContacts, REFERRAL_FORM_STEP.documents)}
                    </div>
                )}

                {/* ============================================================ */}
                {/* REFERRAL_FORM_STEP.documents — UI step 4 */}
                {/* ============================================================ */}
                {currentStep === REFERRAL_FORM_STEP.documents && (
                    <div>
                        <h2 style={S.stepTitle}>{STEP_TITLES[REFERRAL_FORM_STEP.documents]}</h2>
                        <p style={S.stepDesc}>
                            For each document type, indicate whether you have it, can help obtain it, or whether
                            availability is unknown. No files are uploaded on this step.
                        </p>

                        <div style={S.callout}>
                            After you submit, admissions may request specific documents through your portal. You can
                            upload files there at any time using your referral code.
                        </div>

                        <h3 style={S.sectionHeader}>Document inventory</h3>
                        <p style={{ fontSize: "14px", color: C.textMuted, marginBottom: "16px", lineHeight: 1.5 }}>
                            Select one option per row. This is not a hard stop — use your best knowledge today.
                        </p>

                        <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px" }}>
                            {DOCUMENT_OPTIONS.map((doc) => {
                                const selected =
                                    formData.documents_inventory[doc.value] || ("unknown" as DocumentInventoryStatus)
                                return (
                                    <div
                                        key={doc.value}
                                        style={{
                                            padding: "14px 16px",
                                            backgroundColor: C.coconut,
                                            border: `1px solid ${C.ashSubtle}`,
                                            borderRadius: RADIUS.input,
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: "14px",
                                                fontWeight: 600,
                                                color: C.ash,
                                                marginBottom: "10px",
                                            }}
                                        >
                                            {doc.label}
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                            {DOCUMENT_INVENTORY_STATUS_OPTIONS.map((opt) => (
                                                <label
                                                    key={opt.value}
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "flex-start",
                                                        gap: "10px",
                                                        cursor: "pointer",
                                                        fontSize: "13px",
                                                        lineHeight: 1.45,
                                                        color: C.ash,
                                                    }}
                                                >
                                                    <input
                                                        type="radio"
                                                        name={`doc-inventory-${doc.value}`}
                                                        checked={selected === opt.value}
                                                        onChange={() => setDocumentInventoryStatus(doc.value, opt.value)}
                                                        style={{ marginTop: "3px", accentColor: C.moonstone }}
                                                    />
                                                    <span>{opt.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {renderField("Additional notes (optional)", "documents_notes", "textarea", {
                            placeholder:
                                "Any context about document availability, custodians, or timing (no file uploads here)...",
                            rows: 3,
                        })}

                        {renderNav(REFERRAL_FORM_STEP.clientDemographics, REFERRAL_FORM_STEP.insurance)}
                    </div>
                )}

                {/* ============================================================ */}
                {/* REFERRAL_FORM_STEP.insurance — UI step 5 */}
                {/* ============================================================ */}
                {currentStep === REFERRAL_FORM_STEP.insurance && (
                    <div>
                        <h2 style={S.stepTitle}>{STEP_TITLES[REFERRAL_FORM_STEP.insurance]}</h2>
                        <p style={S.stepDesc}>
                            Insurance coverage and benefits information
                        </p>

                        <h3 style={S.sectionHeader}>Medicaid</h3>
                        {renderField("Medicaid Status", "medicaid_status", "select", {
                            options: [
                                { value: "active", label: "Active" },
                                { value: "suspended", label: "Suspended" },
                                { value: "pending", label: "Application Pending" },
                                { value: "not_eligible", label: "Not Eligible" },
                                { value: "unknown", label: "Unknown" },
                            ],
                        })}
                        {renderField("Medicaid Number", "medicaid_number", "text", {
                            placeholder: "Medicaid member ID number",
                        })}

                        <h3 style={S.sectionHeader}>Medicare</h3>
                        {renderField("Medicare Status", "medicare_status", "select", {
                            options: [
                                { value: "active", label: "Active" },
                                { value: "pending", label: "Pending" },
                                { value: "not_eligible", label: "Not Eligible" },
                                { value: "unknown", label: "Unknown" },
                            ],
                        })}
                        {renderField("Medicare Number", "medicare_number", "text", {
                            placeholder: "Medicare beneficiary ID",
                        })}

                        <h3 style={S.sectionHeader}>Other Insurance</h3>
                        {renderCheckbox("Has Private Insurance", "has_private_insurance")}
                        {formData.has_private_insurance &&
                            renderField(
                                "Private Insurance Details",
                                "private_insurance_details",
                                "textarea",
                                {
                                    placeholder: "Insurance company, plan name, member ID...",
                                    rows: 2,
                                }
                            )}

                        <h3 style={S.sectionHeader}>Benefits</h3>
                        {renderField("SSI/SSDI Status", "ssdi_status", "select", {
                            options: [
                                { value: "receiving_ssi", label: "Receiving SSI" },
                                { value: "receiving_ssdi", label: "Receiving SSDI" },
                                { value: "receiving_both", label: "Receiving SSI & SSDI" },
                                { value: "applied_pending", label: "Applied / Pending" },
                                { value: "not_receiving", label: "Not Receiving" },
                                { value: "unknown", label: "Unknown" },
                            ],
                        })}
                        {renderField(
                            "Additional Benefits Information",
                            "benefits_notes",
                            "textarea",
                            {
                                placeholder: "Any other relevant benefits or funding information...",
                                rows: 2,
                            }
                        )}

                        {renderNav(REFERRAL_FORM_STEP.documents, REFERRAL_FORM_STEP.legal)}
                    </div>
                )}

                {/* ============================================================ */}
                {/* REFERRAL_FORM_STEP.legal — UI step 6 */}
                {/* ============================================================ */}
                {currentStep === REFERRAL_FORM_STEP.legal && (
                    <div>
                        <h2 style={S.stepTitle}>{STEP_TITLES[REFERRAL_FORM_STEP.legal]}</h2>
                        <p style={S.stepDesc}>
                            Case details, competency status, and legal representation
                        </p>

                        <h3 style={S.sectionHeader}>Court Case</h3>
                        {renderField("County / Judicial District", "court_jurisdiction", "select", {
                            options: CO_JUDICIAL_DISTRICTS.map((d) => ({ value: d, label: d })),
                        })}
                        {renderField("Case Number", "case_number", "text", {
                            placeholder: "Court case number",
                        })}
                        {renderField("Assigned Judge", "judge_name", "text", {
                            placeholder: "Judge's name",
                        })}
                        {renderField("Courtroom", "courtroom", "text", {
                            placeholder: "Courtroom number or designation",
                        })}
                        {renderField("Next Court Date", "next_court_date", "date")}
                        {renderField("Charges (Brief Summary)", "charges", "textarea", {
                            placeholder: "Brief description of pending charges",
                            rows: 3,
                        })}

                        <h3 style={S.sectionHeader}>Competency Status</h3>
                        {renderField("Competency Status", "competency_status", "select", {
                            options: [
                                { value: "evaluation_ordered", label: "Evaluation Ordered" },
                                { value: "found_incompetent", label: "Found Incompetent to Proceed" },
                                { value: "restoration_ordered", label: "Restoration Ordered" },
                                { value: "in_restoration", label: "Currently in Restoration" },
                                { value: "restored", label: "Restored to Competency" },
                                { value: "not_restorable", label: "Found Not Restorable" },
                                { value: "pending_evaluation", label: "Pending Evaluation" },
                            ],
                        })}
                        {renderField("Competency Evaluation Date", "competency_eval_date", "date")}
                        {renderField("Evaluating Clinician / Organization", "competency_evaluator", "text", {
                            placeholder: "Name of evaluator or organization",
                        })}

                        <h3 style={S.sectionHeader}>Legal Representation</h3>
                        {renderField("Defense Attorney", "attorney_name", "text", {
                            placeholder: "Defense attorney or public defender",
                        })}
                        {renderField("Attorney Phone", "attorney_phone", "tel")}
                        {renderField("Attorney Email", "attorney_email", "email")}

                        <h3 style={S.sectionHeader}>Supervision & Bond Status</h3>
                        {renderCheckbox("Currently on Probation", "on_probation")}
                        {formData.on_probation &&
                            renderField("Probation Officer Name / Contact", "probation_officer_contact", "text", {
                                placeholder: "PO name, phone, or email",
                            })}

                        {renderCheckbox("Currently on Parole", "on_parole")}
                        {formData.on_parole &&
                            renderField("Parole Officer Contact", "parole_officer_contact", "text", {
                                placeholder: "Parole officer name, phone, or email",
                            })}

                        {renderField("Active Warrants?", "active_warrants", "select", {
                            options: [
                                { value: "yes", label: "Yes" },
                                { value: "no", label: "No" },
                                { value: "unknown", label: "Unknown" },
                            ],
                        })}

                        {renderField("Bond Holds?", "has_bond_holds", "select", {
                            options: [
                                { value: "yes", label: "Yes" },
                                { value: "no", label: "No" },
                                { value: "unknown", label: "Unknown" },
                            ],
                        })}
                        {formData.has_bond_holds === "yes" &&
                            renderField("Bond Hold Details", "bond_holds_details", "textarea", {
                                placeholder: "Describe bond holds...",
                                rows: 2,
                            })}

                        {renderField("PR Bond to Monarch?", "pr_bond_to_monarch", "select", {
                            options: [
                                { value: "yes", label: "Yes" },
                                { value: "no", label: "No" },
                                { value: "pending", label: "Pending" },
                                { value: "not_applicable", label: "Not Applicable" },
                            ],
                        })}

                        {formData.pr_bond_to_monarch === "yes" && (
                            <>
                                <div style={S.callout}>
                                    PR Bond notification contacts — who should be notified upon
                                    admission or discharge?
                                </div>
                                {renderField("Judge Contact", "pr_bond_judge_contact", "text", {
                                    placeholder: "Judge name, phone, or email for notifications",
                                })}
                                {renderField("DA Contact", "pr_bond_da_contact", "text", {
                                    placeholder: "District Attorney contact for notifications",
                                })}
                                {renderField("Other Parties to Notify", "pr_bond_other_contacts", "textarea", {
                                    placeholder: "Any other parties who should be notified...",
                                    rows: 2,
                                })}
                            </>
                        )}

                        {renderNav(REFERRAL_FORM_STEP.insurance, REFERRAL_FORM_STEP.location)}
                    </div>
                )}

                {/* ============================================================ */}
                {/* REFERRAL_FORM_STEP.location — UI step 7 */}
                {/* ============================================================ */}
                {currentStep === REFERRAL_FORM_STEP.location && (
                    <div>
                        <h2 style={S.stepTitle}>{STEP_TITLES[REFERRAL_FORM_STEP.location]}</h2>
                        <p style={S.stepDesc}>
                            Where is the individual currently located?
                        </p>

                        {renderField("Current Location Type", "current_location_type", "select", {
                            options: [
                                { value: "county_jail", label: "County Jail" },
                                { value: "state_prison", label: "State Prison / DOC" },
                                { value: "hospital_medical", label: "Hospital (Medical)" },
                                { value: "hospital_psychiatric", label: "Psychiatric Hospital" },
                                { value: "state_hospital", label: "State Hospital (CMHIP)" },
                                { value: "treatment_facility", label: "Treatment Facility" },
                                { value: "residential_program", label: "Residential Program" },
                                { value: "community_supervised", label: "Community (Supervised Release)" },
                                { value: "community_unsupervised", label: "Community (Unsupervised)" },
                                { value: "homeless_shelter", label: "Homeless / Shelter" },
                                { value: "other", label: "Other" },
                            ],
                        })}

                        {renderField("Facility Name", "facility_name", "text", {
                            placeholder: "Name of jail, hospital, or facility",
                        })}
                        {renderField("Facility Address", "facility_address", "text", {
                            placeholder: "Street address, city, state",
                        })}
                        {renderField("Inmate / Patient ID Number", "inmate_id", "text", {
                            placeholder: "Booking number or patient ID",
                        })}
                        {renderField("Facility Contact Person", "facility_contact_person", "text", {
                            placeholder: "Name of contact at facility",
                        })}
                        {renderField("Facility Contact Phone", "facility_contact_phone", "tel")}

                        {renderCheckbox("Currently Incarcerated", "currently_incarcerated")}
                        {formData.currently_incarcerated &&
                            renderField("Expected Release Date", "expected_release_date", "date")}

                        <h3 style={S.sectionHeader}>Housing History</h3>
                        {renderField("Housing Prior to Current Situation", "housing_prior", "select", {
                            options: [
                                { value: "own_home", label: "Own Home / Apartment" },
                                { value: "family_friend", label: "Living with Family / Friend" },
                                { value: "group_home", label: "Group Home / Assisted Living" },
                                { value: "shelter", label: "Shelter" },
                                { value: "homeless", label: "Homeless / Unsheltered" },
                                { value: "transitional", label: "Transitional Housing" },
                                { value: "other", label: "Other" },
                                { value: "unknown", label: "Unknown" },
                            ],
                        })}

                        {renderField("Post-Program Housing Plan", "housing_post_program", "select", {
                            options: [
                                { value: "return_home", label: "Return to Own Home" },
                                { value: "family_friend", label: "Family / Friend" },
                                { value: "group_home", label: "Group Home / Assisted Living" },
                                { value: "transitional", label: "Transitional Housing" },
                                { value: "needs_placement", label: "Needs Placement Assistance" },
                                { value: "unknown", label: "Unknown / TBD" },
                            ],
                        })}

                        {renderField("Housing Notes", "housing_notes", "textarea", {
                            placeholder: "Any additional housing information or concerns...",
                            rows: 2,
                        })}

                        {renderNav(REFERRAL_FORM_STEP.legal, REFERRAL_FORM_STEP.clinical)}
                    </div>
                )}

                {/* ============================================================ */}
                {/* REFERRAL_FORM_STEP.clinical — UI step 8 */}
                {/* ============================================================ */}
                {currentStep === REFERRAL_FORM_STEP.clinical && (
                    <div>
                        <h2 style={S.stepTitle}>{STEP_TITLES[REFERRAL_FORM_STEP.clinical]}</h2>
                        <p style={S.stepDesc}>
                            Mental health diagnoses, medications, and treatment history
                        </p>

                        {renderField("Mental Health Diagnoses", "current_diagnoses", "textarea", {
                            placeholder: "List any known psychiatric diagnoses",
                            rows: 3,
                        })}

                        {renderField("Medication Compliance", "medication_compliance", "select", {
                            options: [
                                { value: "compliant", label: "Compliant / Taking as prescribed" },
                                { value: "partially_compliant", label: "Partially Compliant" },
                                { value: "non_compliant", label: "Non-Compliant / Refusing" },
                                { value: "not_prescribed", label: "Not Currently Prescribed" },
                                { value: "unknown", label: "Unknown" },
                            ],
                        })}

                        {renderField("Current Psychiatric Medications", "current_medications", "textarea", {
                            placeholder: "List medications with dosages (e.g., Risperidone 2mg twice daily)",
                            rows: 4,
                        })}

                        {formData.medication_compliance === "partially_compliant" ||
                        formData.medication_compliance === "non_compliant"
                            ? renderField("Medication Barriers", "medication_barriers", "textarea", {
                                  placeholder: "Describe barriers to medication compliance...",
                                  rows: 2,
                              })
                            : null}

                        {renderField("Psychiatric History", "psychiatric_history", "textarea", {
                            placeholder: "Previous hospitalizations, treatment history, etc.",
                            rows: 3,
                        })}

                        {renderField("Previous Treatment Programs", "previous_treatment_programs", "textarea", {
                            placeholder:
                                "List any previous treatment programs (competency restoration, residential, etc.)",
                            rows: 3,
                        })}

                        <h3 style={S.sectionHeader}>Traumatic Brain Injury (TBI)</h3>
                        {renderField("History of TBI?", "tbi_history", "select", {
                            options: [
                                { value: "yes", label: "Yes" },
                                { value: "no", label: "No" },
                                { value: "suspected", label: "Suspected" },
                                { value: "unknown", label: "Unknown" },
                            ],
                        })}
                        {(formData.tbi_history === "yes" || formData.tbi_history === "suspected") &&
                            renderField("TBI Details", "tbi_details", "textarea", {
                                placeholder: "Describe TBI history, severity, and any related limitations...",
                                rows: 2,
                            })}

                        <h3 style={S.sectionHeader}>Intellectual / Developmental Disability (IDD)</h3>
                        {renderField("Known IDD?", "idd_status", "select", {
                            options: [
                                { value: "yes_documented", label: "Yes — Documented" },
                                { value: "yes_undocumented", label: "Yes — Undocumented / Suspected" },
                                { value: "no", label: "No" },
                                { value: "unknown", label: "Unknown" },
                            ],
                        })}
                        {(formData.idd_status === "yes_documented" ||
                            formData.idd_status === "yes_undocumented") &&
                            renderField("IDD Details", "idd_details", "textarea", {
                                placeholder: "Describe diagnosis, functional level, support needs...",
                                rows: 2,
                            })}

                        {renderNav(REFERRAL_FORM_STEP.location, REFERRAL_FORM_STEP.substance)}
                    </div>
                )}

                {/* ============================================================ */}
                {/* REFERRAL_FORM_STEP.substance — UI step 9 */}
                {/* ============================================================ */}
                {currentStep === REFERRAL_FORM_STEP.substance && (
                    <div>
                        <h2 style={S.stepTitle}>{STEP_TITLES[REFERRAL_FORM_STEP.substance]}</h2>
                        <p style={S.stepDesc}>
                            Substance use history and current status
                        </p>

                        {renderField("Substance Use Pattern", "substance_use_pattern", "select", {
                            options: [
                                { value: "no_history", label: "No History of Substance Use" },
                                { value: "historical_only", label: "Historical Use Only (1+ year sober)" },
                                { value: "in_recovery", label: "In Recovery (active program)" },
                                { value: "occasional", label: "Occasional / Social Use" },
                                { value: "regular", label: "Regular Use" },
                                { value: "daily", label: "Daily Use" },
                                { value: "iv_use", label: "IV Drug Use" },
                                { value: "unknown", label: "Unknown" },
                            ],
                        })}

                        {formData.substance_use_pattern &&
                            formData.substance_use_pattern !== "no_history" &&
                            formData.substance_use_pattern !== "unknown" &&
                            renderField(
                                "Current Use (Last 90 Days)",
                                "substance_use_current",
                                "textarea",
                                {
                                    placeholder:
                                        "Describe current substances used, frequency, route of administration...",
                                    rows: 3,
                                }
                            )}

                        {renderField("Past Substance Use History", "substance_use_history", "textarea", {
                            placeholder: "History of substance use or addiction, previous treatment...",
                            rows: 3,
                        })}

                        {renderField(
                            "Needs Medically Supervised Detox?",
                            "detox_required",
                            "select",
                            {
                                options: [
                                    { value: "yes", label: "Yes" },
                                    { value: "no", label: "No" },
                                    { value: "possibly", label: "Possibly / Under Evaluation" },
                                    { value: "unknown", label: "Unknown" },
                                ],
                            }
                        )}

                        {(formData.detox_required === "yes" || formData.detox_required === "possibly") &&
                            renderField("Detox Details", "detox_details", "textarea", {
                                placeholder: "Substances requiring detox, last use date, withdrawal risk...",
                                rows: 2,
                            })}

                        {renderNav(REFERRAL_FORM_STEP.clinical, REFERRAL_FORM_STEP.medical)}
                    </div>
                )}

                {/* ============================================================ */}
                {/* REFERRAL_FORM_STEP.medical — UI step 10 */}
                {/* ============================================================ */}
                {currentStep === REFERRAL_FORM_STEP.medical && (
                    <div>
                        <h2 style={S.stepTitle}>{STEP_TITLES[REFERRAL_FORM_STEP.medical]}</h2>
                        <p style={S.stepDesc}>
                            Physical health conditions, medications, and care needs
                        </p>

                        {renderField("Medical / Somatic Diagnoses", "medical_conditions", "textarea", {
                            placeholder: "Physical health conditions, chronic illnesses, etc.",
                            rows: 3,
                        })}

                        {renderField(
                            "Are conditions controlled by current medications?",
                            "medical_conditions_controlled",
                            "select",
                            {
                                options: [
                                    { value: "yes", label: "Yes — Well Controlled" },
                                    { value: "partially", label: "Partially Controlled" },
                                    { value: "no", label: "No — Uncontrolled" },
                                    { value: "not_applicable", label: "Not Applicable" },
                                    { value: "unknown", label: "Unknown" },
                                ],
                            }
                        )}

                        {renderField("Non-Psychiatric Medications", "medications_non_psychiatric", "textarea", {
                            placeholder: "List non-psychiatric medications with dosages...",
                            rows: 3,
                        })}

                        {renderField("Medication Allergies", "medication_allergies", "textarea", {
                            placeholder: "List any known medication allergies or adverse reactions...",
                            rows: 2,
                        })}

                        {renderField("Mobility / Assistive Device Needs", "mobility_needs", "select", {
                            options: [
                                { value: "independent", label: "Fully Independent" },
                                { value: "cane_walker", label: "Cane / Walker" },
                                { value: "wheelchair", label: "Wheelchair" },
                                { value: "bedbound", label: "Bedbound / Limited Mobility" },
                                { value: "other", label: "Other Assistive Needs" },
                            ],
                        })}

                        {renderCheckbox("Requires ADL (Activities of Daily Living) Support", "adl_support_needed")}
                        {formData.adl_support_needed &&
                            renderField("ADL Support Details", "adl_support_details", "textarea", {
                                placeholder: "Describe ADL support needs (bathing, dressing, feeding, etc.)...",
                                rows: 2,
                            })}

                        {renderField("Acute Medical Needs", "acute_medical_needs", "textarea", {
                            placeholder:
                                "Any acute medical issues requiring immediate attention (wound care, dialysis, etc.)...",
                            rows: 2,
                        })}

                        {renderNav(REFERRAL_FORM_STEP.substance, REFERRAL_FORM_STEP.safety)}
                    </div>
                )}

                {/* ============================================================ */}
                {/* REFERRAL_FORM_STEP.safety — UI step 11 */}
                {/* ============================================================ */}
                {currentStep === REFERRAL_FORM_STEP.safety && (
                    <div>
                        <h2 style={S.stepTitle}>{STEP_TITLES[REFERRAL_FORM_STEP.safety]}</h2>
                        <p style={S.stepDesc}>
                            Important safety information for care planning
                        </p>

                        <div style={S.warningCallout}>
                            Please provide accurate risk assessment information. This helps us
                            ensure appropriate care and safety for everyone. Select the timeframe
                            that best describes each risk factor.
                        </div>

                        <h3 style={S.sectionHeader}>Self-Harm / Suicide Risk</h3>
                        {renderField("Suicide / Self-Harm History", "suicide_risk", "select", {
                            options: [
                                { value: "current", label: "Current (within 30 days)" },
                                { value: "recent", label: "Recent (within 90 days)" },
                                { value: "recovering", label: "Recovering (4-12 months)" },
                                { value: "historical", label: "Historical (1+ year ago)" },
                                { value: "no_history", label: "No History" },
                            ],
                        })}
                        {formData.suicide_risk &&
                            formData.suicide_risk !== "no_history" &&
                            renderField("Suicide Risk Details", "suicide_risk_details", "textarea", {
                                placeholder: "Describe history, most recent incident, current ideation level...",
                                rows: 2,
                            })}

                        <h3 style={S.sectionHeader}>Violence / Aggression</h3>
                        {renderField("Violence / Aggression History", "violence_risk", "select", {
                            options: [
                                { value: "current", label: "Current (within 30 days)" },
                                { value: "recent", label: "Recent (within 90 days)" },
                                { value: "recovering", label: "Recovering (4-12 months)" },
                                { value: "historical", label: "Historical (1+ year ago)" },
                                { value: "no_history", label: "No History" },
                            ],
                        })}
                        {formData.violence_risk &&
                            formData.violence_risk !== "no_history" &&
                            renderField("Violence Risk Details", "violence_risk_details", "textarea", {
                                placeholder: "Describe history, targets, triggers, most recent incident...",
                                rows: 2,
                            })}

                        <h3 style={S.sectionHeader}>Elopement / AMA Risk</h3>
                        {renderField("Elopement / AMA History", "elopement_risk", "select", {
                            options: [
                                { value: "current", label: "Current (within 30 days)" },
                                { value: "recent", label: "Recent (within 90 days)" },
                                { value: "recovering", label: "Recovering (4-12 months)" },
                                { value: "historical", label: "Historical (1+ year ago)" },
                                { value: "no_history", label: "No History" },
                            ],
                        })}
                        {formData.elopement_risk &&
                            formData.elopement_risk !== "no_history" &&
                            renderField("Elopement Details", "elopement_risk_details", "textarea", {
                                placeholder: "Describe elopement/AMA history, circumstances...",
                                rows: 2,
                            })}

                        <h3 style={S.sectionHeader}>Special Population Flags</h3>
                        {renderField("Arson History / Charges?", "arson_history", "select", {
                            options: [
                                { value: "yes_current", label: "Yes — Current Charges" },
                                { value: "yes_historical", label: "Yes — Historical" },
                                { value: "no", label: "No" },
                                { value: "unknown", label: "Unknown" },
                            ],
                        })}
                        {(formData.arson_history === "yes_current" ||
                            formData.arson_history === "yes_historical") &&
                            renderField("Arson Details", "arson_details", "textarea", {
                                placeholder: "Describe arson charges or history...",
                                rows: 2,
                            })}

                        {renderField("Registered Sex Offender (RSO) Status?", "rso_status", "select", {
                            options: [
                                { value: "yes_registered", label: "Yes — Currently Registered" },
                                { value: "yes_charges", label: "Yes — Pending Charges" },
                                { value: "no", label: "No" },
                                { value: "unknown", label: "Unknown" },
                            ],
                        })}
                        {(formData.rso_status === "yes_registered" ||
                            formData.rso_status === "yes_charges") &&
                            renderField("RSO Details", "rso_details", "textarea", {
                                placeholder: "Describe registration status, offense type, restrictions...",
                                rows: 2,
                            })}

                        <h3 style={S.sectionHeader}>Additional Safety</h3>
                        {renderCheckbox("Requires Specialized Medical Care", "medical_needs")}
                        {renderField("Additional Safety Information", "safety_notes", "textarea", {
                            placeholder:
                                "Any additional behavioral concerns, special accommodations, or safety considerations...",
                            rows: 4,
                        })}

                        {renderNav(REFERRAL_FORM_STEP.medical, REFERRAL_FORM_STEP.urgency)}
                    </div>
                )}

                {/* ============================================================ */}
                {/* REFERRAL_FORM_STEP.urgency — UI step 12 */}
                {/* ============================================================ */}
                {currentStep === REFERRAL_FORM_STEP.urgency && (
                    <div>
                        <h2 style={S.stepTitle}>{STEP_TITLES[REFERRAL_FORM_STEP.urgency]}</h2>
                        <p style={S.stepDesc}>
                            Final details about urgency, additional context, and how you found us
                        </p>

                        <div style={{ ...S.fieldGroup, marginBottom: "8px" }}>
                            <label style={S.checkboxRow}>
                                <input
                                    type="checkbox"
                                    name="urgent_placement"
                                    checked={formData.urgent_placement}
                                    onChange={handleInputChange}
                                    style={S.checkboxInput}
                                />
                                <span style={{ fontWeight: "600", fontSize: "15px", color: C.ash }}>
                                    Request Expedited Placement (Optional)
                                </span>
                            </label>
                        </div>

                        {formData.urgent_placement && (
                            <>
                                {renderField("Placement timing", "urgency_level", "select", {
                                    options: [
                                        {
                                            value: "conditional_timeline",
                                            label: "Conditional timeline — Must be placed by target date (provide conditions/notes below)",
                                        },
                                        {
                                            value: "asap",
                                            label: "ASAP — Soonest available (provide additional notes below)",
                                        },
                                    ],
                                })}

                                <p style={{ fontSize: "13px", color: C.textMuted, fontStyle: "italic", marginTop: "-8px", marginBottom: "20px", lineHeight: 1.5 }}>
                                    *{PLACEMENT_TIMING_DISCLAIMER}
                                </p>

                                {formData.urgency_level === "conditional_timeline" && (
                                    <div style={S.fieldGroup}>
                                        <label style={S.label}>Must be placed by</label>
                                        <input
                                            type="date"
                                            value={expeditedRequiredByDate}
                                            onChange={(e) => setExpeditedRequiredByDate(e.target.value)}
                                            style={S.input}
                                        />
                                    </div>
                                )}

                                {formData.urgency_level === "conditional_timeline" &&
                                    renderField("Conditions / notes for conditional timeline", "urgency_reason", "textarea", {
                                        placeholder:
                                            "Describe placement conditions, court deadlines, safety concerns, or other timing requirements...",
                                        rows: 3,
                                    })}

                                {formData.urgency_level === "asap" &&
                                    renderField("Additional notes for ASAP placement", "urgency_reason", "textarea", {
                                        placeholder:
                                            "Describe why soonest-available placement is needed (court deadlines, safety concerns, etc.)...",
                                        rows: 3,
                                    })}
                            </>
                        )}

                        {renderField("Additional Notes or Special Considerations", "additional_notes", "textarea", {
                            placeholder:
                                "Include any other relevant information about this referral...",
                            rows: 6,
                        })}

                        {renderField("How did you hear about Monarch Competency?", "referral_source_channel", "select", {
                            options: [
                                { value: "court_referral", label: "Court Referral" },
                                { value: "colleague", label: "Colleague / Professional Referral" },
                                { value: "website", label: "Website / Online Search" },
                                { value: "conference", label: "Conference / Training" },
                                { value: "previous_experience", label: "Previous Experience with Monarch" },
                                { value: "other", label: "Other" },
                            ],
                        })}

                        <div style={S.callout}>
                            On the next step, you will review all information before submitting the
                            referral.
                        </div>

                        {renderNav(REFERRAL_FORM_STEP.safety, REFERRAL_FORM_STEP.review, "Review & Submit →")}
                    </div>
                )}

                {/* ============================================================ */}
                {/* REFERRAL_FORM_STEP.review — UI step 13 */}
                {/* ============================================================ */}
                {currentStep === REFERRAL_FORM_STEP.review && submitStatus !== "success" && (
                    <div>
                        <h2 style={S.stepTitle}>{STEP_TITLES[REFERRAL_FORM_STEP.review]}</h2>
                        <p style={S.stepDesc}>
                            Please review the information below before submitting
                        </p>

                        <div style={S.reviewBlock}>
                            <h3 style={S.reviewTitle}>
                                Professional contact {renderEditButton(REFERRAL_FORM_STEP.contact)}
                            </h3>
                            {renderReviewLine("Full Name", formData.referral_source_name)}
                            {renderReviewLine("Organization / Agency Type", fmt(formData.referral_source_type))}
                            {renderReviewLine("Organization / Agency Name", formData.referral_source_organization)}
                            {renderReviewLine("Title / Position", formData.referral_source_title)}
                            {renderReviewLine("Email", formData.referral_source_email)}
                            {renderReviewLine("Phone", formData.referral_source_phone)}
                            {renderReviewLine("Can Provide Collateral", fmt(formData.can_provide_collateral))}
                            {renderReviewLine("Previous Referral", fmt(formData.previous_monarch_referral))}
                        </div>

                        {/* Additional Contacts */}
                        <div style={S.reviewBlock}>
                            <h3 style={S.reviewTitle}>
                                Additional contacts {renderEditButton(REFERRAL_FORM_STEP.additionalContacts)}
                            </h3>
                            {renderReviewLine("Emergency Contact", formData.emergency_contact_name)}
                            {renderReviewLine("EC Phone", formData.emergency_contact_phone)}
                            {renderReviewLine("EC Relationship", formData.emergency_contact_relationship)}
                            {formData.emergency_contact_can_provide_info && (
                                <p style={{ marginBottom: "6px", fontSize: "14px" }}>
                                    <strong>EC Can Provide Info:</strong> Yes
                                </p>
                            )}
                            {formData.additional_contacts.length > 0 && (
                                <div style={{ marginTop: "8px" }}>
                                    <strong style={{ fontSize: "13px" }}>
                                        Additional Contacts ({formData.additional_contacts.length}):
                                    </strong>
                                    {formData.additional_contacts.map((c, i) => (
                                        <p key={i} style={{ fontSize: "13px", marginBottom: "4px", marginLeft: "12px" }}>
                                            {c.name} {c.organization && `— ${c.organization}`} {c.role && `(${c.role})`}
                                        </p>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Client Demographics */}
                        <div style={S.reviewBlock}>
                            <h3 style={S.reviewTitle}>Client Demographics {renderEditButton(REFERRAL_FORM_STEP.clientDemographics)}</h3>
                            {renderReviewLine(
                                "Name",
                                [formData.client_first_name, formData.client_middle_name, formData.client_last_name]
                                    .filter(Boolean)
                                    .join(" ")
                            )}
                            {renderReviewLine("Aliases", formData.client_preferred_name)}
                            {renderReviewLine("DOB", formatCalendarDate(formData.client_dob) || formData.client_dob)}
                            {renderReviewLine("Gender", fmt(formData.client_gender))}
                            {renderReviewLine("Sex at Birth", fmt(formData.client_sex_at_birth))}
                            {renderReviewLine("Pronouns", fmt(formData.client_pronouns))}
                            {renderReviewLine("Language", formData.client_primary_language)}
                            {renderReviewLine("English Proficiency", fmt(formData.client_english_proficiency))}
                            {formData.interpreter_needed && renderReviewLine("Interpreter Needed", "Yes")}
                            {renderReviewLine("Ethnicity", fmt(formData.client_ethnicity))}
                            {renderReviewLine("Marital Status", fmt(formData.client_marital_status))}
                            {renderReviewLine("Client Phone", formData.client_phone)}
                            {renderReviewLine("Client Email", formData.client_email)}
                            {renderReviewLine("Consents to Referral", fmt(formData.client_consents_to_referral))}
                        </div>

                        {/* Documents inventory */}
                        <div style={S.reviewBlock}>
                            <h3 style={S.reviewTitle}>
                                Documents Inventory {renderEditButton(REFERRAL_FORM_STEP.documents)}
                            </h3>
                            <p style={{ fontSize: "14px", marginBottom: "6px", lineHeight: 1.5 }}>
                                {formatDocumentsInventoryReview(null, formData.documents_inventory)}
                            </p>
                            {renderReviewLine("Notes", formData.documents_notes)}
                        </div>

                        {/* Insurance */}
                        <div style={S.reviewBlock}>
                            <h3 style={S.reviewTitle}>
                                Insurance & Benefits {renderEditButton(REFERRAL_FORM_STEP.insurance)}
                            </h3>
                            {renderReviewLine("Medicaid", fmt(formData.medicaid_status))}
                            {renderReviewLine("Medicaid #", formData.medicaid_number)}
                            {renderReviewLine("Medicare", fmt(formData.medicare_status))}
                            {renderReviewLine("Medicare #", formData.medicare_number)}
                            {formData.has_private_insurance && renderReviewLine("Private Insurance", formData.private_insurance_details || "Yes")}
                            {renderReviewLine("SSI/SSDI", fmt(formData.ssdi_status))}
                            {renderReviewLine("Benefits Notes", formData.benefits_notes)}
                        </div>

                        {/* Legal */}
                        <div style={S.reviewBlock}>
                            <h3 style={S.reviewTitle}>
                                Legal Status & Court {renderEditButton(REFERRAL_FORM_STEP.legal)}
                            </h3>
                            {renderReviewLine("Jurisdiction", formData.court_jurisdiction)}
                            {renderReviewLine("Case Number", formData.case_number)}
                            {renderReviewLine("Judge", formData.judge_name)}
                            {renderReviewLine("Courtroom", formData.courtroom)}
                            {renderReviewLine("Next Court Date", formData.next_court_date)}
                            {renderReviewLine("Charges", formData.charges)}
                            {renderReviewLine("Competency Status", fmt(formData.competency_status))}
                            {renderReviewLine("Eval Date", formData.competency_eval_date)}
                            {renderReviewLine("Evaluator", formData.competency_evaluator)}
                            {renderReviewLine("Attorney", formData.attorney_name)}
                            {renderReviewLine("Attorney Phone", formData.attorney_phone)}
                            {renderReviewLine("Attorney Email", formData.attorney_email)}
                            {formData.on_probation && renderReviewLine("Probation", formData.probation_officer_contact || "Yes")}
                            {formData.on_parole && renderReviewLine("Parole", formData.parole_officer_contact || "Yes")}
                            {renderReviewLine("Active Warrants", fmt(formData.active_warrants))}
                            {renderReviewLine("Bond Holds", fmt(formData.has_bond_holds))}
                            {renderReviewLine("Bond Details", formData.bond_holds_details)}
                            {renderReviewLine("PR Bond to Monarch", fmt(formData.pr_bond_to_monarch))}
                        </div>

                        {/* Location */}
                        <div style={S.reviewBlock}>
                            <h3 style={S.reviewTitle}>
                                Current Location {renderEditButton(REFERRAL_FORM_STEP.location)}
                            </h3>
                            {renderReviewLine("Location Type", fmt(formData.current_location_type))}
                            {renderReviewLine("Facility", formData.facility_name)}
                            {renderReviewLine("Facility Address", formData.facility_address)}
                            {renderReviewLine("Inmate/Patient ID", formData.inmate_id)}
                            {renderReviewLine("Facility Contact", formData.facility_contact_person)}
                            {renderReviewLine("Facility Phone", formData.facility_contact_phone)}
                            {formData.currently_incarcerated && renderReviewLine("Currently Incarcerated", "Yes")}
                            {renderReviewLine("Expected Release", formData.expected_release_date)}
                            {renderReviewLine("Prior Housing", fmt(formData.housing_prior))}
                            {renderReviewLine("Post-Program Housing", fmt(formData.housing_post_program))}
                            {renderReviewLine("Housing Notes", formData.housing_notes)}
                        </div>

                        {/* Clinical */}
                        <div style={S.reviewBlock}>
                            <h3 style={S.reviewTitle}>
                                Mental Health & Clinical {renderEditButton(REFERRAL_FORM_STEP.clinical)}
                            </h3>
                            {renderReviewLine("Diagnoses", formData.current_diagnoses)}
                            {renderReviewLine("Med Compliance", fmt(formData.medication_compliance))}
                            {renderReviewLine("Psych Medications", formData.current_medications)}
                            {renderReviewLine("Med Barriers", formData.medication_barriers)}
                            {renderReviewLine("Psych History", formData.psychiatric_history)}
                            {renderReviewLine("Previous Programs", formData.previous_treatment_programs)}
                            {renderReviewLine("TBI History", fmt(formData.tbi_history))}
                            {renderReviewLine("TBI Details", formData.tbi_details)}
                            {renderReviewLine("IDD Status", fmt(formData.idd_status))}
                            {renderReviewLine("IDD Details", formData.idd_details)}
                        </div>

                        {/* Substance Use */}
                        <div style={S.reviewBlock}>
                            <h3 style={S.reviewTitle}>
                                Substance Use {renderEditButton(REFERRAL_FORM_STEP.substance)}
                            </h3>
                            {renderReviewLine("Pattern", fmt(formData.substance_use_pattern))}
                            {renderReviewLine("Current Use", formData.substance_use_current)}
                            {renderReviewLine("History", formData.substance_use_history)}
                            {renderReviewLine("Detox Required", fmt(formData.detox_required))}
                            {renderReviewLine("Detox Details", formData.detox_details)}
                        </div>

                        {/* Medical */}
                        <div style={S.reviewBlock}>
                            <h3 style={S.reviewTitle}>
                                Medical & Somatic {renderEditButton(REFERRAL_FORM_STEP.medical)}
                            </h3>
                            {renderReviewLine("Medical Conditions", formData.medical_conditions)}
                            {renderReviewLine("Controlled by Meds", fmt(formData.medical_conditions_controlled))}
                            {renderReviewLine("Non-Psych Meds", formData.medications_non_psychiatric)}
                            {renderReviewLine("Med Allergies", formData.medication_allergies)}
                            {renderReviewLine("Mobility", fmt(formData.mobility_needs))}
                            {formData.adl_support_needed && renderReviewLine("ADL Support", formData.adl_support_details || "Yes")}
                            {renderReviewLine("Acute Needs", formData.acute_medical_needs)}
                        </div>

                        {/* Safety & Risk */}
                        <div
                            style={{
                                ...S.reviewBlock,
                                backgroundColor: C.warningBg,
                                border: `2px solid ${C.warningBorder}`,
                            }}
                        >
                            <h3 style={{ ...S.reviewTitle, color: C.warningText }}>
                                Safety & Risk Assessment {renderEditButton(REFERRAL_FORM_STEP.safety)}
                            </h3>
                            {renderReviewLine("Suicide Risk", fmt(formData.suicide_risk))}
                            {renderReviewLine("Suicide Details", formData.suicide_risk_details)}
                            {renderReviewLine("Violence Risk", fmt(formData.violence_risk))}
                            {renderReviewLine("Violence Details", formData.violence_risk_details)}
                            {renderReviewLine("Elopement Risk", fmt(formData.elopement_risk))}
                            {renderReviewLine("Elopement Details", formData.elopement_risk_details)}
                            {renderReviewLine("Arson", fmt(formData.arson_history))}
                            {renderReviewLine("Arson Details", formData.arson_details)}
                            {renderReviewLine("RSO Status", fmt(formData.rso_status))}
                            {renderReviewLine("RSO Details", formData.rso_details)}
                            {formData.medical_needs && renderReviewLine("Medical Needs", "Yes")}
                            {renderReviewLine("Safety Notes", formData.safety_notes)}
                        </div>

                        {/* Urgency & Notes */}
                        <div style={S.reviewBlock}>
                            <h3 style={S.reviewTitle}>
                                Urgency & Notes {renderEditButton(REFERRAL_FORM_STEP.urgency)}
                            </h3>
                            {formData.urgent_placement ? (
                                <>
                                    {renderReviewLine(
                                        "Expedited placement",
                                        expeditedUrgentColumnLabel(formData.urgent_placement, formData.urgency_level) || "Requested"
                                    )}
                                    {formData.urgency_level &&
                                        renderReviewLine(
                                            "Placement timing",
                                            EXPEDITED_PLACEMENT_TIMING_LABELS[formData.urgency_level] || fmt(formData.urgency_level)
                                        )}
                                    {formData.urgency_level === "conditional_timeline" && expeditedRequiredByDate &&
                                        renderReviewLine("Must be placed by", expeditedRequiredByDate)}
                                    {formData.urgency_reason && renderReviewLine("Expedited notes", formData.urgency_reason)}
                                </>
                            ) : (
                                renderReviewLine("Expedited placement", "No")
                            )}
                            {renderReviewLine("Additional Notes", formData.additional_notes)}
                            {renderReviewLine("How Found Monarch", fmt(formData.referral_source_channel))}
                        </div>

                        {/* Error */}
                        {submitStatus === "error" && (
                            <div
                                style={{
                                    marginBottom: "20px",
                                    padding: "16px",
                                    backgroundColor: C.errorBg,
                                    color: C.error,
                                    borderRadius: "0px",
                                }}
                            >
                                {submitError ||
                                    "Error submitting referral. Please try again."}
                            </div>
                        )}

                        {/* Submit Navigation */}
                        <div style={S.navRow}>
                            <button onClick={() => setCurrentStep(REFERRAL_FORM_STEP.urgency)} style={S.btnSecondary}>
                                ← Previous
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                style={{
                                    ...S.btnSubmit,
                                    backgroundColor: isSubmitting ? C.moonstone : C.success,
                                    cursor: isSubmitting ? "not-allowed" : "pointer",
                                }}
                            >
                                {isSubmitting ? "Submitting..." : "Submit Referral"}
                            </button>
                        </div>
                    </div>
                )}
                    </div>
                    )}

                {/* ============================================================ */}
                {/* SUCCESS CONFIRMATION                                         */}
                {/* ============================================================ */}
                {submitStatus === "success" && (
                    <div
                        style={{
                            textAlign: "center",
                            padding: "40px 20px",
                        }}
                    >
                        <div
                            style={{
                                width: "64px",
                                height: "64px",
                                backgroundColor: C.successBg,
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                margin: "0 auto 24px auto",
                                fontSize: "28px",
                            }}
                        >
                            ✓
                        </div>

                        <h2
                            style={{
                                fontSize: "24px",
                                fontWeight: "700",
                                color: C.success,
                                marginBottom: "12px",
                            }}
                        >
                            Referral Submitted Successfully
                        </h2>

                        <p style={{ fontSize: "16px", color: C.textMuted, marginBottom: "24px" }}>
                            Thank you for your referral. Our admissions team will review it
                            and follow up shortly.
                        </p>

                        <div style={{ marginBottom: "24px", maxWidth: "420px", margin: "0 auto 24px auto" }}>
                            <button
                                type="button"
                                onClick={() => {
                                    try {
                                        window.location.href = REFERRAL_SOURCE_PORTAL_URL
                                    } catch (_e) {
                                        // ignore
                                    }
                                }}
                                style={{
                                    ...S.btnPrimary,
                                    width: "100%",
                                    padding: "14px 24px",
                                    fontSize: "15px",
                                    fontWeight: 700,
                                }}
                            >
                                Go to referral source portal
                            </button>
                            <p style={{ fontSize: "13px", color: C.textMuted, marginTop: "10px", lineHeight: 1.5 }}>
                                The portal is available anytime with this email to track referrals and upload documents. You can copy your referral code below first.
                            </p>
                        </div>

                        {submittedReferralCode && (
                            <div
                                style={{
                                    backgroundColor: C.shell,
                                    border: `2px solid ${C.moonstone}`,
                                    borderRadius: "0px",
                                    padding: "24px",
                                    marginBottom: "16px",
                                    maxWidth: "400px",
                                    margin: "0 auto 16px auto",
                                }}
                            >
                                <p
                                    style={{
                                        fontSize: "13px",
                                        color: C.textMuted,
                                        marginBottom: "8px",
                                        letterSpacing: "0.04em",
                                        textTransform: "uppercase",
                                        fontWeight: "600",
                                    }}
                                >
                                    Your Referral Code
                                </p>
                                <p
                                    style={{
                                        fontSize: "32px",
                                        fontWeight: "700",
                                        color: C.stoneCloud,
                                        letterSpacing: "0.1em",
                                        marginBottom: "12px",
                                        fontFamily: "monospace",
                                    }}
                                >
                                    {submittedReferralCode}
                                </p>
                                <button
                                    onClick={copyReferralCode}
                                    style={{
                                        padding: "8px 20px",
                                        fontSize: "14px",
                                        fontWeight: "600",
                                        color: codeCopied ? C.success : C.ash,
                                        backgroundColor: codeCopied ? C.successBg : "transparent",
                                        border: `2px solid ${codeCopied ? C.success : C.ash}`,
                                        borderRadius: "0px",
                                        cursor: "pointer",
                                        marginBottom: "12px",
                                        letterSpacing: "0.02em",
                                        transition: "all 0.2s ease",
                                    }}
                                >
                                    {codeCopied ? "Copied!" : "Copy Code"}
                                </button>
                                <p style={{ fontSize: "14px", color: C.textMuted, lineHeight: "1.5" }}>
                                    Save this code to upload documents later. You can visit the
                                    document upload page and enter this code along with your email
                                    address to submit additional documents.
                                </p>
                            </div>
                        )}

                        {submittedReferralCode && (
                            <div
                                style={{
                                    ...S.warningCallout,
                                    maxWidth: "400px",
                                    margin: "0 auto 24px auto",
                                    textAlign: "center",
                                    fontWeight: "600",
                                }}
                            >
                                This code will not be displayed again. Please copy or write it down now.
                            </div>
                        )}

                        {/* File upload warning (if some files failed) */}
                        <div
                            style={{
                                backgroundColor: C.infoBg,
                                border: `1px solid ${C.infoBorder}`,
                                borderRadius: "0px",
                                padding: "20px",
                                marginBottom: "24px",
                                textAlign: "left",
                                maxWidth: "500px",
                                margin: "0 auto 24px auto",
                            }}
                        >
                            <p
                                style={{
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    color: C.infoText,
                                    marginBottom: "8px",
                                }}
                            >
                                What Happens Next
                            </p>
                            <ul
                                style={{
                                    fontSize: "14px",
                                    color: C.infoText,
                                    margin: 0,
                                    paddingLeft: "20px",
                                    lineHeight: "1.6",
                                }}
                            >
                                <li>Our admissions team will review your referral</li>
                                <li>We may follow up for additional information</li>
                                <li>You will receive confirmation at your provided email</li>
                                <li>Use your referral code to upload supporting documents anytime</li>
                            </ul>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
                            <button
                                onClick={() => { setSessionTimeLeft(null); resetForm() }}
                                style={{
                                    ...S.btnSecondary,
                                    color: C.success,
                                    borderColor: C.success,
                                    width: "100%",
                                    maxWidth: "320px",
                                }}
                            >
                                Submit Another Referral
                            </button>

                            <button
                                onClick={() => {
                                    setSessionTimeLeft(null)
                                    try {
                                        window.location.href = submitReferralsDocumentsPath(submittedReferralCode)
                                    } catch (_e) {
                                        // Fallback
                                    }
                                }}
                                style={{
                                    ...S.btnSecondary,
                                    color: C.ash,
                                    borderColor: C.ash,
                                    width: "100%",
                                    maxWidth: "320px",
                                }}
                            >
                                Upload Documents
                            </button>

                            <button
                                onClick={handleSignOut}
                                style={{
                                    padding: "10px 24px",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    color: C.textMuted,
                                    backgroundColor: "transparent",
                                    border: "none",
                                    borderRadius: "0px",
                                    cursor: "pointer",
                                    width: "100%",
                                    maxWidth: "320px",
                                }}
                            >
                                Sign Off
                            </button>
                        </div>

                        {/* Session timeout countdown */}
                        {sessionTimeLeft !== null && sessionTimeLeft <= 60 && sessionTimeLeft > 0 && (
                            <p
                                style={{
                                    fontSize: "13px",
                                    color: C.textMuted,
                                    marginTop: "20px",
                                    textAlign: "center",
                                }}
                            >
                                Session ending in {Math.floor(sessionTimeLeft / 60)}:{String(sessionTimeLeft % 60).padStart(2, "0")}...
                            </p>
                        )}
                    </div>
                )}
                </div>
            </div>
        </div>
        </div>
    )
}
