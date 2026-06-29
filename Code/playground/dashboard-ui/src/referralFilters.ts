import type { PortalFilter } from "./components/PortalSummaryBar"
import type { MockReferral, ReferralSourceType, ReferralStatus } from "./types"
import { STATUS_LABELS } from "./types"
import { clientDisplayId } from "./utils"

/** ReferralForm Step 1 — filter labels for admissions staff (not Monarch program). */
export const REFERRAL_SOURCE_TYPE_FILTER_OPTIONS: { value: ReferralSourceType; label: string }[] = [
    { value: "court", label: "Courts" },
    { value: "legal_representative", label: "Legal Representative" },
    { value: "probation_parole", label: "Probation/Parole" },
    { value: "mental_health_facility", label: "Treatment Facility" },
    { value: "case_management", label: "CMA / Social Services" },
]

const REFERRAL_SOURCE_TYPE_LABELS: Record<ReferralSourceType, string> = {
    court: "Courts",
    legal_representative: "Legal Representative",
    probation_parole: "Probation/Parole",
    mental_health_facility: "Treatment Facility",
    case_management: "CMA / Social Services",
}

export function referralSourceTypeLabel(type: ReferralSourceType): string {
    return REFERRAL_SOURCE_TYPE_LABELS[type]
}

export type PortalReferralFilters = {
    search: string
    status: ReferralStatus | "all"
    urgent: "all" | "true" | "false"
    program: string
}

export const DEFAULT_PORTAL_REFERRAL_FILTERS: PortalReferralFilters = {
    search: "",
    status: "all",
    urgent: "all",
    program: "all",
}

export type ReferralViewMode = "column" | "row"

export type ReferralSortField =
    | "created_at"
    | "activity"
    | "client_name"
    | "ref_id"
    | "status"
    | "program"
    | "organization"
    | "assignee"
    | "referral_source"
    | "urgency"

export type ReferralFilters = {
    search: string
    assignee: string
    organization: string
    sourceType: ReferralSourceType | "all"
}

export type ReferralSort = {
    field: ReferralSortField
    direction: "asc" | "desc"
}

export const DEFAULT_REFERRAL_FILTERS: ReferralFilters = {
    search: "",
    assignee: "all",
    organization: "all",
    sourceType: "all",
}

export const DEFAULT_REFERRAL_SORT: ReferralSort = {
    field: "created_at",
    direction: "desc",
}

export const REFERRAL_SORT_OPTIONS: { value: string; label: string; field: ReferralSortField; direction: "asc" | "desc" }[] = [
    { value: "created_at:desc", label: "Date submitted (newest)", field: "created_at", direction: "desc" },
    { value: "created_at:asc", label: "Date submitted (oldest)", field: "created_at", direction: "asc" },
    { value: "activity:desc", label: "Last activity (newest)", field: "activity", direction: "desc" },
    { value: "activity:asc", label: "Last activity (oldest)", field: "activity", direction: "asc" },
    { value: "ref_id:asc", label: "REF ID (A–Z)", field: "ref_id", direction: "asc" },
    { value: "ref_id:desc", label: "REF ID (Z–A)", field: "ref_id", direction: "desc" },
    { value: "client_name:asc", label: "Client name (A–Z)", field: "client_name", direction: "asc" },
    { value: "client_name:desc", label: "Client name (Z–A)", field: "client_name", direction: "desc" },
    { value: "status:asc", label: "Status (pipeline order)", field: "status", direction: "asc" },
    { value: "status:desc", label: "Status (reverse pipeline)", field: "status", direction: "desc" },
    { value: "program:asc", label: "Program (A–Z)", field: "program", direction: "asc" },
    { value: "program:desc", label: "Program (Z–A)", field: "program", direction: "desc" },
    { value: "organization:asc", label: "Organization (A–Z)", field: "organization", direction: "asc" },
    { value: "organization:desc", label: "Organization (Z–A)", field: "organization", direction: "desc" },
    { value: "assignee:asc", label: "Assignee (A–Z)", field: "assignee", direction: "asc" },
    { value: "assignee:desc", label: "Assignee (Z–A)", field: "assignee", direction: "desc" },
    { value: "referral_source:asc", label: "Referral source (A–Z)", field: "referral_source", direction: "asc" },
    { value: "referral_source:desc", label: "Referral source (Z–A)", field: "referral_source", direction: "desc" },
    { value: "urgency:desc", label: "Urgency (highest first)", field: "urgency", direction: "desc" },
    { value: "urgency:asc", label: "Urgency (lowest first)", field: "urgency", direction: "asc" },
]

const STATUS_ORDER: Record<ReferralStatus, number> = {
    pending_review: 0,
    under_review: 1,
    waitlisted: 2,
    accepted: 3,
    declined: 4,
}

function clientName(r: MockReferral): string {
    return `${r.client_last_name} ${r.client_first_name}`.trim().toLowerCase()
}

function urgencyScore(r: MockReferral): number {
    if (!r.urgent_placement) return 0
    const level = (r.urgency_level || "").toLowerCase()
    if (level === "asap") return 3
    if (level === "conditional_timeline") return 2
    return 1
}

function compareStrings(a: string, b: string, direction: "asc" | "desc"): number {
    const cmp = a.localeCompare(b, undefined, { sensitivity: "base" })
    return direction === "asc" ? cmp : -cmp
}

export function portalReferralFilterOptions(referrals: MockReferral[]) {
    const programs = new Set<string>()
    for (const r of referrals) {
        if (r.program) programs.add(r.program)
    }
    return {
        programs: [...programs].sort((a, b) => a.localeCompare(b)),
    }
}

export function referralFilterOptions(referrals: MockReferral[]) {
    const assignees = new Set<string>()
    const organizations = new Set<string>()

    for (const r of referrals) {
        if (r.assignee_name) assignees.add(r.assignee_name)
        if (r.organization) organizations.add(r.organization)
    }

    return {
        assignees: [...assignees].sort((a, b) => a.localeCompare(b)),
        organizations: [...organizations].sort((a, b) => a.localeCompare(b)),
        sourceTypes: REFERRAL_SOURCE_TYPE_FILTER_OPTIONS,
    }
}

export function hasActiveReferralFilters(filters: ReferralFilters): boolean {
    return (
        filters.search.trim() !== "" ||
        filters.assignee !== "all" ||
        filters.organization !== "all" ||
        filters.sourceType !== "all"
    )
}

export function parseSortValue(value: string): ReferralSort {
    const match = REFERRAL_SORT_OPTIONS.find((o) => o.value === value)
    if (match) return { field: match.field, direction: match.direction }
    return DEFAULT_REFERRAL_SORT
}

export function sortValueFromConfig(sort: ReferralSort): string {
    return `${sort.field}:${sort.direction}`
}

const DEFAULT_DESC_FIELDS: ReferralSortField[] = ["created_at", "activity", "urgency", "ref_id"]

export function toggleReferralSort(sort: ReferralSort, field: ReferralSortField): ReferralSort {
    if (sort.field === field) {
        return { field, direction: sort.direction === "asc" ? "desc" : "asc" }
    }
    return { field, direction: DEFAULT_DESC_FIELDS.includes(field) ? "desc" : "asc" }
}

function activityDate(r: MockReferral): string {
    return r.last_activity_at || r.created_at
}

export function hasActivePortalReferralFilters(filters: PortalReferralFilters): boolean {
    return (
        filters.search.trim() !== "" ||
        filters.status !== "all" ||
        filters.urgent !== "all" ||
        filters.program !== "all"
    )
}

export function applyPortalReferralFilters(referrals: MockReferral[], filters: PortalReferralFilters): MockReferral[] {
    let result = [...referrals]

    const q = filters.search.trim().toLowerCase()
    if (q) {
        result = result.filter((r) => {
            const haystack = [
                r.client_first_name,
                r.client_last_name,
                clientDisplayId(r),
                r.referral_code,
                r.referral_source_name,
                r.organization,
                r.assignee_name,
                r.program,
                STATUS_LABELS[r.status],
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
            return haystack.includes(q)
        })
    }

    if (filters.status !== "all") {
        result = result.filter((r) => r.status === filters.status)
    }

    if (filters.urgent === "true") {
        result = result.filter((r) => r.urgent_placement)
    } else if (filters.urgent === "false") {
        result = result.filter((r) => !r.urgent_placement)
    }

    if (filters.program !== "all") {
        result = result.filter((r) => r.program === filters.program)
    }

    return result
}

export function applyPortalStatusFilter(referrals: MockReferral[], filter: PortalFilter): MockReferral[] {
    if (filter === "all") return referrals
    if (filter === "active") {
        return referrals.filter((r) => r.status === "pending_review" || r.status === "under_review")
    }
    return referrals.filter((r) => r.status === filter)
}

export function filterAndSortReferrals(
    referrals: MockReferral[],
    filters: ReferralFilters,
    sort: ReferralSort
): MockReferral[] {
    let result = [...referrals]

    const q = filters.search.trim().toLowerCase()
    if (q) {
        result = result.filter((r) => {
            const haystack = [
                r.client_first_name,
                r.client_last_name,
                clientDisplayId(r),
                r.referral_code,
                r.referral_source_name,
                referralSourceTypeLabel(r.referral_source_type),
                r.organization,
                r.assignee_name,
                r.program,
                STATUS_LABELS[r.status],
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
            return haystack.includes(q)
        })
    }

    if (filters.assignee === "unassigned") {
        result = result.filter((r) => !r.assignee_name)
    } else if (filters.assignee !== "all") {
        result = result.filter((r) => r.assignee_name === filters.assignee)
    }

    if (filters.organization !== "all") {
        result = result.filter((r) => r.organization === filters.organization)
    }

    if (filters.sourceType !== "all") {
        result = result.filter((r) => r.referral_source_type === filters.sourceType)
    }

    result.sort((a, b) => {
        const { field, direction } = sort
        switch (field) {
            case "created_at":
                return direction === "asc"
                    ? a.created_at.localeCompare(b.created_at)
                    : b.created_at.localeCompare(a.created_at)
            case "activity":
                return direction === "asc"
                    ? activityDate(a).localeCompare(activityDate(b))
                    : activityDate(b).localeCompare(activityDate(a))
            case "ref_id":
                return compareStrings(clientDisplayId(a), clientDisplayId(b), direction)
            case "client_name":
                return compareStrings(clientName(a), clientName(b), direction)
            case "status":
                return direction === "asc"
                    ? STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
                    : STATUS_ORDER[b.status] - STATUS_ORDER[a.status]
            case "program":
                return compareStrings(a.program, b.program, direction)
            case "organization":
                return compareStrings(a.organization, b.organization, direction)
            case "assignee": {
                const aName = a.assignee_name || ""
                const bName = b.assignee_name || ""
                return compareStrings(aName, bName, direction)
            }
            case "referral_source":
                return compareStrings(a.referral_source_name, b.referral_source_name, direction)
            case "urgency":
                return direction === "asc"
                    ? urgencyScore(a) - urgencyScore(b)
                    : urgencyScore(b) - urgencyScore(a)
            default:
                return 0
        }
    })

    return result
}
