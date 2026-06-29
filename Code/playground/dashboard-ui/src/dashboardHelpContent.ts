/** Optional absolute URL to published SOP PDF; when empty, Help shows a placeholder. */
export const DASHBOARD_SOP_PDF_URL = ""

export const DASHBOARD_SUPPORT_EMAIL = "referrals@monarchcompetency.com"

export const DASHBOARD_SUPPORT_PHONE_DISPLAY = "(877) 835-1545 Extension 0"

/** `tel:` href for the main line (extension not dialed via URI). */
export const DASHBOARD_SUPPORT_PHONE_TEL = "8778351545"

export const DASHBOARD_HELP_QUICKSTART: string[] = [
    "**Referral Submissions** = professional referrals; **Inquiries** = public contact forms.",
    "Default sort is **Last activity** (source portal views do not bump this).",
    "**View** opens detail: status, assignee, messages, section workflows, document requests, share links, activity.",
    "**Request documents** notifies the source in portal; check **ROI required** to auto-create a signing link.",
    "**Share links** → ROI signing sends signers to `/r?token=…` with DOB verification (DocuSeal).",
    "Use **Referral code** with sources; **Staff case reference** internally only.",
    "PHI: minimum necessary in messages; never use personal devices for exports; all actions are audited.",
]

export const DASHBOARD_HELP_FAQ: { q: string; a: string }[] = [
    {
        q: "What is the difference between Submitted and Last activity?",
        a: "Submitted is when the referral was first received. Last activity is the most recent substantive update (status change, notes, documents, assignment, ROI events, document requests, etc.). Opening a referral only to view it does not change last activity; views are still recorded in the audit log.",
    },
    {
        q: "How do I request documents or ROI from a referral source?",
        a: "In the submission detail modal, use Request documents to send a structured batch (document types, due date, optional ROI required). When ROI is required, an ROI signing link can be created automatically—copy it from Share links and send through a secure channel. The source sees the request in their portal.",
    },
    {
        q: "How do ROI signing links work?",
        a: "Create Share link → ROI signing (DocuSeal). The URL is /r?token=… on the public site. The signer enters date of birth (must match the referral), then completes the embedded form. Signed PDFs store automatically; Activity logs roi_signed. Revoke links sent in error. See internal SOP for template v2.2 and troubleshooting.",
    },
    {
        q: "What are section workflows (ROI, Insurance, Safety)?",
        a: "These are parallel checklists on each referral, separate from overall status. Update them as work progresses (e.g. ROI in progress when a link is sent, complete when the signed PDF is on file).",
    },
    {
        q: "How do archived referrals work?",
        a: "Use Archive on a row, kanban card, or batch selection to move records out of the active list. Open Archive in the sidebar to find them and unarchive if needed.",
    },
    {
        q: "What do the export options do?",
        a: "CSV is the full internal spreadsheet for selected rows. Ritten is a staff template aligned with your Ritten mapping. Print/PDF opens a printable view when exactly one referral is selected. ZIP attachments downloads selected referrals' files in one archive (one folder per referral). Nothing exports until you select rows.",
    },
]
