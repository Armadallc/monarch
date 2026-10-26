import { MH_PROGRAM_ID } from "../../config/mentalHealth"
import { FACILITY_LOCATIONS } from "./mhOptions"
import { findCma } from "./mhRaeCma"
import type { MedicationRow, MhFormState, WordingMode } from "./mhTypes"
import { wordingMode } from "./mhTypes"

function formatMedicationList(rows: MedicationRow[]): string | null {
    const lines = rows
        .filter((r) => r.name.trim())
        .map((r) => {
            const dose = [r.dose.trim(), r.dose_unit.trim()].filter(Boolean).join(" ")
            const parts = [r.name.trim(), dose, r.frequency.trim()].filter(Boolean)
            return parts.join(" — ")
        })
    return lines.length ? lines.join("\n") : null
}

function digits(phone: string): string | null {
    const d = (phone || "").replace(/\D/g, "")
    return d || null
}

function emptyToNull(v: string | undefined | null): string | null {
    const t = (v || "").trim()
    return t || null
}

function dateOrNull(v: string): string | null {
    const t = (v || "").trim()
    return t || null
}

function joinLines(rows: string[]): string | null {
    const cleaned = rows.map((r) => r.trim()).filter(Boolean)
    return cleaned.length ? cleaned.join("\n") : null
}

/** Light field inventory for form_completion_percentage (0–100). */
export function computeCompletionPercentage(f: MhFormState): number {
    const checks: boolean[] = [
        !!(f.referral_source_type || f.referral_source_first),
        !!(f.client_first_name && f.client_last_name),
        !!(f.client_dob || f.client_phone || f.client_email),
        !!(f.medicaid_status || f.medicare_status),
        !!f.current_location_type,
        !!(f.reason_for_referral || f.diagnoses.some((d) => d.trim())),
        !!(f.substance_use_none || f.substance_use.some((r) => r.substance) || f.substance_use_history),
        !!(
            f.medical_diagnoses.some((d) => d.trim()) ||
            f.non_psychiatric_medications.some((r) => r.name.trim())
        ),
        !!(f.suicide_risk || f.violence_risk || f.safety_notes),
        !!(f.active_court_case || f.legal_history || f.protection_order_active),
        f.contacts.some((c) => c.name.trim()),
        f.documents_available.length > 0,
        !!f.urgency_level,
        !!(f.attestation_checked && f.attestation_name.trim()),
    ]
    const filled = checks.filter(Boolean).length
    return Math.round((filled / checks.length) * 100)
}

export function validateMhSubmit(f: MhFormState): string | null {
    const mode = wordingMode(f.referral_source_type)
    if (!f.referral_source_type.trim()) {
        return "Please select your relationship to the individual (step 1)."
    }
    if (!f.client_first_name.trim() || !f.client_last_name.trim()) {
        return "Please enter the individual's first and last name."
    }
    if (mode === "self") {
        if (!f.client_phone.trim() && !f.client_email.trim()) {
            return "Please provide a phone number or email so we can reach you."
        }
        // referral_source_email is NOT NULL in DB — need an email on the row
        if (!f.client_email.trim() && !f.referral_source_email.trim()) {
            return "Please provide an email address (required to save the referral)."
        }
    } else {
        if (!f.referral_source_first.trim() || !f.referral_source_last.trim()) {
            return "Please enter your first and last name (step 1)."
        }
        if (!f.referral_source_email.trim()) {
            return "Please provide your email (required to save the referral)."
        }
    }
    if (!f.attestation_checked || !f.attestation_name.trim()) {
        return "Please check the attestation and type your full name."
    }
    return null
}

export type MhSubmittedVia = "portal" | "public_web" | "paper"

export function buildMhInsertPayload(
    f: MhFormState,
    submittedByUserId: string | null,
    options?: { submittedVia?: MhSubmittedVia }
): Record<string, unknown> {
    const submittedVia: MhSubmittedVia = options?.submittedVia ?? (submittedByUserId ? "portal" : "public_web")
    const mode: WordingMode = wordingMode(f.referral_source_type)
    const sourceName =
        mode === "self"
            ? `${f.client_first_name.trim()} ${f.client_last_name.trim()}`.trim()
            : `${f.referral_source_first.trim()} ${f.referral_source_last.trim()}`.trim()

    const diagnoses = f.diagnoses.map((d) => d.trim()).filter(Boolean)
    const medicalDx = f.medical_diagnoses.map((d) => d.trim()).filter(Boolean)

    const additional_contacts = f.contacts
        .filter((c) => c.name.trim())
        .map((c) => ({
            type: c.type,
            // ROI party fields: name / role / contact (org + phone + email)
            name: c.name.trim(),
            organization: emptyToNull(c.organization),
            role: emptyToNull(c.role),
            phone: digits(c.phone),
            email: emptyToNull(c.email)?.toLowerCase() ?? null,
            contact: [c.organization, c.phone, c.email]
                .map((x) => String(x || "").trim())
                .filter(Boolean)
                .join(" · ") || null,
            roi_permission: emptyToNull(c.roi_permission),
        }))

    const emergency = additional_contacts.find((c) => c.type === "emergency")

    const documents_available = Object.fromEntries(
        f.documents_available.map((code) => [code, { status: "can_obtain" }])
    )

    const mh_intake: Record<string, unknown> = {
        relationship_other: emptyToNull(f.relationship_other),
        referrer_is_authorized_rep: f.referrer_is_authorized_rep || null,
        medicaid_eligible: emptyToNull(f.medicaid_eligible),
        cma: {
            agency_name: emptyToNull(f.cma_agency_name),
            case_manager_name: emptyToNull(f.cma_case_manager_name),
            case_manager_contact: emptyToNull(f.cma_case_manager_contact),
        },
        private_insurance: {
            carrier: emptyToNull(f.private_insurance_carrier),
            member_id: emptyToNull(f.private_insurance_member_id),
        },
        reason_for_referral: emptyToNull(f.reason_for_referral),
        diagnoses,
        latest_evaluation: {
            date: dateOrNull(f.eval_date),
            type: emptyToNull(f.eval_type),
            evaluator: emptyToNull(f.eval_evaluator),
            organization: emptyToNull(f.eval_organization),
        },
        court_ordered_meds: emptyToNull(f.court_ordered_meds),
        outpatient_cert: emptyToNull(f.outpatient_cert),
        outpatient_cert_term: emptyToNull(f.outpatient_cert_term),
        psychiatric_medications: f.psychiatric_medications.filter((r) => r.name.trim()),
        psychiatric_prescribers: f.psychiatric_prescribers
            .filter((p) => p.name.trim())
            .map((p) => ({ name: p.name.trim(), phone: digits(p.phone) })),
        therapist: {
            name: emptyToNull(f.therapist_name),
            agency: emptyToNull(f.therapist_agency),
            phone: digits(f.therapist_phone),
            email: emptyToNull(f.therapist_email)?.toLowerCase() ?? null,
            roi_permission: emptyToNull(f.therapist_roi_permission),
        },
        idd_co_occurring_smi: emptyToNull(f.idd_co_occurring_smi),
        treatment_history_none: f.treatment_history_none,
        treatment_history: f.treatment_history.filter((r) => r.level || r.facility),
        substance_use_none: f.substance_use_none,
        substance_use: f.substance_use.filter((r) => r.substance),
        non_psychiatric_medications: f.non_psychiatric_medications.filter((r) => r.name.trim()),
        medical_prescribers: f.medical_prescribers
            .filter((p) => p.name.trim())
            .map((p) => ({ name: p.name.trim(), phone: digits(p.phone) })),
        needs_24_7_nursing: emptyToNull(f.needs_24_7_nursing),
        dietary_needs: emptyToNull(f.dietary_needs),
        tobacco_use: emptyToNull(f.tobacco_use),
        restraints: emptyToNull(f.restraints),
        restraints_detail: emptyToNull(f.restraints_detail),
        seclusion: emptyToNull(f.seclusion),
        seclusion_detail: emptyToNull(f.seclusion_detail),
        suicide_risk_detail: emptyToNull(f.suicide_risk_detail),
        violence_risk_detail: emptyToNull(f.violence_risk_detail),
        elopement_risk_detail: emptyToNull(f.elopement_risk_detail),
        locked_facility_behaviors: emptyToNull(f.locked_facility_behaviors),
        incidents_6_months: emptyToNull(f.incidents_6_months),
        incidents_details: emptyToNull(f.incidents_details),
        additional_safety_info: emptyToNull(f.additional_safety_info),
        active_court_case: emptyToNull(f.active_court_case),
        court_cases: f.court_cases.filter(
            (c) => c.charges.trim() || c.case_number.trim() || c.attorney_name.trim()
        ),
        legal_history: emptyToNull(f.legal_history),
        protection_order: {
            active: emptyToNull(f.protection_order_active),
            status: f.protection_order_status,
            protected_parties: emptyToNull(f.protection_order_parties),
            case_number: emptyToNull(f.protection_order_case_number),
            copy: emptyToNull(f.protection_order_copy),
            unavailable_reason: emptyToNull(f.protection_order_unavailable_reason),
        },
        supervision: emptyToNull(f.supervision),
        active_warrants_detail:
            f.active_warrants === "yes"
                ? f.active_warrant_details.filter(
                      (w) =>
                          w.county.trim() ||
                          w.case_number.trim() ||
                          w.charge.trim() ||
                          w.issued.trim() ||
                          w.notes.trim()
                  )
                : [],
        how_heard_other: emptyToNull(f.how_heard_other),
        attestation_signature_style: f.attestation_signature_style,
        attestation_user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
        wording_mode: mode,
        coverage_same_as_loc: f.coverage_same_as_loc || null,
    }

    if (mode === "professional") {
        const cma = findCma(f.loc_rae, f.loc_cma_id)
        mh_intake.loc = {
            completed: emptyToNull(f.loc_completed),
            level: emptyToNull(f.loc_level),
            cmhs_waiver_status: emptyToNull(f.loc_cmhs_waiver_status),
            rae: emptyToNull(f.loc_rae),
            cma_id: emptyToNull(f.loc_cma_id),
            cma_name: cma?.name ?? null,
            cma_counties: cma?.counties ?? null,
            date: dateOrNull(f.loc_date),
            case_manager_name: emptyToNull(f.loc_case_manager_name),
            case_manager_phone: digits(f.loc_case_manager_phone),
            case_manager_email: emptyToNull(f.loc_case_manager_email)?.toLowerCase() ?? null,
            case_manager_same_as_source: f.loc_case_manager_same_as_source || null,
            case_manager_roi_permission: emptyToNull(f.loc_case_manager_roi_permission),
        }
    }

    const inFacility = FACILITY_LOCATIONS.has(f.current_location_type)

    const row: Record<string, unknown> = {
        origin_program_id: MH_PROGRAM_ID,
        intended_program_id: MH_PROGRAM_ID,
        current_program_id: MH_PROGRAM_ID,
        submitted_via: submittedVia,
        status: "pending_review",
        is_priority_referral: false,
        portal_access_opt_in: null,
        submitted_by_user_id: submittedByUserId,
        form_completion_percentage: computeCompletionPercentage(f),
        mh_intake,

        // NOT NULL columns — never send null (PostgREST 400)
        referral_source_type: f.referral_source_type.trim(),
        referral_source_name: sourceName || "Unknown",
        referral_source_organization:
            mode === "professional" ? emptyToNull(f.referral_source_organization) : null,
        referral_source_title: mode === "professional" ? emptyToNull(f.referral_source_title) : null,
        referral_source_phone:
            mode === "self" ? digits(f.client_phone) : digits(f.referral_source_phone),
        referral_source_email: (
            mode === "self"
                ? f.client_email.trim() || f.referral_source_email.trim()
                : f.referral_source_email.trim()
        ).toLowerCase(),
        previous_monarch_referral: emptyToNull(f.previous_monarch_referral),

        client_first_name: f.client_first_name.trim(),
        client_middle_name: emptyToNull(f.client_middle_name),
        client_last_name: f.client_last_name.trim(),
        client_preferred_name: emptyToNull(f.client_preferred_name),
        client_dob: dateOrNull(f.client_dob),
        client_ssn: emptyToNull(f.client_ssn),
        client_phone: digits(f.client_phone),
        client_email: emptyToNull(f.client_email)?.toLowerCase() ?? null,
        client_address_line1: emptyToNull(f.client_address_line1),
        client_address_line2: emptyToNull(f.client_address_line2),
        client_city: emptyToNull(f.client_city),
        client_state: emptyToNull(f.client_state),
        client_postal_code: emptyToNull(f.client_postal_code),
        client_gender_identity: f.client_gender_identity.length ? f.client_gender_identity : null,
        client_gender_detail: emptyToNull(f.client_gender_detail),
        client_sex_at_birth: emptyToNull(f.client_sex_at_birth),
        client_pronouns: emptyToNull(f.client_pronouns),
        client_primary_language: emptyToNull(f.client_primary_language),
        client_english_proficiency: emptyToNull(f.client_english_proficiency),
        interpreter_needed: f.interpreter_needed === "yes",
        client_race: f.client_race.length ? f.client_race : null,
        client_ethnicity: emptyToNull(f.client_ethnicity),
        client_marital_status: emptyToNull(f.client_marital_status),
        client_military_status: emptyToNull(f.client_military_status),
        client_consents_to_referral:
            mode === "self" ? "yes" : emptyToNull(f.client_consents_to_referral),

        medicaid_status: emptyToNull(f.medicaid_status),
        medicaid_number: emptyToNull(f.medicaid_number),
        medicaid_mco: emptyToNull(f.medicaid_mco),
        has_private_insurance: f.has_private_insurance === "yes",
        private_insurance_details: emptyToNull(f.private_insurance_details),
        medicare_status: emptyToNull(f.medicare_status),
        medicare_number: emptyToNull(f.medicare_number),
        ssdi_status: emptyToNull(f.ssdi_status),
        benefits_notes: emptyToNull(f.benefits_notes),

        current_location_type: emptyToNull(f.current_location_type),
        facility_name: inFacility ? emptyToNull(f.facility_name) : null,
        facility_contact_phone: inFacility ? digits(f.facility_contact_phone) : null,
        facility_address: inFacility ? emptyToNull(f.facility_address) : null,
        facility_contact_person: inFacility ? emptyToNull(f.facility_contact_person) : null,
        inmate_id: inFacility ? emptyToNull(f.inmate_id) : null,
        expected_release_date: inFacility ? dateOrNull(f.expected_release_date) : null,
        housing_prior: emptyToNull(f.housing_prior),
        housing_notes: emptyToNull(f.housing_notes),

        current_diagnoses: joinLines(diagnoses),
        current_medications: formatMedicationList(f.psychiatric_medications),
        medication_compliance: emptyToNull(f.medication_compliance),
        medication_barriers: emptyToNull(f.medication_barriers),
        psychiatric_history: emptyToNull(f.psychiatric_history),
        tbi_history: emptyToNull(f.tbi_history),
        tbi_details: emptyToNull(f.tbi_details),
        idd_status: emptyToNull(f.idd_status),
        previous_treatment_programs: emptyToNull(f.previous_treatment_programs),

        substance_use_history: emptyToNull(f.substance_use_history),
        detox_required: emptyToNull(f.detox_required),
        detox_details: emptyToNull(f.detox_details),

        medical_conditions: joinLines([
            ...medicalDx,
            f.medical_notes.trim() ? `Notes: ${f.medical_notes.trim()}` : "",
        ]),
        medical_conditions_controlled: emptyToNull(f.medical_conditions_controlled),
        medications_non_psychiatric: formatMedicationList(f.non_psychiatric_medications),
        medication_allergies: emptyToNull(f.medication_allergies),
        mobility_needs: emptyToNull(f.mobility_needs),
        adl_support_details: emptyToNull(f.adl_support_details),
        adl_support_needed: !!f.adl_support_details.trim(),
        acute_medical_needs: emptyToNull(f.acute_medical_needs),

        suicide_risk: emptyToNull(f.suicide_risk),
        violence_risk: emptyToNull(f.violence_risk),
        elopement_risk: emptyToNull(f.elopement_risk),
        safety_notes: emptyToNull(f.safety_notes),
        arson_history: emptyToNull(f.arson_history),
        arson_details: emptyToNull(f.arson_details),
        rso_status: emptyToNull(f.rso_status),
        rso_details: emptyToNull(f.rso_details),

        // Legacy single-case columns: first court case when present
        charges: emptyToNull(f.court_cases[0]?.charges ?? ""),
        court_jurisdiction: emptyToNull(f.court_cases[0]?.county ?? ""),
        case_number: emptyToNull(f.court_cases[0]?.case_number ?? ""),
        next_court_date: dateOrNull(f.court_cases[0]?.next_court_date ?? ""),
        attorney_name: emptyToNull(f.court_cases[0]?.attorney_name ?? ""),
        attorney_phone: digits(f.court_cases[0]?.attorney_phone ?? ""),
        on_probation: f.supervision === "probation" || f.supervision === "pretrial",
        on_parole: f.supervision === "parole",
        probation_officer_contact:
            f.supervision === "probation" || f.supervision === "pretrial"
                ? emptyToNull(f.officer_contact)
                : null,
        parole_officer_contact: f.supervision === "parole" ? emptyToNull(f.officer_contact) : null,
        active_warrants: emptyToNull(f.active_warrants),

        additional_contacts,
        emergency_contact_name: emergency?.name ?? null,
        emergency_contact_relationship: emergency?.role ?? null,
        emergency_contact_phone: emergency?.phone ?? null,
        emergency_contact_can_provide_info:
            emergency?.roi_permission === "bilateral" || emergency?.roi_permission === "receive_only",

        documents_available,
        documents_notes: emptyToNull(f.documents_notes),
        uploaded_documents: [],

        urgency_level: emptyToNull(f.urgency_level),
        urgency_reason: emptyToNull(f.urgency_reason),
        requested_placement_by: dateOrNull(f.requested_placement_by),
        additional_notes: emptyToNull(f.additional_notes),
        referral_source_channel: emptyToNull(f.referral_source_channel),

        attestation_name: f.attestation_name.trim(),
        attested_at: new Date().toISOString(),
    }

    return row
}
