import type { CSSProperties, MouseEvent } from "react"
import { COLORS, FONT, RADIUS } from "@design"
import { ORGANIZATION_TYPE_LABELS, type MockOrganization } from "../types"

type Props = {
    organizations: MockOrganization[]
    selectedIds: Set<string>
    onToggleSelect: (id: string) => void
    onToggleSelectAll: () => void
    onOpen: (org: MockOrganization) => void
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

export function OrganizationsListView({
    organizations,
    selectedIds,
    onToggleSelect,
    onToggleSelectAll,
    onOpen,
}: Props) {
    const allSelected = organizations.length > 0 && selectedIds.size === organizations.length
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
                    aria-label="Select all organizations"
                    onChange={onToggleSelectAll}
                    style={{ width: 16, height: 16, cursor: "pointer" }}
                />
                <span>Organization / Contact</span>
                <span style={{ textAlign: "right" }}>Type</span>
                <span />
            </div>

            <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
                {organizations.length === 0 ? (
                    <div style={{ padding: 32, textAlign: "center", color: COLORS.ashMuted, fontSize: 14 }}>
                        No organizations match your filters
                    </div>
                ) : (
                    organizations.map((org, index) => {
                        const selected = selectedIds.has(org.id)
                        const zebra = index % 2 === 0 ? COLORS.white : COLORS.coconut25
                        return (
                            <div
                                key={org.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => onOpen(org)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault()
                                        onOpen(org)
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
                                    aria-label={`Select ${org.name}`}
                                    onChange={() => onToggleSelect(org.id)}
                                    onClick={stopRowClick}
                                    style={{ width: 16, height: 16, cursor: "pointer" }}
                                />

                                <div style={{ minWidth: 0 }}>
                                    <div
                                        style={{
                                            fontSize: 15,
                                            fontWeight: 700,
                                            color: COLORS.ash,
                                            letterSpacing: "-0.02em",
                                            marginBottom: 4,
                                        }}
                                    >
                                        {org.name}
                                    </div>
                                    <div style={{ ...metaLine, marginBottom: 2 }}>{org.contact_name}</div>
                                    <div style={metaLine}>
                                        <PhoneIcon />
                                        <span>{org.phone}</span>
                                    </div>
                                    <div style={{ ...metaLine, marginTop: 2 }}>
                                        <AtIcon />
                                        <span
                                            style={{
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {org.email}
                                        </span>
                                    </div>
                                </div>

                                <span
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        padding: "6px 12px",
                                        borderRadius: RADIUS.pill,
                                        background: COLORS.champagne,
                                        color: COLORS.ash,
                                        whiteSpace: "nowrap",
                                        textAlign: "center",
                                    }}
                                >
                                    {ORGANIZATION_TYPE_LABELS[org.organization_type]}
                                </span>

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
