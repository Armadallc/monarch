import {
    LOVED_ONE_RELATIONSHIPS,
    PROFESSIONAL_RELATIONSHIPS,
} from "./mhOptions"

export type WordingMode = "professional" | "loved_one" | "self"

/** Matches ROI party slots: name + role + contact (org/phone/email) + permission. */
export type MhContact = {
    type: "emergency" | "guardian" | "payee" | "professional" | "other"
    name: string
    organization: string
    role: string
    phone: string
    email: string
    roi_permission: string
}

export type ActiveWarrantRow = {
    county: string
    case_number: string
    charge: string
    issued: string
    notes: string
}

export type SubstanceRow = {
    substance: string
    age_of_first_use: string
    last_use: string
    amount: string
    amount_unit: string
    frequency: string
    route: string
    pattern_of_use: string
    length_of_current_use: string
    method_of_acquisition: string
    notes: string
}

export type MedicationRow = {
    name: string
    dose: string
    dose_unit: string
    frequency: string
}

export type PrescriberRow = {
    name: string
    phone: string
}

export type CourtCaseRow = {
    charges: string
    county: string
    case_number: string
    next_court_date: string
    attorney_name: string
    attorney_phone: string
    attorney_email: string
    attorney_roi_permission: string
}

export type TreatmentRow = {
    level: string
    facility: string
    treated_for: string
    admit: string
    discharge: string
    discharge_type: string
}

export function emptyMedicationRow(): MedicationRow {
    return { name: "", dose: "", dose_unit: "", frequency: "" }
}

export function emptyPrescriberRow(): PrescriberRow {
    return { name: "", phone: "" }
}

export function emptySubstanceRow(): SubstanceRow {
    return {
        substance: "",
        age_of_first_use: "",
        last_use: "",
        amount: "",
        amount_unit: "",
        frequency: "",
        route: "",
        pattern_of_use: "",
        length_of_current_use: "",
        method_of_acquisition: "",
        notes: "",
    }
}

export function emptyCourtCaseRow(): CourtCaseRow {
    return {
        charges: "",
        county: "",
        case_number: "",
        next_court_date: "",
        attorney_name: "",
        attorney_phone: "",
        attorney_email: "",
        attorney_roi_permission: "",
    }
}

export function emptyWarrantRow(): ActiveWarrantRow {
    return {
        county: "",
        case_number: "",
        charge: "",
        issued: "",
        notes: "",
    }
}

export type MhFormState = {
    // §1
    referral_source_first: string
    referral_source_last: string
    referral_source_organization: string
    referral_source_title: string
    referral_source_phone: string
    referral_source_email: string
    referral_source_type: string
    relationship_other: string
    referrer_is_authorized_rep: boolean
    previous_monarch_referral: string

    // §2 LOC
    loc_completed: string
    loc_level: string
    loc_cmhs_waiver_status: string
    loc_rae: string
    loc_cma_id: string
    loc_date: string
    loc_case_manager_name: string
    loc_case_manager_phone: string
    loc_case_manager_email: string
    loc_case_manager_same_as_source: boolean
    loc_case_manager_roi_permission: string

    // §3 demographics
    client_first_name: string
    client_middle_name: string
    client_last_name: string
    client_preferred_name: string
    client_dob: string
    client_ssn: string
    client_phone: string
    client_email: string
    client_address_line1: string
    client_address_line2: string
    client_city: string
    client_state: string
    client_postal_code: string
    client_gender_identity: string[]
    client_gender_detail: string
    client_sex_at_birth: string
    client_pronouns: string
    client_primary_language: string
    client_english_proficiency: string
    interpreter_needed: string
    client_race: string[]
    client_ethnicity: string
    client_marital_status: string
    client_military_status: string
    client_consents_to_referral: string

    // §4 coverage
    medicaid_status: string
    medicaid_eligible: string
    medicaid_number: string
    medicaid_mco: string
    coverage_same_as_loc: boolean
    cma_agency_name: string
    cma_case_manager_name: string
    cma_case_manager_contact: string
    has_private_insurance: string
    private_insurance_carrier: string
    private_insurance_member_id: string
    private_insurance_details: string
    medicare_status: string
    medicare_number: string
    ssdi_status: string
    benefits_notes: string

    // §5 location
    current_location_type: string
    facility_name: string
    facility_contact_phone: string
    facility_address: string
    facility_contact_person: string
    inmate_id: string
    expected_release_date: string
    housing_prior: string
    housing_notes: string

    // §6 clinical
    reason_for_referral: string
    diagnoses: string[]
    eval_date: string
    eval_type: string
    eval_evaluator: string
    eval_organization: string
    psychiatric_medications: MedicationRow[]
    medication_compliance: string
    medication_barriers: string
    court_ordered_meds: string
    outpatient_cert: string
    outpatient_cert_term: string
    psychiatric_history: string
    psychiatric_prescribers: PrescriberRow[]
    therapist_name: string
    therapist_agency: string
    therapist_phone: string
    therapist_email: string
    therapist_roi_permission: string
    tbi_history: string
    tbi_details: string
    idd_status: string
    idd_co_occurring_smi: string
    treatment_history_none: boolean
    treatment_history: TreatmentRow[]
    previous_treatment_programs: string

    // §7 substance
    substance_use_none: boolean
    substance_use: SubstanceRow[]
    substance_use_history: string
    detox_required: string
    detox_details: string

    // §8 medical
    medical_diagnoses: string[]
    medical_notes: string
    medical_conditions_controlled: string
    non_psychiatric_medications: MedicationRow[]
    medical_prescribers: PrescriberRow[]
    medication_allergies: string
    mobility_needs: string
    adl_support_details: string
    acute_medical_needs: string
    needs_24_7_nursing: string
    dietary_needs: string
    tobacco_use: string

    // §9 safety
    suicide_risk: string
    suicide_risk_detail: string
    violence_risk: string
    violence_risk_detail: string
    elopement_risk: string
    elopement_risk_detail: string
    restraints: string
    restraints_detail: string
    seclusion: string
    seclusion_detail: string
    safety_notes: string
    locked_facility_behaviors: string
    incidents_6_months: string
    incidents_details: string
    arson_history: string
    arson_details: string
    rso_status: string
    rso_details: string
    additional_safety_info: string

    // §10 legal
    active_court_case: string
    court_cases: CourtCaseRow[]
    legal_history: string
    protection_order_active: string
    protection_order_status: string[]
    protection_order_parties: string
    protection_order_case_number: string
    protection_order_copy: string
    protection_order_unavailable_reason: string
    supervision: string
    officer_contact: string
    active_warrants: string
    active_warrant_details: ActiveWarrantRow[]

    // §11 contacts
    contacts: MhContact[]

    // §12 documents
    documents_available: string[]
    documents_notes: string

    // §13 timeline
    urgency_level: string
    urgency_reason: string
    requested_placement_by: string
    additional_notes: string
    referral_source_channel: string
    how_heard_other: string

    // §14 attestation
    attestation_checked: boolean
    attestation_name: string
    attestation_signature_style: "typed" | "script"
}

export function emptyContact(type: MhContact["type"]): MhContact {
    return {
        type,
        name: "",
        organization: "",
        role: "",
        phone: "",
        email: "",
        roi_permission: "",
    }
}

export function initialMhFormState(email = ""): MhFormState {
    return {
        referral_source_first: "",
        referral_source_last: "",
        referral_source_organization: "",
        referral_source_title: "",
        referral_source_phone: "",
        referral_source_email: email,
        referral_source_type: "",
        relationship_other: "",
        referrer_is_authorized_rep: false,
        previous_monarch_referral: "",

        loc_completed: "",
        loc_level: "",
        loc_cmhs_waiver_status: "",
        loc_rae: "",
        loc_cma_id: "",
        loc_date: "",
        loc_case_manager_name: "",
        loc_case_manager_phone: "",
        loc_case_manager_email: "",
        loc_case_manager_same_as_source: false,
        loc_case_manager_roi_permission: "",

        client_first_name: "",
        client_middle_name: "",
        client_last_name: "",
        client_preferred_name: "",
        client_dob: "",
        client_ssn: "",
        client_phone: "",
        client_email: "",
        client_address_line1: "",
        client_address_line2: "",
        client_city: "",
        client_state: "",
        client_postal_code: "",
        client_gender_identity: [],
        client_gender_detail: "",
        client_sex_at_birth: "",
        client_pronouns: "",
        client_primary_language: "",
        client_english_proficiency: "",
        interpreter_needed: "",
        client_race: [],
        client_ethnicity: "",
        client_marital_status: "",
        client_military_status: "",
        client_consents_to_referral: "",

        medicaid_status: "",
        medicaid_eligible: "",
        medicaid_number: "",
        medicaid_mco: "",
        coverage_same_as_loc: false,
        cma_agency_name: "",
        cma_case_manager_name: "",
        cma_case_manager_contact: "",
        has_private_insurance: "",
        private_insurance_carrier: "",
        private_insurance_member_id: "",
        private_insurance_details: "",
        medicare_status: "",
        medicare_number: "",
        ssdi_status: "",
        benefits_notes: "",

        current_location_type: "",
        facility_name: "",
        facility_contact_phone: "",
        facility_address: "",
        facility_contact_person: "",
        inmate_id: "",
        expected_release_date: "",
        housing_prior: "",
        housing_notes: "",

        reason_for_referral: "",
        diagnoses: ["", "", ""],
        eval_date: "",
        eval_type: "",
        eval_evaluator: "",
        eval_organization: "",
        psychiatric_medications: [emptyMedicationRow(), emptyMedicationRow(), emptyMedicationRow()],
        medication_compliance: "",
        medication_barriers: "",
        court_ordered_meds: "",
        outpatient_cert: "",
        outpatient_cert_term: "",
        psychiatric_history: "",
        psychiatric_prescribers: [emptyPrescriberRow()],
        therapist_name: "",
        therapist_agency: "",
        therapist_phone: "",
        therapist_email: "",
        therapist_roi_permission: "",
        tbi_history: "",
        tbi_details: "",
        idd_status: "",
        idd_co_occurring_smi: "",
        treatment_history_none: false,
        treatment_history: [],
        previous_treatment_programs: "",

        substance_use_none: false,
        substance_use: [],
        substance_use_history: "",
        detox_required: "",
        detox_details: "",

        medical_diagnoses: ["", "", ""],
        medical_notes: "",
        medical_conditions_controlled: "",
        non_psychiatric_medications: [emptyMedicationRow(), emptyMedicationRow(), emptyMedicationRow()],
        medical_prescribers: [emptyPrescriberRow()],
        medication_allergies: "",
        mobility_needs: "",
        adl_support_details: "",
        acute_medical_needs: "",
        needs_24_7_nursing: "",
        dietary_needs: "",
        tobacco_use: "",

        suicide_risk: "",
        suicide_risk_detail: "",
        violence_risk: "",
        violence_risk_detail: "",
        elopement_risk: "",
        elopement_risk_detail: "",
        restraints: "",
        restraints_detail: "",
        seclusion: "",
        seclusion_detail: "",
        safety_notes: "",
        locked_facility_behaviors: "",
        incidents_6_months: "",
        incidents_details: "",
        arson_history: "",
        arson_details: "",
        rso_status: "",
        rso_details: "",
        additional_safety_info: "",

        active_court_case: "",
        court_cases: [emptyCourtCaseRow()],
        legal_history: "",
        protection_order_active: "",
        protection_order_status: [],
        protection_order_parties: "",
        protection_order_case_number: "",
        protection_order_copy: "",
        protection_order_unavailable_reason: "",
        supervision: "",
        officer_contact: "",
        active_warrants: "",
        active_warrant_details: [emptyWarrantRow()],

        contacts: [emptyContact("emergency")],

        documents_available: [],
        documents_notes: "",

        urgency_level: "",
        urgency_reason: "",
        requested_placement_by: "",
        additional_notes: "",
        referral_source_channel: "",
        how_heard_other: "",

        attestation_checked: false,
        attestation_name: "",
        attestation_signature_style: "typed",
    }
}

export function wordingMode(relationship: string): WordingMode {
    if (relationship === "self") return "self"
    if (LOVED_ONE_RELATIONSHIPS.has(relationship)) return "loved_one"
    if (PROFESSIONAL_RELATIONSHIPS.has(relationship) || relationship) return "professional"
    return "professional"
}

export function personLabel(mode: WordingMode): string {
    if (mode === "self") return "your"
    if (mode === "loved_one") return "your loved one's"
    return "the individual's"
}

export function personSubject(mode: WordingMode): string {
    if (mode === "self") return "you"
    if (mode === "loved_one") return "your loved one"
    return "the individual"
}
