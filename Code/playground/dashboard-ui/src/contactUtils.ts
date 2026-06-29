import type {
    MockContact,
    MockReferral,
    OrganizationType,
    ReferralSourceType,
} from "./types"

export type ContactReferralCountFilter = "all" | "1plus" | "2plus" | "5plus"

export type ContactLastActiveFilter = "all" | "30d" | "90d" | "1y"

export type ContactSourceFilter = "all" | "referral" | "personal"

export type ContactFilters = {
    search: string
    organization: string | "all"
    organizationType: OrganizationType | "all"
    referralCount: ContactReferralCountFilter
    lastActive: ContactLastActiveFilter
    source: ContactSourceFilter
}

export const DEFAULT_CONTACT_FILTERS: ContactFilters = {
    search: "",
    organization: "all",
    organizationType: "all",
    referralCount: "all",
    lastActive: "all",
    source: "all",
}

export type ContactListStats = {
    total: number
    hasReferred: number
    personal: number
    activeThisWeek: number
    multiReferral: number
}

function contactKey(name: string, organization: string): string {
    return `${name.trim().toLowerCase()}|${organization.trim().toLowerCase()}`
}

function slugId(name: string, organization: string): string {
    return contactKey(name, organization).replace(/[^a-z0-9]+/g, "-")
}

export function referralSourceTypeToOrgType(type: ReferralSourceType): OrganizationType {
    switch (type) {
        case "court":
            return "court"
        case "legal_representative":
            return "legal_representative"
        case "probation_parole":
            return "probation_parole"
        case "mental_health_facility":
            return "treatment_center"
        case "case_management":
            return "community_center"
        default:
            return "community_center"
    }
}

function matchesContact(referral: MockReferral, contact: MockContact): boolean {
    return contactKey(referral.referral_source_name, referral.organization) === contactKey(contact.name, contact.organization)
}

export function referralsForContact(referrals: MockReferral[], contact: MockContact): MockReferral[] {
    return referrals.filter((r) => matchesContact(r, contact))
}

export function buildContactsFromReferrals(referrals: MockReferral[]): MockContact[] {
    const map = new Map<string, { referrals: MockReferral[]; orgType: OrganizationType }>()

    for (const referral of referrals) {
        const key = contactKey(referral.referral_source_name, referral.organization)
        const existing = map.get(key)
        if (existing) {
            existing.referrals.push(referral)
        } else {
            map.set(key, {
                referrals: [referral],
                orgType: referralSourceTypeToOrgType(referral.referral_source_type),
            })
        }
    }

    const contacts: MockContact[] = []
    for (const { referrals: matching, orgType } of map.values()) {
        const sample = matching[0]
        const lastActive = matching.reduce<string | null>((latest, r) => {
            const candidate = r.last_activity_at ?? r.created_at
            if (!latest) return candidate
            return new Date(candidate) > new Date(latest) ? candidate : latest
        }, null)

        contacts.push({
            id: `contact-ref-${slugId(sample.referral_source_name, sample.organization)}`,
            name: sample.referral_source_name,
            organization: sample.organization,
            organization_type: orgType,
            phone: "",
            email: "",
            url: "",
            notes: "",
            source: "referral",
            referral_count: matching.length,
            last_active_at: lastActive,
            created_at: matching.reduce((earliest, r) => {
                return !earliest || new Date(r.created_at) < new Date(earliest) ? r.created_at : earliest
            }, matching[0].created_at),
        })
    }

    return contacts.sort((a, b) => a.name.localeCompare(b.name))
}

/** Referral-sourced contacts are universal; personal contacts belong to one staff user. */
export function contactsVisibleToUser(contacts: MockContact[], userId: string): MockContact[] {
    return contacts.filter((c) => c.source === "referral" || c.owner_user_id === userId)
}

export function contactOrganizationOptions(contacts: MockContact[]): string[] {
    const names = new Set(contacts.map((c) => c.organization))
    return [...names].sort((a, b) => a.localeCompare(b))
}

function passesReferralCountFilter(count: number, filter: ContactReferralCountFilter): boolean {
    switch (filter) {
        case "1plus":
            return count >= 1
        case "2plus":
            return count >= 2
        case "5plus":
            return count >= 5
        default:
            return true
    }
}

function passesLastActiveFilter(lastActive: string | null, filter: ContactLastActiveFilter): boolean {
    if (filter === "all") return true
    if (!lastActive) return false
    const d = new Date(lastActive)
    if (Number.isNaN(d.getTime())) return false
    const now = new Date()
    const days =
        filter === "30d" ? 30 : filter === "90d" ? 90 : 365
    const cutoff = new Date(now)
    cutoff.setDate(cutoff.getDate() - days)
    return d >= cutoff
}

export function filterContacts(contacts: MockContact[], filters: ContactFilters): MockContact[] {
    let result = [...contacts]
    const q = filters.search.trim().toLowerCase()

    if (q) {
        result = result.filter((c) => {
            const haystack = [c.name, c.organization, c.phone, c.email, c.url, c.notes, c.organization_type]
                .join(" ")
                .toLowerCase()
            return haystack.includes(q)
        })
    }

    if (filters.organization !== "all") {
        result = result.filter((c) => c.organization === filters.organization)
    }

    if (filters.organizationType !== "all") {
        result = result.filter((c) => c.organization_type === filters.organizationType)
    }

    if (filters.referralCount !== "all") {
        result = result.filter((c) => passesReferralCountFilter(c.referral_count, filters.referralCount))
    }

    if (filters.lastActive !== "all") {
        result = result.filter((c) => passesLastActiveFilter(c.last_active_at, filters.lastActive))
    }

    if (filters.source === "referral") {
        result = result.filter((c) => c.source === "referral")
    } else if (filters.source === "personal") {
        result = result.filter((c) => c.source === "user")
    }

    return result.sort((a, b) => {
        const aDate = a.last_active_at ? new Date(a.last_active_at).getTime() : 0
        const bDate = b.last_active_at ? new Date(b.last_active_at).getTime() : 0
        if (bDate !== aDate) return bDate - aDate
        return a.name.localeCompare(b.name)
    })
}

export function contactListStats(contacts: MockContact[]): ContactListStats {
    const now = new Date()
    const weekAgo = new Date(now)
    weekAgo.setDate(weekAgo.getDate() - 7)

    const activeThisWeek = contacts.filter((c) => {
        if (!c.last_active_at) return false
        const d = new Date(c.last_active_at)
        return !Number.isNaN(d.getTime()) && d >= weekAgo
    }).length

    return {
        total: contacts.length,
        hasReferred: contacts.filter((c) => c.referral_count > 0).length,
        personal: contacts.filter((c) => c.source === "user").length,
        activeThisWeek,
        multiReferral: contacts.filter((c) => c.referral_count > 1).length,
    }
}
