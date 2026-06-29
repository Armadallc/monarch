import React, { useEffect, useMemo, useState, useCallback } from "react"
import type { CSSProperties } from "react"
import { createClient } from "@supabase/supabase-js"

const C = {
    ash: "#2B2828",
    ashDark: "#181818",
    ashMuted: "rgba(43, 40, 40, 0.6)",
    ashSubtle: "rgba(43, 40, 40, 0.15)",
    coconut: "#E9EDF6",
    shell: "#F8F6F1",
    white: "#FFFFFF",
    moonstone: "#7EACB5",
    moonstoneLight: "rgba(126, 172, 181, 0.2)",
    success: "#059669",
    successBg: "#d1fae5",
    error: "#991B1B",
    errorBg: "#fee2e2",
    warningBg: "#FFF7ED",
    warningText: "#9A3412",
} as const

const FONT = `"Montserrat", sans-serif`
const RADIUS = { card: "12px", input: "12px", pill: "100px" } as const
const LOGO_URL =
    "https://esbmnympligtknhtkary.supabase.co/storage/v1/object/public/assets/monarch-logo.png"

const supabase = createClient(
    "https://esbmnympligtknhtkary.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzYm1ueW1wbGlndGtuaHRrYXJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MjY5NzcsImV4cCI6MjA4MTAwMjk3N30.TeHhOnsUuAzSx9q5z1VMYHnAWlL63QKxVIRKNeRCRbk"
)

type Gate =
    | "loading"
    | "dob_required"
    | "ready"
    | "completed"
    | "expired"
    | "invalid"
    | "dob_mismatch"
    | "error"

/** Framer does not treat `/r/:token` as a dynamic segment — only the literal path `/r/:token` works.
 * Use a static page at `/r` and pass the real token as `?token=...` (see dashboard / portal SHARE_LINK_BASE). */
async function readEdgeFunctionInvokeError(err: unknown): Promise<string> {
    if (!err || typeof err !== "object") return String(err ?? "Unknown error")
    const e = err as { message?: string; context?: { json?: () => Promise<unknown> } }
    if (e.context && typeof e.context.json === "function") {
        try {
            const body = (await e.context.json()) as {
                error?: string
                message?: string
                gate?: string
            }
            if (body?.message) return body.message
            if (body?.error) return body.error
        } catch {
            // ignore
        }
    }
    if (e.message) return e.message
    return "Could not start signing session."
}

const parseSearchParams = () => {
    if (typeof window === "undefined") {
        return { token: "", refreshSubmission: false }
    }
    const params = new URLSearchParams(window.location.search)
    return {
        token: params.get("token")?.trim() ?? "",
        refreshSubmission: params.get("refresh") === "1",
    }
}

const parseTokenFromLocation = (): string => {
    if (typeof window === "undefined") return ""
    const fromQuery = parseSearchParams().token
    if (fromQuery) return fromQuery

    const parts = window.location.pathname.split("/").filter(Boolean)
    const rIdx = parts.indexOf("r")
    const afterR = rIdx >= 0 ? parts[rIdx + 1] : undefined
    if (afterR && afterR !== ":token") return afterR

    const last = parts[parts.length - 1] ?? ""
    return last === ":token" ? "" : last
}

declare global {
    interface Window {
        docusealForm?: unknown
    }
    namespace JSX {
        interface IntrinsicElements {
            "docuseal-form": React.DetailedHTMLProps<
                React.HTMLAttributes<HTMLElement> & {
                    "data-src"?: string
                    "data-email"?: string
                    "data-name"?: string
                    "data-minimize"?: string
                    "data-order-as-on-page"?: string
                    "data-go-to-last"?: string
                    "data-autoscroll-fields"?: string
                    "data-custom-css"?: string
                },
                HTMLElement
            >
        }
    }
}

/** Sticky step tracker inside DocuSeal embed (see DocuSeal embed custom CSS docs). */
const DOCUSEAL_EMBED_CSS = `
.form-container { padding-bottom: 88px !important; }
.steps-progress {
  position: sticky !important;
  bottom: 0 !important;
  z-index: 40 !important;
  background: #E9EDF6 !important;
  border-top: 1px solid rgba(43, 40, 40, 0.12) !important;
  padding: 10px 12px 12px !important;
  margin: 0 !important;
  box-shadow: 0 -8px 20px rgba(43, 40, 40, 0.1) !important;
}
.steps-progress-current { background: #2B2828 !important; }
`

export default function ReferralSharePage() {
    const { token, refreshSubmission } = useMemo(() => parseSearchParams(), [])
    const [gate, setGate] = useState<Gate>("loading")
    const [label, setLabel] = useState("Release of Information")
    const [message, setMessage] = useState("")
    const [embedSrc, setEmbedSrc] = useState<string | null>(null)
    const [signerEmail, setSignerEmail] = useState("")
    const [signerName, setSignerName] = useState("")
    const [dob, setDob] = useState("")
    const [busy, setBusy] = useState(false)

    const startSession = useCallback(
        async (dobValue?: string) => {
            if (!token) {
                setGate("invalid")
                setMessage("Invalid or missing link.")
                return
            }
            setBusy(true)
            setMessage("")
            const { data, error } = await supabase.functions.invoke(
                "monarch-roi-signing-session",
                {
                    body: {
                        token,
                        dob: dobValue?.trim() || undefined,
                        refresh_submission: refreshSubmission || undefined,
                    },
                }
            )
            setBusy(false)

            const payload = (data ?? null) as {
                gate?: Gate
                label?: string
                message?: string
                embed_src?: string
                signer_email?: string
                signer_name?: string
                error?: string
            } | null

            if (error) {
                const detail = await readEdgeFunctionInvokeError(error)
                const g = (payload?.gate ?? "error") as Gate
                if (g === "dob_mismatch") {
                    setGate("dob_required")
                    setMessage(
                        payload?.message ||
                            payload?.error ||
                            detail
                    )
                    return
                }
                setGate(g === "invalid" ? "invalid" : "error")
                setMessage(
                    payload?.message || payload?.error || detail
                )
                return
            }

            if (payload?.error && !payload?.gate) {
                setGate("error")
                setMessage(payload.message || payload.error)
                return
            }

            const g = (payload.gate ?? "error") as Gate
            if (g === "dob_mismatch") {
                setGate("dob_required")
                setMessage(
                    payload.message ||
                        payload.error ||
                        "Date of birth does not match our records."
                )
                return
            }
            setGate(g)
            if (payload.label) setLabel(payload.label)
            if (payload.message) setMessage(payload.message)
            if (payload.embed_src) setEmbedSrc(payload.embed_src)
            setSignerEmail(payload.signer_email?.trim() || "")
            setSignerName(payload.signer_name?.trim() || "")
        },
        [token, refreshSubmission]
    )

    useEffect(() => {
        startSession()
    }, [startSession])

    useEffect(() => {
        if (gate !== "ready" || !embedSrc) return
        const existing = document.querySelector('script[data-docuseal-form="1"]')
        if (existing) return

        const script = document.createElement("script")
        script.src = "https://cdn.docuseal.com/js/form.js"
        script.async = true
        script.setAttribute("data-docuseal-form", "1")
        document.body.appendChild(script)

        const onCompleted = (e: Event) => {
            const detail = (e as CustomEvent).detail
            console.info("[ReferralSharePage] DocuSeal completed", detail)
            setGate("completed")
            setMessage(
                "Thank you. Your signed authorization has been submitted to Monarch Competency."
            )
        }

        const attach = () => {
            const el = document.querySelector("docuseal-form")
            if (el) {
                el.addEventListener("completed", onCompleted)
            }
        }

        const t = window.setTimeout(attach, 800)
        return () => {
            window.clearTimeout(t)
            const el = document.querySelector("docuseal-form")
            if (el) el.removeEventListener("completed", onCompleted)
        }
    }, [gate, embedSrc])

    const signingActive = gate === "ready" && !!embedSrc

    const shell: CSSProperties = {
        minHeight: "100vh",
        background: C.coconut,
        padding: signingActive ? "20px 8px 24px" : "48px 20px 80px",
        boxSizing: "border-box",
        fontFamily: FONT,
    }

    const card: CSSProperties = {
        maxWidth: "720px",
        margin: "0 auto",
        background: C.white,
        borderRadius: RADIUS.card,
        border: `1px solid ${C.ashSubtle}`,
        padding: signingActive ? "20px 22px 16px" : "32px 28px",
        boxShadow: "0 2px 12px rgba(43, 40, 40, 0.06)",
    }

    return (
        <div style={shell}>
            <div style={card}>
                <img
                    src={LOGO_URL}
                    alt="Monarch Competency"
                    style={{ height: "40px", marginBottom: "20px" }}
                />
                <h1
                    style={{
                        margin: "0 0 8px",
                        fontSize: "22px",
                        fontWeight: 700,
                        color: C.ash,
                        letterSpacing: "-0.02em",
                    }}
                >
                    {label}
                </h1>
                <p
                    style={{
                        margin: "0 0 24px",
                        fontSize: "14px",
                        color: C.ashMuted,
                        lineHeight: 1.5,
                    }}
                >
                    Secure electronic signing for Monarch Competency. Do not
                    share this link.
                </p>

                {gate === "loading" && (
                    <p style={{ color: C.ashMuted, fontSize: "14px" }}>
                        Loading…
                    </p>
                )}

                {gate === "dob_required" && (
                    <div>
                        {message && (
                            <div
                                style={{
                                    padding: "12px 14px",
                                    marginBottom: "16px",
                                    borderRadius: RADIUS.input,
                                    background: C.errorBg,
                                    color: C.error,
                                    fontSize: "14px",
                                    lineHeight: 1.5,
                                }}
                            >
                                {message}
                            </div>
                        )}
                        <p
                            style={{
                                fontSize: "14px",
                                color: C.ash,
                                marginBottom: "12px",
                            }}
                        >
                            {message
                                ? "Try again with the correct date of birth."
                                : "Enter the client date of birth to continue."}
                        </p>
                        <label
                            style={{
                                display: "block",
                                fontSize: "13px",
                                fontWeight: 600,
                                marginBottom: "6px",
                                color: C.ash,
                            }}
                        >
                            Date of birth
                        </label>
                        <input
                            type="date"
                            value={dob}
                            onChange={(e) => setDob(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "12px 14px",
                                fontSize: "15px",
                                fontFamily: FONT,
                                border: `1px solid ${C.ashSubtle}`,
                                borderRadius: RADIUS.input,
                                marginBottom: "16px",
                                boxSizing: "border-box",
                            }}
                        />
                        <button
                            type="button"
                            disabled={busy || !dob}
                            onClick={() => startSession(dob)}
                            style={{
                                padding: "12px 24px",
                                fontSize: "15px",
                                fontWeight: 600,
                                fontFamily: FONT,
                                color: C.coconut,
                                background: C.ash,
                                border: "none",
                                borderRadius: RADIUS.input,
                                cursor: busy ? "wait" : "pointer",
                                opacity: busy || !dob ? 0.6 : 1,
                            }}
                        >
                            {busy ? "Verifying…" : "Continue"}
                        </button>
                    </div>
                )}

                {(gate === "completed" ||
                    gate === "expired" ||
                    gate === "invalid" ||
                    gate === "dob_mismatch" ||
                    gate === "error") && (
                    <div
                        style={{
                            padding: "16px 18px",
                            borderRadius: RADIUS.input,
                            background:
                                gate === "completed"
                                    ? C.successBg
                                    : gate === "dob_mismatch" || gate === "error"
                                      ? C.errorBg
                                      : C.warningBg,
                            color:
                                gate === "completed"
                                    ? C.success
                                    : gate === "dob_mismatch" || gate === "error"
                                      ? C.error
                                      : C.warningText,
                            fontSize: "14px",
                            lineHeight: 1.5,
                        }}
                    >
                        {message ||
                            (gate === "completed"
                                ? "Signing complete."
                                : gate === "expired"
                                  ? "This link has expired."
                                  : gate === "invalid"
                                    ? "This link is not valid."
                                    : "Something went wrong.")}
                    </div>
                )}
            </div>

            {signingActive && (
                <>
                    <div
                        style={{
                            maxWidth: "960px",
                            margin: "12px auto 12px",
                            padding: "12px 14px",
                            borderRadius: RADIUS.input,
                            background: "rgba(255, 255, 255, 0.85)",
                            border: `1px solid ${C.ashSubtle}`,
                            fontSize: "13px",
                            color: C.ash,
                            lineHeight: 1.5,
                        }}
                    >
                        <strong>Tip:</strong> Use the step tracker bar (pinned at the
                        bottom of the form) to jump between fields. Complete all required
                        areas, then submit.
                    </div>
                    <div
                        style={{
                            maxWidth: "960px",
                            margin: "0 auto",
                            borderRadius: RADIUS.card,
                            border: `1px solid ${C.ashSubtle}`,
                            background: C.white,
                            minHeight: "min(75vh, 820px)",
                            overflow: "visible",
                        }}
                    >
                        <docuseal-form
                            data-src={embedSrc}
                            data-email={signerEmail || undefined}
                            data-name={signerName || undefined}
                            data-minimize="false"
                            data-order-as-on-page="true"
                            data-go-to-last="true"
                            data-autoscroll-fields="true"
                            data-custom-css={DOCUSEAL_EMBED_CSS}
                        />
                    </div>
                </>
            )}
        </div>
    )
}
