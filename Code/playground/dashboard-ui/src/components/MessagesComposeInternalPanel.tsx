import { useMemo, useState } from "react"
import { COLORS, FONT, RADIUS } from "@design"
import { filterStaffForMention, resolveParticipantUsernames } from "../internalMessageUtils"
import { MOCK_STAFF_DIRECTORY } from "../mockStaffDirectory"

type Props = {
    currentUsername: string
    onCreate: (payload: { subject: string; recipientInput: string; firstMessage: string }) => void
    onCancel: () => void
}

export function MessagesComposeInternalPanel({ currentUsername, onCreate, onCancel }: Props) {
    const [subject, setSubject] = useState("")
    const [recipients, setRecipients] = useState("")
    const [firstMessage, setFirstMessage] = useState("")
    const [mentionQuery, setMentionQuery] = useState<string | null>(null)

    const participantPreview = useMemo(
        () => resolveParticipantUsernames(recipients, currentUsername),
        [recipients, currentUsername]
    )

    const suggestions = useMemo(() => {
        if (mentionQuery === null) return []
        return filterStaffForMention(mentionQuery, currentUsername).slice(0, 6)
    }, [mentionQuery, currentUsername])

    const handleRecipientsChange = (value: string) => {
        setRecipients(value)
        const match = value.match(/@([a-zA-Z0-9._-]*)$/)
        setMentionQuery(match ? match[1] : null)
    }

    const appendMention = (username: string) => {
        const trimmed = recipients.replace(/@([a-zA-Z0-9._-]*)$/, "")
        const spacer = trimmed.length > 0 && !trimmed.endsWith(" ") ? " " : ""
        setRecipients(`${trimmed}${spacer}@${username} `)
        setMentionQuery(null)
    }

    const canCreate = subject.trim().length > 0 && participantPreview.length >= 1

    return (
        <div
            style={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                background: COLORS.coconut25,
                fontFamily: FONT,
            }}
        >
            <div
                style={{
                    flexShrink: 0,
                    padding: "14px 20px",
                    borderBottom: `1px solid ${COLORS.ashSubtle}`,
                    background: COLORS.white,
                }}
            >
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: COLORS.ash }}>New internal thread</h3>
                <p style={{ margin: "6px 0 0", fontSize: 12, color: COLORS.ashMuted, lineHeight: 1.45 }}>
                    Staff only. Add teammates with @username (e.g. @acorte, @jhurd). Separate from referral threads.
                </p>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
                <div style={{ maxWidth: 520, display: "flex", flexDirection: "column", gap: 16 }}>
                    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: COLORS.ashMuted }}>
                            SUBJECT
                        </span>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="e.g. Weekend coverage — admissions"
                            style={{
                                padding: "10px 12px",
                                fontSize: 14,
                                fontFamily: FONT,
                                border: `1px solid ${COLORS.ashSubtle}`,
                                borderRadius: RADIUS.small,
                                background: COLORS.white,
                            }}
                        />
                    </label>

                    <label style={{ display: "flex", flexDirection: "column", gap: 6, position: "relative" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: COLORS.ashMuted }}>
                            TO
                        </span>
                        <input
                            type="text"
                            value={recipients}
                            onChange={(e) => handleRecipientsChange(e.target.value)}
                            placeholder="@acorte @jhurd"
                            style={{
                                padding: "10px 12px",
                                fontSize: 14,
                                fontFamily: FONT,
                                border: `1px solid ${COLORS.ashSubtle}`,
                                borderRadius: RADIUS.small,
                                background: COLORS.white,
                            }}
                        />
                        {suggestions.length > 0 && (
                            <div
                                style={{
                                    position: "absolute",
                                    top: "100%",
                                    left: 0,
                                    right: 0,
                                    marginTop: 4,
                                    background: COLORS.white,
                                    border: `1px solid ${COLORS.ashSubtle}`,
                                    borderRadius: RADIUS.small,
                                    boxShadow: "0 4px 12px rgba(43,40,40,0.08)",
                                    zIndex: 2,
                                }}
                            >
                                {suggestions.map((staff) => (
                                    <button
                                        key={staff.id}
                                        type="button"
                                        onClick={() => appendMention(staff.username)}
                                        style={{
                                            width: "100%",
                                            textAlign: "left",
                                            padding: "10px 12px",
                                            border: "none",
                                            borderBottom: `1px solid ${COLORS.ashSubtle}`,
                                            background: COLORS.white,
                                            cursor: "pointer",
                                            fontFamily: FONT,
                                        }}
                                    >
                                        <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ash }}>
                                            @{staff.username}
                                        </div>
                                        <div style={{ fontSize: 11, color: COLORS.ashMuted }}>{staff.display_name}</div>
                                    </button>
                                ))}
                            </div>
                        )}
                        <span style={{ fontSize: 11, color: COLORS.ashMuted }}>
                            You (@{currentUsername}) are included automatically.
                            {participantPreview.length > 0 && (
                                <> Participants: {participantPreview.map((u) => `@${u}`).join(", ")}</>
                            )}
                        </span>
                    </label>

                    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: COLORS.ashMuted }}>
                            FIRST MESSAGE (OPTIONAL)
                        </span>
                        <textarea
                            value={firstMessage}
                            onChange={(e) => setFirstMessage(e.target.value)}
                            rows={4}
                            placeholder="Start the conversation…"
                            style={{
                                padding: "10px 12px",
                                fontSize: 14,
                                fontFamily: FONT,
                                border: `1px solid ${COLORS.ashSubtle}`,
                                borderRadius: RADIUS.small,
                                background: COLORS.white,
                                resize: "vertical",
                            }}
                        />
                    </label>

                    <div style={{ fontSize: 11, color: COLORS.ashMuted }}>
                        Directory: {MOCK_STAFF_DIRECTORY.map((s) => `@${s.username}`).join(", ")}
                    </div>
                </div>
            </div>

            <div
                style={{
                    flexShrink: 0,
                    padding: "12px 20px 16px",
                    borderTop: `1px solid ${COLORS.ashSubtle}`,
                    background: COLORS.white,
                    display: "flex",
                    gap: 10,
                }}
            >
                <button
                    type="button"
                    disabled={!canCreate}
                    onClick={() =>
                        onCreate({
                            subject: subject.trim(),
                            recipientInput: recipients,
                            firstMessage: firstMessage.trim(),
                        })
                    }
                    style={{
                        padding: "10px 18px",
                        fontSize: 13,
                        fontWeight: 600,
                        fontFamily: FONT,
                        border: "none",
                        borderRadius: RADIUS.small,
                        background: canCreate ? COLORS.ash : COLORS.ashSubtle,
                        color: COLORS.white,
                        cursor: canCreate ? "pointer" : "not-allowed",
                    }}
                >
                    Create thread
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    style={{
                        padding: "10px 18px",
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
                    Cancel
                </button>
            </div>
        </div>
    )
}
