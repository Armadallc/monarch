import { useMemo, useState } from "react"
import { COLORS, FONT, RADIUS } from "@design"
import { ClientName } from "./ClientName"
import { clientThreadTitle, threadSubtitle } from "../messageUtils"
import { STATUS_LABELS, type MockReferral, type ReferralMessage } from "../types"

type Props = {
    referrals: MockReferral[]
    messagesByReferral: Record<string, ReferralMessage[]>
    selectedReferralId: string | null
    onSelectReferral: (referralId: string) => void
    staffAssigneeName: string
}

export function MessagesReferralSearchRail({
    referrals,
    messagesByReferral,
    selectedReferralId,
    onSelectReferral,
    staffAssigneeName,
}: Props) {
    const [search, setSearch] = useState("")
    const [mineOnly, setMineOnly] = useState(false)

    const results = useMemo(() => {
        const q = search.trim().toLowerCase()
        let list = referrals.filter((r) =>
            ["pending_review", "under_review", "waitlisted", "accepted"].includes(r.status)
        )

        if (mineOnly) {
            const token = staffAssigneeName.split(" ")[0]?.toLowerCase() ?? ""
            list = list.filter((r) => (r.assignee_name ?? "").toLowerCase().includes(token))
        }

        if (!q) return list.slice(0, 12)

        return list
            .filter((r) => {
                const haystack = [
                    r.client_first_name,
                    r.client_last_name,
                    r.admin_ref_id,
                    r.referral_code,
                    r.referral_source_name,
                    r.organization,
                ]
                    .join(" ")
                    .toLowerCase()
                return haystack.includes(q)
            })
            .slice(0, 20)
    }, [referrals, search, mineOnly, staffAssigneeName])

    return (
        <div
            style={{
                width: 280,
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
                borderLeft: `1px solid ${COLORS.ashSubtle}`,
                background: COLORS.white,
                fontFamily: FONT,
            }}
        >
            <div style={{ flexShrink: 0, padding: "16px 16px 12px", borderBottom: `1px solid ${COLORS.ashSubtle}` }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: COLORS.ash }}>Find referral</h3>
                <p style={{ margin: "6px 0 12px", fontSize: 11, color: COLORS.ashMuted, lineHeight: 1.4 }}>
                    Search active referrals to open or start that case&apos;s thread.
                </p>
                <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Client, REF ID, source…"
                    aria-label="Search referrals to message"
                    style={{
                        width: "100%",
                        padding: "9px 12px",
                        fontSize: 13,
                        fontFamily: FONT,
                        border: `1px solid ${COLORS.ashSubtle}`,
                        borderRadius: RADIUS.input,
                        background: COLORS.coconut25,
                        color: COLORS.ash,
                        boxSizing: "border-box",
                        marginBottom: 10,
                    }}
                />
                <label
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        color: COLORS.ashMuted,
                        cursor: "pointer",
                    }}
                >
                    <input
                        type="checkbox"
                        checked={mineOnly}
                        onChange={(e) => setMineOnly(e.target.checked)}
                        style={{ width: 16, height: 16 }}
                    />
                    My caseload only
                </label>
            </div>

            <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
                {results.length === 0 ? (
                    <p style={{ padding: 16, fontSize: 12, color: COLORS.ashMuted, margin: 0 }}>No matching referrals</p>
                ) : (
                    results.map((referral) => {
                        const hasThread = (messagesByReferral[referral.id] ?? []).length > 0
                        const selected = selectedReferralId === referral.id
                        return (
                            <button
                                key={referral.id}
                                type="button"
                                onClick={() => onSelectReferral(referral.id)}
                                style={{
                                    width: "100%",
                                    textAlign: "left",
                                    padding: "12px 16px",
                                    border: "none",
                                    borderBottom: `1px solid ${COLORS.ashSubtle}`,
                                    background: selected ? COLORS.moonstoneLight : COLORS.white,
                                    cursor: "pointer",
                                    fontFamily: FONT,
                                }}
                            >
                                <ClientName as="div" size="sm" style={{ marginBottom: 2 }}>
                                    {clientThreadTitle(referral)}
                                </ClientName>
                                <div style={{ fontSize: 11, color: COLORS.ashMuted, marginBottom: 4 }}>
                                    {threadSubtitle(referral)}
                                </div>
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                    <span
                                        style={{
                                            fontSize: 10,
                                            fontWeight: 600,
                                            padding: "2px 8px",
                                            borderRadius: RADIUS.pill,
                                            background: COLORS.coconut,
                                            color: COLORS.ash,
                                        }}
                                    >
                                        {STATUS_LABELS[referral.status]}
                                    </span>
                                    <span style={{ fontSize: 10, color: COLORS.ashMuted }}>
                                        {hasThread ? "Has messages" : "Start thread"}
                                    </span>
                                </div>
                            </button>
                        )
                    })
                )}
            </div>
        </div>
    )
}
