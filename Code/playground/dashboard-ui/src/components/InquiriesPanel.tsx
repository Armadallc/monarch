import { COLORS, FONT, RADIUS, SHADOWS, formatDisplayDate } from "@design"
import type { MockInquiry } from "../mockInquiries"

type Props = {
    inquiries: MockInquiry[]
}

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
    new: { bg: COLORS.champagneLight, text: COLORS.ash, label: "New" },
    contacted: { bg: COLORS.moonstoneLight, text: COLORS.gunmetal, label: "Contacted" },
    closed: { bg: COLORS.coconut, text: COLORS.ashMuted, label: "Closed" },
}

export function InquiriesPanel({ inquiries }: Props) {
    return (
        <div
            style={{
                flex: 1,
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
                background: COLORS.white,
                borderRadius: RADIUS.section,
                boxShadow: SHADOWS.card,
                overflow: "hidden",
                fontFamily: FONT,
            }}
        >
            <div
                style={{
                    padding: "14px 20px",
                    borderBottom: `1px solid ${COLORS.ashSubtle}`,
                    background: COLORS.sidebar,
                    color: COLORS.onChrome,
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    display: "grid",
                    gridTemplateColumns: "1.2fr 1fr 1.5fr 100px 110px",
                    gap: 12,
                }}
            >
                <span>Name</span>
                <span>Contact</span>
                <span>Message</span>
                <span>Status</span>
                <span>Submitted</span>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
                {inquiries.length === 0 ? (
                    <p style={{ padding: 24, margin: 0, fontSize: 14, color: COLORS.ashMuted }}>
                        No inquiries
                    </p>
                ) : (
                    inquiries.map((row, i) => {
                        const st = STATUS_STYLE[row.status] ?? STATUS_STYLE.new
                        return (
                            <div
                                key={row.id}
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1.2fr 1fr 1.5fr 100px 110px",
                                    gap: 12,
                                    padding: "14px 20px",
                                    alignItems: "center",
                                    borderBottom:
                                        i < inquiries.length - 1 ? `1px solid ${COLORS.ashSubtle}` : undefined,
                                    fontSize: 13,
                                    color: COLORS.ash,
                                }}
                            >
                                <span style={{ fontWeight: 600 }}>{row.name}</span>
                                <span style={{ color: COLORS.ashMuted, fontSize: 12 }}>
                                    {row.email}
                                    {row.phone ? ` · ${row.phone}` : ""}
                                </span>
                                <span
                                    style={{
                                        color: COLORS.ashMuted,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {row.message_preview}
                                </span>
                                <span
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 600,
                                        padding: "4px 10px",
                                        borderRadius: RADIUS.pill,
                                        background: st.bg,
                                        color: st.text,
                                        justifySelf: "start",
                                    }}
                                >
                                    {st.label}
                                </span>
                                <span style={{ fontSize: 12, color: COLORS.ashMuted }}>
                                    {formatDisplayDate(row.created_at)}
                                </span>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
