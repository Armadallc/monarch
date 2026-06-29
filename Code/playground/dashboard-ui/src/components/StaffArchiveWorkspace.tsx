import { useMemo, useState } from "react"
import { COLORS, FONT } from "@design"
import { ReferralFiltersBar } from "./ReferralFiltersBar"
import { ReferralKanbanBoard } from "./ReferralKanbanBoard"
import { ReferralTableView } from "./ReferralTableView"
import {
    DEFAULT_REFERRAL_FILTERS,
    DEFAULT_REFERRAL_SORT,
    filterAndSortReferrals,
    referralFilterOptions,
    type ReferralFilters,
    type ReferralSort,
    type ReferralViewMode,
} from "../referralFilters"
import type { MockReferral } from "../types"

type Props = {
    referrals: MockReferral[]
    archivedIds: Set<string>
    onOpenReferral: (r: MockReferral) => void
    onRecoverReferrals: (ids: string[]) => void
}

export function StaffArchiveWorkspace({
    referrals,
    archivedIds,
    onOpenReferral,
    onRecoverReferrals,
}: Props) {
    const [referralFilters, setReferralFilters] = useState<ReferralFilters>(DEFAULT_REFERRAL_FILTERS)
    const [referralSort, setReferralSort] = useState<ReferralSort>(DEFAULT_REFERRAL_SORT)
    const [referralViewMode, setReferralViewMode] = useState<ReferralViewMode>("row")
    const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())

    const archivedReferrals = useMemo(
        () => referrals.filter((r) => archivedIds.has(r.id)),
        [referrals, archivedIds]
    )
    const filterOptions = useMemo(() => referralFilterOptions(archivedReferrals), [archivedReferrals])
    const filteredReferrals = useMemo(
        () => filterAndSortReferrals(archivedReferrals, referralFilters, referralSort),
        [archivedReferrals, referralFilters, referralSort]
    )

    const clearReferralFilters = () => {
        setReferralFilters(DEFAULT_REFERRAL_FILTERS)
        setReferralSort(DEFAULT_REFERRAL_SORT)
    }

    const recoverSelected = () => {
        onRecoverReferrals([...selectedIds])
        setSelectedIds(new Set())
    }

    const recoverOne = (referral: MockReferral) => {
        onRecoverReferrals([referral.id])
        setSelectedIds((prev) => {
            const next = new Set(prev)
            next.delete(referral.id)
            return next
        })
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
            <div style={{ flexShrink: 0, marginBottom: 4 }}>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: COLORS.ash }}>Archive</h1>
                <p style={{ margin: "6px 0 0", fontSize: 13, color: COLORS.ashMuted, lineHeight: 1.5 }}>
                    Referrals hidden from your admissions dashboard — recover any time to restore them to Cases
                </p>
            </div>

            {selectedIds.size > 0 && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        marginBottom: 12,
                        padding: "10px 14px",
                        background: COLORS.moonstoneLight,
                        borderRadius: 8,
                        flexShrink: 0,
                    }}
                >
                    <span style={{ fontSize: 13, color: COLORS.ash, fontWeight: 600 }}>
                        {selectedIds.size} selected
                    </span>
                    <button
                        type="button"
                        onClick={recoverSelected}
                        style={{
                            padding: "8px 14px",
                            fontSize: 13,
                            fontWeight: 600,
                            fontFamily: FONT,
                            border: "none",
                            borderRadius: 8,
                            background: COLORS.ash,
                            color: COLORS.shell,
                            cursor: "pointer",
                        }}
                    >
                        Recover to dashboard
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedIds(new Set())}
                        style={{
                            padding: "8px 14px",
                            fontSize: 13,
                            fontWeight: 600,
                            fontFamily: FONT,
                            border: `1px solid ${COLORS.ashSubtle}`,
                            borderRadius: 8,
                            background: COLORS.white,
                            color: COLORS.ashMuted,
                            cursor: "pointer",
                        }}
                    >
                        Clear selection
                    </button>
                </div>
            )}

            <ReferralFiltersBar
                filters={referralFilters}
                sort={referralSort}
                viewMode={referralViewMode}
                options={filterOptions}
                resultCount={filteredReferrals.length}
                totalCount={archivedReferrals.length}
                onFiltersChange={setReferralFilters}
                onSortChange={setReferralSort}
                onViewModeChange={setReferralViewMode}
                onClear={clearReferralFilters}
            />

            <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
                {archivedReferrals.length === 0 ? (
                    <div
                        style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: COLORS.ashMuted,
                            fontSize: 14,
                            textAlign: "center",
                            padding: 24,
                        }}
                    >
                        No archived referrals — use Archive on a row in Cases to hide one from your admissions
                        dashboard
                    </div>
                ) : referralViewMode === "column" ? (
                    <ReferralKanbanBoard
                        referrals={filteredReferrals}
                        readOnly
                        onOpenReferral={onOpenReferral}
                    />
                ) : (
                    <ReferralTableView
                        referrals={filteredReferrals}
                        sort={referralSort}
                        onSortChange={setReferralSort}
                        tableMode="staff-archive"
                        onOpenReferral={onOpenReferral}
                        onRecover={recoverOne}
                        selectedIds={selectedIds}
                        onSelectedIdsChange={setSelectedIds}
                    />
                )}
            </div>
        </div>
    )
}
