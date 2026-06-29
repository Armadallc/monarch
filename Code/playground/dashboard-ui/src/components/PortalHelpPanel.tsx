import { useState, type CSSProperties } from "react"
import { COLORS, FONT, FONT_HEADING, RADIUS } from "@design"
import {
    PORTAL_HELP_FAQ,
    PORTAL_HELP_QUICKSTART,
    PORTAL_HELP_SUPPORT_EMAIL,
    PORTAL_HELP_SUPPORT_PHONE_DISPLAY,
    PORTAL_HELP_SUPPORT_PHONE_TEL,
} from "../portalHelpContent"

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

function inlineBoldText(text: string) {
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

export function PortalHelpPanel() {
    const [openFaqs, setOpenFaqs] = useState<Set<number>>(() => new Set())

    const toggleFaq = (index: number) => {
        setOpenFaqs((prev) => {
            const next = new Set(prev)
            if (next.has(index)) next.delete(index)
            else next.add(index)
            return next
        })
    }

    return (
        <>
            <p style={{ margin: "0 0 20px", fontSize: 14, lineHeight: 1.55, color: COLORS.ashMuted, fontFamily: FONT }}>
                Quick answers for referring sources. For clinical questions about a specific case, use messages inside
                the referral when available or contact admissions using the information below.
            </p>

            <div style={{ marginBottom: 24 }}>
                <h3 style={sectionTitle}>Quickstart</h3>
                <div style={{ ...sectionCardStyle, fontSize: 14, fontFamily: FONT, color: COLORS.ash, lineHeight: 1.55 }}>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                        {PORTAL_HELP_QUICKSTART.map((item) => (
                            <li key={item} style={{ marginBottom: 8 }}>
                                {inlineBoldText(item)}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div style={{ marginBottom: 24 }}>
                <h3 style={sectionTitle}>FAQ</h3>
                <p style={{ margin: "0 0 12px", fontSize: 12, color: COLORS.ashMuted, fontFamily: FONT }}>
                    Tap a question to expand the answer.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {PORTAL_HELP_FAQ.map((item, index) => {
                        const open = openFaqs.has(index)
                        return (
                            <div
                                key={item.q}
                                style={{
                                    ...sectionCardStyle,
                                    padding: 0,
                                    overflow: "hidden",
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() => toggleFaq(index)}
                                    aria-expanded={open}
                                    style={{
                                        width: "100%",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: 12,
                                        padding: "14px 16px",
                                        fontSize: 14,
                                        fontWeight: 600,
                                        fontFamily: FONT_HEADING,
                                        color: COLORS.ash,
                                        background: open ? COLORS.coconut50 : COLORS.coconut,
                                        border: "none",
                                        cursor: "pointer",
                                        textAlign: "left",
                                    }}
                                >
                                    <span style={{ flex: "1 1 auto", minWidth: 0 }}>{item.q}</span>
                                    <span
                                        style={{ flexShrink: 0, fontSize: 12, color: COLORS.primary, fontWeight: 700 }}
                                        aria-hidden
                                    >
                                        {open ? "▼" : "▶"}
                                    </span>
                                </button>
                                {open ? (
                                    <div
                                        style={{
                                            padding: "0 16px 16px",
                                            fontSize: 13,
                                            lineHeight: 1.5,
                                            fontFamily: FONT,
                                            color: COLORS.ashMuted,
                                            borderTop: `1px solid ${COLORS.ashSubtle}`,
                                            background: COLORS.white,
                                        }}
                                    >
                                        {item.a}
                                    </div>
                                ) : null}
                            </div>
                        )
                    })}
                </div>
            </div>

            <div style={{ marginBottom: 16 }}>
                <h3 style={sectionTitle}>Contact</h3>
                <div style={{ ...sectionCardStyle, fontSize: 14, fontFamily: FONT, color: COLORS.ash, lineHeight: 1.6 }}>
                    <p style={{ margin: "0 0 8px" }}>
                        <strong>Email:</strong>{" "}
                        <a href={`mailto:${PORTAL_HELP_SUPPORT_EMAIL}`} style={contactLink}>
                            {PORTAL_HELP_SUPPORT_EMAIL}
                        </a>
                    </p>
                    <p style={{ margin: 0 }}>
                        <strong>Phone:</strong>{" "}
                        <a href={`tel:${PORTAL_HELP_SUPPORT_PHONE_TEL}`} style={contactLink}>
                            {PORTAL_HELP_SUPPORT_PHONE_DISPLAY}
                        </a>
                    </p>
                </div>
            </div>

            <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: COLORS.ashMuted, fontFamily: FONT }}>
                This page is for logistical and technical help. For emergencies, use your local protocols and appropriate
                crisis services.
            </p>
        </>
    )
}
