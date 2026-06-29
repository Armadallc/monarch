import { DashboardPanelModal } from "./DashboardPanelModal"
import { PortalHelpPanel } from "./PortalHelpPanel"

type Props = {
    open: boolean
    onClose: () => void
}

export function PortalHelpModal({ open, onClose }: Props) {
    if (!open) return null

    return (
        <DashboardPanelModal title="Help & support" onClose={onClose} maxWidth={760}>
            <PortalHelpPanel />
        </DashboardPanelModal>
    )
}
