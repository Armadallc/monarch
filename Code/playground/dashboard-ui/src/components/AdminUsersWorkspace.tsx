import { useMemo, useState } from "react"
import { COLORS, FONT, RADIUS } from "@design"
import type { DashboardProgram } from "../programBranding"
import type { MockReferral } from "../types"
import { clientDisplayId } from "../utils"
import {
    canAssignAdminRole,
    isMonarchStaffEmail,
    normalizeStaffEmail,
    staffRecordsForProgram,
    type BlockedPortalSource,
    type StaffAccessRecord,
    type StaffMembershipRole,
    type StaffMembershipStatus,
} from "../staffAccess"

type Props = {
    program: DashboardProgram
    actorEmail: string
    memberships: StaffAccessRecord[]
    onMembershipsChange: (next: StaffAccessRecord[]) => void
    blockedPortalSources: BlockedPortalSource[]
    onBlockedPortalSourcesChange: (next: BlockedPortalSource[]) => void
    referrals: MockReferral[]
}

function todayIso(): string {
    return new Date().toISOString().slice(0, 10)
}

function newId(prefix: string): string {
    return `${prefix}-${Date.now().toString(36)}`
}

const btnBase = {
    fontFamily: FONT,
    fontSize: 13,
    fontWeight: 600,
    borderRadius: RADIUS.small,
    cursor: "pointer",
    padding: "8px 14px",
    border: "none",
} as const

export function AdminUsersWorkspace({
    program,
    actorEmail,
    memberships,
    onMembershipsChange,
    blockedPortalSources,
    onBlockedPortalSourcesChange,
    referrals,
}: Props) {
    const superAdmin = canAssignAdminRole(actorEmail)
    const programRows = useMemo(() => staffRecordsForProgram(memberships, program), [memberships, program])

    const [addEmail, setAddEmail] = useState("")
    const [addName, setAddName] = useState("")
    const [addError, setAddError] = useState<string | null>(null)

    const [blockEmail, setBlockEmail] = useState("")
    const [blockReason, setBlockReason] = useState("")
    const [blockReferralId, setBlockReferralId] = useState("")
    const [blockError, setBlockError] = useState<string | null>(null)

    const handleAddStaff = () => {
        setAddError(null)
        const email = normalizeStaffEmail(addEmail)
        if (!email) {
            setAddError("Enter an email address.")
            return
        }
        if (!isMonarchStaffEmail(email)) {
            setAddError("Staff must use an @monarchcompetency.com address.")
            return
        }
        if (programRows.some((r) => normalizeStaffEmail(r.email) === email)) {
            setAddError("This email is already on the allowlist for this program.")
            return
        }

        const record: StaffAccessRecord = {
            id: newId("spm"),
            email,
            display_name: addName.trim() || email.split("@")[0],
            program,
            role: "user",
            status: "active",
            invited_at: todayIso(),
        }
        onMembershipsChange([...memberships, record])
        setAddEmail("")
        setAddName("")
        window.alert(
            `Invite sent (mock)\n\n${email} can sign in at /admin with Google. On first login they receive dashboard access for ${program}.`
        )
    }

    const patchRow = (id: string, patch: Partial<StaffAccessRecord>) => {
        onMembershipsChange(memberships.map((r) => (r.id === id ? { ...r, ...patch } : r)))
    }

    const setStatus = (row: StaffAccessRecord, status: StaffMembershipStatus) => {
        if (status === "blocked") {
            const reason = window.prompt("Block reason (optional):", row.blocked_reason ?? "") ?? ""
            patchRow(row.id, {
                status: "blocked",
                blocked_at: todayIso(),
                blocked_reason: reason.trim() || "Blocked by admissions admin",
            })
            return
        }
        patchRow(row.id, {
            status: "active",
            blocked_at: null,
            blocked_reason: null,
        })
    }

    const setRole = (row: StaffAccessRecord, role: StaffMembershipRole) => {
        if (!superAdmin) return
        if (role === "admin" && normalizeStaffEmail(row.email) === normalizeStaffEmail(actorEmail)) {
            window.alert("Super admin assigns admissions admin via this control — your own role is unchanged here.")
        }
        patchRow(row.id, { role })
    }

    const handleBlockPortalSource = () => {
        setBlockError(null)
        const email = normalizeStaffEmail(blockEmail)
        if (!email || !email.includes("@")) {
            setBlockError("Enter a valid portal user email.")
            return
        }
        if (blockedPortalSources.some((b) => normalizeStaffEmail(b.email) === email)) {
            setBlockError("This portal account is already blocked.")
            return
        }

        const referralLookup = blockReferralId.trim()
        const referral = referralLookup
            ? referrals.find((r) => r.id === referralLookup || clientDisplayId(r) === referralLookup)
            : undefined

        const entry: BlockedPortalSource = {
            id: newId("bps"),
            email,
            display_name: referral?.referral_source_name,
            blocked_at: todayIso(),
            blocked_by_email: actorEmail,
            reason: blockReason.trim() || undefined,
            related_referral_id: referral?.id,
        }
        onBlockedPortalSourcesChange([...blockedPortalSources, entry])
        setBlockEmail("")
        setBlockReason("")
        setBlockReferralId("")
        window.alert(
            `Portal access blocked (mock)\n\n${email} will be denied at the referral source portal gate. Archive related referrals separately in Cases.`
        )
    }

    const unblockPortal = (id: string) => {
        onBlockedPortalSourcesChange(blockedPortalSources.filter((b) => b.id !== id))
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "auto" }}>
            <div style={{ flexShrink: 0, marginBottom: 20 }}>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: COLORS.ash }}>Administration</h1>
                <p style={{ margin: "6px 0 0", fontSize: 13, color: COLORS.ashMuted, lineHeight: 1.55, maxWidth: 640 }}>
                    Manage who can use the admissions dashboard for <strong>{program}</strong>. Admissions admins add or
                    block staff. Only platform super admins can assign the admissions admin role.
                </p>
            </div>

            <section
                style={{
                    marginBottom: 28,
                    padding: 20,
                    background: COLORS.white,
                    border: `1px solid ${COLORS.ashSubtle}`,
                    borderRadius: RADIUS.section,
                }}
            >
                <h2 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: COLORS.ash }}>Staff allowlist</h2>
                <p style={{ margin: "0 0 16px", fontSize: 13, color: COLORS.ashMuted, lineHeight: 1.5 }}>
                    Any @monarchcompetency.com account can authenticate; only approved rows below pass the dashboard
                    gate.
                </p>

                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 10,
                        marginBottom: 16,
                        alignItems: "flex-end",
                    }}
                >
                    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 600 }}>
                        Email
                        <input
                            type="email"
                            value={addEmail}
                            onChange={(e) => setAddEmail(e.target.value)}
                            placeholder="name@monarchcompetency.com"
                            style={{
                                padding: "8px 12px",
                                fontSize: 13,
                                fontFamily: FONT,
                                border: `1px solid ${COLORS.ashSubtle}`,
                                borderRadius: RADIUS.small,
                                minWidth: 240,
                            }}
                        />
                    </label>
                    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 600 }}>
                        Display name
                        <input
                            type="text"
                            value={addName}
                            onChange={(e) => setAddName(e.target.value)}
                            placeholder="Optional"
                            style={{
                                padding: "8px 12px",
                                fontSize: 13,
                                fontFamily: FONT,
                                border: `1px solid ${COLORS.ashSubtle}`,
                                borderRadius: RADIUS.small,
                                minWidth: 180,
                            }}
                        />
                    </label>
                    <button
                        type="button"
                        onClick={handleAddStaff}
                        style={{ ...btnBase, background: COLORS.primary, color: COLORS.primaryForeground }}
                    >
                        Add &amp; send invite
                    </button>
                </div>
                {addError ? (
                    <p style={{ margin: "0 0 12px", fontSize: 12, color: COLORS.error }}>{addError}</p>
                ) : null}

                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: FONT }}>
                        <thead>
                            <tr style={{ borderBottom: `1px solid ${COLORS.ashSubtle}`, textAlign: "left" }}>
                                <th style={{ padding: "10px 8px", fontWeight: 600, color: COLORS.ashMuted }}>Name</th>
                                <th style={{ padding: "10px 8px", fontWeight: 600, color: COLORS.ashMuted }}>Email</th>
                                <th style={{ padding: "10px 8px", fontWeight: 600, color: COLORS.ashMuted }}>Role</th>
                                <th style={{ padding: "10px 8px", fontWeight: 600, color: COLORS.ashMuted }}>Status</th>
                                <th style={{ padding: "10px 8px", fontWeight: 600, color: COLORS.ashMuted }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {programRows.map((row) => (
                                <tr key={row.id} style={{ borderBottom: `1px solid ${COLORS.coconut25}` }}>
                                    <td style={{ padding: "12px 8px", color: COLORS.ash }}>{row.display_name}</td>
                                    <td style={{ padding: "12px 8px", color: COLORS.ash }}>{row.email}</td>
                                    <td style={{ padding: "12px 8px" }}>
                                        {superAdmin ? (
                                            <select
                                                value={row.role}
                                                onChange={(e) => setRole(row, e.target.value as StaffMembershipRole)}
                                                style={{
                                                    padding: "6px 10px",
                                                    fontSize: 12,
                                                    fontFamily: FONT,
                                                    border: `1px solid ${COLORS.ashSubtle}`,
                                                    borderRadius: RADIUS.small,
                                                }}
                                            >
                                                <option value="user">Admissions staff</option>
                                                <option value="admin">Admissions admin</option>
                                            </select>
                                        ) : (
                                            <span style={{ color: COLORS.ash }}>
                                                {row.role === "admin" ? "Admissions admin" : "Admissions staff"}
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ padding: "12px 8px" }}>
                                        <span
                                            style={{
                                                display: "inline-block",
                                                padding: "3px 8px",
                                                borderRadius: 999,
                                                fontSize: 11,
                                                fontWeight: 600,
                                                background:
                                                    row.status === "active" ? COLORS.successBg : COLORS.errorBg,
                                                color: row.status === "active" ? COLORS.successText : COLORS.errorText,
                                            }}
                                        >
                                            {row.status === "active" ? "Active" : "Blocked"}
                                        </span>
                                    </td>
                                    <td style={{ padding: "12px 8px" }}>
                                        {row.status === "active" ? (
                                            <button
                                                type="button"
                                                onClick={() => setStatus(row, "blocked")}
                                                style={{
                                                    ...btnBase,
                                                    padding: "6px 10px",
                                                    fontSize: 12,
                                                    background: COLORS.coconut25,
                                                    color: COLORS.ash,
                                                    border: `1px solid ${COLORS.ashSubtle}`,
                                                }}
                                            >
                                                Block
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => setStatus(row, "active")}
                                                style={{
                                                    ...btnBase,
                                                    padding: "6px 10px",
                                                    fontSize: 12,
                                                    background: COLORS.primary,
                                                    color: COLORS.primaryForeground,
                                                }}
                                            >
                                                Restore access
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {programRows.length === 0 ? (
                    <p style={{ margin: "12px 0 0", fontSize: 13, color: COLORS.ashMuted }}>No staff rows for this program yet.</p>
                ) : null}
            </section>

            <section
                style={{
                    padding: 20,
                    background: COLORS.white,
                    border: `1px solid ${COLORS.ashSubtle}`,
                    borderRadius: RADIUS.section,
                }}
            >
                <h2 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: COLORS.ash }}>
                    Blocked referral sources
                </h2>
                <p style={{ margin: "0 0 16px", fontSize: 13, color: COLORS.ashMuted, lineHeight: 1.5 }}>
                    Deactivate bad portal actors (<code>profile_deactivated_at</code> in production). Locate the referral,
                    block the source, then archive the fake referral in Cases.
                </p>

                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 10,
                        marginBottom: 16,
                        alignItems: "flex-end",
                    }}
                >
                    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 600 }}>
                        Portal email
                        <input
                            type="email"
                            value={blockEmail}
                            onChange={(e) => setBlockEmail(e.target.value)}
                            placeholder="source@example.com"
                            style={{
                                padding: "8px 12px",
                                fontSize: 13,
                                fontFamily: FONT,
                                border: `1px solid ${COLORS.ashSubtle}`,
                                borderRadius: RADIUS.small,
                                minWidth: 220,
                            }}
                        />
                    </label>
                    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 600 }}>
                        Related referral ID
                        <input
                            type="text"
                            value={blockReferralId}
                            onChange={(e) => setBlockReferralId(e.target.value)}
                            placeholder="Optional"
                            style={{
                                padding: "8px 12px",
                                fontSize: 13,
                                fontFamily: FONT,
                                border: `1px solid ${COLORS.ashSubtle}`,
                                borderRadius: RADIUS.small,
                                width: 120,
                            }}
                        />
                    </label>
                    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 600 }}>
                        Reason
                        <input
                            type="text"
                            value={blockReason}
                            onChange={(e) => setBlockReason(e.target.value)}
                            placeholder="Optional"
                            style={{
                                padding: "8px 12px",
                                fontSize: 13,
                                fontFamily: FONT,
                                border: `1px solid ${COLORS.ashSubtle}`,
                                borderRadius: RADIUS.small,
                                minWidth: 200,
                            }}
                        />
                    </label>
                    <button
                        type="button"
                        onClick={handleBlockPortalSource}
                        style={{ ...btnBase, background: COLORS.error, color: COLORS.errorText }}
                    >
                        Block portal access
                    </button>
                </div>
                {blockError ? (
                    <p style={{ margin: "0 0 12px", fontSize: 12, color: COLORS.error }}>{blockError}</p>
                ) : null}

                {blockedPortalSources.length > 0 ? (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: FONT }}>
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${COLORS.ashSubtle}`, textAlign: "left" }}>
                                    <th style={{ padding: "10px 8px", fontWeight: 600, color: COLORS.ashMuted }}>Email</th>
                                    <th style={{ padding: "10px 8px", fontWeight: 600, color: COLORS.ashMuted }}>Blocked</th>
                                    <th style={{ padding: "10px 8px", fontWeight: 600, color: COLORS.ashMuted }}>Reason</th>
                                    <th style={{ padding: "10px 8px", fontWeight: 600, color: COLORS.ashMuted }}>Referral</th>
                                    <th style={{ padding: "10px 8px", fontWeight: 600, color: COLORS.ashMuted }} />
                                </tr>
                            </thead>
                            <tbody>
                                {blockedPortalSources.map((row) => (
                                    <tr key={row.id} style={{ borderBottom: `1px solid ${COLORS.coconut25}` }}>
                                        <td style={{ padding: "12px 8px", color: COLORS.ash }}>{row.email}</td>
                                        <td style={{ padding: "12px 8px", color: COLORS.ashMuted, fontSize: 12 }}>
                                            {row.blocked_at}
                                            <div style={{ fontSize: 11 }}>by {row.blocked_by_email}</div>
                                        </td>
                                        <td style={{ padding: "12px 8px", color: COLORS.ashMuted }}>{row.reason ?? "—"}</td>
                                        <td style={{ padding: "12px 8px", color: COLORS.ashMuted }}>
                                            {row.related_referral_id ?? "—"}
                                        </td>
                                        <td style={{ padding: "12px 8px" }}>
                                            <button
                                                type="button"
                                                onClick={() => unblockPortal(row.id)}
                                                style={{
                                                    ...btnBase,
                                                    padding: "6px 10px",
                                                    fontSize: 12,
                                                    background: COLORS.coconut25,
                                                    color: COLORS.ash,
                                                    border: `1px solid ${COLORS.ashSubtle}`,
                                                }}
                                            >
                                                Unblock
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p style={{ margin: 0, fontSize: 13, color: COLORS.ashMuted }}>No blocked portal sources.</p>
                )}
            </section>
        </div>
    )
}
