import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react"
import { COLORS, FONT, RADIUS, SHADOWS, formatDisplayDate } from "@design"
import { referralsForContact } from "../contactUtils"
import {
    ORGANIZATION_TYPE_LABELS,
    STATUS_LABELS,
    type MockContact,
    type MockReferral,
    type OrganizationType,
} from "../types"
import { EdgePanelCollapseFooter } from "./EdgePanelCollapseToggle"
import { exportContactsCsv } from "../directoryExport"

export type ContactPanelMode = "create" | "edit"

type Props = {
    contact: MockContact
    referrals: MockReferral[]
    mode: ContactPanelMode
    collapsed: boolean
    onToggleCollapse: () => void
    onClose: () => void
    onSave: (updated: MockContact) => void
}

const EXPANDED_WIDTH = 340
const COLLAPSED_WIDTH = 52

const fieldLabel: CSSProperties = {
    display: "block",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: COLORS.ashMuted,
    marginBottom: 6,
    fontFamily: FONT,
}

const fieldInput: CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    fontSize: 13,
    fontFamily: FONT,
    border: `1px solid ${COLORS.ashSubtle}`,
    borderRadius: RADIUS.small,
    background: COLORS.white,
    color: COLORS.ash,
    boxSizing: "border-box",
}

const readOnlyValue: CSSProperties = {
    padding: "10px 12px",
    fontSize: 13,
    fontFamily: FONT,
    borderRadius: RADIUS.small,
    background: COLORS.coconut25,
    border: `1px solid ${COLORS.ashSubtle}`,
    color: COLORS.ash,
    lineHeight: 1.45,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
}

const ORG_TYPE_OPTIONS = Object.entries(ORGANIZATION_TYPE_LABELS) as [OrganizationType, string][]

function ReadOnlyField({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div style={fieldLabel}>{label}</div>
            <div style={readOnlyValue}>{value.trim() ? value : "—"}</div>
        </div>
    )
}

export function ContactActionsPanelShell({
    collapsed,
    onToggleCollapse,
}: {
    collapsed: boolean
    onToggleCollapse: () => void
}) {
    const width = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH

    return (
        <aside
            style={{
                width,
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                background: COLORS.white,
                borderLeft: `1px solid ${COLORS.ashSubtle}`,
                boxShadow: SHADOWS.card,
                fontFamily: FONT,
                transition: "width 0.2s ease",
                minHeight: 0,
                overflow: "hidden",
            }}
            aria-label="Contact actions"
        >
            <div
                style={{
                    flex: 1,
                    minHeight: 0,
                    display: "flex",
                    flexDirection: "column",
                    padding: collapsed ? "12px 8px 0" : "16px 16px 0",
                }}
            >
                {!collapsed ? (
                    <div
                        style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "24px 8px",
                        }}
                    >
                        <p
                            style={{
                                margin: 0,
                                fontSize: 13,
                                color: COLORS.ashMuted,
                                textAlign: "center",
                                lineHeight: 1.55,
                            }}
                        >
                            Select a contact to view details, or use <strong style={{ color: COLORS.ash }}>+ New Contact</strong>{" "}
                            above the list.
                        </p>
                    </div>
                ) : (
                    <div style={{ flex: 1 }} />
                )}
                <EdgePanelCollapseFooter
                    collapsed={collapsed}
                    onToggleCollapse={onToggleCollapse}
                    edge="right"
                    panelLabel="actions panel"
                />
            </div>
        </aside>
    )
}

export function ContactActionsPanel({
    contact,
    referrals,
    mode,
    collapsed,
    onToggleCollapse,
    onClose,
    onSave,
}: Props) {
    const [draft, setDraft] = useState(contact)
    const [editing, setEditing] = useState(mode === "create")
    const matchingReferrals = useMemo(() => referralsForContact(referrals, contact), [referrals, contact])
    const width = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH
    const isPersonal = contact.source === "user"
    const isReferralSource = contact.source === "referral"
    const isCreate = mode === "create"
    const formActive = isCreate || editing

    useEffect(() => {
        setDraft(contact)
        setEditing(mode === "create")
    }, [contact.id, mode])

    const statusBreakdown = useMemo(() => {
        const counts: Partial<Record<string, number>> = {}
        for (const r of matchingReferrals) {
            counts[r.status] = (counts[r.status] ?? 0) + 1
        }
        return counts
    }, [matchingReferrals])

    const headerEyebrow = isCreate
        ? "NEW CONTACT"
        : isPersonal
          ? "PERSONAL CONTACT"
          : "REFERRAL SOURCE"

    const handleSave = () => {
        onSave(draft)
        if (!isCreate) setEditing(false)
    }

    const handleCancelEdit = () => {
        if (isCreate) {
            onClose()
            return
        }
        setDraft(contact)
        setEditing(false)
    }

    const renderField = (
        label: string,
        value: string,
        editable: boolean,
        renderInput: ReactNode
    ) => {
        if (formActive && editable) {
            return (
                <label style={fieldLabel}>
                    {label}
                    {renderInput}
                </label>
            )
        }
        return <ReadOnlyField label={label} value={value} />
    }

    return (
        <aside
            style={{
                width,
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                background: COLORS.white,
                borderLeft: `1px solid ${COLORS.ashSubtle}`,
                boxShadow: SHADOWS.card,
                fontFamily: FONT,
                transition: "width 0.2s ease",
                minHeight: 0,
                overflow: "hidden",
            }}
            aria-label="Contact actions"
        >
            <div
                style={{
                    flexShrink: 0,
                    padding: collapsed ? "14px 8px" : "16px 16px",
                    borderBottom: `1px solid ${COLORS.ashSubtle}`,
                    background: COLORS.sidebar,
                    color: COLORS.onChrome,
                    display: "flex",
                    alignItems: collapsed ? "center" : "flex-start",
                    justifyContent: collapsed ? "center" : "space-between",
                    gap: 10,
                }}
            >
                {collapsed ? (
                    <span style={{ fontSize: 14, fontWeight: 700 }}>
                        {isCreate ? "+" : contact.name.charAt(0)}
                    </span>
                ) : (
                    <>
                        <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.7, letterSpacing: "0.06em" }}>
                                {headerEyebrow}
                            </div>
                            <div
                                style={{
                                    fontSize: 16,
                                    fontWeight: 700,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {isCreate ? "Add contact" : contact.name}
                            </div>
                            {!isCreate && (
                                <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>{contact.organization}</div>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close contact panel"
                            style={{
                                border: "none",
                                background: "rgba(255,255,255,0.12)",
                                color: COLORS.white,
                                borderRadius: RADIUS.small,
                                width: 32,
                                height: 32,
                                cursor: "pointer",
                                fontSize: 18,
                                flexShrink: 0,
                            }}
                        >
                            ×
                        </button>
                    </>
                )}
            </div>

            <div
                style={{
                    flex: 1,
                    minHeight: 0,
                    display: "flex",
                    flexDirection: "column",
                    padding: collapsed ? "12px 8px 0" : "0",
                }}
            >
                {!collapsed ? (
                <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
                    {!isCreate && matchingReferrals.length > 0 && (
                        <div>
                            <div
                                style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    letterSpacing: "0.06em",
                                    color: COLORS.ashMuted,
                                    marginBottom: 10,
                                }}
                            >
                                REFERRAL STATS
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                                <div
                                    style={{
                                        padding: "10px 12px",
                                        background: COLORS.coconut25,
                                        borderRadius: RADIUS.small,
                                        border: `1px solid ${COLORS.ashSubtle}`,
                                    }}
                                >
                                    <div style={{ fontSize: 10, fontWeight: 600, color: COLORS.ashMuted }}>Total sent</div>
                                    <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.ash }}>{matchingReferrals.length}</div>
                                </div>
                                <div
                                    style={{
                                        padding: "10px 12px",
                                        background: COLORS.coconut25,
                                        borderRadius: RADIUS.small,
                                        border: `1px solid ${COLORS.ashSubtle}`,
                                    }}
                                >
                                    <div style={{ fontSize: 10, fontWeight: 600, color: COLORS.ashMuted }}>Last active</div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.ash }}>
                                        {contact.last_active_at ? formatDisplayDate(contact.last_active_at) : "—"}
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {Object.entries(statusBreakdown).map(([status, count]) => (
                                    <span
                                        key={status}
                                        style={{
                                            fontSize: 11,
                                            fontWeight: 600,
                                            padding: "4px 10px",
                                            borderRadius: RADIUS.pill,
                                            background: COLORS.coconut,
                                            color: COLORS.ash,
                                        }}
                                    >
                                        {STATUS_LABELS[status as keyof typeof STATUS_LABELS] ?? status}: {count}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 8,
                            }}
                        >
                            <div
                                style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    letterSpacing: "0.06em",
                                    color: COLORS.ashMuted,
                                }}
                            >
                                {formActive ? (isCreate ? "CONTACT DETAILS" : "EDIT CONTACT") : "CONTACT DETAILS"}
                            </div>
                            {!isCreate && !editing && (
                                <button
                                    type="button"
                                    onClick={() => setEditing(true)}
                                    style={{
                                        padding: "4px 10px",
                                        fontSize: 12,
                                        fontWeight: 600,
                                        fontFamily: FONT,
                                        border: `1px solid ${COLORS.ashSubtle}`,
                                        borderRadius: RADIUS.small,
                                        background: COLORS.white,
                                        color: COLORS.ash,
                                        cursor: "pointer",
                                    }}
                                >
                                    Edit
                                </button>
                            )}
                        </div>

                        {isReferralSource && !isCreate && (
                            <p style={{ margin: 0, fontSize: 12, color: COLORS.ashMuted, lineHeight: 1.45 }}>
                                Identity fields come from referral submissions. You can update phone, URL, and notes only.
                            </p>
                        )}

                        {renderField(
                            "Name",
                            draft.name,
                            isPersonal || isCreate,
                            <input
                                type="text"
                                value={draft.name}
                                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                                style={fieldInput}
                                autoFocus={isCreate}
                            />
                        )}

                        {renderField(
                            "Organization",
                            draft.organization,
                            isPersonal || isCreate,
                            <input
                                type="text"
                                value={draft.organization}
                                onChange={(e) => setDraft({ ...draft, organization: e.target.value })}
                                style={fieldInput}
                            />
                        )}

                        {renderField(
                            "Organization type",
                            ORGANIZATION_TYPE_LABELS[draft.organization_type],
                            isPersonal || isCreate,
                            <select
                                value={draft.organization_type}
                                onChange={(e) =>
                                    setDraft({ ...draft, organization_type: e.target.value as OrganizationType })
                                }
                                style={{ ...fieldInput, cursor: "pointer" }}
                            >
                                {ORG_TYPE_OPTIONS.map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        )}

                        {renderField(
                            "Phone",
                            draft.phone,
                            true,
                            <input
                                type="tel"
                                value={draft.phone}
                                onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                                style={fieldInput}
                            />
                        )}

                        {renderField(
                            "Email",
                            draft.email,
                            isPersonal || isCreate,
                            <input
                                type="email"
                                value={draft.email}
                                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                                style={fieldInput}
                            />
                        )}

                        {renderField(
                            "URL",
                            draft.url,
                            true,
                            <input
                                type="url"
                                value={draft.url}
                                onChange={(e) => setDraft({ ...draft, url: e.target.value })}
                                placeholder="https://"
                                style={fieldInput}
                            />
                        )}

                        {renderField(
                            "Notes",
                            draft.notes,
                            true,
                            <textarea
                                value={draft.notes}
                                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                                rows={4}
                                style={{ ...fieldInput, resize: "vertical", minHeight: 80 }}
                            />
                        )}
                    </div>

                    {!formActive && !isCreate && (
                        <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                            <button
                                type="button"
                                onClick={() => exportContactsCsv([draft])}
                                style={{
                                    flex: 1,
                                    padding: "12px 16px",
                                    fontSize: 13,
                                    fontWeight: 600,
                                    fontFamily: FONT,
                                    border: `1px solid ${COLORS.ashSubtle}`,
                                    borderRadius: RADIUS.small,
                                    background: COLORS.white,
                                    color: COLORS.ash,
                                    cursor: "pointer",
                                }}
                            >
                                Export CSV
                            </button>
                        </div>
                    )}

                    {formActive && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: "auto" }}>
                            <button
                                type="button"
                                onClick={handleSave}
                                style={{
                                    flex: 1,
                                    padding: "12px 16px",
                                    fontSize: 13,
                                    fontWeight: 600,
                                    fontFamily: FONT,
                                    border: "none",
                                    borderRadius: RADIUS.small,
                                    background: COLORS.moonstone,
                                    color: COLORS.white,
                                    cursor: "pointer",
                                }}
                            >
                                {isCreate ? "Create contact" : "Save changes"}
                            </button>
                            {!isCreate ? (
                                <button
                                    type="button"
                                    onClick={() => exportContactsCsv([draft])}
                                    style={{
                                        padding: "12px 16px",
                                        fontSize: 13,
                                        fontWeight: 600,
                                        fontFamily: FONT,
                                        border: `1px solid ${COLORS.ashSubtle}`,
                                        borderRadius: RADIUS.small,
                                        background: COLORS.white,
                                        color: COLORS.ash,
                                        cursor: "pointer",
                                    }}
                                >
                                    Export CSV
                                </button>
                            ) : null}
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                style={{
                                    padding: "12px 16px",
                                    fontSize: 13,
                                    fontWeight: 600,
                                    fontFamily: FONT,
                                    border: `1px solid ${COLORS.ashSubtle}`,
                                    borderRadius: RADIUS.small,
                                    background: COLORS.white,
                                    color: COLORS.ashMuted,
                                    cursor: "pointer",
                                }}
                            >
                                {isCreate ? "Cancel" : "Cancel"}
                            </button>
                        </div>
                    )}
                </div>
                ) : (
                    <div style={{ flex: 1 }} />
                )}

                <EdgePanelCollapseFooter
                    collapsed={collapsed}
                    onToggleCollapse={onToggleCollapse}
                    edge="right"
                    panelLabel="actions panel"
                />
            </div>
        </aside>
    )
}
