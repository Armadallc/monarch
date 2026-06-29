import type { CSSProperties, MouseEvent } from "react"
import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { COLORS, FONT, RADIUS, SHADOWS, formatDisplayDate } from "@design"
import type { MockReferral } from "../types"
import { clientDisplayId } from "../utils"
import { ClientName } from "./ClientName"
import { referralHasSafetyFlag } from "../referralSafetyFlag"
import { ReferralCardIndicators, ReferralSafetyFlagIcon } from "./ReferralCardIndicators"
import { ReferralProgramLabel } from "./ReferralProgramLabel"
import { ReferralTransferBadge } from "./ReferralTransferBadge"

type Props = {
    referral: MockReferral
    readOnly: boolean
    onOpen: (referral: MockReferral) => void
    isDragging?: boolean
    selected?: boolean
    onToggleSelect?: (id: string) => void
    /** When set, overrides default drag enablement (!readOnly). */
    draggable?: boolean
}

export function ReferralKanbanCard({
    referral,
    readOnly,
    onOpen,
    isDragging,
    selected = false,
    onToggleSelect,
    draggable: draggableProp,
}: Props) {
    const draggable = draggableProp ?? !readOnly
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: referral.id,
        disabled: !draggable,
    })

    const declined = referral.status === "declined"
    const accepted = referral.status === "accepted"
    const style: CSSProperties = {
        transform: transform ? CSS.Translate.toString(transform) : undefined,
        opacity: declined ? 0.45 : isDragging ? 0.85 : 1,
        border: accepted
            ? "2px solid rgba(0, 255, 51, 1)"
            : declined
              ? `2px solid ${COLORS.errorText}`
              : selected
                ? `2px solid ${COLORS.moonstone}`
                : `1px solid ${COLORS.ashSubtle}`,
        borderRadius: RADIUS.card,
        background: selected ? COLORS.coconut25 : COLORS.white,
        padding: "10px 12px",
        boxShadow: isDragging ? SHADOWS.cardHover : SHADOWS.card,
        cursor: draggable ? "grab" : "pointer",
        fontFamily: FONT,
        touchAction: draggable ? "none" : "auto",
    }

    const stopCardClick = (e: MouseEvent) => {
        e.stopPropagation()
    }

    return (
        <div
            ref={draggable ? setNodeRef : undefined}
            style={style}
            {...(draggable ? { ...listeners, ...attributes } : {})}
            onClick={() => onOpen(referral)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    onOpen(referral)
                }
            }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6, marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8, minWidth: 0 }}>
                    {onToggleSelect && (
                        <input
                            type="checkbox"
                            checked={selected}
                            aria-label={`Select ${referral.client_first_name} ${referral.client_last_name}`}
                            onChange={() => onToggleSelect(referral.id)}
                            onClick={stopCardClick}
                            onPointerDown={stopCardClick}
                            style={{
                                width: 12,
                                height: 12,
                                marginTop: 2,
                                flexShrink: 0,
                                cursor: "pointer",
                            }}
                        />
                    )}
                    <div style={{ minWidth: 0 }}>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                                minWidth: 0,
                                flexWrap: "nowrap",
                            }}
                        >
                            <ClientName
                                as="div"
                                size="md"
                                style={{
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    minWidth: 0,
                                }}
                            >
                                {readOnly
                                    ? `${referral.client_first_name} ${referral.client_last_name.charAt(0)}.`
                                    : `${referral.client_first_name} ${referral.client_last_name}`}
                            </ClientName>
                            {referralHasSafetyFlag(referral) ? <ReferralSafetyFlagIcon size={13} /> : null}
                        </div>
                        {!readOnly && (
                            <div style={{ fontSize: 10, color: COLORS.ashMuted, marginTop: 1, lineHeight: 1.2 }}>
                                {clientDisplayId(referral)}
                            </div>
                        )}
                        {!readOnly && referral.pending_transfer_to_program ? (
                            <div style={{ marginTop: 4 }}>
                                <ReferralTransferBadge
                                    transfer={{
                                        id: "inline",
                                        referral_id: referral.id,
                                        from_program: referral.program,
                                        to_program: referral.pending_transfer_to_program,
                                        requested_by_staff_id: "",
                                        requested_at: "",
                                        status: "pending",
                                    }}
                                />
                            </div>
                        ) : null}
                    </div>
                </div>
                <ReferralCardIndicators referral={referral} variant="info" includeUrgency dense />
            </div>

            {!readOnly && (
                <>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 8,
                            marginBottom: 3,
                            minHeight: 14,
                        }}
                    >
                        <span
                            style={{
                                fontSize: 12,
                                color: COLORS.ashMuted,
                                minWidth: 0,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {referral.assignee_name ?? "\u00A0"}
                        </span>
                        <ReferralProgramLabel program={referral.program} variant="compact" />
                    </div>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "baseline",
                            justifyContent: "space-between",
                            gap: 8,
                            fontSize: 11,
                            color: COLORS.ashMuted,
                            marginBottom: 0,
                        }}
                    >
                        <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {referral.referral_source_name}
                        </span>
                        <span style={{ flexShrink: 0, fontSize: 10, color: COLORS.ashMuted }}>
                            {formatDisplayDate(referral.created_at)}
                        </span>
                    </div>
                </>
            )}

            {readOnly && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                        fontSize: 12,
                        color: COLORS.ashMuted,
                        minHeight: 15,
                    }}
                >
                    <span style={{ flexShrink: 0 }}>{formatDisplayDate(referral.created_at)}</span>
                    {referral.assignee_name ? (
                        <span
                            style={{
                                minWidth: 0,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                textAlign: "right",
                                fontWeight: 600,
                                color: COLORS.ash,
                                opacity: 0.85,
                            }}
                        >
                            {referral.assignee_name}
                        </span>
                    ) : null}
                </div>
            )}
        </div>
    )
}
