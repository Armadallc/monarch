import { useEffect, useMemo, useRef, useState } from "react"
import { COLORS, FONT, RADIUS } from "@design"
import { formatParticipantHandles } from "../internalMessageUtils"
import { formatMessageDayLabel, formatMessageTime } from "../messageUtils"
import { CURRENT_STAFF_USERNAME } from "../mockStaffDirectory"
import type { InternalConversation, InternalMessage } from "../types"

type Props = {
    conversation: InternalConversation | null
    messages: InternalMessage[]
    currentUsername: string
    onSend: (body: string) => void
}

export function MessagesInternalChatPanel({
    conversation,
    messages,
    currentUsername,
    onSend,
}: Props) {
    const [draft, setDraft] = useState("")
    const scrollRef = useRef<HTMLDivElement>(null)

    const grouped = useMemo(() => {
        const groups: { day: string; items: InternalMessage[] }[] = []
        for (const msg of messages) {
            const day = formatMessageDayLabel(msg.created_at)
            const last = groups[groups.length - 1]
            if (last && last.day === day) last.items.push(msg)
            else groups.push({ day, items: [msg] })
        }
        return groups
    }, [messages])

    useEffect(() => {
        const el = scrollRef.current
        if (el) el.scrollTop = el.scrollHeight
    }, [messages, conversation?.id])

    const handleSend = () => {
        const body = draft.trim()
        if (!body || !conversation) return
        onSend(body)
        setDraft("")
    }

    if (!conversation) {
        return (
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: COLORS.coconut25,
                    color: COLORS.ashMuted,
                    fontFamily: FONT,
                    fontSize: 14,
                }}
            >
                Select an internal thread or start a new one
            </div>
        )
    }

    return (
        <div
            style={{
                flex: 1,
                minWidth: 0,
                minHeight: 0,
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
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span
                        style={{
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            padding: "3px 8px",
                            borderRadius: RADIUS.pill,
                            background: COLORS.sidebar,
                            color: COLORS.onChrome,
                        }}
                    >
                        Internal
                    </span>
                </div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: COLORS.ash }}>{conversation.subject}</h3>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: COLORS.ashMuted }}>
                    {formatParticipantHandles(conversation.participant_usernames)}
                </p>
                <p style={{ margin: "8px 0 0", fontSize: 11, color: COLORS.ashMuted, lineHeight: 1.4 }}>
                    Staff only — not visible to referral sources. Not tied to any referral thread.
                </p>
            </div>

            <div
                ref={scrollRef}
                style={{
                    flex: 1,
                    minHeight: 0,
                    overflowY: "auto",
                    padding: "16px 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                }}
            >
                {messages.length === 0 ? (
                    <p style={{ margin: "auto", fontSize: 13, color: COLORS.ashMuted, textAlign: "center" }}>
                        No messages yet. Start the conversation.
                    </p>
                ) : (
                    grouped.map((group) => (
                        <div key={group.day}>
                            <div
                                style={{
                                    textAlign: "center",
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: COLORS.ashMuted,
                                    marginBottom: 12,
                                }}
                            >
                                {group.day}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {group.items.map((msg) => {
                                    const isMine = msg.author_username.toLowerCase() === currentUsername.toLowerCase()
                                    return (
                                        <div
                                            key={msg.id}
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: isMine ? "flex-end" : "flex-start",
                                                maxWidth: "78%",
                                                alignSelf: isMine ? "flex-end" : "flex-start",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontSize: 10,
                                                    fontWeight: 600,
                                                    color: COLORS.ashMuted,
                                                    marginBottom: 4,
                                                }}
                                            >
                                                {msg.author_name} · {formatMessageTime(msg.created_at)}
                                            </div>
                                            <div
                                                style={{
                                                    padding: "10px 14px",
                                                    borderRadius: RADIUS.section,
                                                    background: isMine ? COLORS.gunmetal : COLORS.white,
                                                    color: isMine ? COLORS.white : COLORS.ash,
                                                    fontSize: 14,
                                                    lineHeight: 1.45,
                                                    border: isMine ? "none" : `1px solid ${COLORS.ashSubtle}`,
                                                    whiteSpace: "pre-wrap",
                                                    wordBreak: "break-word",
                                                }}
                                            >
                                                {msg.body}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div
                style={{
                    flexShrink: 0,
                    padding: "12px 16px 16px",
                    borderTop: `1px solid ${COLORS.ashSubtle}`,
                    background: COLORS.white,
                }}
            >
                <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                    <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault()
                                handleSend()
                            }
                        }}
                        placeholder="Message staff… use @username to mention"
                        rows={2}
                        style={{
                            flex: 1,
                            resize: "none",
                            padding: "10px 12px",
                            fontSize: 14,
                            fontFamily: FONT,
                            border: `1px solid ${COLORS.ashSubtle}`,
                            borderRadius: RADIUS.section,
                            background: COLORS.coconut25,
                            color: COLORS.ash,
                            boxSizing: "border-box",
                        }}
                    />
                    <button
                        type="button"
                        onClick={handleSend}
                        disabled={!draft.trim()}
                        style={{
                            padding: "10px 18px",
                            fontSize: 13,
                            fontWeight: 600,
                            fontFamily: FONT,
                            border: "none",
                            borderRadius: RADIUS.small,
                            background: draft.trim() ? COLORS.ash : COLORS.ashSubtle,
                            color: COLORS.white,
                            cursor: draft.trim() ? "pointer" : "not-allowed",
                        }}
                    >
                        Send
                    </button>
                </div>
                <p style={{ margin: "8px 0 0", fontSize: 11, color: COLORS.ashMuted }}>
                    Sending as @{currentUsername || CURRENT_STAFF_USERNAME}
                </p>
            </div>
        </div>
    )
}
