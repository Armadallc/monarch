import React, { useState, useEffect, useMemo } from "react"
import { createClient } from "@supabase/supabase-js"

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

const supabase = createClient(
    "https://esbmnympligtknhtkary.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzYm1ueW1wbGlndGtuaHRrYXJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MjY5NzcsImV4cCI6MjA4MTAwMjk3N30.TeHhOnsUuAzSx9q5z1VMYHnAWlL63QKxVIRKNeRCRbk"
)

// ============================================================================
// DESIGN SYSTEM — Norre Aesthetic + Monarch Colors
// ============================================================================

const COLORS = {
    ash: "#2B2828",
    ashMuted: "#2B282899",
    ashSubtle: "#2B282826",
    gunmetal: "#1B242A",
    moonstone: "#7EACB5",
    moonstoneLight: "#7EACB533",
    champagne: "#F5E4C8",
    champagneLight: "#F5E4C84D",
    tangerine: "#FFA089",
    tangerineLight: "#FFA0894D",
    coconut: "#E9EDF6",
    white: "#FFFFFF",
    green: "#d1fae5",
    greenText: "#059669",
    redText: "#c0392b",
    overlay: "rgba(27, 36, 42, 0.6)",
} as const

const RADIUS = {
    pill: "100px",
    container: "24px",
    modal: "28px",
    section: "16px",
    card: "20px",
    small: "12px",
} as const

const SHADOWS = {
    card: "0 2px 12px rgba(27, 36, 42, 0.06)",
    modal: "0 32px 64px -16px rgba(27, 36, 42, 0.2)",
    hover: "0 4px 16px rgba(27, 36, 42, 0.1)",
} as const

const FONT = `"Montserrat", sans-serif`

// ============================================================================
// TYPESCRIPT INTERFACES
// ============================================================================

type ReferralStatus =
    | "pending_review"
    | "under_review"
    | "accepted"
    | "declined"
    | "waitlisted"

type ReferralSourceType =
    | "court"
    | "legal_representative"
    | "probation_parole"
    | "mental_health_facility"
    | "case_management"
    | "other_professional"
    | "family"
    | "self_referral"

type TabId = "submissions" | "inquiries"

interface ReferralSubmission {
    id: string
    created_at: string
    updated_at: string
    referral_source_type: ReferralSourceType
    referral_source_name: string
    referral_source_email: string
    referral_source_phone: string
    referral_source_organization: string
    referral_source_title: string
    is_priority_referral: boolean
    urgent_placement: boolean
    can_provide_collateral: string
    previous_monarch_referral: string
    referral_code: string
    admin_ref_id: string
    // Demographics
    client_first_name: string
    client_middle_name: string
    client_last_name: string
    client_dob: string | null
    client_ssn: string
    client_gender: string
    client_sex_at_birth: string
    client_pronouns: string
    client_preferred_name: string
    client_primary_language: string
    client_english_proficiency: string
    interpreter_needed: boolean
    client_ethnicity: string
    client_marital_status: string
    client_phone: string
    client_email: string
    client_consents_to_referral: string
    // Additional contacts
    emergency_contact_name: string
    emergency_contact_relationship: string
    emergency_contact_phone: string
    emergency_contact_can_provide_info: boolean
    additional_contacts: any[]
    // Documents
    documents_available: string[]
    documents_notes: string
    uploaded_documents: any[]
    // Insurance
    medicaid_status: string
    medicaid_id: string
    medicaid_number: string
    medicaid_mco: string
    expected_payer: string
    medicare_status: string
    medicare_number: string
    has_private_insurance: boolean
    private_insurance_details: string
    ssdi_status: string
    benefits_notes: string
    // Legal
    case_number: string
    court_jurisdiction: string
    judge_name: string
    courtroom: string
    attorney_name: string
    attorney_phone: string
    attorney_email: string
    charges: string
    competency_status: string
    competency_eval_date: string | null
    competency_evaluator: string
    next_court_date: string | null
    on_probation: boolean
    probation_officer_contact: string
    on_parole: boolean
    parole_officer_contact: string
    active_warrants: string
    has_bond_holds: string
    bond_holds_details: string
    pr_bond_to_monarch: string
    pr_bond_judge_contact: string
    pr_bond_da_contact: string
    pr_bond_other_contacts: string
    // Location
    current_location_type: string
    facility_name: string
    facility_address: string
    inmate_id: string
    facility_contact_person: string
    facility_contact_phone: string
    currently_incarcerated: boolean
    expected_release_date: string | null
    housing_prior: string
    housing_post_program: string
    housing_notes: string
    // Clinical
    current_diagnoses: string
    medication_compliance: string
    current_medications: unknown
    medication_barriers: string
    psychiatric_history: string
    previous_treatment_programs: string
    tbi_history: string
    tbi_details: string
    idd_status: string
    idd_details: string
    // Substance use
    substance_use_pattern: string
    substance_use_current: string
    substance_use_history: string
    detox_required: string
    detox_details: string
    // Medical
    medical_conditions: string
    medical_conditions_controlled: string
    medications_non_psychiatric: string
    medication_allergies: string
    mobility_needs: string
    adl_support_needed: boolean
    adl_support_details: string
    acute_medical_needs: string
    // Safety & risk (changed from boolean to text enum)
    violence_risk: string
    suicide_risk: string
    elopement_risk: string
    suicide_risk_details: string
    violence_risk_details: string
    elopement_risk_details: string
    arson_history: string
    arson_details: string
    rso_status: string
    rso_details: string
    medical_needs: boolean
    safety_notes: string
    // Urgency & notes
    urgency_level: string
    urgency_reason: string
    additional_notes: string
    referral_source_channel: string
    // System
    status: ReferralStatus
    reviewed_by: string | null
    reviewed_at: string | null
    review_notes: string
    ip_address: string
    user_agent: string
    form_completion_percentage: number
    time_spent_seconds: number
    session_id: string
    last_auto_save: string | null
    archived_at: string | null
}

interface ReferralInquiry {
    id: string
    created_at: string
    updated_at: string
    inquiry_type: string
    referral_source_name: string
    referral_source_phone: string
    referral_source_email: string
    referral_source_relationship: string
    referral_source_organization: string
    referral_source_title: string
    client_first_name: string
    client_last_initial: string
    client_approximate_age: string
    client_current_location: string
    situation_notes: string
    how_heard_about_us: string
    status: ReferralStatus
    archived_at: string | null
}

interface SortConfig {
    column: string
    direction: "asc" | "desc"
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STATUS_OPTIONS: { value: ReferralStatus; label: string }[] = [
    { value: "pending_review", label: "Pending Review" },
    { value: "under_review", label: "Under Review" },
    { value: "accepted", label: "Accepted" },
    { value: "declined", label: "Declined" },
    { value: "waitlisted", label: "Waitlisted" },
]

const SOURCE_TYPE_LABELS: Record<string, string> = {
    court: "Court",
    legal_representative: "Legal Rep",
    probation_parole: "Probation/Parole",
    mental_health_facility: "Mental Health",
    case_management: "Case Mgmt",
    other_professional: "Other Pro",
    family: "Family",
    self_referral: "Self",
}

const COMPETENCY_STATUS_LABELS: Record<string, string> = {
    evaluation_ordered: "Evaluation Ordered",
    found_incompetent: "Found Incompetent",
    restoration_ordered: "Restoration Ordered",
    in_restoration: "In Restoration",
    restored: "Restored",
    not_restorable: "Not Restorable",
    pending_evaluation: "Pending Evaluation",
}

const URGENCY_LABELS: Record<string, string> = {
    immediate: "Immediate",
    urgent: "Urgent",
    standard: "Standard",
    planning_ahead: "Planning Ahead",
}

const RISK_TIMEFRAME_LABELS: Record<string, string> = {
    current: "Current (30 days)",
    recent: "Recent (90 days)",
    recovering: "Recovering (4-12 mo)",
    historical: "Historical (1+ yr)",
    no_history: "No History",
}

const LOCATION_LABELS: Record<string, string> = {
    county_jail: "County Jail",
    state_prison: "State Prison / DOC",
    hospital_medical: "Hospital (Medical)",
    hospital_psychiatric: "Hospital (Psych)",
    state_hospital: "State Hospital (CMHIP)",
    treatment_facility: "Treatment Facility",
    residential_program: "Residential Program",
    community: "Community",
    community_supervised: "Community (Supervised)",
    community_unsupervised: "Community (Unsupervised)",
    homeless_shelter: "Homeless / Shelter",
    jail: "Jail",
    prison: "Prison",
    hospital: "Hospital",
    homeless: "Homeless",
    other: "Other",
}

const GENDER_LABELS: Record<string, string> = {
    male: "Male",
    female: "Female",
    non_binary: "Non-Binary",
    transgender_male: "Transgender Male",
    transgender_female: "Transgender Female",
    other: "Other",
    prefer_not_to_say: "Prefer Not to Say",
}

const MCO_LABELS: Record<string, string> = {
    health_first_colorado: "Health First Colorado",
    rocky_mountain: "Rocky Mountain Health Plans",
    colorado_access: "Colorado Access",
    denver_health: "Denver Health",
    friday_health: "Friday Health",
    anthem: "Anthem",
    united: "United",
    other: "Other",
    unknown: "Unknown",
}

const PAYER_LABELS: Record<string, string> = {
    medicaid: "Medicaid",
    medicare: "Medicare",
    state_contract: "State Contract",
    self_pay: "Self Pay",
    unknown: "Unknown",
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const formatLabel = (value: string | null | undefined, labels?: Record<string, string>): string => {
    if (!value) return "\u2014"
    if (labels && labels[value]) return labels[value]
    return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

const formatDate = (date: string | null | undefined): string => {
    if (!date) return "\u2014"
    return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

const formatPhone = (phone: string | null | undefined): string => {
    if (!phone) return "\u2014"
    const digits = phone.replace(/\D/g, "")
    if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
    return phone
}

const maskSSN = (ssn: string | null | undefined): string => {
    if (!ssn) return "\u2014"
    const digits = ssn.replace(/\D/g, "")
    if (digits.length >= 4) return `***-**-${digits.slice(-4)}`
    return "***"
}

const formatMedications = (meds: unknown): string => {
    if (!meds) return "Not provided"
    if (typeof meds === "string") return meds
    return JSON.stringify(meds, null, 2)
}

const ALLOWED_DOMAIN = "monarchcompetency.com"
const DASHBOARD_REDIRECT_URL = "https://monarchy.framer.website/dashboard"

const isAllowedDomain = (email: string | undefined | null): boolean => {
    if (!email) return false
    return email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`)
}

const statusColors: Record<ReferralStatus, { bg: string; text: string }> = {
    pending_review: { bg: COLORS.champagne, text: COLORS.ash },
    under_review: { bg: COLORS.moonstoneLight, text: COLORS.gunmetal },
    accepted: { bg: COLORS.green, text: COLORS.greenText },
    declined: { bg: COLORS.tangerineLight, text: COLORS.redText },
    waitlisted: { bg: COLORS.coconut, text: COLORS.ashMuted },
}

// ============================================================================
// SHARED STYLES
// ============================================================================

const cellStyle: React.CSSProperties = { padding: "14px 12px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }

const sectionCardStyle: React.CSSProperties = {
    background: COLORS.coconut,
    borderRadius: RADIUS.section,
    padding: "20px 24px",
}

const pillBtnBase: React.CSSProperties = {
    border: "none",
    borderRadius: RADIUS.pill,
    cursor: "pointer",
    fontFamily: FONT,
    fontSize: "13px",
    fontWeight: 600,
    letterSpacing: "-0.02em",
    transition: "all 0.2s ease",
}

const selectStyle: React.CSSProperties = {
    ...pillBtnBase,
    padding: "8px 20px",
    border: `1px solid ${COLORS.ashSubtle}`,
    background: COLORS.white,
    color: COLORS.ash,
    appearance: "none" as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%232B2828' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 14px center",
    paddingRight: "36px",
    fontSize: "12px",
    fontWeight: 500,
}

// ============================================================================
// EXPORT UTILITIES
// ============================================================================

const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
}

const escapeCSV = (val: unknown): string => {
    if (val == null) return ""
    const str = typeof val === "object" ? JSON.stringify(val) : String(val)
    if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
        return `"${str.replace(/"/g, '""')}"`
    }
    return str
}

const exportSubmissionsCSV = (data: ReferralSubmission[], filename: string) => {
    const columns = [
        "id", "admin_ref_id", "referral_code", "referral_source_type", "is_priority_referral", "referral_source_name",
        "referral_source_email", "referral_source_phone", "referral_source_organization",
        "referral_source_title", "urgent_placement", "can_provide_collateral", "previous_monarch_referral",
        // Demographics
        "client_first_name", "client_middle_name", "client_last_name", "client_dob", "client_ssn",
        "client_gender", "client_sex_at_birth", "client_pronouns", "client_preferred_name",
        "client_primary_language", "client_english_proficiency", "interpreter_needed",
        "client_ethnicity", "client_marital_status", "client_phone", "client_email",
        "client_consents_to_referral",
        // Contacts
        "emergency_contact_name", "emergency_contact_relationship", "emergency_contact_phone",
        "emergency_contact_can_provide_info", "additional_contacts",
        // Documents
        "documents_available", "documents_notes",
        // Insurance
        "medicaid_status", "medicaid_number", "medicare_status", "medicare_number",
        "has_private_insurance", "private_insurance_details", "ssdi_status", "benefits_notes",
        // Legal
        "case_number", "court_jurisdiction", "judge_name", "courtroom", "attorney_name",
        "attorney_phone", "attorney_email", "charges", "competency_status", "competency_eval_date",
        "competency_evaluator", "next_court_date", "on_probation", "probation_officer_contact",
        "on_parole", "parole_officer_contact", "active_warrants", "has_bond_holds",
        "bond_holds_details", "pr_bond_to_monarch",
        // Location
        "current_location_type", "facility_name", "facility_address", "inmate_id",
        "facility_contact_person", "facility_contact_phone", "currently_incarcerated",
        "expected_release_date", "housing_prior", "housing_post_program", "housing_notes",
        // Clinical
        "current_diagnoses", "medication_compliance", "current_medications", "medication_barriers",
        "psychiatric_history", "previous_treatment_programs", "tbi_history", "tbi_details",
        "idd_status", "idd_details",
        // Substance
        "substance_use_pattern", "substance_use_current", "substance_use_history",
        "detox_required", "detox_details",
        // Medical
        "medical_conditions", "medical_conditions_controlled", "medications_non_psychiatric",
        "medication_allergies", "mobility_needs", "adl_support_needed", "adl_support_details",
        "acute_medical_needs",
        // Safety
        "violence_risk", "violence_risk_details", "suicide_risk", "suicide_risk_details",
        "elopement_risk", "elopement_risk_details", "arson_history", "arson_details",
        "rso_status", "rso_details", "medical_needs", "safety_notes",
        // Urgency
        "urgency_level", "urgency_reason", "additional_notes", "referral_source_channel",
        // System
        "status", "reviewed_by", "reviewed_at", "review_notes", "created_at", "updated_at",
    ]
    const header = columns.join(",")
    const rows = data.map((row) => columns.map((col) => escapeCSV((row as any)[col])).join(","))
    downloadFile([header, ...rows].join("\n"), filename, "text/csv")
}

const exportInquiriesCSV = (data: ReferralInquiry[], filename: string) => {
    const columns = [
        "id", "inquiry_type", "referral_source_name", "referral_source_phone",
        "referral_source_email", "referral_source_relationship", "referral_source_organization",
        "referral_source_title", "client_first_name", "client_last_initial",
        "client_approximate_age", "client_current_location", "situation_notes",
        "how_heard_about_us", "status", "created_at", "updated_at",
    ]
    const header = columns.join(",")
    const rows = data.map((row) => columns.map((col) => escapeCSV((row as any)[col])).join(","))
    downloadFile([header, ...rows].join("\n"), filename, "text/csv")
}

const exportSubmissionPDF = (s: ReferralSubmission) => {
    const w = window.open("", "_blank")
    if (!w) return
    w.document.write(`<!DOCTYPE html><html><head>
<title>Referral \u2014 ${s.client_first_name} ${s.client_last_name}</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:"Montserrat",sans-serif;color:${COLORS.ash};padding:40px;max-width:800px;margin:0 auto}
h1{font-size:22px;font-weight:700;margin-bottom:4px}
h2{font-size:15px;font-weight:600;margin:24px 0 12px;padding-bottom:6px;border-bottom:2px solid ${COLORS.moonstone};color:${COLORS.gunmetal}}
.meta{font-size:12px;color:${COLORS.ashMuted};margin-bottom:20px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 32px}
.field{font-size:13px;margin-bottom:6px}
.field strong{font-weight:600}
.risk-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:8px 0}
.risk{text-align:center;padding:8px;border-radius:8px;font-size:11px;font-weight:600;text-transform:uppercase}
.risk-yes{background:${COLORS.tangerineLight};color:${COLORS.redText};border:1px solid ${COLORS.tangerine}}
.risk-no{background:${COLORS.coconut};color:${COLORS.ashMuted}}
.notes{background:${COLORS.coconut};padding:12px;border-radius:8px;font-size:13px;white-space:pre-wrap;margin-top:4px}
@media print{body{padding:20px}}
</style></head><body>
<h1>${s.client_first_name} ${s.client_middle_name || ""} ${s.client_last_name}</h1>
<div class="meta">${s.admin_ref_id || `ID: ${s.id}`} | Code: ${s.referral_code || "\u2014"} | Submitted: ${formatDate(s.created_at)} | Status: ${formatLabel(s.status)}</div>
<h2>Client Demographics</h2>
<div class="grid">
<div class="field"><strong>Aliases:</strong> ${s.client_preferred_name || "\u2014"}</div>
<div class="field"><strong>Date of Birth:</strong> ${formatDate(s.client_dob)}</div>
<div class="field"><strong>Gender:</strong> ${formatLabel(s.client_gender, GENDER_LABELS)}</div>
<div class="field"><strong>Sex at Birth:</strong> ${formatLabel(s.client_sex_at_birth)}</div>
<div class="field"><strong>Pronouns:</strong> ${formatLabel(s.client_pronouns)}</div>
<div class="field"><strong>SSN:</strong> ${maskSSN(s.client_ssn)}</div>
<div class="field"><strong>Primary Language:</strong> ${s.client_primary_language || "\u2014"}</div>
<div class="field"><strong>English Proficiency:</strong> ${formatLabel(s.client_english_proficiency)}</div>
<div class="field"><strong>Interpreter Needed:</strong> ${s.interpreter_needed ? "Yes" : "No"}</div>
<div class="field"><strong>Ethnicity:</strong> ${formatLabel(s.client_ethnicity)}</div>
<div class="field"><strong>Marital Status:</strong> ${formatLabel(s.client_marital_status)}</div>
<div class="field"><strong>Client Phone:</strong> ${formatPhone(s.client_phone)}</div>
<div class="field"><strong>Client Email:</strong> ${s.client_email || "\u2014"}</div>
<div class="field"><strong>Consents to Referral:</strong> ${formatLabel(s.client_consents_to_referral)}</div>
</div>
<h2>Referral Source</h2>
<div class="grid">
<div class="field"><strong>Name:</strong> ${s.referral_source_name}</div>
<div class="field"><strong>Type:</strong> ${formatLabel(s.referral_source_type, SOURCE_TYPE_LABELS)}</div>
<div class="field"><strong>Organization:</strong> ${s.referral_source_organization || "\u2014"}</div>
<div class="field"><strong>Title:</strong> ${s.referral_source_title || "\u2014"}</div>
<div class="field"><strong>Email:</strong> ${s.referral_source_email}</div>
<div class="field"><strong>Phone:</strong> ${formatPhone(s.referral_source_phone)}</div>
<div class="field"><strong>Can Provide Collateral:</strong> ${formatLabel(s.can_provide_collateral)}</div>
<div class="field"><strong>Previous Referral:</strong> ${formatLabel(s.previous_monarch_referral)}</div>
<div class="field"><strong>Priority:</strong> ${s.is_priority_referral ? "HIGH" : "Standard"}</div>
<div class="field"><strong>Urgent Placement:</strong> ${s.urgent_placement ? "YES" : "No"}</div>
</div>
<h2>Legal / Court Information</h2>
<div class="grid">
<div class="field"><strong>Case Number:</strong> ${s.case_number || "\u2014"}</div>
<div class="field"><strong>Court Jurisdiction:</strong> ${s.court_jurisdiction || "\u2014"}</div>
<div class="field"><strong>Judge:</strong> ${s.judge_name || "\u2014"}</div>
<div class="field"><strong>Courtroom:</strong> ${s.courtroom || "\u2014"}</div>
<div class="field"><strong>Attorney:</strong> ${s.attorney_name || "\u2014"}</div>
<div class="field"><strong>Attorney Phone:</strong> ${formatPhone(s.attorney_phone)}</div>
<div class="field"><strong>Attorney Email:</strong> ${s.attorney_email || "\u2014"}</div>
<div class="field"><strong>Charges:</strong> ${s.charges || "\u2014"}</div>
<div class="field"><strong>Competency Status:</strong> ${formatLabel(s.competency_status, COMPETENCY_STATUS_LABELS)}</div>
<div class="field"><strong>Competency Eval Date:</strong> ${formatDate(s.competency_eval_date)}</div>
<div class="field"><strong>Evaluator:</strong> ${s.competency_evaluator || "\u2014"}</div>
<div class="field"><strong>Next Court Date:</strong> ${formatDate(s.next_court_date)}</div>
<div class="field"><strong>On Probation:</strong> ${s.on_probation ? "Yes" : "No"}</div>
${s.on_probation ? `<div class="field"><strong>PO Contact:</strong> ${s.probation_officer_contact || "\u2014"}</div>` : ""}
<div class="field"><strong>On Parole:</strong> ${s.on_parole ? "Yes" : "No"}</div>
${s.on_parole ? `<div class="field"><strong>Parole Contact:</strong> ${s.parole_officer_contact || "\u2014"}</div>` : ""}
<div class="field"><strong>Active Warrants:</strong> ${formatLabel(s.active_warrants)}</div>
<div class="field"><strong>Bond Holds:</strong> ${formatLabel(s.has_bond_holds)}</div>
${s.bond_holds_details ? `<div class="field"><strong>Bond Details:</strong> ${s.bond_holds_details}</div>` : ""}
<div class="field"><strong>PR Bond to Monarch:</strong> ${formatLabel(s.pr_bond_to_monarch)}</div>
</div>
<h2>Current Location / Facility</h2>
<div class="grid">
<div class="field"><strong>Location Type:</strong> ${formatLabel(s.current_location_type, LOCATION_LABELS)}</div>
<div class="field"><strong>Facility:</strong> ${s.facility_name || "\u2014"}</div>
<div class="field"><strong>Address:</strong> ${s.facility_address || "\u2014"}</div>
<div class="field"><strong>Inmate ID:</strong> ${s.inmate_id || "\u2014"}</div>
<div class="field"><strong>Contact Person:</strong> ${s.facility_contact_person || "\u2014"}</div>
<div class="field"><strong>Contact Phone:</strong> ${formatPhone(s.facility_contact_phone)}</div>
<div class="field"><strong>Currently Incarcerated:</strong> ${s.currently_incarcerated ? "Yes" : "No"}</div>
${s.expected_release_date ? `<div class="field"><strong>Expected Release:</strong> ${formatDate(s.expected_release_date)}</div>` : ""}
<div class="field"><strong>Prior Housing:</strong> ${formatLabel(s.housing_prior)}</div>
<div class="field"><strong>Post-Program Housing:</strong> ${formatLabel(s.housing_post_program)}</div>
${s.housing_notes ? `<div class="field"><strong>Housing Notes:</strong> ${s.housing_notes}</div>` : ""}
</div>
<h2>Emergency Contact</h2>
<div class="grid">
<div class="field"><strong>Name:</strong> ${s.emergency_contact_name || "\u2014"}</div>
<div class="field"><strong>Relationship:</strong> ${s.emergency_contact_relationship || "\u2014"}</div>
<div class="field"><strong>Phone:</strong> ${formatPhone(s.emergency_contact_phone)}</div>
<div class="field"><strong>Can Provide Info:</strong> ${s.emergency_contact_can_provide_info ? "Yes" : "No"}</div>
</div>
${Array.isArray(s.additional_contacts) && s.additional_contacts.length > 0 ? `<h2>Additional Contacts</h2>${s.additional_contacts.map((c: any, i: number) => `<div class="grid"><div class="field"><strong>Contact ${i+1}:</strong> ${c.name || "\u2014"}</div><div class="field"><strong>Org:</strong> ${c.organization || "\u2014"}</div><div class="field"><strong>Contact:</strong> ${c.phone_email || "\u2014"}</div><div class="field"><strong>Role:</strong> ${c.role || "\u2014"}</div></div>`).join("")}` : ""}
<h2>Risk Assessment</h2>
<div class="risk-grid">
<div class="risk ${s.violence_risk && s.violence_risk !== "no_history" ? "risk-yes" : "risk-no"}">Violence: ${formatLabel(s.violence_risk, RISK_TIMEFRAME_LABELS)}</div>
<div class="risk ${s.suicide_risk && s.suicide_risk !== "no_history" ? "risk-yes" : "risk-no"}">Suicide: ${formatLabel(s.suicide_risk, RISK_TIMEFRAME_LABELS)}</div>
<div class="risk ${s.elopement_risk && s.elopement_risk !== "no_history" ? "risk-yes" : "risk-no"}">Elopement: ${formatLabel(s.elopement_risk, RISK_TIMEFRAME_LABELS)}</div>
<div class="risk ${s.medical_needs ? "risk-yes" : "risk-no"}">Medical: ${s.medical_needs ? "YES" : "NO"}</div>
</div>
${s.violence_risk_details ? `<div class="field"><strong>Violence Details:</strong></div><div class="notes">${s.violence_risk_details}</div>` : ""}
${s.suicide_risk_details ? `<div class="field"><strong>Suicide Details:</strong></div><div class="notes">${s.suicide_risk_details}</div>` : ""}
${s.elopement_risk_details ? `<div class="field"><strong>Elopement Details:</strong></div><div class="notes">${s.elopement_risk_details}</div>` : ""}
<div class="grid">
<div class="field"><strong>Arson History:</strong> ${formatLabel(s.arson_history)}</div>
${s.arson_details ? `<div class="field"><strong>Arson Details:</strong> ${s.arson_details}</div>` : ""}
<div class="field"><strong>RSO Status:</strong> ${formatLabel(s.rso_status)}</div>
${s.rso_details ? `<div class="field"><strong>RSO Details:</strong> ${s.rso_details}</div>` : ""}
</div>
${s.safety_notes ? `<div class="field"><strong>Safety Notes:</strong></div><div class="notes">${s.safety_notes}</div>` : ""}
<h2>Clinical / Mental Health</h2>
<div class="field"><strong>Current Diagnoses:</strong></div><div class="notes">${s.current_diagnoses || "Not provided"}</div>
<div class="field" style="margin-top:12px"><strong>Medication Compliance:</strong> ${formatLabel(s.medication_compliance)}</div>
<div class="field" style="margin-top:12px"><strong>Current Medications:</strong></div><div class="notes">${formatMedications(s.current_medications)}</div>
${s.medication_barriers ? `<div class="field" style="margin-top:12px"><strong>Medication Barriers:</strong></div><div class="notes">${s.medication_barriers}</div>` : ""}
<div class="field" style="margin-top:12px"><strong>Psychiatric History:</strong></div><div class="notes">${s.psychiatric_history || "Not provided"}</div>
${s.previous_treatment_programs ? `<div class="field" style="margin-top:12px"><strong>Previous Treatment:</strong></div><div class="notes">${s.previous_treatment_programs}</div>` : ""}
<div class="grid" style="margin-top:12px">
<div class="field"><strong>TBI History:</strong> ${formatLabel(s.tbi_history)}</div>
${s.tbi_details ? `<div class="field"><strong>TBI Details:</strong> ${s.tbi_details}</div>` : ""}
<div class="field"><strong>IDD Status:</strong> ${formatLabel(s.idd_status)}</div>
${s.idd_details ? `<div class="field"><strong>IDD Details:</strong> ${s.idd_details}</div>` : ""}
</div>
<h2>Substance Use</h2>
<div class="grid">
<div class="field"><strong>Pattern:</strong> ${formatLabel(s.substance_use_pattern)}</div>
${s.substance_use_current ? `<div class="field"><strong>Current Use:</strong> ${s.substance_use_current}</div>` : ""}
<div class="field"><strong>Detox Required:</strong> ${formatLabel(s.detox_required)}</div>
${s.detox_details ? `<div class="field"><strong>Detox Details:</strong> ${s.detox_details}</div>` : ""}
</div>
<div class="field" style="margin-top:12px"><strong>Substance Use History:</strong></div><div class="notes">${s.substance_use_history || "Not provided"}</div>
<h2>Medical / Somatic</h2>
<div class="field"><strong>Medical Conditions:</strong></div><div class="notes">${s.medical_conditions || "Not provided"}</div>
<div class="grid" style="margin-top:12px">
<div class="field"><strong>Controlled by Meds:</strong> ${formatLabel(s.medical_conditions_controlled)}</div>
<div class="field"><strong>Mobility:</strong> ${formatLabel(s.mobility_needs)}</div>
<div class="field"><strong>ADL Support:</strong> ${s.adl_support_needed ? "Yes" : "No"}</div>
<div class="field"><strong>Med Allergies:</strong> ${s.medication_allergies || "\u2014"}</div>
</div>
${s.medications_non_psychiatric ? `<div class="field" style="margin-top:12px"><strong>Non-Psych Medications:</strong></div><div class="notes">${s.medications_non_psychiatric}</div>` : ""}
${s.acute_medical_needs ? `<div class="field" style="margin-top:12px"><strong>Acute Medical Needs:</strong></div><div class="notes">${s.acute_medical_needs}</div>` : ""}
<h2>Insurance / Benefits</h2>
<div class="grid">
<div class="field"><strong>Medicaid Status:</strong> ${formatLabel(s.medicaid_status)}</div>
<div class="field"><strong>Medicaid #:</strong> ${s.medicaid_number || s.medicaid_id || "\u2014"}</div>
<div class="field"><strong>Medicare Status:</strong> ${formatLabel(s.medicare_status)}</div>
<div class="field"><strong>Medicare #:</strong> ${s.medicare_number || "\u2014"}</div>
<div class="field"><strong>Private Insurance:</strong> ${s.has_private_insurance ? "Yes" : "No"}</div>
${s.private_insurance_details ? `<div class="field"><strong>Private Ins Details:</strong> ${s.private_insurance_details}</div>` : ""}
<div class="field"><strong>SSI/SSDI:</strong> ${formatLabel(s.ssdi_status)}</div>
${s.benefits_notes ? `<div class="field"><strong>Benefits Notes:</strong> ${s.benefits_notes}</div>` : ""}
</div>
<h2>Urgency</h2>
<div class="grid">
<div class="field"><strong>Urgency Level:</strong> ${formatLabel(s.urgency_level, URGENCY_LABELS)}</div>
${s.urgency_reason ? `<div class="field"><strong>Urgency Reason:</strong> ${s.urgency_reason}</div>` : ""}
<div class="field"><strong>Referral Channel:</strong> ${formatLabel(s.referral_source_channel)}</div>
</div>
${s.additional_notes ? `<h2>Additional Notes</h2><div class="notes">${s.additional_notes}</div>` : ""}
</body></html>`)
    w.document.close()
    setTimeout(() => w.print(), 500)
}

const exportSubmissionText = (s: ReferralSubmission) => {
    const lines = [
        "REFERRAL SUMMARY", "================",
        `Admin Ref: ${s.admin_ref_id || "\u2014"}`, `ID: ${s.id}`, `Referral Code: ${s.referral_code || "\u2014"}`,
        `Submitted: ${formatDate(s.created_at)}`, `Status: ${formatLabel(s.status)}`, "",
        "CLIENT INFORMATION", "------------------",
        `Name: ${s.client_first_name} ${s.client_middle_name || ""} ${s.client_last_name}`,
        `Aliases: ${s.client_preferred_name || "\u2014"}`,
        `DOB: ${formatDate(s.client_dob)}`, `Gender: ${formatLabel(s.client_gender, GENDER_LABELS)}`,
        `Sex at Birth: ${formatLabel(s.client_sex_at_birth)}`, `Pronouns: ${formatLabel(s.client_pronouns)}`,
        `SSN: ${maskSSN(s.client_ssn)}`, `Primary Language: ${s.client_primary_language || "\u2014"}`,
        `English Proficiency: ${formatLabel(s.client_english_proficiency)}`,
        `Interpreter Needed: ${s.interpreter_needed ? "Yes" : "No"}`,
        `Ethnicity: ${formatLabel(s.client_ethnicity)}`, `Marital Status: ${formatLabel(s.client_marital_status)}`,
        `Client Phone: ${formatPhone(s.client_phone)}`, `Client Email: ${s.client_email || "\u2014"}`,
        `Consents to Referral: ${formatLabel(s.client_consents_to_referral)}`, "",
        "REFERRAL SOURCE", "---------------",
        `Name: ${s.referral_source_name}`, `Type: ${formatLabel(s.referral_source_type, SOURCE_TYPE_LABELS)}`,
        `Organization: ${s.referral_source_organization || "\u2014"}`, `Title: ${s.referral_source_title || "\u2014"}`,
        `Email: ${s.referral_source_email}`, `Phone: ${formatPhone(s.referral_source_phone)}`,
        `Can Provide Collateral: ${formatLabel(s.can_provide_collateral)}`,
        `Previous Referral: ${formatLabel(s.previous_monarch_referral)}`,
        `Priority: ${s.is_priority_referral ? "HIGH" : "Standard"}`, `Urgent: ${s.urgent_placement ? "YES" : "No"}`, "",
        "CONTACTS", "--------",
        `Emergency: ${s.emergency_contact_name || "\u2014"} (${s.emergency_contact_relationship || "\u2014"}) ${formatPhone(s.emergency_contact_phone)}`,
        `EC Can Provide Info: ${s.emergency_contact_can_provide_info ? "Yes" : "No"}`,
        ...(Array.isArray(s.additional_contacts) ? s.additional_contacts.map((c: any, i: number) =>
            `Contact ${i+1}: ${c.name || ""} - ${c.organization || ""} - ${c.role || ""} - ${c.phone_email || ""}`) : []), "",
        "LEGAL / COURT", "-------------",
        `Case #: ${s.case_number || "\u2014"}`, `Court: ${s.court_jurisdiction || "\u2014"}`,
        `Judge: ${s.judge_name || "\u2014"}`, `Courtroom: ${s.courtroom || "\u2014"}`,
        `Attorney: ${s.attorney_name || "\u2014"}`, `Attorney Phone: ${formatPhone(s.attorney_phone)}`,
        `Attorney Email: ${s.attorney_email || "\u2014"}`,
        `Charges: ${s.charges || "\u2014"}`,
        `Competency Status: ${formatLabel(s.competency_status, COMPETENCY_STATUS_LABELS)}`,
        `Comp. Eval Date: ${formatDate(s.competency_eval_date)}`, `Evaluator: ${s.competency_evaluator || "\u2014"}`,
        `Next Court Date: ${formatDate(s.next_court_date)}`,
        `On Probation: ${s.on_probation ? "Yes" : "No"}`, ...(s.on_probation ? [`PO: ${s.probation_officer_contact || "\u2014"}`] : []),
        `On Parole: ${s.on_parole ? "Yes" : "No"}`, ...(s.on_parole ? [`Parole: ${s.parole_officer_contact || "\u2014"}`] : []),
        `Active Warrants: ${formatLabel(s.active_warrants)}`, `Bond Holds: ${formatLabel(s.has_bond_holds)}`,
        ...(s.bond_holds_details ? [`Bond Details: ${s.bond_holds_details}`] : []),
        `PR Bond to Monarch: ${formatLabel(s.pr_bond_to_monarch)}`, "",
        "LOCATION / FACILITY", "-------------------",
        `Type: ${formatLabel(s.current_location_type, LOCATION_LABELS)}`,
        `Facility: ${s.facility_name || "\u2014"}`, `Address: ${s.facility_address || "\u2014"}`,
        `Inmate ID: ${s.inmate_id || "\u2014"}`,
        `Contact: ${s.facility_contact_person || "\u2014"} ${formatPhone(s.facility_contact_phone)}`,
        `Incarcerated: ${s.currently_incarcerated ? "Yes" : "No"}`,
        ...(s.expected_release_date ? [`Expected Release: ${formatDate(s.expected_release_date)}`] : []),
        `Prior Housing: ${formatLabel(s.housing_prior)}`, `Post-Program Housing: ${formatLabel(s.housing_post_program)}`,
        ...(s.housing_notes ? [`Housing Notes: ${s.housing_notes}`] : []), "",
        "RISK ASSESSMENT", "---------------",
        `Violence Risk: ${formatLabel(s.violence_risk, RISK_TIMEFRAME_LABELS)}`,
        ...(s.violence_risk_details ? [`Violence Details: ${s.violence_risk_details}`] : []),
        `Suicide Risk: ${formatLabel(s.suicide_risk, RISK_TIMEFRAME_LABELS)}`,
        ...(s.suicide_risk_details ? [`Suicide Details: ${s.suicide_risk_details}`] : []),
        `Elopement Risk: ${formatLabel(s.elopement_risk, RISK_TIMEFRAME_LABELS)}`,
        ...(s.elopement_risk_details ? [`Elopement Details: ${s.elopement_risk_details}`] : []),
        `Arson: ${formatLabel(s.arson_history)}`, ...(s.arson_details ? [`Arson Details: ${s.arson_details}`] : []),
        `RSO: ${formatLabel(s.rso_status)}`, ...(s.rso_details ? [`RSO Details: ${s.rso_details}`] : []),
        `Medical Needs: ${s.medical_needs ? "YES" : "No"}`,
        `Safety Notes: ${s.safety_notes || "\u2014"}`, "",
        "CLINICAL / MENTAL HEALTH", "------------------------",
        `Diagnoses: ${s.current_diagnoses || "Not provided"}`,
        `Med Compliance: ${formatLabel(s.medication_compliance)}`,
        `Medications: ${formatMedications(s.current_medications)}`,
        ...(s.medication_barriers ? [`Med Barriers: ${s.medication_barriers}`] : []),
        `Psychiatric History: ${s.psychiatric_history || "Not provided"}`,
        ...(s.previous_treatment_programs ? [`Previous Treatment: ${s.previous_treatment_programs}`] : []),
        `TBI: ${formatLabel(s.tbi_history)}`, ...(s.tbi_details ? [`TBI Details: ${s.tbi_details}`] : []),
        `IDD: ${formatLabel(s.idd_status)}`, ...(s.idd_details ? [`IDD Details: ${s.idd_details}`] : []), "",
        "SUBSTANCE USE", "-------------",
        `Pattern: ${formatLabel(s.substance_use_pattern)}`,
        ...(s.substance_use_current ? [`Current Use: ${s.substance_use_current}`] : []),
        `History: ${s.substance_use_history || "Not provided"}`,
        `Detox Required: ${formatLabel(s.detox_required)}`,
        ...(s.detox_details ? [`Detox Details: ${s.detox_details}`] : []), "",
        "MEDICAL / SOMATIC", "-----------------",
        `Medical Conditions: ${s.medical_conditions || "Not provided"}`,
        `Controlled by Meds: ${formatLabel(s.medical_conditions_controlled)}`,
        ...(s.medications_non_psychiatric ? [`Non-Psych Meds: ${s.medications_non_psychiatric}`] : []),
        `Med Allergies: ${s.medication_allergies || "\u2014"}`,
        `Mobility: ${formatLabel(s.mobility_needs)}`,
        `ADL Support: ${s.adl_support_needed ? "Yes" : "No"}`,
        ...(s.adl_support_details ? [`ADL Details: ${s.adl_support_details}`] : []),
        ...(s.acute_medical_needs ? [`Acute Needs: ${s.acute_medical_needs}`] : []), "",
        "INSURANCE / BENEFITS", "--------------------",
        `Medicaid: ${formatLabel(s.medicaid_status)}`, `Medicaid #: ${s.medicaid_number || s.medicaid_id || "\u2014"}`,
        `Medicare: ${formatLabel(s.medicare_status)}`, `Medicare #: ${s.medicare_number || "\u2014"}`,
        `Private Insurance: ${s.has_private_insurance ? "Yes" : "No"}`,
        ...(s.private_insurance_details ? [`Private Ins: ${s.private_insurance_details}`] : []),
        `SSI/SSDI: ${formatLabel(s.ssdi_status)}`,
        ...(s.benefits_notes ? [`Benefits Notes: ${s.benefits_notes}`] : []), "",
        "URGENCY", "-------",
        `Urgency Level: ${formatLabel(s.urgency_level, URGENCY_LABELS)}`,
        ...(s.urgency_reason ? [`Reason: ${s.urgency_reason}`] : []),
        `Referral Channel: ${formatLabel(s.referral_source_channel)}`, "",
        "NOTES", "-----", s.additional_notes || "None",
    ]
    downloadFile(lines.join("\n"), `referral_${s.client_last_name}_${s.client_first_name}.txt`, "text/plain")
}

// ============================================================================
// BADGE COMPONENTS
// ============================================================================

const PriorityBadge = ({ isPriority }: { isPriority: boolean }) => (
    <span style={{
        background: isPriority ? COLORS.tangerine : COLORS.coconut,
        color: isPriority ? COLORS.ash : COLORS.ashMuted,
        padding: "3px 10px", borderRadius: RADIUS.pill, fontSize: "11px",
        fontWeight: 600, fontFamily: FONT, textTransform: "uppercase", letterSpacing: "0.04em",
        whiteSpace: "nowrap" as const,
    }}>
        {isPriority ? "High" : "Standard"}
    </span>
)

const UrgentBadge = ({ urgent }: { urgent: boolean }) => {
    if (!urgent) return null
    return (
        <span style={{
            background: COLORS.tangerine, color: COLORS.white, padding: "3px 10px",
            borderRadius: RADIUS.pill, fontSize: "11px", fontWeight: 600, fontFamily: FONT,
            textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap" as const,
        }}>
            Urgent
        </span>
    )
}

const TypeBadge = ({ type }: { type: string }) => (
    <span style={{
        background: COLORS.moonstoneLight, color: COLORS.gunmetal, padding: "3px 10px",
        borderRadius: RADIUS.pill, fontSize: "11px", fontWeight: 600, fontFamily: FONT,
        whiteSpace: "nowrap" as const,
    }}>
        {SOURCE_TYPE_LABELS[type] || formatLabel(type)}
    </span>
)

const StatusBadge = ({ status }: { status: string }) => {
    const s = (status || "pending_review") as ReferralStatus
    const colors = statusColors[s] || statusColors.pending_review
    return (
        <span style={{
            background: colors.bg, color: colors.text, padding: "3px 10px",
            borderRadius: RADIUS.pill, fontSize: "11px", fontWeight: 600, fontFamily: FONT,
            whiteSpace: "nowrap" as const,
        }}>
            {formatLabel(s)}
        </span>
    )
}

const RiskIndicator = ({ label, active, value }: { label: string; active?: boolean; value?: string }) => {
    // Support both boolean (medical_needs) and text enum (risk timeframes)
    const isActive = active !== undefined ? active : (value ? value !== "no_history" && value !== "" : false)
    const displayValue = value ? formatLabel(value, RISK_TIMEFRAME_LABELS) : (isActive ? "YES" : "NO")
    return (
        <div style={{
            padding: "14px", borderRadius: RADIUS.section, textAlign: "center",
            background: isActive ? COLORS.tangerineLight : COLORS.coconut,
            border: isActive ? `2px solid ${COLORS.tangerine}` : `1px solid ${COLORS.ashSubtle}`,
        }}>
            <div style={{
                fontSize: "11px", fontWeight: 600, fontFamily: FONT, textTransform: "uppercase",
                letterSpacing: "0.04em", marginBottom: "4px",
                color: isActive ? COLORS.redText : COLORS.ashMuted,
            }}>
                {label}
            </div>
            <div style={{
                fontSize: value ? "12px" : "16px", fontWeight: 700, fontFamily: FONT,
                color: isActive ? COLORS.redText : COLORS.ashMuted,
            }}>
                {displayValue}
            </div>
        </div>
    )
}

const ActionButton = ({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) => (
    <button onClick={onClick} title={title} style={{
        ...pillBtnBase, background: COLORS.coconut, color: COLORS.ash, padding: "6px 12px",
        fontSize: "13px", border: `1px solid ${COLORS.ashSubtle}`,
    }}>
        {children}
    </button>
)

// ============================================================================
// HEADER CELL
// ============================================================================

const HeaderCell = ({ column, label, sortColumn, sortDirection, onSort, sortable = true }: {
    column: string; label: string; sortColumn: string; sortDirection: "asc" | "desc"
    onSort: (col: string) => void; sortable?: boolean
}) => (
    <div style={{
        padding: "14px 12px", cursor: sortable ? "pointer" : "default",
        display: "flex", alignItems: "center", gap: "4px", userSelect: "none",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const,
    }} onClick={() => sortable && onSort(column)}>
        {label}
        {sortable && sortColumn === column && (
            <span style={{ color: COLORS.moonstone, fontSize: "12px", fontWeight: 700 }}>
                {sortDirection === "asc" ? "\u2191" : "\u2193"}
            </span>
        )}
    </div>
)

// ============================================================================
// TAB BAR
// ============================================================================

const TabBar = ({ activeTab, onTabChange, submissionCount, inquiryCount }: {
    activeTab: TabId; onTabChange: (tab: TabId) => void; submissionCount: number; inquiryCount: number
}) => (
    <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
        {([
            { id: "submissions" as TabId, label: "Referral Submissions", count: submissionCount },
            { id: "inquiries" as TabId, label: "Inquiries", count: inquiryCount },
        ]).map((tab) => (
            <button key={tab.id} onClick={() => onTabChange(tab.id)} style={{
                ...pillBtnBase, padding: "10px 28px", fontSize: "13px",
                background: activeTab === tab.id ? COLORS.moonstone : "transparent",
                color: activeTab === tab.id ? COLORS.white : COLORS.ashMuted,
                border: activeTab === tab.id ? "none" : `1px solid ${COLORS.ashSubtle}`,
            }}>
                {tab.label}
                <span style={{
                    marginLeft: "8px", padding: "2px 10px", borderRadius: RADIUS.pill,
                    fontSize: "11px", fontWeight: 700,
                    background: activeTab === tab.id ? "rgba(255,255,255,0.25)" : COLORS.coconut,
                }}>
                    {tab.count}
                </span>
            </button>
        ))}
    </div>
)

// ============================================================================
// STATUS DROPDOWN
// ============================================================================

const StatusDropdown = ({ currentStatus, onUpdate, disabled }: {
    currentStatus: string; onUpdate: (s: ReferralStatus) => void; disabled?: boolean
}) => (
    <select value={currentStatus || "pending_review"} disabled={disabled}
        onChange={(e) => onUpdate(e.target.value as ReferralStatus)}
        style={{ ...selectStyle, fontSize: "11px", padding: "4px 30px 4px 12px", opacity: disabled ? 0.6 : 1 }}>
        {STATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
)

// ============================================================================
// MODAL HELPERS
// ============================================================================

const ModalSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: "24px" }}>
        <h3 style={{ margin: "0 0 14px 0", fontSize: "16px", fontWeight: 600, fontFamily: FONT, color: COLORS.ash, letterSpacing: "-0.02em" }}>
            {title}
        </h3>
        <div style={sectionCardStyle}>{children}</div>
    </div>
)

const DetailField = ({ label, value, fullWidth }: { label: string; value: React.ReactNode; fullWidth?: boolean }) => (
    <div style={{ gridColumn: fullWidth ? "1 / -1" : undefined, marginBottom: "8px" }}>
        <div style={{ fontSize: "11px", fontWeight: 600, fontFamily: FONT, color: COLORS.ashMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px" }}>
            {label}
        </div>
        <div style={{ fontSize: "14px", fontWeight: 400, fontFamily: FONT, color: COLORS.ash }}>
            {value || "\u2014"}
        </div>
    </div>
)

const DetailGrid = ({ children }: { children: React.ReactNode }) => (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 28px" }}>{children}</div>
)

const NotesBlock = ({ text }: { text: string | null | undefined }) => (
    <div style={{
        background: COLORS.white, padding: "14px 18px", borderRadius: RADIUS.small, fontSize: "13px",
        fontFamily: FONT, color: COLORS.ash, whiteSpace: "pre-wrap", lineHeight: "1.6",
        border: `1px solid ${COLORS.ashSubtle}`,
    }}>
        {text || "Not provided"}
    </div>
)

// ============================================================================
// SUBMISSION DETAIL MODAL
// ============================================================================

const SubmissionDetailModal = ({ referral, onClose, onStatusUpdate, updatingStatus, onArchive }: {
    referral: ReferralSubmission; onClose: () => void
    onStatusUpdate: (id: string, status: ReferralStatus, table: string) => void; updatingStatus: string | null
    onArchive?: (ids: string[], table: string, action: "archive" | "unarchive") => void
}) => {
    const [showAudit, setShowAudit] = useState(false)
    return (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: COLORS.overlay, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px", backdropFilter: "blur(8px)" }}
            onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div style={{ background: COLORS.white, borderRadius: RADIUS.modal, maxWidth: "960px", width: "100%", maxHeight: "90vh", overflow: "auto", boxShadow: SHADOWS.modal }}>
                {/* Header */}
                <div style={{ padding: "28px 40px", background: COLORS.gunmetal, borderTopLeftRadius: RADIUS.modal, borderTopRightRadius: RADIUS.modal, display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "sticky", top: 0, zIndex: 1 }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 700, fontFamily: FONT, color: COLORS.white, letterSpacing: "-0.02em" }}>
                            {referral.client_first_name} {referral.client_last_name}
                        </h2>
                        <p style={{ margin: "6px 0 0", fontSize: "13px", fontFamily: FONT, color: "rgba(255,255,255,0.6)" }}>
                            {referral.admin_ref_id || `ID: ${referral.id.substring(0, 8)}...`} &nbsp;|&nbsp; {referral.referral_code && <span style={{ fontFamily: "monospace", letterSpacing: "0.05em" }}>{referral.referral_code}</span>} &nbsp;|&nbsp; {formatDate(referral.created_at)}
                        </p>
                        <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
                            <PriorityBadge isPriority={referral.is_priority_referral} />
                            <UrgentBadge urgent={referral.urgent_placement} />
                            <StatusBadge status={referral.status} />
                            {Array.isArray(referral.uploaded_documents) && referral.uploaded_documents.length > 0 && (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: RADIUS.pill, fontSize: "11px", fontWeight: 600, fontFamily: FONT, background: COLORS.moonstoneLight, color: COLORS.moonstone }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                                    {referral.uploaded_documents.length}
                                </span>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} style={{ ...pillBtnBase, background: "rgba(255,255,255,0.15)", color: COLORS.white, padding: "8px 16px", fontSize: "16px" }}>{"\u2715"}</button>
                </div>

                {/* Content */}
                <div style={{ padding: "32px 40px" }}>
                    <ModalSection title="Client Demographics">
                        <DetailGrid>
                            <DetailField label="Full Name" value={`${referral.client_first_name} ${referral.client_middle_name || ""} ${referral.client_last_name}`} />
                            <DetailField label="Aliases" value={referral.client_preferred_name} />
                            <DetailField label="Date of Birth" value={formatDate(referral.client_dob)} />
                            <DetailField label="Gender" value={formatLabel(referral.client_gender, GENDER_LABELS)} />
                            <DetailField label="Sex at Birth" value={formatLabel(referral.client_sex_at_birth)} />
                            <DetailField label="Pronouns" value={formatLabel(referral.client_pronouns)} />
                            <DetailField label="SSN" value={maskSSN(referral.client_ssn)} />
                            <DetailField label="Primary Language" value={referral.client_primary_language} />
                            <DetailField label="English Proficiency" value={formatLabel(referral.client_english_proficiency)} />
                            <DetailField label="Interpreter Needed" value={referral.interpreter_needed ? "Yes" : "No"} />
                            <DetailField label="Ethnicity" value={formatLabel(referral.client_ethnicity)} />
                            <DetailField label="Marital Status" value={formatLabel(referral.client_marital_status)} />
                            <DetailField label="Client Phone" value={formatPhone(referral.client_phone)} />
                            <DetailField label="Client Email" value={referral.client_email} />
                            <DetailField label="Consents to Referral" value={formatLabel(referral.client_consents_to_referral)} />
                        </DetailGrid>
                    </ModalSection>

                    <ModalSection title="Referral Source">
                        <DetailGrid>
                            <DetailField label="Name" value={referral.referral_source_name} />
                            <DetailField label="Type" value={<TypeBadge type={referral.referral_source_type} />} />
                            <DetailField label="Organization" value={referral.referral_source_organization} />
                            <DetailField label="Title" value={referral.referral_source_title} />
                            <DetailField label="Email" value={referral.referral_source_email} />
                            <DetailField label="Phone" value={formatPhone(referral.referral_source_phone)} />
                            <DetailField label="Can Provide Collateral" value={formatLabel(referral.can_provide_collateral)} />
                            <DetailField label="Previous Referral" value={formatLabel(referral.previous_monarch_referral)} />
                        </DetailGrid>
                    </ModalSection>

                    <ModalSection title="Contacts">
                        <DetailGrid>
                            <DetailField label="Emergency Contact" value={referral.emergency_contact_name} />
                            <DetailField label="Relationship" value={referral.emergency_contact_relationship} />
                            <DetailField label="EC Phone" value={formatPhone(referral.emergency_contact_phone)} />
                            <DetailField label="EC Can Provide Info" value={referral.emergency_contact_can_provide_info ? "Yes" : "No"} />
                        </DetailGrid>
                        {Array.isArray(referral.additional_contacts) && referral.additional_contacts.length > 0 && (
                            <div style={{ marginTop: "12px" }}>
                                <DetailField label={`Additional Contacts (${referral.additional_contacts.length})`} value="" fullWidth />
                                {referral.additional_contacts.map((c: any, i: number) => (
                                    <div key={i} style={{ background: COLORS.white, padding: "8px 12px", borderRadius: RADIUS.small, marginBottom: "4px", fontSize: "13px", fontFamily: FONT }}>
                                        <strong>{c.name || "—"}</strong> — {c.organization || ""} ({c.role || "—"}) — {c.phone_email || "—"} {c.can_provide_info ? "✓ collateral" : ""}
                                    </div>
                                ))}
                            </div>
                        )}
                    </ModalSection>

                    {(Array.isArray(referral.documents_available) && referral.documents_available.length > 0 || referral.documents_notes || (Array.isArray(referral.uploaded_documents) && referral.uploaded_documents.length > 0)) && (
                        <ModalSection title="Documents">
                            {Array.isArray(referral.documents_available) && referral.documents_available.length > 0 && (
                                <DetailField label="Available Documents" value={referral.documents_available.map((d: string) => formatLabel(d)).join(", ")} fullWidth />
                            )}
                            {referral.documents_notes && <div style={{ marginTop: "8px" }}><DetailField label="Document Notes" value="" fullWidth /><NotesBlock text={referral.documents_notes} /></div>}
                            {Array.isArray(referral.uploaded_documents) && referral.uploaded_documents.length > 0 && (
                                <div style={{ marginTop: "8px" }}>
                                    <DetailField label={`Uploaded Files (${referral.uploaded_documents.length})`} value="" fullWidth />
                                    {referral.uploaded_documents.map((doc: any, i: number) => (
                                        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "13px", fontFamily: FONT, padding: "6px 8px", backgroundColor: i % 2 === 0 ? COLORS.white : COLORS.coconut, borderRadius: RADIUS.small, marginBottom: "2px" }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                {doc.document_type && doc.document_type !== "other" && (
                                                    <span style={{ display: "inline-block", padding: "2px 8px", backgroundColor: COLORS.moonstoneLight, color: COLORS.moonstone, fontSize: "11px", fontWeight: 600, borderRadius: RADIUS.pill, marginRight: "8px", letterSpacing: "0.02em" }}>
                                                        {formatLabel(doc.document_type)}
                                                    </span>
                                                )}
                                                <span style={{ fontWeight: 500 }}>{doc.filename}</span>
                                                <span style={{ color: COLORS.ashMuted, marginLeft: "6px" }}>({Math.round((doc.file_size || 0) / 1024)} KB)</span>
                                                <span style={{ color: COLORS.ashMuted, marginLeft: "6px" }}>— {formatDate(doc.uploaded_at)}</span>
                                            </div>
                                            {doc.storage_path && (
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            const { data, error } = await supabase.storage.from("referral-documents").createSignedUrl(doc.storage_path, 60)
                                                            if (error || !data?.signedUrl) { alert("Could not generate download link. Please try again."); return }
                                                            const a = document.createElement("a")
                                                            a.href = data.signedUrl
                                                            a.download = doc.filename || "download"
                                                            a.target = "_blank"
                                                            a.rel = "noopener noreferrer"
                                                            document.body.appendChild(a)
                                                            a.click()
                                                            document.body.removeChild(a)
                                                        } catch (_e) { alert("Download failed. Please try again.") }
                                                    }}
                                                    title={`Download ${doc.filename}`}
                                                    style={{ background: "none", border: `1px solid ${COLORS.ashSubtle}`, borderRadius: RADIUS.small, padding: "4px 8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontFamily: FONT, fontWeight: 500, color: COLORS.ash, marginLeft: "8px", flexShrink: 0, transition: "all 0.15s ease" }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = COLORS.moonstone; e.currentTarget.style.color = COLORS.moonstone }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = COLORS.ashSubtle; e.currentTarget.style.color = COLORS.ash }}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ModalSection>
                    )}

                    <ModalSection title="Legal / Court Information">
                        <DetailGrid>
                            <DetailField label="Case Number" value={referral.case_number} />
                            <DetailField label="Court Jurisdiction" value={referral.court_jurisdiction} />
                            <DetailField label="Judge" value={referral.judge_name} />
                            <DetailField label="Courtroom" value={referral.courtroom} />
                            <DetailField label="Attorney" value={referral.attorney_name} />
                            <DetailField label="Attorney Phone" value={formatPhone(referral.attorney_phone)} />
                            <DetailField label="Attorney Email" value={referral.attorney_email} />
                            <DetailField label="Charges" value={referral.charges} fullWidth />
                            <DetailField label="Competency Status" value={formatLabel(referral.competency_status, COMPETENCY_STATUS_LABELS)} />
                            <DetailField label="Competency Eval Date" value={formatDate(referral.competency_eval_date)} />
                            <DetailField label="Evaluator" value={referral.competency_evaluator} />
                            <DetailField label="Next Court Date" value={formatDate(referral.next_court_date)} />
                        </DetailGrid>
                        {(referral.on_probation || referral.on_parole || referral.active_warrants || referral.has_bond_holds || referral.pr_bond_to_monarch) && (
                            <div style={{ marginTop: "12px" }}>
                                <DetailGrid>
                                    <DetailField label="On Probation" value={referral.on_probation ? "Yes" : "No"} />
                                    {referral.on_probation && <DetailField label="PO Contact" value={referral.probation_officer_contact} />}
                                    <DetailField label="On Parole" value={referral.on_parole ? "Yes" : "No"} />
                                    {referral.on_parole && <DetailField label="Parole Contact" value={referral.parole_officer_contact} />}
                                    <DetailField label="Active Warrants" value={formatLabel(referral.active_warrants)} />
                                    <DetailField label="Bond Holds" value={formatLabel(referral.has_bond_holds)} />
                                    {referral.bond_holds_details && <DetailField label="Bond Details" value={referral.bond_holds_details} fullWidth />}
                                    <DetailField label="PR Bond to Monarch" value={formatLabel(referral.pr_bond_to_monarch)} />
                                </DetailGrid>
                            </div>
                        )}
                    </ModalSection>

                    <ModalSection title="Current Location / Facility">
                        <DetailGrid>
                            <DetailField label="Location Type" value={formatLabel(referral.current_location_type, LOCATION_LABELS)} />
                            <DetailField label="Facility Name" value={referral.facility_name} />
                            <DetailField label="Address" value={referral.facility_address} />
                            <DetailField label="Inmate ID" value={referral.inmate_id} />
                            <DetailField label="Contact Person" value={referral.facility_contact_person} />
                            <DetailField label="Contact Phone" value={formatPhone(referral.facility_contact_phone)} />
                            <DetailField label="Currently Incarcerated" value={referral.currently_incarcerated ? "Yes" : "No"} />
                            {referral.expected_release_date && <DetailField label="Expected Release" value={formatDate(referral.expected_release_date)} />}
                            <DetailField label="Prior Housing" value={formatLabel(referral.housing_prior)} />
                            <DetailField label="Post-Program Housing" value={formatLabel(referral.housing_post_program)} />
                        </DetailGrid>
                        {referral.housing_notes && <div style={{ marginTop: "8px" }}><DetailField label="Housing Notes" value="" fullWidth /><NotesBlock text={referral.housing_notes} /></div>}
                    </ModalSection>

                    <ModalSection title="Risk Assessment">
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "12px" }}>
                            <RiskIndicator label="Violence" value={referral.violence_risk} />
                            <RiskIndicator label="Suicide" value={referral.suicide_risk} />
                            <RiskIndicator label="Elopement" value={referral.elopement_risk} />
                            <RiskIndicator label="Medical" active={referral.medical_needs} />
                        </div>
                        {referral.violence_risk_details && <div style={{ marginBottom: "8px" }}><DetailField label="Violence Details" value="" fullWidth /><NotesBlock text={referral.violence_risk_details} /></div>}
                        {referral.suicide_risk_details && <div style={{ marginBottom: "8px" }}><DetailField label="Suicide Details" value="" fullWidth /><NotesBlock text={referral.suicide_risk_details} /></div>}
                        {referral.elopement_risk_details && <div style={{ marginBottom: "8px" }}><DetailField label="Elopement Details" value="" fullWidth /><NotesBlock text={referral.elopement_risk_details} /></div>}
                        <DetailGrid>
                            <DetailField label="Arson History" value={formatLabel(referral.arson_history)} />
                            {referral.arson_details && <DetailField label="Arson Details" value={referral.arson_details} />}
                            <DetailField label="RSO Status" value={formatLabel(referral.rso_status)} />
                            {referral.rso_details && <DetailField label="RSO Details" value={referral.rso_details} />}
                        </DetailGrid>
                        {referral.safety_notes && (
                            <div style={{ marginTop: "12px" }}>
                                <DetailField label="Safety Notes" value="" fullWidth />
                                <NotesBlock text={referral.safety_notes} />
                            </div>
                        )}
                    </ModalSection>

                    <ModalSection title="Mental Health & Clinical">
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div><DetailField label="Current Diagnoses" value="" fullWidth /><NotesBlock text={referral.current_diagnoses} /></div>
                            <DetailGrid>
                                <DetailField label="Medication Compliance" value={formatLabel(referral.medication_compliance)} />
                            </DetailGrid>
                            <div><DetailField label="Current Medications" value="" fullWidth /><NotesBlock text={formatMedications(referral.current_medications)} /></div>
                            {referral.medication_barriers && <div><DetailField label="Medication Barriers" value="" fullWidth /><NotesBlock text={referral.medication_barriers} /></div>}
                            <div><DetailField label="Psychiatric History" value="" fullWidth /><NotesBlock text={referral.psychiatric_history} /></div>
                            {referral.previous_treatment_programs && <div><DetailField label="Previous Treatment Programs" value="" fullWidth /><NotesBlock text={referral.previous_treatment_programs} /></div>}
                            <DetailGrid>
                                <DetailField label="TBI History" value={formatLabel(referral.tbi_history)} />
                                {referral.tbi_details && <DetailField label="TBI Details" value={referral.tbi_details} />}
                                <DetailField label="IDD Status" value={formatLabel(referral.idd_status)} />
                                {referral.idd_details && <DetailField label="IDD Details" value={referral.idd_details} />}
                            </DetailGrid>
                        </div>
                    </ModalSection>

                    <ModalSection title="Substance Use">
                        <DetailGrid>
                            <DetailField label="Pattern" value={formatLabel(referral.substance_use_pattern)} />
                            <DetailField label="Detox Required" value={formatLabel(referral.detox_required)} />
                        </DetailGrid>
                        {referral.substance_use_current && <div style={{ marginTop: "8px" }}><DetailField label="Current Use (90 days)" value="" fullWidth /><NotesBlock text={referral.substance_use_current} /></div>}
                        {referral.substance_use_history && <div style={{ marginTop: "8px" }}><DetailField label="Substance Use History" value="" fullWidth /><NotesBlock text={referral.substance_use_history} /></div>}
                        {referral.detox_details && <div style={{ marginTop: "8px" }}><DetailField label="Detox Details" value="" fullWidth /><NotesBlock text={referral.detox_details} /></div>}
                    </ModalSection>

                    <ModalSection title="Medical / Somatic">
                        <div><DetailField label="Medical Conditions" value="" fullWidth /><NotesBlock text={referral.medical_conditions} /></div>
                        <DetailGrid>
                            <DetailField label="Controlled by Meds" value={formatLabel(referral.medical_conditions_controlled)} />
                            <DetailField label="Mobility" value={formatLabel(referral.mobility_needs)} />
                            <DetailField label="ADL Support" value={referral.adl_support_needed ? "Yes" : "No"} />
                            <DetailField label="Med Allergies" value={referral.medication_allergies} />
                        </DetailGrid>
                        {referral.medications_non_psychiatric && <div style={{ marginTop: "8px" }}><DetailField label="Non-Psych Medications" value="" fullWidth /><NotesBlock text={referral.medications_non_psychiatric} /></div>}
                        {referral.adl_support_details && <div style={{ marginTop: "8px" }}><DetailField label="ADL Details" value="" fullWidth /><NotesBlock text={referral.adl_support_details} /></div>}
                        {referral.acute_medical_needs && <div style={{ marginTop: "8px" }}><DetailField label="Acute Medical Needs" value="" fullWidth /><NotesBlock text={referral.acute_medical_needs} /></div>}
                    </ModalSection>

                    <ModalSection title="Insurance / Benefits">
                        <DetailGrid>
                            <DetailField label="Medicaid Status" value={formatLabel(referral.medicaid_status)} />
                            <DetailField label="Medicaid #" value={referral.medicaid_number || referral.medicaid_id} />
                            <DetailField label="Medicare Status" value={formatLabel(referral.medicare_status)} />
                            <DetailField label="Medicare #" value={referral.medicare_number} />
                            <DetailField label="Private Insurance" value={referral.has_private_insurance ? "Yes" : "No"} />
                            {referral.private_insurance_details && <DetailField label="Private Ins Details" value={referral.private_insurance_details} />}
                            <DetailField label="SSI/SSDI" value={formatLabel(referral.ssdi_status)} />
                        </DetailGrid>
                        {referral.benefits_notes && <div style={{ marginTop: "8px" }}><DetailField label="Benefits Notes" value="" fullWidth /><NotesBlock text={referral.benefits_notes} /></div>}
                    </ModalSection>

                    <ModalSection title="Urgency & Notes">
                        <DetailGrid>
                            <DetailField label="Urgency Level" value={formatLabel(referral.urgency_level, URGENCY_LABELS)} />
                            <DetailField label="Referral Channel" value={formatLabel(referral.referral_source_channel)} />
                        </DetailGrid>
                        {referral.urgency_reason && <div style={{ marginTop: "8px" }}><DetailField label="Urgency Reason" value="" fullWidth /><NotesBlock text={referral.urgency_reason} /></div>}
                        {referral.additional_notes && <div style={{ marginTop: "8px" }}><DetailField label="Additional Notes" value="" fullWidth /><NotesBlock text={referral.additional_notes} /></div>}
                    </ModalSection>

                    <ModalSection title="Review History">
                        <DetailGrid>
                            <DetailField label="Reviewed By" value={referral.reviewed_by || "Not yet reviewed"} />
                            <DetailField label="Reviewed At" value={formatDate(referral.reviewed_at)} />
                            <DetailField label="Review Notes" value={referral.review_notes} fullWidth />
                        </DetailGrid>
                    </ModalSection>

                    <div style={{ marginBottom: "24px" }}>
                        <button onClick={() => setShowAudit(!showAudit)} style={{ ...pillBtnBase, background: "transparent", color: COLORS.ashMuted, padding: "8px 0", fontSize: "13px", fontWeight: 500 }}>
                            {showAudit ? "\u25BC" : "\u25B6"} Audit Trail
                        </button>
                        {showAudit && (
                            <div style={{ ...sectionCardStyle, marginTop: "8px" }}>
                                <DetailGrid>
                                    <DetailField label="IP Address" value={referral.ip_address} />
                                    <DetailField label="User Agent" value={referral.user_agent} />
                                    <DetailField label="Form Completion" value={`${referral.form_completion_percentage || 0}%`} />
                                    <DetailField label="Time Spent" value={referral.time_spent_seconds ? `${Math.round(referral.time_spent_seconds / 60)} min` : "\u2014"} />
                                    <DetailField label="Session ID" value={referral.session_id} />
                                    <DetailField label="Last Auto Save" value={formatDate(referral.last_auto_save)} />
                                </DetailGrid>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div style={{ padding: "20px 40px", borderTop: `1px solid ${COLORS.ashSubtle}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: COLORS.coconut, borderBottomLeftRadius: RADIUS.modal, borderBottomRightRadius: RADIUS.modal, position: "sticky", bottom: 0 }}>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <span style={{ fontSize: "12px", fontFamily: FONT, color: COLORS.ashMuted, fontWeight: 500 }}>Status:</span>
                        <StatusDropdown currentStatus={referral.status} onUpdate={(status) => onStatusUpdate(referral.id, status, "referral_submissions")} disabled={updatingStatus === referral.id} />
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                        {onArchive && (
                            <button onClick={() => { onArchive([referral.id], "referral_submissions", referral.archived_at ? "unarchive" : "archive"); onClose() }}
                                style={{ ...pillBtnBase, background: referral.archived_at ? COLORS.green : COLORS.champagne, color: referral.archived_at ? COLORS.greenText : COLORS.ash, padding: "10px 24px" }}>
                                {referral.archived_at ? "Unarchive" : "Archive"}
                            </button>
                        )}
                        <button onClick={() => exportSubmissionPDF(referral)} style={{ ...pillBtnBase, background: COLORS.moonstone, color: COLORS.white, padding: "10px 24px" }}>Print / PDF</button>
                        <button onClick={() => exportSubmissionText(referral)} style={{ ...pillBtnBase, background: "transparent", color: COLORS.ash, padding: "10px 24px", border: `1px solid ${COLORS.ashSubtle}` }}>Export Text</button>
                        <button onClick={onClose} style={{ ...pillBtnBase, background: COLORS.ash, color: COLORS.white, padding: "10px 24px" }}>Close</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ============================================================================
// INQUIRY DETAIL MODAL
// ============================================================================

const InquiryDetailModal = ({ inquiry, onClose, onStatusUpdate, updatingStatus, onArchive }: {
    inquiry: ReferralInquiry; onClose: () => void
    onStatusUpdate: (id: string, status: ReferralStatus, table: string) => void; updatingStatus: string | null
    onArchive?: (ids: string[], table: string, action: "archive" | "unarchive") => void
}) => (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: COLORS.overlay, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px", backdropFilter: "blur(8px)" }}
        onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div style={{ background: COLORS.white, borderRadius: RADIUS.modal, maxWidth: "720px", width: "100%", maxHeight: "90vh", overflow: "auto", boxShadow: SHADOWS.modal }}>
            <div style={{ padding: "28px 40px", background: COLORS.gunmetal, borderTopLeftRadius: RADIUS.modal, borderTopRightRadius: RADIUS.modal, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 700, fontFamily: FONT, color: COLORS.white, letterSpacing: "-0.02em" }}>
                        {inquiry.referral_source_name}
                    </h2>
                    <p style={{ margin: "6px 0 0", fontSize: "13px", fontFamily: FONT, color: "rgba(255,255,255,0.6)" }}>
                        Inquiry &nbsp;|&nbsp; ID: {inquiry.id.substring(0, 8)}... &nbsp;|&nbsp; {formatDate(inquiry.created_at)}
                    </p>
                    <div style={{ marginTop: "12px" }}><StatusBadge status={inquiry.status} /></div>
                </div>
                <button onClick={onClose} style={{ ...pillBtnBase, background: "rgba(255,255,255,0.15)", color: COLORS.white, padding: "8px 16px", fontSize: "16px" }}>{"\u2715"}</button>
            </div>

            <div style={{ padding: "32px 40px" }}>
                <ModalSection title="Contact Information">
                    <DetailGrid>
                        <DetailField label="Name" value={inquiry.referral_source_name} />
                        <DetailField label="Inquiry Type" value={formatLabel(inquiry.inquiry_type)} />
                        <DetailField label="Email" value={inquiry.referral_source_email} />
                        <DetailField label="Phone" value={formatPhone(inquiry.referral_source_phone)} />
                        <DetailField label="Relationship" value={formatLabel(inquiry.referral_source_relationship)} />
                        <DetailField label="Organization" value={inquiry.referral_source_organization} />
                        <DetailField label="Title" value={inquiry.referral_source_title} />
                    </DetailGrid>
                </ModalSection>

                <ModalSection title="Client Information">
                    <DetailGrid>
                        <DetailField label="First Name" value={inquiry.client_first_name} />
                        <DetailField label="Last Initial" value={inquiry.client_last_initial} />
                        <DetailField label="Approximate Age" value={inquiry.client_approximate_age} />
                        <DetailField label="Current Location" value={formatLabel(inquiry.client_current_location, LOCATION_LABELS)} />
                    </DetailGrid>
                </ModalSection>

                <ModalSection title="Inquiry Details">
                    <DetailField label="How They Heard About Us" value={inquiry.how_heard_about_us} />
                    <div style={{ marginTop: "12px" }}>
                        <DetailField label="Situation Notes" value="" fullWidth />
                        <NotesBlock text={inquiry.situation_notes} />
                    </div>
                </ModalSection>
            </div>

            <div style={{ padding: "20px 40px", borderTop: `1px solid ${COLORS.ashSubtle}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: COLORS.coconut, borderBottomLeftRadius: RADIUS.modal, borderBottomRightRadius: RADIUS.modal }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", fontFamily: FONT, color: COLORS.ashMuted, fontWeight: 500 }}>Status:</span>
                    <StatusDropdown currentStatus={inquiry.status} onUpdate={(status) => onStatusUpdate(inquiry.id, status, "referral_inquiries")} disabled={updatingStatus === inquiry.id} />
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                    {onArchive && (
                        <button onClick={() => { onArchive([inquiry.id], "referral_inquiries", inquiry.archived_at ? "unarchive" : "archive"); onClose() }}
                            style={{ ...pillBtnBase, background: inquiry.archived_at ? COLORS.green : COLORS.champagne, color: inquiry.archived_at ? COLORS.greenText : COLORS.ash, padding: "10px 24px" }}>
                            {inquiry.archived_at ? "Unarchive" : "Archive"}
                        </button>
                    )}
                    <button onClick={onClose} style={{ ...pillBtnBase, background: COLORS.ash, color: COLORS.white, padding: "10px 24px" }}>Close</button>
                </div>
            </div>
        </div>
    </div>
)

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

export default function ReferralDashboard() {
    const [submissions, setSubmissions] = useState<ReferralSubmission[]>([])
    const [inquiries, setInquiries] = useState<ReferralInquiry[]>([])
    const [loadingSubmissions, setLoadingSubmissions] = useState(true)
    const [loadingInquiries, setLoadingInquiries] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<TabId>("submissions")
    const [searchQuery, setSearchQuery] = useState("")
    const [submissionSort, setSubmissionSort] = useState<SortConfig>({ column: "created_at", direction: "desc" })
    const [inquirySort, setInquirySort] = useState<SortConfig>({ column: "created_at", direction: "desc" })
    const [subFilters, setSubFilters] = useState({ priority: "all", sourceType: "all", status: "all", urgent: "all" })
    const [inqFilters, setInqFilters] = useState({ inquiryType: "all", status: "all" })
    const [selectedSubs, setSelectedSubs] = useState<Set<string>>(new Set())
    const [selectedInqs, setSelectedInqs] = useState<Set<string>>(new Set())
    const [showModal, setShowModal] = useState(false)
    const [selectedSubmission, setSelectedSubmission] = useState<ReferralSubmission | null>(null)
    const [selectedInquiry, setSelectedInquiry] = useState<ReferralInquiry | null>(null)
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
    const [showExportMenu, setShowExportMenu] = useState(false)
    const [authStatus, setAuthStatus] = useState<string>("checking")
    const [userEmail, setUserEmail] = useState<string | null>(null)
    const [userName, setUserName] = useState<string | null>(null)
    const [authError, setAuthError] = useState<string | null>(null)
    const [authMode, setAuthMode] = useState<"options" | "magic-link" | "signing-in">("options")
    const [magicLinkEmail, setMagicLinkEmail] = useState("")
    const [magicLinkSent, setMagicLinkSent] = useState(false)
    const [showArchived, setShowArchived] = useState(false)
    const [archiveConfirm, setArchiveConfirm] = useState<{ ids: string[]; table: string; action: "archive" | "unarchive" } | null>(null)
    const [archiving, setArchiving] = useState(false)

    useEffect(() => {
        if (!document.getElementById("montserrat-font")) {
            const link = document.createElement("link")
            link.id = "montserrat-font"
            link.rel = "stylesheet"
            link.href = "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap"
            document.head.appendChild(link)
        }
    }, [])

    // Check auth session on mount + validate domain
    useEffect(() => {
        const validateAndSetSession = async (session: any) => {
            if (session) {
                const email = session.user?.email
                if (isAllowedDomain(email)) {
                    setAuthStatus("authenticated")
                    setUserEmail(email)
                    setUserName(session.user?.user_metadata?.full_name || session.user?.user_metadata?.name || email?.split("@")[0] || null)
                    setAuthError(null)
                    console.log("[Dashboard] Authenticated as:", email)
                } else {
                    console.warn("[Dashboard] Unauthorized domain:", email)
                    await supabase.auth.signOut()
                    setAuthStatus("anonymous")
                    setUserEmail(null)
                    setAuthError(`Access restricted to @${ALLOWED_DOMAIN} accounts. You signed in with ${email}. Please use your Monarch email.`)
                }
            } else {
                setAuthStatus("anonymous")
                setUserEmail(null)
            }
        }
        supabase.auth.getSession().then(({ data: { session } }) => validateAndSetSession(session))
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            validateAndSetSession(session)
        })
        return () => subscription.unsubscribe()
    }, [])

    // Auth handlers
    const handleGoogleSignIn = async () => {
        setAuthError(null)
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: DASHBOARD_REDIRECT_URL,
                queryParams: { hd: ALLOWED_DOMAIN },
            },
        })
        if (error) setAuthError(error.message)
    }

    const handleMagicLinkSignIn = async () => {
        setAuthError(null)
        if (!isAllowedDomain(magicLinkEmail)) {
            setAuthError(`Only @${ALLOWED_DOMAIN} email addresses can access this dashboard.`)
            return
        }
        setAuthMode("signing-in")
        const { error } = await supabase.auth.signInWithOtp({
            email: magicLinkEmail,
            options: { emailRedirectTo: DASHBOARD_REDIRECT_URL },
        })
        if (error) {
            setAuthError(error.message)
            setAuthMode("magic-link")
        } else {
            setMagicLinkSent(true)
        }
    }

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        setAuthStatus("anonymous")
        setUserEmail(null)
        setAuthError(null)
        setAuthMode("options")
        setMagicLinkSent(false)
        setMagicLinkEmail("")
    }

    // Archive / Unarchive handler
    const handleArchive = async (ids: string[], table: string, action: "archive" | "unarchive") => {
        setArchiving(true)
        try {
            const value = action === "archive" ? new Date().toISOString() : null
            for (const id of ids) {
                const { error } = await supabase.from(table).update({ archived_at: value, updated_at: new Date().toISOString() }).eq("id", id)
                if (error) throw error
            }
            // Update local state
            if (table === "referral_submissions") {
                setSubmissions((prev) => prev.map((s) => ids.includes(s.id) ? { ...s, archived_at: value } : s))
            } else {
                setInquiries((prev) => prev.map((i) => ids.includes(i.id) ? { ...i, archived_at: value } : i))
            }
            // Clear selections for archived items
            if (action === "archive") {
                if (table === "referral_submissions") setSelectedSubs((prev) => { const n = new Set(prev); ids.forEach((id) => n.delete(id)); return n })
                else setSelectedInqs((prev) => { const n = new Set(prev); ids.forEach((id) => n.delete(id)); return n })
            }
            setArchiveConfirm(null)
            console.log(`[Dashboard] ${action}d ${ids.length} record(s) in ${table}`)
        } catch (err: any) {
            console.error(`[Dashboard] ${action} failed:`, err)
            setError(`${action === "archive" ? "Archive" : "Unarchive"} failed: ${err.message}`)
            setTimeout(() => setError(null), 6000)
        } finally { setArchiving(false) }
    }

    const requestArchive = (ids: string[], table: string, action: "archive" | "unarchive") => {
        setArchiveConfirm({ ids, table, action })
    }

    const handleBatchArchive = () => {
        const table = activeTab === "submissions" ? "referral_submissions" : "referral_inquiries"
        const ids = Array.from(activeSelected)
        if (ids.length === 0) return
        requestArchive(ids, table, showArchived ? "unarchive" : "archive")
    }

    useEffect(() => { if (authStatus === "authenticated") { fetchSubmissions(); fetchInquiries() } }, [authStatus])

    const fetchSubmissions = async () => {
        try {
            const { data, error } = await supabase.from("referral_submissions").select("*").order("created_at", { ascending: false })
            if (error) throw error
            setSubmissions(data || [])
        } catch (err: any) {
            console.error("Error fetching submissions:", err)
            setError("Failed to load referral submissions")
        } finally { setLoadingSubmissions(false) }
    }

    const fetchInquiries = async () => {
        try {
            const { data, error } = await supabase.from("referral_inquiries").select("*").order("created_at", { ascending: false })
            if (error) throw error
            setInquiries(data || [])
        } catch (err: any) {
            console.error("Error fetching inquiries:", err)
            setError("Failed to load inquiries")
        } finally { setLoadingInquiries(false) }
    }

    const handleStatusUpdate = async (id: string, newStatus: ReferralStatus, table: string) => {
        setUpdatingStatus(id)
        const prevSubs = [...submissions]
        const prevInqs = [...inquiries]
        if (table === "referral_submissions") setSubmissions((p) => p.map((s) => s.id === id ? { ...s, status: newStatus } : s))
        else setInquiries((p) => p.map((i) => i.id === id ? { ...i, status: newStatus } : i))
        try {
            const { data, error, count } = await supabase
                .from(table)
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq("id", id)
                .select()
            console.log("[Dashboard] Status update response:", { data, error, count, table, id, newStatus })
            if (error) throw error
            if (!data || data.length === 0) throw new Error("Update returned no rows — RLS may be blocking the update. Check Supabase policies.")
        } catch (err: any) {
            console.error("[Dashboard] Status update failed:", err)
            setSubmissions(prevSubs)
            setInquiries(prevInqs)
            setError(`Status update failed: ${err.message || "Unknown error"}`)
            setTimeout(() => setError(null), 6000)
        } finally { setUpdatingStatus(null) }
    }

    const handleTabChange = (tab: TabId) => { setActiveTab(tab); setSearchQuery(""); setShowModal(false); setShowExportMenu(false); setShowArchived(false); setSelectedSubs(new Set()); setSelectedInqs(new Set()) }

    const handleSort = (column: string) => {
        const setter = activeTab === "submissions" ? setSubmissionSort : setInquirySort
        const current = activeTab === "submissions" ? submissionSort : inquirySort
        if (column === current.column) setter({ column, direction: current.direction === "asc" ? "desc" : "asc" })
        else setter({ column, direction: "asc" })
    }

    const activeSelected = activeTab === "submissions" ? selectedSubs : selectedInqs
    const setActiveSelected = activeTab === "submissions" ? setSelectedSubs : setSelectedInqs

    const toggleRowSelection = (id: string) => {
        const s = new Set(activeSelected)
        if (s.has(id)) s.delete(id); else s.add(id)
        setActiveSelected(s)
    }

    const toggleSelectAll = (data: any[]) => {
        if (activeSelected.size === data.length && data.length > 0) setActiveSelected(new Set())
        else setActiveSelected(new Set(data.map((r: any) => r.id)))
    }

    // Stat card computations — only count active (non-archived) records
    const activeSubmissions = useMemo(() => submissions.filter((s) => !s.archived_at), [submissions])
    const activeInquiries = useMemo(() => inquiries.filter((i) => !i.archived_at), [inquiries])
    const archivedSubmissions = useMemo(() => submissions.filter((s) => !!s.archived_at), [submissions])
    const archivedInquiries = useMemo(() => inquiries.filter((i) => !!i.archived_at), [inquiries])
    const archivedCount = useMemo(() => archivedSubmissions.length + archivedInquiries.length, [archivedSubmissions, archivedInquiries])

    const stats = useMemo(() => {
        const now = new Date()
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const allRecords = [...activeSubmissions, ...activeInquiries]
        return {
            total: allRecords.length,
            pending: allRecords.filter((r) => r.status === "pending_review").length,
            urgent: activeSubmissions.filter((s) => s.urgent_placement).length,
            accepted: allRecords.filter((r) => r.status === "accepted").length,
            thisWeek: allRecords.filter((r) => new Date(r.created_at) >= weekAgo).length,
        }
    }, [activeSubmissions, activeInquiries])

    const filteredSubmissions = useMemo(() => {
        let f = showArchived ? archivedSubmissions : activeSubmissions
        if (searchQuery) {
            const q = searchQuery.toLowerCase()
            f = f.filter((s) =>
                (s.client_first_name || "").toLowerCase().includes(q) ||
                (s.client_last_name || "").toLowerCase().includes(q) ||
                (s.referral_source_name || "").toLowerCase().includes(q) ||
                (s.court_jurisdiction || "").toLowerCase().includes(q) ||
                (s.case_number || "").toLowerCase().includes(q) ||
                (s.referral_code || "").toLowerCase().includes(q) ||
                (s.admin_ref_id || "").toLowerCase().includes(q) ||
                (s.attorney_name || "").toLowerCase().includes(q) ||
                (s.competency_status || "").toLowerCase().includes(q) ||
                (s.facility_name || "").toLowerCase().includes(q)
            )
        }
        if (subFilters.priority !== "all") f = f.filter((s) => s.is_priority_referral === (subFilters.priority === "true"))
        if (subFilters.sourceType !== "all") f = f.filter((s) => s.referral_source_type === subFilters.sourceType)
        if (subFilters.status !== "all") f = f.filter((s) => s.status === subFilters.status)
        if (subFilters.urgent !== "all") f = f.filter((s) => s.urgent_placement === (subFilters.urgent === "true"))
        return [...f].sort((a, b) => {
            const col = submissionSort.column as keyof ReferralSubmission
            let aV: any = a[col]; let bV: any = b[col]
            if (typeof aV === "boolean") { aV = aV ? 1 : 0; bV = bV ? 1 : 0 }
            if (col === "created_at" || col === "updated_at" || col === "archived_at") { aV = new Date(aV as string).getTime(); bV = new Date(bV as string).getTime() }
            const aS = String(aV || ""); const bS = String(bV || "")
            return submissionSort.direction === "asc" ? aS.localeCompare(bS) : bS.localeCompare(aS)
        })
    }, [activeSubmissions, archivedSubmissions, showArchived, searchQuery, subFilters, submissionSort])

    const filteredInquiries = useMemo(() => {
        let f = showArchived ? archivedInquiries : activeInquiries
        if (searchQuery) {
            const q = searchQuery.toLowerCase()
            f = f.filter((i) =>
                (i.referral_source_name || "").toLowerCase().includes(q) ||
                (i.client_first_name || "").toLowerCase().includes(q) ||
                (i.client_last_initial || "").toLowerCase().includes(q) ||
                (i.client_current_location || "").toLowerCase().includes(q) ||
                (i.situation_notes || "").toLowerCase().includes(q)
            )
        }
        if (inqFilters.inquiryType !== "all") f = f.filter((i) => i.inquiry_type === inqFilters.inquiryType)
        if (inqFilters.status !== "all") f = f.filter((i) => i.status === inqFilters.status)
        return [...f].sort((a, b) => {
            const col = inquirySort.column as keyof ReferralInquiry
            let aV: any = a[col]; let bV: any = b[col]
            if (col === "created_at" || col === "updated_at" || col === "archived_at") { aV = new Date(aV as string).getTime(); bV = new Date(bV as string).getTime() }
            const aS = String(aV || ""); const bS = String(bV || "")
            return inquirySort.direction === "asc" ? aS.localeCompare(bS) : bS.localeCompare(aS)
        })
    }, [activeInquiries, archivedInquiries, showArchived, searchQuery, inqFilters, inquirySort])

    const handleExportCSV = (mode: "selected" | "all") => {
        const ts = new Date().toISOString().split("T")[0]
        if (activeTab === "submissions") {
            const d = mode === "selected" ? filteredSubmissions.filter((s) => selectedSubs.has(s.id)) : filteredSubmissions
            exportSubmissionsCSV(d, `monarch_referrals_${ts}.csv`)
        } else {
            const d = mode === "selected" ? filteredInquiries.filter((i) => selectedInqs.has(i.id)) : filteredInquiries
            exportInquiriesCSV(d, `monarch_inquiries_${ts}.csv`)
        }
        setShowExportMenu(false)
    }

    const openSubmissionDetail = (s: ReferralSubmission) => { setSelectedSubmission(s); setSelectedInquiry(null); setShowModal(true) }
    const openInquiryDetail = (i: ReferralInquiry) => { setSelectedInquiry(i); setSelectedSubmission(null); setShowModal(true) }
    const closeModal = () => { setShowModal(false); setSelectedSubmission(null); setSelectedInquiry(null) }

    // ---- AUTH GATE: checking spinner ----
    if (authStatus === "checking") return (
        <div style={{ fontFamily: FONT, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: COLORS.coconut, letterSpacing: "-0.02em" }}>
            <div style={{ textAlign: "center", color: COLORS.ashMuted, fontSize: "14px" }}>
                <div style={{ width: "40px", height: "40px", border: `3px solid ${COLORS.moonstoneLight}`, borderTopColor: COLORS.moonstone, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
                Verifying session...
                <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
        </div>
    )

    // ---- AUTH GATE: login screen ----
    if (authStatus !== "authenticated") return (
        <div style={{ fontFamily: FONT, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: COLORS.coconut, letterSpacing: "-0.02em", padding: "20px" }}>
            <div style={{ background: COLORS.white, borderRadius: RADIUS.container, boxShadow: SHADOWS.modal, maxWidth: "460px", width: "100%", padding: "48px 40px" }}>
                {/* Branding */}
                <div style={{ textAlign: "center", marginBottom: "36px" }}>
                    <img src="https://esbmnympligtknhtkary.supabase.co/storage/v1/object/public/assets/monarch-logo.png" alt="Monarch Competency" style={{ height: "48px", margin: "0 auto 20px", display: "block", objectFit: "contain" }} />
                    <h1 style={{ margin: "0 0 8px", fontSize: "22px", fontWeight: 700, color: COLORS.ash, fontFamily: FONT }}>Referral Dashboard</h1>
                    <p style={{ margin: 0, fontSize: "14px", color: COLORS.ashMuted, fontFamily: FONT }}>Monarch Competency Restoration Program</p>
                </div>

                {/* Auth error */}
                {authError && (
                    <div style={{ padding: "14px 20px", marginBottom: "24px", background: COLORS.tangerineLight, color: COLORS.redText, borderRadius: RADIUS.section, fontSize: "13px", fontFamily: FONT, lineHeight: "1.5" }}>
                        {authError}
                    </div>
                )}

                {/* Magic link sent confirmation */}
                {magicLinkSent ? (
                    <div style={{ padding: "28px", background: COLORS.green, borderRadius: RADIUS.section, textAlign: "center" }}>
                        <div style={{ fontSize: "18px", fontWeight: 600, color: COLORS.greenText, fontFamily: FONT, marginBottom: "8px" }}>Check your email</div>
                        <p style={{ color: COLORS.greenText, fontFamily: FONT, fontSize: "14px", margin: "0 0 16px" }}>
                            We sent a login link to <strong>{magicLinkEmail}</strong>. Click the link to access the dashboard.
                        </p>
                        <button onClick={() => { setMagicLinkSent(false); setAuthMode("options"); setMagicLinkEmail("") }} style={{ ...pillBtnBase, background: "transparent", color: COLORS.greenText, padding: "8px 20px", border: `1px solid ${COLORS.greenText}` }}>
                            Use different email
                        </button>
                    </div>

                ) : authMode === "magic-link" ? (
                    /* Magic link form */
                    <div>
                        <div style={{ marginBottom: "16px" }}>
                            <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: 600, fontFamily: FONT, color: COLORS.ash }}>Email Address</label>
                            <input type="email" value={magicLinkEmail} onChange={(e) => setMagicLinkEmail(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && magicLinkEmail && handleMagicLinkSignIn()}
                                placeholder={`you@${ALLOWED_DOMAIN}`}
                                style={{ ...selectStyle, width: "100%", padding: "14px 20px", fontSize: "15px", backgroundImage: "none", paddingRight: "20px", boxSizing: "border-box" as const }} />
                        </div>
                        <button onClick={handleMagicLinkSignIn} disabled={!magicLinkEmail || authMode === "signing-in"}
                            style={{ ...pillBtnBase, width: "100%", padding: "14px", fontSize: "15px", background: !magicLinkEmail ? COLORS.ashSubtle : COLORS.moonstone, color: !magicLinkEmail ? COLORS.ashMuted : COLORS.white, cursor: !magicLinkEmail ? "not-allowed" : "pointer", marginBottom: "12px" }}>
                            {authMode === "signing-in" ? "Sending..." : "Send Login Link"}
                        </button>
                        <button onClick={() => { setAuthMode("options"); setAuthError(null) }}
                            style={{ ...pillBtnBase, width: "100%", padding: "12px", background: "transparent", color: COLORS.ashMuted, fontSize: "13px" }}>
                            Back to sign-in options
                        </button>
                    </div>

                ) : (
                    /* Default: Google + Magic Link options */
                    <div>
                        <button onClick={handleGoogleSignIn} style={{ ...pillBtnBase, width: "100%", padding: "14px", fontSize: "15px", background: COLORS.white, color: COLORS.ash, border: `2px solid ${COLORS.ashSubtle}`, display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "16px" }}>
                            <svg width="20" height="20" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Continue with Google
                        </button>

                        <div style={{ display: "flex", alignItems: "center", margin: "20px 0" }}>
                            <div style={{ flex: 1, height: "1px", background: COLORS.ashSubtle }} />
                            <span style={{ padding: "0 16px", color: COLORS.ashMuted, fontSize: "13px", fontFamily: FONT }}>or</span>
                            <div style={{ flex: 1, height: "1px", background: COLORS.ashSubtle }} />
                        </div>

                        <button onClick={() => { setAuthMode("magic-link"); setAuthError(null) }}
                            style={{ ...pillBtnBase, width: "100%", padding: "14px", fontSize: "15px", background: "transparent", color: COLORS.ash, border: `2px solid ${COLORS.ash}` }}>
                            Continue with Email
                        </button>

                        <p style={{ marginTop: "28px", fontSize: "12px", color: COLORS.ashMuted, fontFamily: FONT, textAlign: "center", lineHeight: "1.6" }}>
                            Access restricted to @{ALLOWED_DOMAIN} accounts.<br />Contact your administrator if you need access.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )

    // ---- DASHBOARD (authenticated) ----
    const isLoading = activeTab === "submissions" ? loadingSubmissions : loadingInquiries
    if (isLoading && !error) return (
        <div style={{ fontFamily: FONT, padding: "60px", textAlign: "center", color: COLORS.ashMuted, fontSize: "14px", letterSpacing: "-0.02em" }}>
            Loading referrals...
        </div>
    )

    const currentSort = activeTab === "submissions" ? submissionSort : inquirySort
    const currentData: any[] = activeTab === "submissions" ? filteredSubmissions : filteredInquiries
    const subGrid = "40px 2.5fr 1fr 1.8fr 1.3fr 1.3fr 0.8fr 0.5fr 1fr 1.2fr 0.9fr"
    const inqGrid = "40px 2fr 1fr 1.6fr 1.3fr 1fr 1.2fr 0.9fr"
    const currentGrid = activeTab === "submissions" ? subGrid : inqGrid

    return (
        <div style={{ fontFamily: FONT, padding: "32px", maxWidth: "100%", background: COLORS.coconut, minHeight: "100vh", letterSpacing: "-0.02em" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
                <div>
                    <h1 style={{ margin: "0 0 4px 0", fontSize: "24px", fontWeight: 700, color: COLORS.ash, fontFamily: FONT }}>
                        {userName ? `Welcome, ${userName.split(" ")[0]}` : "Referral Management"}
                    </h1>
                    <p style={{ margin: 0, fontSize: "13px", color: COLORS.ashMuted, fontFamily: FONT }}>Monarch Competency Restoration Program</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 16px", borderRadius: RADIUS.pill, background: COLORS.green, fontSize: "12px", fontWeight: 500, fontFamily: FONT, color: COLORS.greenText }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: COLORS.greenText }} />
                        {userEmail}
                    </div>
                    <button onClick={handleSignOut} style={{ ...pillBtnBase, padding: "6px 16px", fontSize: "12px", background: "transparent", color: COLORS.ashMuted, border: `1px solid ${COLORS.ashSubtle}` }}>
                        Sign Out
                    </button>
                </div>
            </div>

            <TabBar activeTab={activeTab} onTabChange={handleTabChange} submissionCount={activeSubmissions.length} inquiryCount={activeInquiries.length} />

            {/* Stat Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px", marginBottom: "24px" }}>
                {([
                    { label: "Total Referrals", value: stats.total, color: COLORS.moonstone, bg: COLORS.moonstoneLight },
                    { label: "Pending Review", value: stats.pending, color: COLORS.ash, bg: COLORS.champagneLight },
                    { label: "Urgent", value: stats.urgent, color: COLORS.redText, bg: COLORS.tangerineLight },
                    { label: "Accepted", value: stats.accepted, color: COLORS.greenText, bg: COLORS.green },
                    { label: "This Week", value: stats.thisWeek, color: COLORS.gunmetal, bg: COLORS.coconut },
                ] as const).map((card) => (
                    <div key={card.label} style={{ background: COLORS.white, borderRadius: RADIUS.card, boxShadow: SHADOWS.card, padding: "20px 24px", display: "flex", flexDirection: "column", gap: "8px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 600, fontFamily: FONT, color: COLORS.ashMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{card.label}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <span style={{ fontSize: "28px", fontWeight: 700, fontFamily: FONT, color: card.color, letterSpacing: "-0.02em" }}>{card.value}</span>
                            <span style={{ padding: "3px 10px", borderRadius: RADIUS.pill, background: card.bg, fontSize: "11px", fontWeight: 600, fontFamily: FONT, color: card.color }}>
                                {stats.total > 0 ? `${Math.round((card.value / stats.total) * 100)}%` : "0%"}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Archived mode banner */}
            {showArchived && (
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", padding: "14px 24px", background: COLORS.champagneLight, borderRadius: RADIUS.section, border: `1px solid ${COLORS.champagne}` }}>
                    <span style={{ fontSize: "16px" }}>{"\uD83D\uDCE6"}</span>
                    <span style={{ fontSize: "14px", fontFamily: FONT, color: COLORS.ash, fontWeight: 500 }}>
                        Viewing archived {activeTab === "submissions" ? "submissions" : "inquiries"} &mdash; {activeTab === "submissions" ? archivedSubmissions.length : archivedInquiries.length} record{(activeTab === "submissions" ? archivedSubmissions.length : archivedInquiries.length) !== 1 ? "s" : ""}
                    </span>
                </div>
            )}

            <div style={{ background: COLORS.white, borderRadius: RADIUS.container, boxShadow: SHADOWS.card, overflow: "hidden" }}>
                {/* Toolbar */}
                <div style={{ padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${COLORS.ashSubtle}`, flexWrap: "wrap", gap: "12px" }}>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                        <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ ...selectStyle, width: "200px", backgroundImage: "none", paddingRight: "20px" }} />
                        {activeTab === "submissions" ? (
                            <>
                                <select value={subFilters.priority} onChange={(e) => setSubFilters({ ...subFilters, priority: e.target.value })} style={selectStyle}>
                                    <option value="all">All Priority</option><option value="true">High Priority</option><option value="false">Standard</option>
                                </select>
                                <select value={subFilters.sourceType} onChange={(e) => setSubFilters({ ...subFilters, sourceType: e.target.value })} style={selectStyle}>
                                    <option value="all">All Types</option>
                                    {Object.entries(SOURCE_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                </select>
                                <select value={subFilters.status} onChange={(e) => setSubFilters({ ...subFilters, status: e.target.value })} style={selectStyle}>
                                    <option value="all">All Status</option>
                                    {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                                <select value={subFilters.urgent} onChange={(e) => setSubFilters({ ...subFilters, urgent: e.target.value })} style={selectStyle}>
                                    <option value="all">All Urgency</option><option value="true">Urgent</option><option value="false">Not Urgent</option>
                                </select>
                            </>
                        ) : (
                            <>
                                <select value={inqFilters.inquiryType} onChange={(e) => setInqFilters({ ...inqFilters, inquiryType: e.target.value })} style={selectStyle}>
                                    <option value="all">All Types</option><option value="self">Self</option><option value="other">Someone Else</option>
                                </select>
                                <select value={inqFilters.status} onChange={(e) => setInqFilters({ ...inqFilters, status: e.target.value })} style={selectStyle}>
                                    <option value="all">All Status</option>
                                    {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </>
                        )}
                    </div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "12px", color: COLORS.ashMuted, fontFamily: FONT, fontWeight: 500 }}>
                            {currentData.length} result{currentData.length !== 1 ? "s" : ""}
                            {activeSelected.size > 0 && ` \u00b7 ${activeSelected.size} selected`}
                        </span>
                        {/* Batch archive/unarchive button */}
                        {activeSelected.size > 0 && (
                            <button onClick={handleBatchArchive} style={{ ...pillBtnBase, background: showArchived ? COLORS.green : COLORS.champagne, color: showArchived ? COLORS.greenText : COLORS.ash, padding: "8px 20px" }}>
                                {showArchived ? `Unarchive (${activeSelected.size})` : `Archive (${activeSelected.size})`}
                            </button>
                        )}
                        {/* Archive toggle */}
                        <button onClick={() => { setShowArchived(!showArchived); setSelectedSubs(new Set()); setSelectedInqs(new Set()) }}
                            style={{ ...pillBtnBase, padding: "8px 20px", background: showArchived ? COLORS.champagne : "transparent", color: showArchived ? COLORS.ash : COLORS.ashMuted, border: showArchived ? "none" : `1px solid ${COLORS.ashSubtle}` }}>
                            {showArchived ? `\u2190 Active` : `Archived (${activeTab === "submissions" ? archivedSubmissions.length : archivedInquiries.length})`}
                        </button>
                        <div style={{ position: "relative" }}>
                            <button onClick={() => setShowExportMenu(!showExportMenu)} style={{ ...pillBtnBase, background: COLORS.moonstone, color: COLORS.white, padding: "8px 20px" }}>
                                Export {"\u25BE"}
                            </button>
                            {showExportMenu && (
                                <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: COLORS.white, borderRadius: RADIUS.section, boxShadow: SHADOWS.modal, border: `1px solid ${COLORS.ashSubtle}`, minWidth: "180px", zIndex: 100, overflow: "hidden" }}>
                                    {activeSelected.size > 0 && (
                                        <button onClick={() => handleExportCSV("selected")} style={{ display: "block", width: "100%", textAlign: "left", padding: "12px 20px", border: "none", background: "transparent", cursor: "pointer", fontFamily: FONT, fontSize: "13px", color: COLORS.ash, borderBottom: `1px solid ${COLORS.ashSubtle}` }}>
                                            CSV \u2014 Selected ({activeSelected.size})
                                        </button>
                                    )}
                                    <button onClick={() => handleExportCSV("all")} style={{ display: "block", width: "100%", textAlign: "left", padding: "12px 20px", border: "none", background: "transparent", cursor: "pointer", fontFamily: FONT, fontSize: "13px", color: COLORS.ash }}>
                                        CSV \u2014 All ({currentData.length})
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Table — scrollable on small screens */}
                <div style={{ overflowX: "auto", minWidth: 0 }}>
                <div style={{ minWidth: activeTab === "submissions" ? "1200px" : "860px" }}>
                {/* Table Header */}
                <div style={{ display: "grid", gridTemplateColumns: currentGrid, background: COLORS.gunmetal, fontSize: "11px", fontWeight: 600, fontFamily: FONT, color: COLORS.coconut, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    <div style={{ ...cellStyle, display: "flex", justifyContent: "center", alignItems: "center" }}>
                        <input type="checkbox" checked={activeSelected.size === currentData.length && currentData.length > 0} onChange={() => toggleSelectAll(currentData)} style={{ accentColor: COLORS.moonstone }} />
                    </div>
                    {activeTab === "submissions" ? (
                        <>
                            <HeaderCell column="client_first_name" label="Client Name" sortColumn={currentSort.column} sortDirection={currentSort.direction} onSort={handleSort} />
                            <HeaderCell column="is_priority_referral" label="Priority" sortColumn={currentSort.column} sortDirection={currentSort.direction} onSort={handleSort} />
                            <HeaderCell column="referral_source_name" label="Source" sortColumn={currentSort.column} sortDirection={currentSort.direction} onSort={handleSort} />
                            <HeaderCell column="referral_source_type" label="Type" sortColumn={currentSort.column} sortDirection={currentSort.direction} onSort={handleSort} />
                            <HeaderCell column="court_jurisdiction" label="Court" sortColumn={currentSort.column} sortDirection={currentSort.direction} onSort={handleSort} />
                            <HeaderCell column="urgent_placement" label="Urgent" sortColumn={currentSort.column} sortDirection={currentSort.direction} onSort={handleSort} />
                            <div style={cellStyle}>Docs</div>
                            <HeaderCell column="created_at" label="Date" sortColumn={currentSort.column} sortDirection={currentSort.direction} onSort={handleSort} />
                            <div style={cellStyle}>Status</div>
                            <div style={cellStyle}>Actions</div>
                        </>
                    ) : (
                        <>
                            <HeaderCell column="referral_source_name" label="Contact" sortColumn={currentSort.column} sortDirection={currentSort.direction} onSort={handleSort} />
                            <HeaderCell column="inquiry_type" label="Type" sortColumn={currentSort.column} sortDirection={currentSort.direction} onSort={handleSort} />
                            <HeaderCell column="client_first_name" label="Client" sortColumn={currentSort.column} sortDirection={currentSort.direction} onSort={handleSort} />
                            <HeaderCell column="client_current_location" label="Location" sortColumn={currentSort.column} sortDirection={currentSort.direction} onSort={handleSort} />
                            <HeaderCell column="created_at" label="Date" sortColumn={currentSort.column} sortDirection={currentSort.direction} onSort={handleSort} />
                            <div style={cellStyle}>Status</div>
                            <div style={cellStyle}>Actions</div>
                        </>
                    )}
                </div>

                {/* Table Body */}
                {currentData.length === 0 ? (
                    <div style={{ padding: "60px 20px", textAlign: "center", color: COLORS.ashMuted, fontFamily: FONT, fontSize: "14px" }}>
                        {searchQuery ? "No results match your search" : showArchived ? `No archived ${activeTab === "submissions" ? "submissions" : "inquiries"}` : `No ${activeTab === "submissions" ? "referral submissions" : "inquiries"} found`}
                    </div>
                ) : activeTab === "submissions" ? (
                    filteredSubmissions.map((row, i) => (
                        <div key={row.id} style={{
                            display: "grid", gridTemplateColumns: subGrid, alignItems: "center", fontSize: "14px", fontFamily: FONT, color: COLORS.ash,
                            borderBottom: i < filteredSubmissions.length - 1 ? `1px solid ${COLORS.ashSubtle}` : "none",
                            background: selectedSubs.has(row.id) ? COLORS.champagneLight : i % 2 === 0 ? COLORS.white : COLORS.coconut,
                            transition: "background 0.15s ease",
                        }}>
                            <div style={{ ...cellStyle, display: "flex", justifyContent: "center" }}>
                                <input type="checkbox" checked={selectedSubs.has(row.id)} onChange={() => toggleRowSelection(row.id)} style={{ accentColor: COLORS.moonstone }} />
                            </div>
                            <div style={{ ...cellStyle, fontWeight: 500 }}>{row.client_first_name} {row.client_last_name}</div>
                            <div style={cellStyle}><PriorityBadge isPriority={row.is_priority_referral} /></div>
                            <div style={{ ...cellStyle, fontSize: "13px" }}>{row.referral_source_name}</div>
                            <div style={cellStyle}><TypeBadge type={row.referral_source_type} /></div>
                            <div style={{ ...cellStyle, fontSize: "13px" }}>{row.court_jurisdiction || "\u2014"}</div>
                            <div style={cellStyle}>{row.urgent_placement ? <UrgentBadge urgent={true} /> : <span style={{ color: COLORS.ashMuted }}>{"\u2014"}</span>}</div>
                            <div style={{ ...cellStyle, fontSize: "13px" }}>
                                {Array.isArray(row.uploaded_documents) && row.uploaded_documents.length > 0
                                    ? <span style={{ color: COLORS.moonstone, fontWeight: 600 }}>{"\uD83D\uDCCE"} {row.uploaded_documents.length}</span>
                                    : <span style={{ color: COLORS.ashMuted }}>{"\u2014"}</span>
                                }
                            </div>
                            <div style={{ ...cellStyle, fontSize: "13px" }}>{formatDate(row.created_at)}</div>
                            <div style={cellStyle}><StatusBadge status={row.status} /></div>
                            <div style={{ ...cellStyle, display: "flex", gap: "4px" }}>
                                <ActionButton onClick={() => openSubmissionDetail(row)} title="View Details">View</ActionButton>
                                <ActionButton onClick={() => requestArchive([row.id], "referral_submissions", showArchived ? "unarchive" : "archive")} title={showArchived ? "Unarchive" : "Archive"}>
                                    {showArchived ? "\u21A9" : "\u2716"}
                                </ActionButton>
                            </div>
                        </div>
                    ))
                ) : (
                    filteredInquiries.map((row, i) => (
                        <div key={row.id} style={{
                            display: "grid", gridTemplateColumns: inqGrid, alignItems: "center", fontSize: "14px", fontFamily: FONT, color: COLORS.ash,
                            borderBottom: i < filteredInquiries.length - 1 ? `1px solid ${COLORS.ashSubtle}` : "none",
                            background: selectedInqs.has(row.id) ? COLORS.champagneLight : i % 2 === 0 ? COLORS.white : COLORS.coconut,
                            transition: "background 0.15s ease",
                        }}>
                            <div style={{ ...cellStyle, display: "flex", justifyContent: "center" }}>
                                <input type="checkbox" checked={selectedInqs.has(row.id)} onChange={() => toggleRowSelection(row.id)} style={{ accentColor: COLORS.moonstone }} />
                            </div>
                            <div style={{ ...cellStyle, fontWeight: 500 }}>{row.referral_source_name}</div>
                            <div style={{ ...cellStyle, fontSize: "13px" }}>{formatLabel(row.inquiry_type)}</div>
                            <div style={{ ...cellStyle, fontSize: "13px" }}>{row.client_first_name} {row.client_last_initial ? `${row.client_last_initial}.` : ""}</div>
                            <div style={{ ...cellStyle, fontSize: "13px" }}>{formatLabel(row.client_current_location, LOCATION_LABELS)}</div>
                            <div style={{ ...cellStyle, fontSize: "13px" }}>{formatDate(row.created_at)}</div>
                            <div style={cellStyle}><StatusBadge status={row.status} /></div>
                            <div style={{ ...cellStyle, display: "flex", gap: "4px" }}>
                                <ActionButton onClick={() => openInquiryDetail(row)} title="View Details">View</ActionButton>
                                <ActionButton onClick={() => requestArchive([row.id], "referral_inquiries", showArchived ? "unarchive" : "archive")} title={showArchived ? "Unarchive" : "Archive"}>
                                    {showArchived ? "\u21A9" : "\u2716"}
                                </ActionButton>
                            </div>
                        </div>
                    ))
                )}
                </div>{/* end minWidth wrapper */}
                </div>{/* end overflowX wrapper */}
            </div>

            {error && (
                <div style={{ marginTop: "16px", padding: "14px 24px", background: COLORS.tangerineLight, color: COLORS.redText, borderRadius: RADIUS.section, fontFamily: FONT, fontSize: "13px" }}>
                    {error}
                </div>
            )}

            {showModal && selectedSubmission && <SubmissionDetailModal referral={selectedSubmission} onClose={closeModal} onStatusUpdate={handleStatusUpdate} updatingStatus={updatingStatus} onArchive={requestArchive} />}
            {showModal && selectedInquiry && <InquiryDetailModal inquiry={selectedInquiry} onClose={closeModal} onStatusUpdate={handleStatusUpdate} updatingStatus={updatingStatus} onArchive={requestArchive} />}

            {/* Archive Confirmation Modal */}
            {archiveConfirm && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: COLORS.overlay, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "20px", backdropFilter: "blur(8px)" }}
                    onClick={(e) => e.target === e.currentTarget && !archiving && setArchiveConfirm(null)}>
                    <div style={{ background: COLORS.white, borderRadius: RADIUS.container, boxShadow: SHADOWS.modal, maxWidth: "440px", width: "100%", padding: "36px 32px", textAlign: "center" }}>
                        <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: archiveConfirm.action === "archive" ? COLORS.champagneLight : COLORS.green, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: "22px" }}>
                            {archiveConfirm.action === "archive" ? "\uD83D\uDCE6" : "\u21A9\uFE0F"}
                        </div>
                        <h3 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 700, fontFamily: FONT, color: COLORS.ash }}>
                            {archiveConfirm.action === "archive" ? "Archive" : "Unarchive"} {archiveConfirm.ids.length} {archiveConfirm.ids.length === 1 ? "record" : "records"}?
                        </h3>
                        <p style={{ margin: "0 0 28px", fontSize: "14px", color: COLORS.ashMuted, fontFamily: FONT, lineHeight: "1.6" }}>
                            {archiveConfirm.action === "archive"
                                ? "Archived records will be hidden from the active view. You can view and restore them anytime from the Archived tab."
                                : "These records will be moved back to the active view."}
                        </p>
                        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                            <button onClick={() => setArchiveConfirm(null)} disabled={archiving}
                                style={{ ...pillBtnBase, padding: "12px 28px", background: "transparent", color: COLORS.ashMuted, border: `1px solid ${COLORS.ashSubtle}` }}>
                                Cancel
                            </button>
                            <button onClick={() => handleArchive(archiveConfirm.ids, archiveConfirm.table, archiveConfirm.action)} disabled={archiving}
                                style={{ ...pillBtnBase, padding: "12px 28px", background: archiveConfirm.action === "archive" ? COLORS.champagne : COLORS.moonstone, color: archiveConfirm.action === "archive" ? COLORS.ash : COLORS.white }}>
                                {archiving ? "Processing..." : archiveConfirm.action === "archive" ? "Archive" : "Unarchive"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
