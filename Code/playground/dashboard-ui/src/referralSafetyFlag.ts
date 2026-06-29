import type { MockReferral } from "./types"

/** ReferralForm fields that can trigger the safety flag on kanban cards. */
export type ReferralSafetyFlagFields = Pick<
    MockReferral,
    | "medication_compliance"
    | "detox_required"
    | "mobility_needs"
    | "adl_support_needed"
    | "suicide_risk"
    | "violence_risk"
    | "elopement_risk"
    | "arson_history"
    | "rso_status"
    | "has_safety_flags"
>

function isRiskAffirmative(value?: string | null): boolean {
    const v = (value ?? "").trim().toLowerCase()
    return v.length > 0 && v !== "no_history"
}

function hasExplicitSafetyFields(r: ReferralSafetyFlagFields): boolean {
    return (
        r.medication_compliance != null ||
        r.detox_required != null ||
        r.mobility_needs != null ||
        r.adl_support_needed != null ||
        r.suicide_risk != null ||
        r.violence_risk != null ||
        r.elopement_risk != null ||
        r.arson_history != null ||
        r.rso_status != null
    )
}

/**
 * Red flag on referral cards when form answers indicate Monarch cannot meet needs
 * or elevated safety review is required (Steps 8–11 on ReferralForm).
 */
export function referralHasSafetyFlag(r: ReferralSafetyFlagFields): boolean {
    if (!hasExplicitSafetyFields(r)) {
        return !!r.has_safety_flags
    }

    if (r.medication_compliance === "non_compliant") return true
    if (r.detox_required === "yes") return true
    if (r.mobility_needs === "bedbound" || r.mobility_needs === "wheelchair") return true
    if (r.adl_support_needed === true) return true

    if (isRiskAffirmative(r.suicide_risk)) return true
    if (isRiskAffirmative(r.violence_risk)) return true
    if (isRiskAffirmative(r.elopement_risk)) return true

    const arson = (r.arson_history ?? "").trim().toLowerCase()
    if (arson === "yes_current" || arson === "yes_historical") return true

    const rso = (r.rso_status ?? "").trim().toLowerCase()
    if (rso === "yes_registered" || rso === "yes_charges") return true

    return false
}
