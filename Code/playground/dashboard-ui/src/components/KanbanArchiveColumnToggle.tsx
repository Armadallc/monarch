import { COLORS, FONT, RADIUS, TRANSITION } from "@design"

type Props = {
    visible: boolean
    onChange: (visible: boolean) => void
}

const TRACK_WIDTH = 36
const TRACK_HEIGHT = 20
const THUMB_SIZE = 16
const THUMB_OFFSET = 2

function ArchiveIcon({ color }: { color: string }) {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <rect x="3" y="5" width="18" height="4" rx="1" stroke={color} strokeWidth="2" />
            <path
                d="M5 9v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9"
                stroke={color}
                strokeWidth="2"
                strokeLinejoin="round"
            />
            <path d="M10 13h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </svg>
    )
}

export function KanbanArchiveColumnToggle({ visible, onChange }: Props) {
    const iconColor = visible ? COLORS.warning : COLORS.ashMuted

    return (
        <div
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 10px",
                borderRadius: RADIUS.input,
                border: `1px solid ${visible ? COLORS.warningBorder : COLORS.ashSubtle}`,
                background: visible ? COLORS.warningBg : COLORS.coconut25,
                flexShrink: 0,
                transition: TRANSITION,
            }}
        >
            <ArchiveIcon color={iconColor} />
            <button
                type="button"
                role="switch"
                aria-checked={visible}
                aria-label={visible ? "Hide archive column" : "Show archive column"}
                title={visible ? "Hide archive column" : "Show archive column for drag-to-archive"}
                onClick={() => onChange(!visible)}
                style={{
                    position: "relative",
                    width: TRACK_WIDTH,
                    height: TRACK_HEIGHT,
                    padding: 0,
                    border: "none",
                    borderRadius: RADIUS.pill,
                    background: visible ? COLORS.warning : COLORS.ashSubtle,
                    cursor: "pointer",
                    flexShrink: 0,
                    transition: TRANSITION,
                    fontFamily: FONT,
                }}
            >
                <span
                    aria-hidden
                    style={{
                        position: "absolute",
                        top: THUMB_OFFSET,
                        left: visible ? TRACK_WIDTH - THUMB_SIZE - THUMB_OFFSET : THUMB_OFFSET,
                        width: THUMB_SIZE,
                        height: THUMB_SIZE,
                        borderRadius: RADIUS.pill,
                        background: COLORS.white,
                        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.18)",
                        transition: TRANSITION,
                    }}
                />
            </button>
        </div>
    )
}
