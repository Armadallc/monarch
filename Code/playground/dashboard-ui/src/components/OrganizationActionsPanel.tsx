import { useMemo, useState, type CSSProperties } from "react"
import { COLORS, FONT, RADIUS, SHADOWS } from "@design"
import { organizationReferralStats } from "../organizationUtils"
import {
    ORGANIZATION_TYPE_LABELS,
    type MockOrganization,
    type MockReferral,
    type OrganizationType,
} from "../types"
import { EdgePanelCollapseFooter } from "./EdgePanelCollapseToggle"
import { exportOrganizationsCsv } from "../directoryExport"

type Props = {
    organization: MockOrganization
    referrals: MockReferral[]
    collapsed: boolean
    onToggleCollapse: () => void
    onClose: () => void
    onSave: (updated: MockOrganization) => void
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

const ORG_TYPE_OPTIONS = Object.entries(ORGANIZATION_TYPE_LABELS) as [OrganizationType, string][]

export function OrganizationActionsPanel({
    organization,
    referrals,
    collapsed,
    onToggleCollapse,
    onClose,
    onSave,
}: Props) {
    const [draft, setDraft] = useState(organization)
    const stats = useMemo(() => organizationReferralStats(referrals, organization), [referrals, organization])
    const width = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH

    const statItems = [
        { label: "Total referrals", value: stats.total },
        { label: "Active", value: stats.active },
        { label: "Under review", value: stats.under_review },
        { label: "New referral", value: stats.pending_review },
        { label: "Declined", value: stats.declined },
        { label: "Accepted", value: stats.accepted },
        { label: "Waitlisted", value: stats.waitlisted },
        { label: "This week", value: stats.this_week },
    ]

    const handleSave = () => {
        onSave(draft)
        window.alert("Organization contact saved (mock — wire to referral_source_profiles in production)")
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
            aria-label="Organization actions"
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
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{organization.name.charAt(0)}</span>
                ) : (
                    <>
                        <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.7, letterSpacing: "0.06em" }}>
                                ORGANIZATION
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
                                {organization.name}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close organization panel"
                            style={{
                                border: "none",
                                background: "rgba(255,255,255,0.12)",
                                color: COLORS.white,
                                borderRadius: RADIUS.small,
                                width: 32,
                                height: 32,
                                cursor: "pointer",
                                fontSize: 18,
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
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: 8,
                            }}
                        >
                            {statItems.map((item) => (
                                <div
                                    key={item.label}
                                    style={{
                                        padding: "10px 12px",
                                        background: COLORS.coconut25,
                                        borderRadius: RADIUS.small,
                                        border: `1px solid ${COLORS.ashSubtle}`,
                                    }}
                                >
                                    <div style={{ fontSize: 10, fontWeight: 600, color: COLORS.ashMuted }}>{item.label}</div>
                                    <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.ash }}>{item.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div
                            style={{
                                fontSize: 11,
                                fontWeight: 700,
                                letterSpacing: "0.06em",
                                color: COLORS.ashMuted,
                            }}
                        >
                            EDIT CONTACT
                        </div>

                        <label style={fieldLabel}>
                            Organization name
                            <input
                                type="text"
                                value={draft.name}
                                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                                style={fieldInput}
                            />
                        </label>

                        <label style={fieldLabel}>
                            Primary contact
                            <input
                                type="text"
                                value={draft.contact_name}
                                onChange={(e) => setDraft({ ...draft, contact_name: e.target.value })}
                                style={fieldInput}
                            />
                        </label>

                        <label style={fieldLabel}>
                            Phone
                            <input
                                type="tel"
                                value={draft.phone}
                                onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                                style={fieldInput}
                            />
                        </label>

                        <label style={fieldLabel}>
                            Email
                            <input
                                type="email"
                                value={draft.email}
                                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                                style={fieldInput}
                            />
                        </label>

                        <label style={fieldLabel}>
                            Organization type
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
                        </label>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: "auto" }}>
                        <button
                            type="button"
                            onClick={handleSave}
                            style={{
                                flex: "1 1 140px",
                                padding: "12px 16px",
                                fontSize: 13,
                                fontWeight: 600,
                                fontFamily: FONT,
                                border: "none",
                                borderRadius: RADIUS.small,
                                background: COLORS.ash,
                                color: COLORS.shell,
                                cursor: "pointer",
                            }}
                        >
                            Save changes
                        </button>
                        <button
                            type="button"
                            onClick={() => exportOrganizationsCsv([draft], referrals)}
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
                        <button
                            type="button"
                            onClick={onClose}
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
                            Close
                        </button>
                    </div>
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
