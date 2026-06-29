import type { CSSProperties } from "react"
import { COLORS } from "@design"
import { referralHasSafetyFlag } from "../referralSafetyFlag"
import type { MockReferral } from "../types"
import { expeditedPlacementDisplay } from "../utils"
import { ExpeditedPlacementIcon } from "./ReferralUrgencyBadges"

const iconWrap: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
}

type IconProps = { size?: number; color?: string; title: string }

function PaperclipIcon({ size = 14, color = COLORS.ashMuted, title }: IconProps) {
    return (
        <span style={iconWrap} title={title} aria-label={title} role="img">
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
        </span>
    )
}

export function FlagIcon({ size = 14, color = COLORS.warningText, title = "Safety review required" }: Omit<IconProps, "title"> & { title?: string }) {
    return (
        <span style={iconWrap} title={title} aria-label={title} role="img">
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                <line x1="4" y1="22" x2="4" y2="15" />
            </svg>
        </span>
    )
}

export function MessageIcon({ size = 14, color = COLORS.infoText, title }: IconProps) {
    return (
        <span style={iconWrap} title={title} aria-label={title} role="img">
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
        </span>
    )
}

/** Inline beside client name on kanban cards. */
export function ReferralSafetyFlagIcon({ size = 14 }: { size?: number }) {
    return <FlagIcon size={size} title="Safety review required — see referral form flags" />
}

type ReferralIndicatorFields = Pick<
    MockReferral,
    | "has_attachments"
    | "has_unread_messages"
    | "urgent_placement"
    | "urgency_level"
> &
    Parameters<typeof referralHasSafetyFlag>[0]

type Props = {
    referral: ReferralIndicatorFields
    variant?: "all" | "alerts" | "flags" | "attachments" | "info"
    /** Kanban top-right — expedited + paperclip + unread message (not safety flag). */
    includeUrgency?: boolean
    dense?: boolean
}

export function hasReferralInfoIndicators(referral: ReferralIndicatorFields): boolean {
    return !!(referral.has_attachments || referral.has_unread_messages || referralHasSafetyFlag(referral))
}

/**
 * Top-right card indicators (kanban): expedited, attachments, unread messages.
 * Safety flag renders inline next to client name — see ReferralSafetyFlagIcon.
 */
export function ReferralCardIndicators({
    referral,
    variant = "all",
    includeUrgency = false,
    dense = false,
}: Props) {
    const showAttachments =
        !!referral.has_attachments &&
        (variant === "all" || variant === "attachments" || variant === "info")
    const showUnread =
        !!referral.has_unread_messages && (variant === "all" || variant === "alerts" || variant === "info")

    const expeditedMode = includeUrgency
        ? expeditedPlacementDisplay(referral.urgent_placement, referral.urgency_level)
        : "none"
    const urgencyIcon =
        expeditedMode === "lightning_circled" ? (
            <ExpeditedPlacementIcon mode="lightning_circled" />
        ) : expeditedMode === "lightning" ? (
            <ExpeditedPlacementIcon mode="lightning" />
        ) : null

    if (!showAttachments && !showUnread && !urgencyIcon) return null

    const attachmentIcon = showAttachments ? <PaperclipIcon title="Has attachments" /> : null
    const messageIcon = showUnread ? <MessageIcon title="Unread message" /> : null

    const icons = [urgencyIcon, attachmentIcon, messageIcon].filter(Boolean)

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "nowrap",
                gap: dense ? 4 : 6,
                flexShrink: 0,
                minHeight: dense ? 16 : 18,
                opacity: 0.75,
            }}
        >
            {icons}
        </div>
    )
}
