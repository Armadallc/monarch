import type { ReactNode } from "react"
import { COLORS } from "@design"
import { STATUS_LABELS, type ReferralStatus } from "../types"

const ICON_SIZE = 18

function StatusIcon({
    title,
    color,
    children,
    size = ICON_SIZE,
}: {
    title: string
    color: string
    children: ReactNode
    size?: number
}) {
    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
            }}
            title={title}
            aria-label={title}
            role="img"
        >
            <svg
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
            >
                {children}
            </svg>
        </span>
    )
}

function NewReferralIcon({ title }: { color: string; title: string }) {
    return (
        <StatusIcon title={title} color={COLORS.primary}>
            <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0z" />
            <path d="M20 3v4" />
            <path d="M22 5h-4" />
            <path d="M4 17v2" />
            <path d="M5 18H3" />
        </StatusIcon>
    )
}

function UnderReviewIcon({ color, title }: { color: string; title: string }) {
    return (
        <StatusIcon title={title} color={color}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
            <circle cx="12" cy="14" r="1.5" />
            <path d="M12 16.5c-1.8 0-3.2-.9-4-2.2.8-1.3 2.2-2.2 4-2.2s3.2.9 4 2.2c-.8 1.3-2.2 2.2-4 2.2z" />
        </StatusIcon>
    )
}

function WaitlistedIcon({ color, title }: { color: string; title: string }) {
    return (
        <StatusIcon title={title} color={color}>
            <circle cx="12" cy="12" r="10" />
            <line x1="10" x2="10" y1="15" y2="9" />
            <line x1="14" x2="14" y1="15" y2="9" />
        </StatusIcon>
    )
}

function AcceptedIcon({ title }: { color: string; title: string }) {
    return (
        <span
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            title={title}
            aria-label={title}
            role="img"
        >
            <svg
                width={ICON_SIZE}
                height={ICON_SIZE}
                viewBox="0 0 24 24"
                fill="none"
                stroke={COLORS.success}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
            >
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                {/* oversized checkmark — arms extend beyond the circle */}
                <path d="M6.5 12.5l3.5 3.5 7.5-8" strokeWidth="2.5" />
            </svg>
        </span>
    )
}

function DeclinedIcon({ color, title }: { color: string; title: string }) {
    return (
        <StatusIcon title={title} color={color}>
            <circle cx="12" cy="12" r="10" />
            <path d="m4.2 4.2 15.6 15.6" />
        </StatusIcon>
    )
}

const STATUS_COLORS: Record<ReferralStatus, string> = {
    pending_review: COLORS.statusPendingText,
    under_review: COLORS.statusReviewText,
    waitlisted: COLORS.statusWaitlistText,
    accepted: COLORS.statusAcceptedText,
    declined: COLORS.statusDeclinedText,
}

type Props = {
    status: ReferralStatus
}

export function ReferralStatusBadge({ status }: Props) {
    const color = STATUS_COLORS[status]
    const title = STATUS_LABELS[status]

    switch (status) {
        case "pending_review":
            return <NewReferralIcon color={color} title={title} />
        case "under_review":
            return <UnderReviewIcon color={color} title={title} />
        case "waitlisted":
            return <WaitlistedIcon color={color} title={title} />
        case "accepted":
            return <AcceptedIcon color={color} title={title} />
        case "declined":
            return <DeclinedIcon color={color} title={title} />
    }
}
