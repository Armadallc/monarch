import { DashboardHelpPanel } from "./DashboardHelpPanel"
import { DashboardPanelModal } from "./DashboardPanelModal"

type Props = {
    open: boolean
    onClose: () => void
}

export function DashboardHelpModal({ open, onClose }: Props) {
    if (!open) return null

    return (
        <DashboardPanelModal title="Help & support" onClose={onClose} maxWidth={760}>
            <DashboardHelpPanel />
        </DashboardPanelModal>
    )
}
