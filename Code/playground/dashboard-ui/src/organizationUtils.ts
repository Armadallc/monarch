import type { MockOrganization, MockReferral, OrganizationType, ReferralStatus } from "./types"

export type OrganizationReferralStats = {
    total: number
    active: number
    pending_review: number
    under_review: number
    accepted: number
    declined: number
    waitlisted: number
    this_week: number
}

const ACTIVE_STATUSES: ReferralStatus[] = ["pending_review", "under_review"]

function matchesOrganization(referral: MockReferral, org: MockOrganization): boolean {
    const orgMatch = referral.organization.trim().toLowerCase() === org.name.trim().toLowerCase()
    const contactMatch =
        referral.referral_source_name.trim().toLowerCase() === org.contact_name.trim().toLowerCase()
    return orgMatch && contactMatch
}

export function referralsForOrganization(referrals: MockReferral[], org: MockOrganization): MockReferral[] {
    return referrals.filter((r) => matchesOrganization(r, org))
}

export function organizationReferralStats(
    referrals: MockReferral[],
    org: MockOrganization
): OrganizationReferralStats {
    const matching = referralsForOrganization(referrals, org)
    const now = new Date()
    const weekAgo = new Date(now)
    weekAgo.setDate(weekAgo.getDate() - 7)

    const thisWeek = matching.filter((r) => {
        const d = new Date(r.created_at)
        return !Number.isNaN(d.getTime()) && d >= weekAgo
    }).length

    return {
        total: matching.length,
        active: matching.filter((r) => ACTIVE_STATUSES.includes(r.status)).length,
        pending_review: matching.filter((r) => r.status === "pending_review").length,
        under_review: matching.filter((r) => r.status === "under_review").length,
        accepted: matching.filter((r) => r.status === "accepted").length,
        declined: matching.filter((r) => r.status === "declined").length,
        waitlisted: matching.filter((r) => r.status === "waitlisted").length,
        this_week: thisWeek,
    }
}

export type OrganizationListStats = {
    total: number
    newThisMonth: number
    multiReferral: number
    admitted: number
    thisWeek: number
}

export function organizationListStats(
    organizations: MockOrganization[],
    referrals: MockReferral[]
): OrganizationListStats {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const weekAgo = new Date(now)
    weekAgo.setDate(weekAgo.getDate() - 7)

    const referralCounts = organizations.map((org) => referralsForOrganization(referrals, org).length)
    const multiReferral = referralCounts.filter((c) => c > 1).length

    const admitted = referrals.filter((r) => r.status === "accepted").length
    const thisWeek = referrals.filter((r) => {
        const d = new Date(r.created_at)
        return !Number.isNaN(d.getTime()) && d >= weekAgo
    }).length

    const newThisMonth = organizations.filter((org) => {
        const d = new Date(org.created_at)
        return !Number.isNaN(d.getTime()) && d >= monthStart
    }).length

    return {
        total: organizations.length,
        newThisMonth,
        multiReferral,
        admitted,
        thisWeek,
    }
}

export function filterOrganizations(
    organizations: MockOrganization[],
    search: string,
    typeFilter: OrganizationType | "all"
): MockOrganization[] {
    let result = [...organizations]
    const q = search.trim().toLowerCase()
    if (q) {
        result = result.filter((org) => {
            const haystack = [org.name, org.contact_name, org.phone, org.email, org.organization_type]
                .join(" ")
                .toLowerCase()
            return haystack.includes(q)
        })
    }
    if (typeFilter !== "all") {
        result = result.filter((org) => org.organization_type === typeFilter)
    }
    return result.sort((a, b) => a.name.localeCompare(b.name))
}
