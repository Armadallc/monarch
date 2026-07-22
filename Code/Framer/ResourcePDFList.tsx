/**
 * ResourcePDFList — Framer paste version (no DesignSystem import).
 * List of PDFs with View (modal + pdf.js), Download, and Share.
 * Pass items from Framer CMS or override; each item: { id?, title, url }.
 * PDF URLs should be public (e.g. Supabase Storage public bucket).
 *
 * Responsive: at ≤809px (phone), cards stack title + full-width actions; modal is full-screen.
 */
import { useState, useCallback, useEffect } from "react"
import { addPropertyControls, ControlType } from "framer"

// Framer Phone breakpoint — sync with Code/Framer/reference/useMonarchViewport.tsx
const MOBILE_MAX_PX = 809

// ----- Inlined design system (no import) — site primary #0d0d0d / #fafafa + blues -----
const COLORS = {
    ink: "#0d0d0d",
    paper: "#fafafa",
    inkMuted: "rgba(13, 13, 13, 0.62)",
    inkSubtle: "rgba(13, 13, 13, 0.12)",
    paperElevated: "#ffffff",
    blue: "#4338ca",
    blueText: "#1e40af",
    blueLight: "#eff6ff",
    blueMuted: "rgba(67, 56, 202, 0.1)",
    overlay: "rgba(13, 13, 13, 0.48)",
}
const RADIUS = { card: "12px", input: "12px", modal: "16px", small: "8px" }
const FONT = `"Montserrat", sans-serif`
const SHADOWS = {
    card: "0 2px 12px rgba(13, 13, 13, 0.06)",
    modal: "0 24px 48px -12px rgba(13, 13, 13, 0.18)",
}
const TRANSITION = "all 0.2s ease"
const PDF_JS_VIEWER = "https://mozilla.github.io/pdf.js/web/viewer.html"
// ----- End inlined design system -----

export type PDFItem = { id?: string; title: string; url: string }

type Props = {
    items?: PDFItem[]
    listTitle?: string
    width?: number
    height?: number
}

export default function ResourcePDFList(props: Props) {
    const { items: itemsProp = [], listTitle = "Resource PDFs", width = 600, height = 400 } = props
    const items = Array.isArray(itemsProp) ? itemsProp.filter((i) => i && i.title && i.url) : []
    const [modalIndex, setModalIndex] = useState<number | null>(null)
    const [shareMenuIndex, setShareMenuIndex] = useState<number | null>(null)
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const check = () => setIsMobile(typeof window !== "undefined" && window.innerWidth <= MOBILE_MAX_PX)
        check()
        window.addEventListener("resize", check)
        return () => window.removeEventListener("resize", check)
    }, [])

    const currentItem = modalIndex !== null ? items[modalIndex] ?? null : null
    const pdfViewerUrl = currentItem ? `${PDF_JS_VIEWER}?file=${encodeURIComponent(currentItem.url)}` : ""

    const openModal = useCallback((index: number) => setModalIndex(index), [])
    const closeModal = useCallback(() => setModalIndex(null), [])
    const goPrev = useCallback(() => setModalIndex((i) => (i === null ? 0 : i > 0 ? i - 1 : items.length - 1)), [items.length])
    const goNext = useCallback(() => setModalIndex((i) => (i === null ? 0 : i < items.length - 1 ? i + 1 : 0)), [items.length])

    const handleShare = useCallback(
        async (item: PDFItem, index: number) => {
            const title = item.title
            const url = item.url
            const text = `${title}: ${url}`
            if (typeof navigator !== "undefined" && navigator.share) {
                try {
                    await navigator.share({ title, url, text })
                    setShareMenuIndex(null)
                } catch (e) {
                    if ((e as Error).name !== "AbortError") setShareMenuIndex(index)
                }
            } else {
                setShareMenuIndex(shareMenuIndex === index ? null : index)
            }
        },
        [shareMenuIndex]
    )

    const copyLink = useCallback((item: PDFItem) => {
        const url = item.url
        if (navigator.clipboard?.writeText) navigator.clipboard.writeText(url)
        setShareMenuIndex(null)
    }, [])

    const emailLink = useCallback((item: PDFItem) => {
        const subject = encodeURIComponent(item.title)
        const body = encodeURIComponent(`${item.title}\n${item.url}`)
        window.open(`mailto:?subject=${subject}&body=${body}`, "_blank")
        setShareMenuIndex(null)
    }, [])

    const buttonBase: React.CSSProperties = {
        padding: isMobile ? "12px 16px" : "8px 16px",
        fontSize: isMobile ? "14px" : "13px",
        fontWeight: 600,
        fontFamily: FONT,
        border: "none",
        borderRadius: RADIUS.small,
        cursor: "pointer",
        transition: TRANSITION,
        letterSpacing: "-0.01em",
        minHeight: isMobile ? 44 : undefined,
        boxSizing: "border-box",
    }

    const actionRowStyle: React.CSSProperties = isMobile
        ? { display: "flex", flexDirection: "column", gap: "8px", width: "100%" }
        : { display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }

    const actionButtonStyle = (extra: React.CSSProperties): React.CSSProperties =>
        isMobile ? { ...extra, width: "100%", justifyContent: "center", display: "inline-flex" } : extra

    if (typeof window !== "undefined" && !document.getElementById("montserrat-font")) {
        const link = document.createElement("link")
        link.id = "montserrat-font"
        link.rel = "stylesheet"
        link.href = "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap"
        document.head.appendChild(link)
    }

    return (
        <div style={{ width: "100%", maxWidth: isMobile ? "100%" : width, fontFamily: FONT, boxSizing: "border-box" }}>
            {listTitle && (
                <h3
                    style={{
                        margin: isMobile ? "0 0 12px" : "0 0 16px",
                        fontSize: isMobile ? "16px" : "18px",
                        fontWeight: 600,
                        color: COLORS.ink,
                        letterSpacing: "-0.02em",
                    }}
                >
                    {listTitle}
                </h3>
            )}
            {items.length === 0 ? (
                <p style={{ margin: 0, fontSize: "14px", color: COLORS.inkMuted }}>
                    No PDFs added yet. Add items via the component props (or Framer CMS override).
                </p>
            ) : (
                <ul
                    style={{
                        listStyle: "none",
                        margin: 0,
                        padding: 0,
                        display: "flex",
                        flexDirection: "column",
                        gap: isMobile ? "10px" : "12px",
                    }}
                >
                    {items.map((item, index) => (
                        <li
                            key={item.id ?? index}
                            style={{
                                display: "flex",
                                flexDirection: isMobile ? "column" : "row",
                                alignItems: isMobile ? "stretch" : "center",
                                justifyContent: "space-between",
                                flexWrap: "wrap",
                                gap: isMobile ? "10px" : "12px",
                                padding: isMobile ? "14px 14px" : "14px 18px",
                                background: COLORS.paper,
                                border: `1px solid ${COLORS.inkSubtle}`,
                                borderRadius: RADIUS.card,
                                boxSizing: "border-box",
                                boxShadow: SHADOWS.card,
                            }}
                        >
                            <span
                                style={{
                                    fontSize: isMobile ? "14px" : "15px",
                                    fontWeight: 500,
                                    color: COLORS.ink,
                                    flex: isMobile ? "none" : "1 1 200px",
                                    letterSpacing: "-0.01em",
                                    lineHeight: 1.4,
                                    wordBreak: "break-word",
                                }}
                            >
                                {item.title}
                            </span>
                            <div style={actionRowStyle}>
                                <button
                                    type="button"
                                    onClick={() => openModal(index)}
                                    style={actionButtonStyle({
                                        ...buttonBase,
                                        background: COLORS.ink,
                                        color: COLORS.paper,
                                    })}
                                >
                                    View
                                </button>
                                <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download
                                    style={actionButtonStyle({
                                        ...buttonBase,
                                        background: COLORS.blueLight,
                                        color: COLORS.blueText,
                                        textDecoration: "none",
                                        alignItems: "center",
                                    })}
                                >
                                    Download
                                </a>
                                <div style={{ position: "relative", width: isMobile ? "100%" : undefined }}>
                                    <button
                                        type="button"
                                        onClick={() => handleShare(item, index)}
                                        style={actionButtonStyle({
                                            ...buttonBase,
                                            background: COLORS.paperElevated,
                                            color: COLORS.ink,
                                            border: `1px solid ${COLORS.inkSubtle}`,
                                        })}
                                    >
                                        Share
                                    </button>
                                    {shareMenuIndex === index && !navigator.share && (
                                        <>
                                            <div
                                                style={{
                                                    position: "fixed",
                                                    top: 0,
                                                    left: 0,
                                                    right: 0,
                                                    bottom: 0,
                                                    zIndex: 9998,
                                                }}
                                                onClick={() => setShareMenuIndex(null)}
                                                aria-hidden="true"
                                            />
                                            <div
                                                style={{
                                                    position: isMobile ? "fixed" : "absolute",
                                                    ...(isMobile
                                                        ? {
                                                              left: 16,
                                                              right: 16,
                                                              bottom: 16,
                                                              top: "auto",
                                                          }
                                                        : {
                                                              top: "100%",
                                                              right: 0,
                                                              marginTop: "4px",
                                                          }),
                                                    padding: "8px",
                                                    background: COLORS.paperElevated,
                                                    border: `1px solid ${COLORS.inkSubtle}`,
                                                    borderRadius: RADIUS.card,
                                                    boxShadow: SHADOWS.modal,
                                                    zIndex: 9999,
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: "4px",
                                                    minWidth: isMobile ? undefined : "140px",
                                                }}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => copyLink(item)}
                                                    style={{
                                                        ...buttonBase,
                                                        background: "transparent",
                                                        color: COLORS.ink,
                                                        padding: "8px 12px",
                                                        textAlign: "left",
                                                    }}
                                                >
                                                    Copy link
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => emailLink(item)}
                                                    style={{
                                                        ...buttonBase,
                                                        background: "transparent",
                                                        color: COLORS.ink,
                                                        padding: "8px 12px",
                                                        textAlign: "left",
                                                    }}
                                                >
                                                    Email link
                                                </button>
                                                <a
                                                    href={item.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    download
                                                    style={{
                                                        ...buttonBase,
                                                        background: "transparent",
                                                        color: COLORS.ink,
                                                        padding: "8px 12px",
                                                        textAlign: "left",
                                                        textDecoration: "none",
                                                    }}
                                                >
                                                    Download
                                                </a>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        window.open(item.url, "_blank")
                                                        setShareMenuIndex(null)
                                                    }}
                                                    style={{
                                                        ...buttonBase,
                                                        background: "transparent",
                                                        color: COLORS.ink,
                                                        padding: "8px 12px",
                                                        textAlign: "left",
                                                    }}
                                                >
                                                    Open & print
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {/* Modal: view PDF with title, download, share, prev/next */}
            {modalIndex !== null && currentItem && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: COLORS.overlay,
                        display: "flex",
                        alignItems: isMobile ? "stretch" : "center",
                        justifyContent: "center",
                        zIndex: 10000,
                        padding: isMobile ? "0" : "20px",
                        boxSizing: "border-box",
                        backdropFilter: "blur(8px)",
                    }}
                    onClick={(e) => e.target === (e.currentTarget as HTMLElement) && closeModal()}
                >
                    <div
                        style={{
                            background: COLORS.paperElevated,
                            borderRadius: isMobile ? 0 : RADIUS.modal,
                            boxShadow: SHADOWS.modal,
                            border: isMobile ? "none" : `1px solid ${COLORS.inkSubtle}`,
                            maxWidth: isMobile ? "100%" : "96vw",
                            width: isMobile ? "100%" : 900,
                            maxHeight: isMobile ? "100%" : "90vh",
                            height: isMobile ? "100%" : undefined,
                            display: "flex",
                            flexDirection: "column",
                            overflow: "hidden",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            style={{
                                padding: isMobile ? "12px 14px" : "16px 20px",
                                borderBottom: `1px solid ${COLORS.inkSubtle}`,
                                background: COLORS.paper,
                                display: "flex",
                                flexDirection: isMobile ? "column" : "row",
                                alignItems: isMobile ? "stretch" : "center",
                                gap: isMobile ? "10px" : "16px",
                                flexWrap: "wrap",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    flex: isMobile ? "none" : "1 1 200px",
                                    minWidth: 0,
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={goPrev}
                                    style={{
                                        ...buttonBase,
                                        padding: isMobile ? "10px 14px" : "6px 12px",
                                        background: COLORS.blueMuted,
                                        color: COLORS.ink,
                                        flexShrink: 0,
                                    }}
                                    aria-label="Previous PDF"
                                >
                                    &#8249;
                                </button>
                                <button
                                    type="button"
                                    onClick={goNext}
                                    style={{
                                        ...buttonBase,
                                        padding: isMobile ? "10px 14px" : "6px 12px",
                                        background: COLORS.blueMuted,
                                        color: COLORS.ink,
                                        flexShrink: 0,
                                    }}
                                    aria-label="Next PDF"
                                >
                                    &#8250;
                                </button>
                                <span
                                    style={{
                                        fontSize: isMobile ? "14px" : "16px",
                                        fontWeight: 600,
                                        color: COLORS.ink,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: isMobile ? "normal" : "nowrap",
                                        lineHeight: 1.35,
                                        flex: 1,
                                        minWidth: 0,
                                    }}
                                >
                                    {currentItem.title}
                                </span>
                            </div>
                            <div
                                style={
                                    isMobile
                                        ? { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", width: "100%" }
                                        : { display: "flex", alignItems: "center", gap: "8px" }
                                }
                            >
                                <a
                                    href={currentItem.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download
                                    style={actionButtonStyle({
                                        ...buttonBase,
                                        padding: "8px 16px",
                                        background: COLORS.blueLight,
                                        color: COLORS.blueText,
                                        textDecoration: "none",
                                    })}
                                >
                                    Download
                                </a>
                                <button
                                    type="button"
                                    onClick={() => handleShare(currentItem, modalIndex)}
                                    style={actionButtonStyle({
                                        ...buttonBase,
                                        padding: "8px 16px",
                                        background: COLORS.paperElevated,
                                        color: COLORS.ink,
                                        border: `1px solid ${COLORS.inkSubtle}`,
                                    })}
                                >
                                    Share
                                </button>
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    style={actionButtonStyle({
                                        ...buttonBase,
                                        padding: "8px 16px",
                                        background: COLORS.ink,
                                        color: COLORS.paper,
                                        ...(isMobile ? { gridColumn: "1 / -1" } : {}),
                                    })}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
                            <iframe
                                src={pdfViewerUrl}
                                title={currentItem.title}
                                style={{
                                    width: "100%",
                                    flex: 1,
                                    minHeight: isMobile ? "0" : "60vh",
                                    border: "none",
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

addPropertyControls(ResourcePDFList, {
    listTitle: {
        type: ControlType.String,
        title: "Section title",
        defaultValue: "Resource PDFs",
    },
    items: {
        type: ControlType.Array,
        title: "PDFs",
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, title: "Title", defaultValue: "Document" },
                url: { type: ControlType.String, title: "PDF URL", defaultValue: "" },
            },
        },
    },
})
