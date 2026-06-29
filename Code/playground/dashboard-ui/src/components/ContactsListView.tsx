import type { CSSProperties, MouseEvent } from "react"
import { COLORS, FONT, RADIUS, formatDisplayDate } from "@design"
import { ORGANIZATION_TYPE_LABELS, type MockContact } from "../types"

type Props = {
    contacts: MockContact[]
    selectedIds: Set<string>
    onToggleSelect: (id: string) => void
    onToggleSelectAll: () => void
    onOpen: (contact: MockContact) => void
}

function PhoneIcon() {
    return (
        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
    )
}

function AtIcon() {
    return (
        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <circle cx="12" cy="12" r="4" />
            <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
        </svg>
    )
}

const metaLine: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    color: COLORS.ashMuted,
    minWidth: 0,
}

export function ContactsListView({ contacts, selectedIds, onToggleSelect, onToggleSelectAll, onOpen }: Props) {
    const allSelected = contacts.length > 0 && selectedIds.size === contacts.length
    const someSelected = selectedIds.size > 0 && !allSelected

    const stopRowClick = (e: MouseEvent) => {
        e.stopPropagation()
    }

    return (
        <div
            style={{
                flex: 1,
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
                border: `1px solid ${COLORS.ashSubtle}`,
                borderRadius: RADIUS.section,
                background: COLORS.white,
                overflow: "hidden",
            }}
        >
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "40px 1fr auto 32px",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 16px",
                    background: COLORS.coconut,
                    borderBottom: `1px solid ${COLORS.ashSubtle}`,
                    fontFamily: FONT,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: COLORS.ashMuted,
                }}
            >
                <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                        if (el) el.indeterminate = someSelected
                    }}
                    aria-label="Select all contacts"
                    onChange={onToggleSelectAll}
                    style={{ width: 16, height: 16, cursor: "pointer" }}
                />
                <span>Contact / Organization</span>
                <span style={{ textAlign: "right" }}>Type · Referrals</span>
                <span />
            </div>

            <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
                {contacts.length === 0 ? (
                    <div style={{ padding: 32, textAlign: "center", color: COLORS.ashMuted, fontSize: 14 }}>
                        No contacts match your filters
                    </div>
                ) : (
                    contacts.map((contact, index) => {
                        const selected = selectedIds.has(contact.id)
                        const zebra = index % 2 === 0 ? COLORS.white : COLORS.coconut25
                        const isPersonal = contact.source === "user"

                        return (
                            <div
                                key={contact.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => onOpen(contact)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault()
                                        onOpen(contact)
                                    }
                                }}
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "40px 1fr auto 32px",
                                    alignItems: "center",
                                    gap: 12,
                                    padding: "14px 16px",
                                    background: selected ? COLORS.moonstoneLight : zebra,
                                    borderBottom: `1px solid ${COLORS.ashSubtle}`,
                                    cursor: "pointer",
                                    fontFamily: FONT,
                                    transition: "background 0.15s ease",
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={selected}
                                    aria-label={`Select ${contact.name}`}
                                    onChange={() => onToggleSelect(contact.id)}
                                    onClick={stopRowClick}
                                    style={{ width: 16, height: 16, cursor: "pointer" }}
                                />

                                <div style={{ minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                        <div
                                            style={{
                                                fontSize: 15,
                                                fontWeight: 700,
                                                color: COLORS.ash,
                                                letterSpacing: "-0.02em",
                                            }}
                                        >
                                            {contact.name}
                                        </div>
                                        {isPersonal && (
                                            <span
                                                style={{
                                                    fontSize: 10,
                                                    fontWeight: 700,
                                                    padding: "2px 8px",
                                                    borderRadius: RADIUS.pill,
                                                    background: COLORS.moonstoneLight,
                                                    color: COLORS.moonstone,
                                                    letterSpacing: "0.04em",
                                                    textTransform: "uppercase",
                                                }}
                                            >
                                                Personal
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ ...metaLine, marginBottom: 2, fontWeight: 500 }}>{contact.organization}</div>
                                    {contact.phone ? (
                                        <div style={metaLine}>
                                            <PhoneIcon />
                                            <span>{contact.phone}</span>
                                        </div>
                                    ) : null}
                                    {contact.email ? (
                                        <div style={{ ...metaLine, marginTop: contact.phone ? 2 : 0 }}>
                                            <AtIcon />
                                            <span
                                                style={{
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {contact.email}
                                            </span>
                                        </div>
                                    ) : null}
                                    {contact.last_active_at ? (
                                        <div style={{ ...metaLine, marginTop: 4, fontSize: 11 }}>
                                            Last active {formatDisplayDate(contact.last_active_at)}
                                        </div>
                                    ) : null}
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                                    <span
                                        style={{
                                            fontSize: 11,
                                            fontWeight: 700,
                                            padding: "6px 12px",
                                            borderRadius: RADIUS.pill,
                                            background: COLORS.champagne,
                                            color: COLORS.ash,
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {ORGANIZATION_TYPE_LABELS[contact.organization_type]}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: 11,
                                            fontWeight: 600,
                                            color: contact.referral_count > 0 ? COLORS.ash : COLORS.ashMuted,
                                        }}
                                    >
                                        {contact.referral_count} referral{contact.referral_count === 1 ? "" : "s"}
                                    </span>
                                </div>

                                <span style={{ color: COLORS.ashMuted, fontSize: 16, textAlign: "center" }} aria-hidden>
                                    →
                                </span>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
