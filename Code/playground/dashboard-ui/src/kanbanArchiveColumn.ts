import { useCallback, useState } from "react"

export type KanbanArchiveShell = "staff" | "portal"

const STORAGE_KEYS: Record<KanbanArchiveShell, string> = {
    staff: "monarch-kanban-archive-column-staff",
    portal: "monarch-kanban-archive-column-portal",
}

const DEFAULT_VISIBLE: Record<KanbanArchiveShell, boolean> = {
    staff: false,
    portal: false,
}

export const KANBAN_ARCHIVE_DROP_ID = "kanban-archive"
export const KANBAN_ARCHIVE_COLUMN_WIDTH = 100
/** Extra space before archive column (board gap is 12px; 12 + 14 = 26px). */
export const KANBAN_ARCHIVE_COLUMN_LEADING_GAP = 14

export function readKanbanArchiveColumnVisible(shell: KanbanArchiveShell): boolean {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS[shell])
        if (raw === null) return DEFAULT_VISIBLE[shell]
        return raw === "true"
    } catch {
        return DEFAULT_VISIBLE[shell]
    }
}

export function useKanbanArchiveColumnVisible(shell: KanbanArchiveShell) {
    const [visible, setVisible] = useState(() => readKanbanArchiveColumnVisible(shell))

    const setVisiblePersisted = useCallback(
        (next: boolean) => {
            setVisible(next)
            try {
                localStorage.setItem(STORAGE_KEYS[shell], String(next))
            } catch {
                /* ignore */
            }
        },
        [shell]
    )

    return [visible, setVisiblePersisted] as const
}
