import { useEffect, useMemo, useRef, useState } from "react"
import { COLORS, FONT, RADIUS } from "@design"
import {
    clientThreadTitle,
    formatMessageDayLabel,
    formatMessageTime,
    threadSubtitle,
} from "../messageUtils"
import { STATUS_LABELS, type MockReferral, type MessageAuthorRole, type ReferralMessage } from "../types"
import { clientDisplayId } from "../utils"
import { ClientName } from "./ClientName"

type Props = {
    referral: MockReferral | null
    messages: ReferralMessage[]
    shell: "staff" | "portal"
    staffDisplayName: string
    onSend: (body: string) => void
    onOpenReferral?: () => void
}

export function MessagesChatPanel({
    referral,
    messages,
    shell,
    staffDisplayName,
    onSend,
    onOpenReferral,
}: Props) {
    const [draft, setDraft] = useState("")
    const scrollRef = useRef<HTMLDivElement>(null)
    const composerRole: MessageAuthorRole = shell === "staff" ? "staff" : "source"

    const grouped = useMemo(() => {
        const groups: { day: string; items: ReferralMessage[] }[] = []
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
    }, [messages, referral?.id])

    const handleSend = () => {
        const body = draft.trim()
        if (!body || !referral) return
        onSend(body)
        setDraft("")
    }

    if (!referral) {
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
                Select a referral thread to start messaging
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                        <ClientName as="h3" size="chat" style={{ margin: 0 }}>
                            {clientThreadTitle(referral)}
                        </ClientName>
                        <p style={{ margin: "4px 0 0", fontSize: 12, color: COLORS.ashMuted }}>
                            {threadSubtitle(referral)} · {STATUS_LABELS[referral.status]}
                        </p>
                        <p style={{ margin: "8px 0 0", fontSize: 11, color: COLORS.ashMuted, lineHeight: 1.4 }}>
                            Messages in this thread are only about <strong style={{ color: COLORS.ash }}>{clientDisplayId(referral)}</strong> — not other referrals.
                        </p>
                    </div>
                    {onOpenReferral && (
                        <button
                            type="button"
                            onClick={onOpenReferral}
                            style={{
                                flexShrink: 0,
                                padding: "8px 12px",
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
                            View Record
                        </button>
                    )}
                </div>
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
                        No messages yet. Send the first message about this referral.
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
                                    letterSpacing: "0.04em",
                                }}
                            >
                                {group.day}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {group.items.map((msg) => {
                                    const isMine =
                                        (shell === "staff" && msg.author_role === "staff") ||
                                        (shell === "portal" && msg.author_role === "source")
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
                                                    paddingLeft: isMine ? 0 : 4,
                                                    paddingRight: isMine ? 4 : 0,
                                                }}
                                            >
                                                {msg.author_name} · {formatMessageTime(msg.created_at)}
                                            </div>
                                            <div
                                                style={{
                                                    padding: "10px 14px",
                                    borderRadius: isMine
                                        ? "20px"
                                        : `${RADIUS.section} ${RADIUS.section} ${RADIUS.section} ${RADIUS.small}`,
                                                    background: isMine ? COLORS.moonstone : COLORS.white,
                                                    color: isMine ? COLORS.white : COLORS.ash,
                                                    fontSize: 14,
                                                    lineHeight: 1.45,
                                                    boxShadow: isMine ? "none" : "0 1px 4px rgba(43,40,40,0.06)",
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
                        placeholder={
                            shell === "staff"
                                ? `Message ${referral.referral_source_name} about this referral…`
                                : "Message admissions about this referral…"
                        }
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
                            lineHeight: 1.4,
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
                            flexShrink: 0,
                        }}
                    >
                        Send
                    </button>
                </div>
                <p style={{ margin: "8px 0 0", fontSize: 11, color: COLORS.ashMuted }}>
                    Sending as {composerRole === "staff" ? staffDisplayName : referral.referral_source_name} · Enter to send, Shift+Enter for new line
                </p>
            </div>
        </div>
    )
}
