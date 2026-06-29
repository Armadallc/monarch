import { useMemo, useState } from "react"
import { COLORS, FONT, FONT_HEADING, RADIUS, formatDisplayDate } from "@design"
import {
    ACTIVITY_FEED_TYPE_LABELS,
    buildActivityFeedEvents,
    groupActivityFeedByDay,
    type ActivityFeedEvent,
    type ActivityFeedEventType,
} from "../mockActivityFeed"
import { CURRENT_STAFF_ID } from "../mockStaffDirectory"
import type { MockReferral, MockReferralTransfer, ReferralMessage, StaffMember } from "../types"

type ScopeFilter = "all" | "mine"

type Props = {
    referrals: MockReferral[]
    transfers?: MockReferralTransfer[]
    messagesByReferral?: Record<string, ReferralMessage[]>
    staffDirectory?: StaffMember[]
    currentStaffId?: string
    onOpenReferral: (referral: MockReferral) => void
}

const TYPE_FILTER_OPTIONS: { value: ActivityFeedEventType | "all"; label: string }[] = [
    { value: "all", label: "All types" },
    { value: "referral_submitted", label: "Submitted" },
    { value: "status_changed", label: "Status" },
    { value: "message_sent", label: "Messages" },
    { value: "assignment_changed", label: "Assignment" },
    { value: "transfer_requested", label: "Transfers" },
    { value: "document_uploaded", label: "Documents" },
    { value: "section_note", label: "Notes" },
]

function typeBadgeColor(type: ActivityFeedEventType): string {
    switch (type) {
        case "message_sent":
            return COLORS.infoText
        case "transfer_requested":
            return COLORS.warningText
        case "referral_submitted":
            return COLORS.successText
        case "status_changed":
            return COLORS.statusReviewText
        default:
            return COLORS.ashMuted
    }
}

function typeBadgeBg(type: ActivityFeedEventType): string {
    switch (type) {
        case "message_sent":
            return COLORS.infoBg
        case "transfer_requested":
            return COLORS.warningBg
        case "referral_submitted":
            return COLORS.successBg
        case "status_changed":
            return COLORS.statusReviewBg
        default:
            return COLORS.coconut25
    }
}

export function ActivityFeedWorkspace({
    referrals,
    transfers,
    messagesByReferral,
    staffDirectory,
    currentStaffId = CURRENT_STAFF_ID,
    onOpenReferral,
}: Props) {
    const [scope, setScope] = useState<ScopeFilter>("all")
    const [typeFilter, setTypeFilter] = useState<ActivityFeedEventType | "all">("all")

    const referralsById = useMemo(() => new Map(referrals.map((r) => [r.id, r])), [referrals])

    const allEvents = useMemo(
        () =>
            buildActivityFeedEvents({
                referrals,
                transfers,
                messagesByReferral,
                staffDirectory,
            }),
        [referrals, transfers, messagesByReferral, staffDirectory]
    )

    const filteredEvents = useMemo(() => {
        return allEvents.filter((event) => {
            if (scope === "mine" && event.assignedToUserId !== currentStaffId) return false
            if (typeFilter !== "all" && event.type !== typeFilter) return false
            return true
        })
    }, [allEvents, scope, typeFilter, currentStaffId])

    const grouped = useMemo(() => groupActivityFeedByDay(filteredEvents), [filteredEvents])

    const openEvent = (event: ActivityFeedEvent) => {
        const referral = referralsById.get(event.referralId)
        if (referral) onOpenReferral(referral)
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
            <div style={{ flexShrink: 0, marginBottom: 12 }}>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: COLORS.ash, fontFamily: FONT_HEADING }}>
                    Activity Feed
                </h1>
                <p style={{ margin: "6px 0 0", fontSize: 13, color: COLORS.ashMuted, lineHeight: 1.5 }}>
                    Program-wide timeline of substantive referral updates — status, messages, assignment, transfers, and
                    documents. View-only opens are not shown here.
                </p>
            </div>

            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 16,
                    flexShrink: 0,
                }}
            >
                <div style={{ display: "flex", gap: 6 }}>
                    {(
                        [
                            { key: "all" as const, label: "All activity" },
                            { key: "mine" as const, label: "My assignments" },
                        ] as const
                    ).map((item) => (
                        <button
                            key={item.key}
                            type="button"
                            onClick={() => setScope(item.key)}
                            style={{
                                padding: "8px 14px",
                                fontSize: 13,
                                fontWeight: 600,
                                fontFamily: FONT,
                                border: `1px solid ${scope === item.key ? COLORS.ash : COLORS.ashSubtle}`,
                                borderRadius: RADIUS.pill,
                                background: scope === item.key ? COLORS.ash : COLORS.white,
                                color: scope === item.key ? COLORS.shell : COLORS.ash,
                                cursor: "pointer",
                            }}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as ActivityFeedEventType | "all")}
                    style={{
                        padding: "8px 12px",
                        fontSize: 13,
                        fontFamily: FONT,
                        border: `1px solid ${COLORS.ashSubtle}`,
                        borderRadius: RADIUS.small,
                        background: COLORS.white,
                        color: COLORS.ash,
                        cursor: "pointer",
                    }}
                    aria-label="Filter by event type"
                >
                    {TYPE_FILTER_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>

                <span style={{ fontSize: 12, color: COLORS.ashMuted, marginLeft: "auto" }}>
                    {filteredEvents.length} event{filteredEvents.length === 1 ? "" : "s"}
                </span>
            </div>

            <div style={{ flex: 1, minHeight: 0, overflowY: "auto", paddingRight: 4 }}>
                {filteredEvents.length === 0 ? (
                    <div
                        style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            minHeight: 200,
                            color: COLORS.ashMuted,
                            fontSize: 14,
                            textAlign: "center",
                            padding: 24,
                        }}
                    >
                        No activity matches these filters.
                    </div>
                ) : (
                    grouped.map(({ day, events }) => (
                        <section key={day} style={{ marginBottom: 20 }}>
                            <div
                                style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    letterSpacing: "0.06em",
                                    textTransform: "uppercase",
                                    color: COLORS.ashMuted,
                                    marginBottom: 8,
                                    fontFamily: FONT,
                                }}
                            >
                                {formatDisplayDate(day)}
                            </div>
                            <div
                                style={{
                                    border: `1px solid ${COLORS.ashSubtle}`,
                                    borderRadius: RADIUS.small,
                                    background: COLORS.white,
                                    overflow: "hidden",
                                }}
                            >
                                {events.map((event, index) => (
                                    <button
                                        key={event.id}
                                        type="button"
                                        onClick={() => openEvent(event)}
                                        style={{
                                            width: "100%",
                                            display: "grid",
                                            gridTemplateColumns: "88px 1fr auto",
                                            gap: 12,
                                            alignItems: "start",
                                            padding: "12px 14px",
                                            border: "none",
                                            borderBottom:
                                                index < events.length - 1
                                                    ? `1px solid ${COLORS.ashSubtle}`
                                                    : undefined,
                                            background: "transparent",
                                            cursor: "pointer",
                                            textAlign: "left",
                                            fontFamily: FONT,
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: 11,
                                                fontWeight: 700,
                                                letterSpacing: "0.04em",
                                                color: typeBadgeColor(event.type),
                                                background: typeBadgeBg(event.type),
                                                padding: "4px 8px",
                                                borderRadius: RADIUS.small,
                                                justifySelf: "start",
                                            }}
                                        >
                                            {ACTIVITY_FEED_TYPE_LABELS[event.type]}
                                        </span>
                                        <span style={{ minWidth: 0 }}>
                                            <span
                                                style={{
                                                    display: "block",
                                                    fontSize: 14,
                                                    fontWeight: 600,
                                                    color: COLORS.ash,
                                                    fontFamily: FONT_HEADING,
                                                }}
                                            >
                                                {event.clientName}{" "}
                                                <span style={{ fontWeight: 500, color: COLORS.ashMuted }}>
                                                    {event.referralLabel}
                                                </span>
                                            </span>
                                            <span
                                                style={{
                                                    display: "block",
                                                    marginTop: 4,
                                                    fontSize: 13,
                                                    color: COLORS.ashMuted,
                                                    lineHeight: 1.45,
                                                }}
                                            >
                                                {event.summary}
                                            </span>
                                            <span style={{ display: "block", marginTop: 4, fontSize: 12, color: COLORS.ash50 }}>
                                                {event.actorName} · {event.program}
                                            </span>
                                        </span>
                                        <span
                                            style={{
                                                fontSize: 12,
                                                color: COLORS.ashMuted,
                                                whiteSpace: "nowrap",
                                                paddingTop: 2,
                                            }}
                                        >
                                            {formatDisplayDate(event.at)}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </section>
                    ))
                )}
            </div>
        </div>
    )
}
