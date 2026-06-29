import { COLORS, FONT, RADIUS } from "@design"
import { STAFF_EMAIL_DOMAIN } from "../staffAccess"

type Props = {
    email: string
    program: string
    reason: "not_monarch" | "not_approved" | "blocked"
}

const COPY: Record<Props["reason"], { title: string; body: string }> = {
    not_monarch: {
        title: "Staff sign-in required",
        body: `The admissions dashboard is limited to @${STAFF_EMAIL_DOMAIN} accounts approved by your program admin.`,
    },
    not_approved: {
        title: "Dashboard access not approved",
        body: `You signed in with a @${STAFF_EMAIL_DOMAIN} account, but admissions has not added you to the staff allowlist yet. Contact your admissions admin to request access.`,
    },
    blocked: {
        title: "Dashboard access removed",
        body: "Your account has been blocked from the admissions dashboard. Contact your admissions admin if you believe this is an error.",
    },
}

export function StaffAccessDenied({ email, program, reason }: Props) {
    const copy = COPY[reason]

    return (
        <div
            style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 32,
                minHeight: 0,
            }}
        >
            <div
                style={{
                    maxWidth: 480,
                    width: "100%",
                    padding: "28px 32px",
                    background: COLORS.white,
                    border: `1px solid ${COLORS.ashSubtle}`,
                    borderRadius: RADIUS.section,
                    fontFamily: FONT,
                    textAlign: "center",
                }}
            >
                <h1 style={{ margin: "0 0 12px", fontSize: 22, fontWeight: 700, color: COLORS.ash }}>{copy.title}</h1>
                <p style={{ margin: "0 0 20px", fontSize: 14, color: COLORS.ashMuted, lineHeight: 1.55 }}>{copy.body}</p>
                <div
                    style={{
                        fontSize: 12,
                        color: COLORS.ashMuted,
                        padding: "12px 14px",
                        background: COLORS.coconut25,
                        borderRadius: RADIUS.small,
                        textAlign: "left",
                        lineHeight: 1.5,
                    }}
                >
                    <div>
                        <strong style={{ color: COLORS.ash }}>Signed in as:</strong> {email}
                    </div>
                    <div>
                        <strong style={{ color: COLORS.ash }}>Program:</strong> {program}
                    </div>
                </div>
                <p style={{ margin: "16px 0 0", fontSize: 12, color: COLORS.ashMuted }}>
                    Playground tip: use the <strong>Staff session</strong> selector in the header to switch personas.
                </p>
            </div>
        </div>
    )
}
