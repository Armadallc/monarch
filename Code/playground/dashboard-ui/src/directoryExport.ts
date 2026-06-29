import { organizationReferralStats } from "./organizationUtils"
import { ORGANIZATION_TYPE_LABELS, type MockContact, type MockOrganization, type MockReferral } from "./types"

function escapeCSV(value: unknown): string {
    if (value === null || value === undefined) return ""
    const text = String(value)
    if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`
    return text
}

function downloadTextFile(content: string, filename: string, mime = "text/csv;charset=utf-8") {
    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = filename
    anchor.click()
    URL.revokeObjectURL(url)
}

function exportTimestamp(): string {
    const d = new Date()
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`
}

export function buildOrganizationsExportFilename(count: number): string {
    return `monarch_organizations_${count}-${exportTimestamp()}.csv`
}

export function buildContactsExportFilename(count: number): string {
    return `monarch_contacts_${count}-${exportTimestamp()}.csv`
}

const ORG_COLUMNS = [
    "id",
    "name",
    "contact_name",
    "phone",
    "email",
    "organization_type",
    "organization_type_label",
    "created_at",
    "total_referrals",
    "active_referrals",
    "pending_review",
    "under_review",
    "accepted",
    "declined",
    "waitlisted",
    "referrals_this_week",
] as const

const CONTACT_COLUMNS = [
    "id",
    "name",
    "organization",
    "organization_type",
    "organization_type_label",
    "phone",
    "email",
    "url",
    "notes",
    "source",
    "referral_count",
    "last_active_at",
    "created_at",
] as const

export function exportOrganizationsCsv(
    organizations: MockOrganization[],
    referrals: MockReferral[],
    filename?: string
) {
    if (organizations.length === 0) {
        window.alert("No organizations to export.")
        return
    }

    const header = ORG_COLUMNS.join(",")
    const rows = organizations.map((org) => {
        const stats = organizationReferralStats(referrals, org)
        const row: Record<(typeof ORG_COLUMNS)[number], string | number> = {
            id: org.id,
            name: org.name,
            contact_name: org.contact_name,
            phone: org.phone,
            email: org.email,
            organization_type: org.organization_type,
            organization_type_label: ORGANIZATION_TYPE_LABELS[org.organization_type],
            created_at: org.created_at,
            total_referrals: stats.total,
            active_referrals: stats.active,
            pending_review: stats.pending_review,
            under_review: stats.under_review,
            accepted: stats.accepted,
            declined: stats.declined,
            waitlisted: stats.waitlisted,
            referrals_this_week: stats.this_week,
        }
        return ORG_COLUMNS.map((col) => escapeCSV(row[col])).join(",")
    })

    downloadTextFile(
        [header, ...rows].join("\n"),
        filename ?? buildOrganizationsExportFilename(organizations.length)
    )
}

export function exportContactsCsv(contacts: MockContact[], filename?: string) {
    if (contacts.length === 0) {
        window.alert("No contacts to export.")
        return
    }

    const header = CONTACT_COLUMNS.join(",")
    const rows = contacts.map((contact) => {
        const row: Record<(typeof CONTACT_COLUMNS)[number], string | number> = {
            id: contact.id,
            name: contact.name,
            organization: contact.organization,
            organization_type: contact.organization_type,
            organization_type_label: ORGANIZATION_TYPE_LABELS[contact.organization_type],
            phone: contact.phone,
            email: contact.email,
            url: contact.url,
            notes: contact.notes,
            source: contact.source,
            referral_count: contact.referral_count,
            last_active_at: contact.last_active_at ?? "",
            created_at: contact.created_at,
        }
        return CONTACT_COLUMNS.map((col) => escapeCSV(row[col])).join(",")
    })

    downloadTextFile([header, ...rows].join("\n"), filename ?? buildContactsExportFilename(contacts.length))
}
