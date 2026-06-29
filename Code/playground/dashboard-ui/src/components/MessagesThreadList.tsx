import { COLORS, FONT, FONT_HEADING, RADIUS } from "@design"
import { clientNameStyle } from "./ClientName"
import {
    filterInboxThreads,
    inboxItemPreview,
    inboxItemSubtitle,
    inboxItemTimeLabel,
    inboxItemTitle,
    type InboxThreadItem,
} from "../internalMessageUtils"
import type { ActiveMessageSelection, MessageInboxFilter } from "../types"

type Props = {
    items: InboxThreadItem[]
    filter: MessageInboxFilter
    onFilterChange: (filter: MessageInboxFilter) => void
    selection: ActiveMessageSelection
    onSelect: (selection: ActiveMessageSelection) => void
    shell: "staff" | "portal"
    onNewInternal?: () => void
}

const FILTERS: { id: MessageInboxFilter; label: string; staffOnly?: boolean }[] = [
    { id: "all", label: "All" },
    { id: "referrals", label: "Referrals" },
    { id: "internal", label: "Internal", staffOnly: true },
    { id: "unread", label: "Unread" },
]

function isSelected(item: InboxThreadItem, selection: ActiveMessageSelection): boolean {
    if (!selection) return false
    if (selection.kind === "compose-internal") return false
    if (item.kind === "referral" && selection.kind === "referral") return item.referralId === selection.id
    if (item.kind === "internal" && selection.kind === "internal") return item.conversationId === selection.id
    return false
}

export function MessagesThreadList({
    items,
    filter,
    onFilterChange,
    selection,
    onSelect,
    shell,
    onNewInternal,
}: Props) {
    const filtered = filterInboxThreads(items, filter)
    const visibleFilters = FILTERS.filter((f) => shell === "staff" || !f.staffOnly)

    return (
        <div
            style={{
                width: 300,
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
                borderRight: `1px solid ${COLORS.ashSubtle}`,
                background: COLORS.white,
            }}
        >
            <div style={{ flexShrink: 0, padding: "16px 18px", borderBottom: `1px solid ${COLORS.ashSubtle}` }}>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: COLORS.ash, fontFamily: FONT_HEADING }}>
                    Messages
                </h2>
                <p style={{ margin: "6px 0 10px", fontSize: 12, color: COLORS.ashMuted, fontFamily: FONT, lineHeight: 1.45 }}>
                    {shell === "staff"
                        ? "Referral threads (one per case) and internal staff threads."
                        : "Your referrals — each case has its own thread with admissions."}
                </p>

                {shell === "staff" && onNewInternal && (
                    <button
                        type="button"
                        onClick={onNewInternal}
                        style={{
                            width: "100%",
                            marginBottom: 10,
                            padding: "8px 12px",
                            fontSize: 12,
                            fontWeight: 600,
                            fontFamily: FONT,
                            border: "none",
                            borderRadius: RADIUS.small,
                            background: COLORS.moonstone,
                            color: COLORS.white,
                            cursor: "pointer",
                        }}
                    >
                        + New internal thread
                    </button>
                )}

                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {visibleFilters.map((f) => {
                        const active = filter === f.id
                        return (
                            <button
                                key={f.id}
                                type="button"
                                onClick={() => onFilterChange(f.id)}
                                style={{
                                    padding: "4px 10px",
                                    fontSize: 11,
                                    fontWeight: 600,
                                    fontFamily: FONT,
                                    border: `1px solid ${active ? COLORS.moonstone : COLORS.ashSubtle}`,
                                    borderRadius: RADIUS.pill,
                                    background: active ? COLORS.moonstoneLight : COLORS.white,
                                    color: active ? COLORS.ash : COLORS.ashMuted,
                                    cursor: "pointer",
                                }}
                            >
                                {f.label}
                            </button>
                        )
                    })}
                </div>
            </div>

            <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
                {filtered.length === 0 ? (
                    <p style={{ padding: 20, fontSize: 13, color: COLORS.ashMuted, fontFamily: FONT, margin: 0 }}>
                        No threads match this filter.
                    </p>
                ) : (
                    filtered.map((item) => {
                        const selected = isSelected(item, selection)
                        const isInternal = item.kind === "internal"
                        return (
                            <button
                                key={item.kind === "referral" ? `ref-${item.referralId}` : `int-${item.conversationId}`}
                                type="button"
                                onClick={() =>
                                    onSelect(
                                        item.kind === "referral"
                                            ? { kind: "referral", id: item.referralId }
                                            : { kind: "internal", id: item.conversationId }
                                    )
                                }
                                style={{
                                    width: "100%",
                                    textAlign: "left",
                                    padding: "14px 18px",
                                    border: "none",
                                    borderBottom: `1px solid ${COLORS.ashSubtle}`,
                                    background: selected
                                        ? COLORS.moonstoneLight
                                        : item.unread
                                          ? COLORS.infoBg
                                          : COLORS.white,
                                    cursor: "pointer",
                                    fontFamily: FONT,
                                }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, flex: 1 }}>
                                        {isInternal && (
                                            <span
                                                style={{
                                                    flexShrink: 0,
                                                    fontSize: 9,
                                                    fontWeight: 700,
                                                    letterSpacing: "0.05em",
                                                    textTransform: "uppercase",
                                                    padding: "2px 6px",
                                                    borderRadius: RADIUS.pill,
                                                    background: COLORS.primary,
                                                    color: COLORS.primaryForeground,
                                                }}
                                            >
                                                Internal
                                            </span>
                                        )}
                                        <span
                                            style={
                                                item.kind === "referral"
                                                    ? clientNameStyle("md", {
                                                          overflow: "hidden",
                                                          textOverflow: "ellipsis",
                                                          whiteSpace: "nowrap",
                                                      })
                                                    : {
                                                          fontSize: 14,
                                                          fontWeight: 600,
                                                          fontFamily: FONT_HEADING,
                                                          color: COLORS.ash,
                                                          letterSpacing: "-0.02em",
                                                          overflow: "hidden",
                                                          textOverflow: "ellipsis",
                                                          whiteSpace: "nowrap",
                                                      }
                                            }
                                        >
                                            {inboxItemTitle(item)}
                                        </span>
                                    </div>
                                    <span style={{ fontSize: 11, color: COLORS.ashMuted, flexShrink: 0 }}>
                                        {inboxItemTimeLabel(item)}
                                    </span>
                                </div>
                                <div style={{ fontSize: 11, color: COLORS.ashMuted, marginBottom: 4 }}>
                                    {inboxItemSubtitle(item)}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    {item.unread && (
                                        <span
                                            style={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: "50%",
                                                background: COLORS.moonstone,
                                                flexShrink: 0,
                                            }}
                                            aria-label="Unread"
                                        />
                                    )}
                                    <span
                                        style={{
                                            fontSize: 13,
                                            color: COLORS.ashMuted,
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                            fontWeight: item.unread ? 600 : 400,
                                        }}
                                    >
                                        {inboxItemPreview(item)}
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
