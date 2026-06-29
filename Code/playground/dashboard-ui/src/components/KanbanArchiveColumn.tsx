import { useDroppable } from "@dnd-kit/core"
import { COLORS, FONT, FONT_HEADING, RADIUS } from "@design"
import { KANBAN_ARCHIVE_COLUMN_WIDTH, KANBAN_ARCHIVE_DROP_ID } from "../kanbanArchiveColumn"

type Props = {
    disabled?: boolean
    isDragging?: boolean
}

function ArchiveIcon({ size = 22 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
            <rect x="3" y="5" width="18" height="4" rx="1" stroke="currentColor" strokeWidth="2" />
            <path
                d="M5 9v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
            />
            <path d="M10 13h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    )
}

export function KanbanArchiveColumn({ disabled = false, isDragging = false }: Props) {
    const { setNodeRef, isOver } = useDroppable({
        id: KANBAN_ARCHIVE_DROP_ID,
        disabled,
    })

    const active = isOver && !disabled

    return (
        <div
            style={{
                flex: `0 0 ${KANBAN_ARCHIVE_COLUMN_WIDTH}px`,
                width: KANBAN_ARCHIVE_COLUMN_WIDTH,
                minWidth: KANBAN_ARCHIVE_COLUMN_WIDTH,
                height: "100%",
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
            }}
        >
            <div
                style={{
                    flexShrink: 0,
                    boxSizing: "content-box",
                    height: 24,
                    padding: "12px 8px",
                    margin: "5px 0 10px 0",
                    borderRadius: 0,
                    background: COLORS.sidebar,
                    color: COLORS.ash,
                    fontFamily: FONT_HEADING,
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    border: "none",
                    borderBottom: `2px solid ${COLORS.warning}`,
                }}
            >
                <ArchiveIcon size={14} />
                <span
                    style={{
                        fontSize: 13,
                        fontWeight: 600,
                        fontFamily: FONT_HEADING,
                        color: COLORS.ash,
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                        lineHeight: 1.2,
                        opacity: 0.75,
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                    }}
                >
                    Archive
                </span>
            </div>
            <div
                ref={setNodeRef}
                style={{
                    flex: 1,
                    minHeight: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 8,
                    borderRadius: RADIUS.section,
                    background: active ? COLORS.warningBg : COLORS.coconut25,
                    border: `2px dashed ${active ? COLORS.warning : COLORS.warningBorder}`,
                    color: active ? COLORS.warningText : COLORS.ashMuted,
                    transition: "background 0.15s ease, border-color 0.15s ease, color 0.15s ease",
                }}
            >
                <ArchiveIcon size={active ? 26 : 22} />
                <p
                    style={{
                        margin: "10px 0 0",
                        fontSize: 10,
                        fontWeight: 600,
                        fontFamily: FONT,
                        textAlign: "center",
                        lineHeight: 1.35,
                        maxWidth: "100%",
                        opacity: isDragging || active ? 1 : 0.75,
                    }}
                >
                    {active ? "Release to archive" : isDragging ? "Drop here" : "Drag to archive"}
                </p>
            </div>
        </div>
    )
}
