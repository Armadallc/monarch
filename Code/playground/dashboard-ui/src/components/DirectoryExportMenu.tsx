import { useEffect, useRef, useState, type CSSProperties } from "react"
import { COLORS, FONT, RADIUS, SHADOWS } from "@design"

type Props = {
    selectedCount: number
    visibleCount: number
    onExportSelected: () => void
    onExportVisible: () => void
    entityLabel: string
}

export function DirectoryExportMenu({
    selectedCount,
    visibleCount,
    onExportSelected,
    onExportVisible,
    entityLabel,
}: Props) {
    const [open, setOpen] = useState(false)
    const rootRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!open) return
        const onDown = (e: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener("mousedown", onDown, true)
        return () => document.removeEventListener("mousedown", onDown, true)
    }, [open])

    const run = (action: () => void) => {
        action()
        setOpen(false)
    }

    return (
        <div ref={rootRef} style={{ position: "relative", flexShrink: 0 }}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-haspopup="menu"
                disabled={visibleCount === 0}
                style={{
                    padding: "8px 14px",
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: FONT,
                    border: `1px solid ${COLORS.ashSubtle}`,
                    borderRadius: RADIUS.input,
                    background: COLORS.white,
                    color: visibleCount === 0 ? COLORS.ashMuted : COLORS.ash,
                    cursor: visibleCount === 0 ? "not-allowed" : "pointer",
                    opacity: visibleCount === 0 ? 0.6 : 1,
                }}
            >
                Export
            </button>

            {open && visibleCount > 0 && (
                <div
                    role="menu"
                    style={{
                        position: "absolute",
                        top: "calc(100% + 6px)",
                        right: 0,
                        minWidth: 220,
                        background: COLORS.white,
                        border: `1px solid ${COLORS.ashSubtle}`,
                        borderRadius: RADIUS.small,
                        boxShadow: SHADOWS.card,
                        padding: 6,
                        zIndex: 40,
                        fontFamily: FONT,
                    }}
                >
                    <button
                        type="button"
                        role="menuitem"
                        disabled={selectedCount === 0}
                        onClick={() => run(onExportSelected)}
                        style={menuItemStyle(selectedCount === 0)}
                    >
                        Export selected ({selectedCount})
                    </button>
                    <button
                        type="button"
                        role="menuitem"
                        onClick={() => run(onExportVisible)}
                        style={menuItemStyle(false)}
                    >
                        Export all visible ({visibleCount})
                    </button>
                    <div
                        style={{
                            padding: "8px 10px 4px",
                            fontSize: 11,
                            color: COLORS.ashMuted,
                            lineHeight: 1.4,
                        }}
                    >
                        Downloads CSV for {entityLabel}. Selected exports require at least one checked row.
                    </div>
                </div>
            )}
        </div>
    )
}

function menuItemStyle(disabled: boolean): CSSProperties {
    return {
        width: "100%",
        display: "block",
        textAlign: "left",
        padding: "10px 12px",
        fontSize: 13,
        fontWeight: 600,
        fontFamily: FONT,
        border: "none",
        borderRadius: RADIUS.small,
        background: "transparent",
        color: disabled ? COLORS.ashMuted : COLORS.ash,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
    }
}
