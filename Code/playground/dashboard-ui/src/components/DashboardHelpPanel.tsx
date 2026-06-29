import type { CSSProperties, ReactNode } from "react"
import { COLORS, FONT, FONT_HEADING, RADIUS } from "@design"
import {
    DASHBOARD_HELP_FAQ,
    DASHBOARD_HELP_QUICKSTART,
    DASHBOARD_SOP_PDF_URL,
    DASHBOARD_SUPPORT_EMAIL,
    DASHBOARD_SUPPORT_PHONE_DISPLAY,
    DASHBOARD_SUPPORT_PHONE_TEL,
} from "../dashboardHelpContent"

const sectionCardStyle: CSSProperties = {
    padding: "16px 18px",
    borderRadius: RADIUS.section,
    border: `1px solid ${COLORS.ashSubtle}`,
    background: COLORS.coconut,
}

const sectionTitle: CSSProperties = {
    margin: "0 0 12px",
    fontSize: 15,
    fontWeight: 600,
    fontFamily: FONT_HEADING,
    color: COLORS.ash,
}

const codeChip: CSSProperties = {
    fontSize: 12,
    background: COLORS.coconut50,
    padding: "2px 6px",
    borderRadius: 4,
    fontFamily: FONT,
}

const contactLink: CSSProperties = {
    color: COLORS.ash,
    fontWeight: 600,
    textDecoration: "none",
    fontFamily: FONT,
}

function inlineBoldText(text: string): ReactNode {
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
    return parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={i}>{part.slice(2, -2)}</strong>
        }
        if (part.startsWith("`") && part.endsWith("`")) {
            return (
                <code key={i} style={codeChip}>
                    {part.slice(1, -1)}
                </code>
            )
        }
        return part
    })
}

export function DashboardHelpPanel() {
    return (
        <>
            <p style={{ margin: "0 0 28px", fontSize: 14, lineHeight: 1.55, color: COLORS.ashMuted, fontFamily: FONT }}>
                Quick reference for admissions. Full onboarding and SOP: see your staff training page and printed SOP
                packet (repo:{" "}
                <code style={codeChip}>docs/ADMISSIONS_STAFF_ONBOARDING_AND_SOP.md</code>).
            </p>

            <div style={{ marginBottom: 28 }}>
                <h3 style={sectionTitle}>Quickstart</h3>
                <div style={{ ...sectionCardStyle, fontSize: 14, fontFamily: FONT, color: COLORS.ash, lineHeight: 1.55 }}>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                        {DASHBOARD_HELP_QUICKSTART.map((item) => (
                            <li key={item} style={{ marginBottom: 8 }}>
                                {inlineBoldText(item)}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div style={{ marginBottom: 28 }}>
                <h3 style={sectionTitle}>FAQ</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {DASHBOARD_HELP_FAQ.map((item) => (
                        <div key={item.q} style={{ ...sectionCardStyle, padding: "16px 18px" }}>
                            <p
                                style={{
                                    margin: "0 0 8px",
                                    fontSize: 14,
                                    fontWeight: 600,
                                    fontFamily: FONT_HEADING,
                                    color: COLORS.ash,
                                }}
                            >
                                {item.q}
                            </p>
                            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, fontFamily: FONT, color: COLORS.ashMuted }}>
                                {item.a}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ marginBottom: 28 }}>
                <h3 style={sectionTitle}>Standard operating procedures (SOP)</h3>
                <div style={{ ...sectionCardStyle, fontSize: 14, fontFamily: FONT, color: COLORS.ash }}>
                    {DASHBOARD_SOP_PDF_URL ? (
                        <a
                            href={DASHBOARD_SOP_PDF_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: COLORS.primary, fontWeight: 600, textDecoration: "none" }}
                        >
                            Download SOP (PDF) ↗
                        </a>
                    ) : (
                        <p style={{ margin: 0, color: COLORS.ashMuted, fontSize: 13, lineHeight: 1.5 }}>
                            Add a hosted PDF URL in <code style={codeChip}>DASHBOARD_SOP_PDF_URL</code> in{" "}
                            <code style={codeChip}>dashboardHelpContent.ts</code>, or link to your SOP from your intranet
                            here once finalized.
                        </p>
                    )}
                </div>
            </div>

            <div style={{ marginBottom: 20 }}>
                <h3 style={sectionTitle}>Contact</h3>
                <div style={{ ...sectionCardStyle, fontSize: 14, fontFamily: FONT, color: COLORS.ash, lineHeight: 1.6 }}>
                    <p style={{ margin: "0 0 8px" }}>
                        <strong>Email:</strong>{" "}
                        <a href={`mailto:${DASHBOARD_SUPPORT_EMAIL}`} style={contactLink}>
                            {DASHBOARD_SUPPORT_EMAIL}
                        </a>
                    </p>
                    <p style={{ margin: 0 }}>
                        <strong>Phone:</strong>{" "}
                        <a href={`tel:${DASHBOARD_SUPPORT_PHONE_TEL}`} style={contactLink}>
                            {DASHBOARD_SUPPORT_PHONE_DISPLAY}
                        </a>
                    </p>
                </div>
            </div>

            <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: COLORS.ashMuted, fontFamily: FONT }}>
                <strong style={{ color: COLORS.ash }}>Tooltips</strong> on individual controls are on the wishlist (see
                program checklist P2).
            </p>
        </>
    )
}
