export type Opt = { value: string; label: string }

export const RELATIONSHIP_OPTIONS: Opt[] = [
    { value: "cma_case_manager", label: "CMA case manager" },
    { value: "state_hospital_staff", label: "State hospital staff" },
    { value: "facility_clinician", label: "Hospital or facility clinician" },
    { value: "social_worker", label: "Social worker" },
    { value: "other_licensed_provider", label: "Other licensed provider" },
    { value: "other_professional", label: "Other professional" },
    { value: "family_member", label: "Family member" },
    { value: "attorney", label: "Attorney / legal representative" },
    { value: "poa_guardian", label: "POA / guardian" },
    { value: "self", label: "Self (the individual)" },
    { value: "other", label: "Other" },
]

export const PROFESSIONAL_RELATIONSHIPS = new Set([
    "cma_case_manager",
    "state_hospital_staff",
    "facility_clinician",
    "social_worker",
    "other_licensed_provider",
    "other_professional",
    "attorney",
    "other",
])

export const LOVED_ONE_RELATIONSHIPS = new Set(["family_member", "poa_guardian"])

const MH_RELATIONSHIP_VALUES = new Set(RELATIONSHIP_OPTIONS.map((o) => o.value))

/** Map Competency (or MH) profile `referral_source_type` into an MH relationship code when possible. */
export function mapProfileTypeToMhRelationship(raw: string | null | undefined): string {
    const v = (raw || "").trim()
    if (!v) return ""
    if (MH_RELATIONSHIP_VALUES.has(v)) return v
    const fromCompetency: Record<string, string> = {
        case_management: "cma_case_manager",
        mental_health_facility: "facility_clinician",
        legal_representative: "attorney",
        family: "family_member",
        self_referral: "self",
        other_professional: "other_professional",
        court: "other_professional",
        probation_parole: "other_professional",
    }
    return fromCompetency[v] || ""
}

export function splitDisplayName(displayName: string): { first: string; last: string } {
    const parts = displayName.trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return { first: "", last: "" }
    if (parts.length === 1) return { first: parts[0], last: "" }
    return { first: parts[0], last: parts.slice(1).join(" ") }
}

export const ROI_PERMISSION_OPTIONS: Opt[] = [
    { value: "bilateral", label: "Bilateral exchange" },
    { value: "send_only", label: "Send only" },
    { value: "receive_only", label: "Receive only" },
]

export const YES_NO: Opt[] = [
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
]

export const YES_NO_UNKNOWN: Opt[] = [
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
    { value: "unknown", label: "Unknown" },
]

export const GENDER_IDENTITY_OPTIONS: Opt[] = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "transgender_male", label: "Transgender male" },
    { value: "transgender_female", label: "Transgender female" },
    { value: "genderqueer", label: "Non-binary / genderqueer" },
    { value: "decline_to_answer", label: "Prefer not to say" },
    { value: "additional_category", label: "Another identity" },
]

export const SEX_AT_BIRTH_OPTIONS: Opt[] = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "unknown", label: "Unknown" },
]

export const PRONOUN_OPTIONS: Opt[] = [
    { value: "he_him", label: "He / him" },
    { value: "she_her", label: "She / her" },
    { value: "they_them", label: "They / them" },
    { value: "other", label: "Other / specify" },
]

export const ENGLISH_PROFICIENCY_OPTIONS: Opt[] = [
    { value: "fluent", label: "Fluent" },
    { value: "conversational", label: "Conversational" },
    { value: "limited", label: "Limited" },
    { value: "none", label: "None" },
    { value: "unknown", label: "Unknown" },
]

export const RACE_OPTIONS: Opt[] = [
    { value: "american_indian_alaska_native", label: "American Indian or Alaska Native" },
    { value: "asian", label: "Asian" },
    { value: "black_african_american", label: "Black or African American" },
    { value: "native_hawaiian_pacific_islander", label: "Native Hawaiian or Other Pacific Islander" },
    { value: "white", label: "White" },
    { value: "decline_to_specify", label: "Decline to specify" },
]

export const ETHNICITY_OPTIONS: Opt[] = [
    { value: "hispanic_latino", label: "Hispanic or Latino" },
    { value: "not_hispanic_latino", label: "Not Hispanic or Latino" },
    { value: "decline_to_specify", label: "Decline to specify" },
]

export const MARITAL_OPTIONS: Opt[] = [
    { value: "married", label: "Married" },
    { value: "unmarried", label: "Unmarried" },
    { value: "unknown", label: "Unknown" },
]

export const MILITARY_OPTIONS: Opt[] = [
    { value: "none", label: "None" },
    { value: "veteran", label: "Veteran" },
    { value: "active_duty_guard_reserve", label: "Active duty / Guard / Reserve" },
    { value: "military_family", label: "Military family" },
    { value: "unknown", label: "Unknown" },
]

export const CONSENT_OPTIONS: Opt[] = [
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
    { value: "unable_unknown", label: "Unable to consent / unknown" },
]

export const MEDICAID_STATUS_OPTIONS: Opt[] = [
    { value: "enrolled", label: "Yes" },
    { value: "not_enrolled", label: "No" },
]

export const RAE_OPTIONS: Opt[] = [
    { value: "rae_1", label: "RAE 1 – Rocky Mountain Health Plans" },
    { value: "rae_2", label: "RAE 2 – Northeast Health Partners" },
    { value: "rae_3", label: "RAE 3 – Colorado Community Health Alliance" },
    { value: "rae_4", label: "RAE 4 – Colorado Access" },
    { value: "unknown", label: "Unknown" },
]

export const MEDICARE_OPTIONS: Opt[] = [
    { value: "active", label: "Active" },
    { value: "pending", label: "Pending" },
    { value: "not_eligible", label: "Not eligible" },
    { value: "unknown", label: "Unknown" },
]

export const SSDI_OPTIONS: Opt[] = [
    { value: "ssi", label: "Receiving SSI" },
    { value: "ssdi", label: "Receiving SSDI" },
    { value: "ssi_and_ssdi", label: "Receiving SSI and SSDI" },
    { value: "pending", label: "Applied / pending" },
    { value: "not_receiving", label: "Not receiving" },
    { value: "unknown", label: "Unknown" },
]

export const LOCATION_OPTIONS: Opt[] = [
    { value: "state_hospital", label: "State hospital" },
    { value: "psychiatric_hospital", label: "Psychiatric hospital" },
    { value: "medical_hospital", label: "Medical hospital" },
    { value: "treatment_facility", label: "Treatment facility" },
    { value: "residential_program", label: "Residential program" },
    { value: "jail_detention", label: "Jail / detention" },
    { value: "community_housed", label: "Community, housed" },
    { value: "shelter_unhoused", label: "Shelter / unhoused" },
    { value: "other", label: "Other" },
]

export const FACILITY_LOCATIONS = new Set([
    "state_hospital",
    "psychiatric_hospital",
    "medical_hospital",
    "treatment_facility",
    "residential_program",
    "jail_detention",
])

export const HOUSING_PRIOR_OPTIONS: Opt[] = [
    { value: "rent_own", label: "Rent / own" },
    { value: "assisted_living", label: "Assisted living" },
    { value: "homeless_with_shelter", label: "Homeless with shelter" },
    { value: "living_with_friend_relative", label: "Living with friend / relative" },
    { value: "homeless", label: "Homeless" },
    { value: "host_home", label: "Host home" },
    { value: "supportive_housing", label: "Supportive housing" },
    { value: "other", label: "Other" },
]

export const MED_ADHERENCE_OPTIONS: Opt[] = [
    { value: "as_prescribed", label: "Taking as prescribed" },
    { value: "partial", label: "Partially adherent" },
    { value: "not_taking", label: "Not taking / refusing" },
    { value: "not_prescribed", label: "Not currently prescribed" },
    { value: "unknown", label: "Unknown" },
]

export const TBI_OPTIONS: Opt[] = [
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
    { value: "suspected", label: "Suspected" },
    { value: "unknown", label: "Unknown" },
]

export const IDD_OPTIONS: Opt[] = [
    { value: "yes_documented", label: "Yes, documented" },
    { value: "yes_undocumented", label: "Yes, undocumented / suspected" },
    { value: "no", label: "No" },
    { value: "unknown", label: "Unknown" },
]

export const DETOX_OPTIONS: Opt[] = [
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
    { value: "possibly", label: "Possibly / under evaluation" },
    { value: "unknown", label: "Unknown" },
]

export const MEDICAL_CONTROLLED_OPTIONS: Opt[] = [
    { value: "well_controlled", label: "Yes, well controlled" },
    { value: "partially", label: "Partially controlled" },
    { value: "uncontrolled", label: "No, uncontrolled" },
    { value: "not_applicable", label: "Not applicable" },
    { value: "unknown", label: "Unknown" },
]

export const MOBILITY_OPTIONS: Opt[] = [
    { value: "independent", label: "Fully independent" },
    { value: "cane_walker", label: "Cane / walker" },
    { value: "wheelchair", label: "Wheelchair" },
    { value: "bedbound", label: "Bedbound / limited mobility" },
    { value: "other", label: "Other" },
]

export const RISK_TIMELINE_OPTIONS: Opt[] = [
    { value: "within_30_days", label: "Within 30 days" },
    { value: "within_6_months", label: "Within 6 months" },
    { value: "within_12_months", label: "Within 12 months" },
    { value: "no_history", label: "No history" },
]

export const ARSON_OPTIONS: Opt[] = [
    { value: "yes_current", label: "Yes, current charges" },
    { value: "yes_historical", label: "Yes, historical" },
    { value: "no", label: "No" },
    { value: "unknown", label: "Unknown" },
]

export const RSO_OPTIONS: Opt[] = [
    { value: "yes_registered", label: "Yes, currently registered" },
    { value: "yes_pending", label: "Yes, pending charges" },
    { value: "no", label: "No" },
    { value: "unknown", label: "Unknown" },
]

export const SUPERVISION_OPTIONS: Opt[] = [
    { value: "none", label: "None" },
    { value: "probation", label: "On probation" },
    { value: "parole", label: "On parole" },
    { value: "pretrial", label: "Pretrial" },
]

export const URGENCY_OPTIONS: Opt[] = [
    { value: "immediate", label: "Immediate" },
    { value: "within_1_2_weeks", label: "Within 1–2 weeks" },
    { value: "within_1_3_months", label: "Within 1–3 months" },
    { value: "planning_ahead", label: "Planning ahead" },
]

export const HOW_HEARD_OPTIONS: Opt[] = [
    { value: "colleague", label: "Colleague / professional referral" },
    { value: "website", label: "Website / online search" },
    { value: "previous_monarch", label: "Previous experience with Monarch" },
    { value: "conference", label: "Conference / training" },
    { value: "other", label: "Other" },
]

export const LOC_LEVEL_OPTIONS: Opt[] = [
    { value: "level_1", label: "Level 1" },
    { value: "level_2", label: "Level 2" },
    { value: "not_determined", label: "Not determined / not sure" },
]

export const CMHS_WAIVER_OPTIONS: Opt[] = [
    { value: "enrolled", label: "Enrolled" },
    { value: "pending", label: "Application pending" },
    { value: "not_enrolled", label: "Not enrolled" },
    { value: "unknown", label: "Unknown" },
]

export const DOSE_UNIT_OPTIONS: Opt[] = [
    { value: "mg", label: "mg" },
    { value: "g", label: "g" },
    { value: "oz", label: "oz" },
    { value: "ml", label: "ml" },
    { value: "drinks", label: "drinks" },
    { value: "bottles", label: "bottles" },
    { value: "nips", label: "nips" },
    { value: "pills", label: "pills" },
    { value: "bags", label: "bags" },
    { value: "times", label: "times" },
    { value: "doses", label: "doses" },
]

export const MED_FREQUENCY_OPTIONS: Opt[] = [
    { value: "hourly", label: "Hourly" },
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "prn", label: "PRN (As needed)" },
]

export const FREQUENCY_OPTIONS: Opt[] = [
    { value: "hourly", label: "Hourly" },
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "yearly", label: "Yearly" },
    { value: "1_2_past_month", label: "1-2 times in the past month" },
    { value: "1_2_past_week", label: "1-2 times in the past week" },
    { value: "3_6_past_week", label: "3-6 times in the past week" },
    { value: "none_past_month", label: "No use in the past month" },
    { value: "other", label: "Other" },
]

export const PATTERN_OF_USE_OPTIONS: Opt[] = [
    { value: "refused", label: "Refused to answer" },
    { value: "unknown", label: "Unknown" },
    { value: "binge", label: "Binge" },
    { value: "episodic", label: "Episodic" },
    { value: "continuous", label: "Continuous" },
]

export const ROUTE_OPTIONS: Opt[] = [
    { value: "oral", label: "Oral" },
    { value: "intravenous", label: "Intravenous" },
    { value: "intranasal", label: "Intranasal" },
    { value: "intramuscular", label: "Intramuscular" },
    { value: "inhaled", label: "Inhaled" },
    { value: "smoked", label: "Smoked" },
    { value: "sublingual", label: "Sublingual" },
    { value: "subcutaneous", label: "Subcutaneous" },
    { value: "topical", label: "Topical" },
    { value: "rectal", label: "Rectal" },
    { value: "other", label: "Other" },
]

export const TREATMENT_LEVELS: Opt[] = [
    { value: "inpatient", label: "Inpatient" },
    { value: "outpatient_iop_php", label: "Outpatient / IOP / PHP" },
    { value: "residential", label: "Residential" },
    { value: "detox", label: "Detox" },
    { value: "hospital", label: "Hospital" },
    { value: "therapist", label: "Therapist" },
    { value: "other", label: "Other" },
]

export const DISCHARGE_TYPE_OPTIONS: Opt[] = [
    { value: "completed", label: "Completed" },
    { value: "self", label: "Self" },
    { value: "unknown", label: "Unknown" },
    { value: "other", label: "Other" },
]

export const DOCUMENT_CHECKLIST: { code: string; label: string; starred?: boolean }[] = [
    { code: "medication_list_mar", label: "Current medication list (MAR), including PRN", starred: true },
    { code: "social_work_progress_notes", label: "Most recent social work progress notes", starred: true },
    {
        code: "psychiatric_progress_notes",
        label: "Most recent psychiatric progress notes (review for sections 9 and 10)",
        starred: true,
    },
    { code: "insurance_cards", label: "Health First Colorado / Medicare cards" },
    { code: "nursing_notes", label: "Most recent nursing notes" },
    { code: "evaluation", label: "Most recent psychiatric / psychological evaluation" },
    { code: "incident_reports", label: "Incident reports" },
    { code: "legal_history", label: "Legal history" },
    { code: "court_orders_cert", label: "Court-ordered medication or outpatient certification" },
    { code: "loc_waiver_docs", label: "LOC assessment / CMHS waiver documentation" },
    { code: "authorized_rep_docs", label: "Authorized-representative documents (POA, guardianship)" },
    { code: "collateral", label: "Collateral (biopsychosocial, treatment plans, therapy notes)" },
    { code: "identification", label: "ID: Colorado ID, Social Security card, birth certificate" },
    { code: "signed_roi", label: "Signed ROI(s)" },
    { code: "protection_order", label: "Protection / restraining order" },
]

export const MH_STEP_SHORT_LABELS = [
    "Referral source",
    "Level of care",
    "Demographics",
    "Coverage",
    "Location",
    "Clinical",
    "Substance use",
    "Medical",
    "Safety",
    "Legal",
    "Contacts",
    "Documents",
    "Timeline",
    "Attestation",
] as const
