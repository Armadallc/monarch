/**
 * AuthGateway — Framer paste for `/login` (referral partners) and `/admin` (staff).
 * Dual session buckets: `?bucket=staff` → `-auth-staff` (dashboard); `?bucket=source` → `-auth-source` (portal/forms).
 * Paste the same component on both pages in Framer. Keep URL constants in sync with `Code/config/monarchProgramCompetency.ts`.
 *
 * Logotype: defaults to Supabase public `assets/AuthGateway_Logotype_390x75.png` (390×75).
 * Optional: override via Framer **Logotype** property control.
 */
import { useState, useEffect, useMemo, useRef, type CSSProperties } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@supabase/supabase-js"
import { addPropertyControls, ControlType } from "framer"

// ----- Inlined design system (no import) -----
const COLORS = {
    ash: "#2B2828",
    charcoal: "#323232",
    charcoal25: "rgba(50, 50, 50, 0.25)",
    charcoal40: "rgba(50, 50, 50, 0.4)",
    charcoal60: "rgba(50, 50, 50, 0.6)",
    ashMuted: "rgba(43, 40, 40, 0.6)",
    ashSubtle: "rgba(43, 40, 40, 0.15)",
    coconut: "#E9EDF6",
    coconut25: "rgba(233, 237, 246, 0.25)",
    coconut40: "rgba(233, 237, 246, 0.4)",
    shell: "#F8F6F1",
    white: "#FFFFFF",
    success: "#059669",
    successBg: "#d1fae5",
    successText: "#059669",
    error: "#991B1B",
    errorBg: "#fee2e2",
    errorText: "#c0392b",
    borderLight: "#E2E8F0",
}
const RADIUS = { card: "12px", input: "12px" }
const FONT = `"Montserrat", sans-serif`
const SHADOWS = {
    card: "0 2px 12px rgba(43, 40, 40, 0.06)",
    modal: "0 24px 48px -12px rgba(43, 40, 40, 0.15)",
}
const TRANSITION = "all 0.2s ease"

const FROSTED_GLASS: CSSProperties = {
    background: COLORS.coconut25,
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    border: `1px solid ${COLORS.ashSubtle}`,
    borderRadius: RADIUS.card,
    boxSizing: "border-box",
}

const BUTTON_PRIMARY: CSSProperties = {
    padding: "12px 24px",
    fontSize: "15px",
    fontWeight: 600,
    fontFamily: FONT,
    color: COLORS.shell,
    backgroundColor: COLORS.ash,
    border: "none",
    borderRadius: RADIUS.input,
    cursor: "pointer",
    letterSpacing: "-0.01em",
    transition: TRANSITION,
}

const BUTTON_SECONDARY: CSSProperties = {
    padding: "12px 24px",
    fontSize: "15px",
    fontWeight: 600,
    fontFamily: FONT,
    color: COLORS.ash,
    backgroundColor: "transparent",
    border: `2px solid ${COLORS.ashSubtle}`,
    borderRadius: RADIUS.input,
    cursor: "pointer",
    letterSpacing: "-0.01em",
    transition: TRANSITION,
}

const OAUTH_BTN_BASE: CSSProperties = {
    width: "100%",
    padding: "14px 20px",
    marginBottom: "12px",
    fontSize: "15px",
    fontWeight: 600,
    fontFamily: FONT,
    borderRadius: RADIUS.input,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    transition: TRANSITION,
    boxSizing: "border-box",
}

/** Google — frosted coconut fill, charcoal label + border. */
const OAUTH_GOOGLE: CSSProperties = {
    ...OAUTH_BTN_BASE,
    color: COLORS.charcoal,
    backgroundColor: COLORS.coconut25,
    border: `1px solid ${COLORS.charcoal}`,
}

/** Apple — charcoal tint, coconut label + mark. */
const OAUTH_APPLE: CSSProperties = {
    ...OAUTH_BTN_BASE,
    color: COLORS.coconut,
    backgroundColor: COLORS.charcoal25,
    border: "none",
}

/** Continue with Email — same glass tint as Apple. */
const OAUTH_EMAIL: CSSProperties = {
    ...OAUTH_BTN_BASE,
    width: "100%",
    marginBottom: 0,
    color: COLORS.coconut,
    backgroundColor: COLORS.charcoal25,
    border: "none",
}

const AUTH_GATEWAY_HOVER_CSS = `
.auth-gw-btn-google:hover { background-color: ${COLORS.coconut40} !important; }
.auth-gw-btn-apple:hover,
.auth-gw-btn-email:hover { background-color: ${COLORS.charcoal40} !important; }
`

const INPUT_BASE: CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    fontSize: "15px",
    fontFamily: FONT,
    color: COLORS.ash,
    border: `1px solid ${COLORS.ashSubtle}`,
    borderRadius: RADIUS.input,
    backgroundColor: COLORS.white,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s ease",
}

const LOGIN_PAGE_SHELL: CSSProperties = {
    width: "100%",
    minHeight: "min(100vh, 100dvh)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "clamp(24px, 6vh, 64px) clamp(20px, 5vw, 40px)",
    boxSizing: "border-box",
    fontFamily: FONT,
}

const LOGIN_CARD: CSSProperties = {
    ...FROSTED_GLASS,
    width: "100%",
    maxWidth: "480px",
    padding: "clamp(28px, 4vw, 40px) clamp(24px, 4vw, 36px)",
    boxShadow: SHADOWS.modal,
}

/** Public `assets` bucket — override via Framer Logotype control if needed. */
const DEFAULT_LOGOTYPE_URL =
    "https://esbmnympligtknhtkary.supabase.co/storage/v1/object/public/assets/AuthGateway_Logotype_390x75.png"

/** Framer ControlType.Image may pass a string URL or `{ src: string }`. */
function resolveLogotypeUrl(value: unknown): string {
    if (value == null) return DEFAULT_LOGOTYPE_URL
    if (typeof value === "string") {
        const t = value.trim()
        return t || DEFAULT_LOGOTYPE_URL
    }
    if (typeof value === "object" && value !== null && "src" in value) {
        const src = (value as { src?: unknown }).src
        if (typeof src === "string" && src.trim()) return src.trim()
    }
    return DEFAULT_LOGOTYPE_URL
}

const SUPABASE_URL = "https://esbmnympligtknhtkary.supabase.co"
const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzYm1ueW1wbGlndGtuaHRrYXJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MjY5NzcsImV4cCI6MjA4MTAwMjk3N30.TeHhOnsUuAzSx9q5z1VMYHnAWlL63QKxVIRKNeRCRbk"

const SITE_BASE = "https://monarchy.framer.website"
const LOGIN_PAGE_BASE = `${SITE_BASE}/login`
const ADMIN_PAGE_BASE = `${SITE_BASE}/admin`
const AUTH_STORAGE_STAFF = "sb-esbmnympligtknhtkary-auth-staff"
const AUTH_STORAGE_SOURCE = "sb-esbmnympligtknhtkary-auth-source"
const AUTH_BUCKET_LS_KEY = "monarch_referrals_auth_bucket"
const AUTH_BUCKET_SS_KEY = "monarch_referrals_auth_bucket"

type AuthBucket = "staff" | "source"

function writeAuthBucketHint(bucket: AuthBucket): void {
    if (typeof window === "undefined") return
    try {
        localStorage.setItem(AUTH_BUCKET_LS_KEY, bucket)
    } catch {
        /* ignore */
    }
    try {
        sessionStorage.setItem(AUTH_BUCKET_SS_KEY, bucket)
    } catch {
        /* ignore */
    }
}

function readStoredAuthBucket(): AuthBucket | null {
    try {
        const ss = sessionStorage.getItem(AUTH_BUCKET_SS_KEY)
        if (ss === "source" || ss === "staff") return ss
    } catch {
        /* ignore */
    }
    try {
        const ls = localStorage.getItem(AUTH_BUCKET_LS_KEY)
        if (ls === "source" || ls === "staff") return ls
    } catch {
        /* ignore */
    }
    return null
}

function hasSupabaseAuthCallback(): boolean {
    if (typeof window === "undefined") return false
    const h = window.location.hash
    const sp = new URLSearchParams(window.location.search)
    if (/access_token|refresh_token|provider_token|error=/i.test(h)) return true
    return Boolean(sp.get("code"))
}

function normalizedPathname(): string {
    if (typeof window === "undefined") return "/"
    const p = window.location.pathname.replace(/\/+$/, "")
    return p || "/"
}

function isAdminLoginPath(): boolean {
    return normalizedPathname() === "/admin"
}

/** Client-only. OAuth may strip `bucket` from the return URL — reuse stored hint on callback. */
function resolveLoginAuthBucket(): AuthBucket {
    if (typeof window === "undefined") return "source"
    if (isAdminLoginPath()) {
        writeAuthBucketHint("staff")
        return "staff"
    }
    const sp = new URLSearchParams(window.location.search)
    if (sp.get("bucket") === "source") {
        writeAuthBucketHint("source")
        return "source"
    }
    if (sp.get("bucket") === "staff") {
        writeAuthBucketHint("staff")
        return "staff"
    }
    if (normalizedPathname() === "/login") {
        writeAuthBucketHint("source")
        return "source"
    }
    if (hasSupabaseAuthCallback()) {
        const stored = readStoredAuthBucket()
        if (stored) return stored
        return "source"
    }
    const stored = readStoredAuthBucket()
    if (stored) return stored
    return "source"
}

/** OAuth / magic-link return URL — never include `switch=1` or fresh sign-ins get cleared immediately. */
function loginPageRedirectUrlFor(bucket: AuthBucket): string {
    return bucket === "source"
        ? `${LOGIN_PAGE_BASE}?bucket=source`
        : `${ADMIN_PAGE_BASE}?bucket=staff`
}

function clearForceLoginParamsFromUrl(): void {
    if (typeof window === "undefined") return
    try {
        const url = new URL(window.location.href)
        if (!url.searchParams.has("switch") && !url.searchParams.has("force_login")) return
        url.searchParams.delete("switch")
        url.searchParams.delete("force_login")
        const next = `${url.pathname}${url.search}${url.hash}`
        window.history.replaceState({}, "", next)
    } catch {
        /* ignore */
    }
}

/** Google/Apple block OAuth inside Framer canvas preview (iframes) — 403 on AccountChooser. */
function isEmbeddedAuthContext(): boolean {
    if (typeof window === "undefined") return false
    try {
        if (window.self !== window.top) return true
    } catch {
        return true
    }
    const host = window.location.hostname
    return host.endsWith("framer.com") || host === "framerusercontent.com"
}

async function startProviderOAuth(
    supabase: SupabaseClient,
    provider: "google" | "apple",
    redirectTo: string,
    forceAccountPicker = false
): Promise<{ error: Error | null }> {
    const oauthOptions: {
        redirectTo: string
        skipBrowserRedirect: true
        queryParams?: Record<string, string>
    } = { redirectTo, skipBrowserRedirect: true }
    if (provider === "google" && forceAccountPicker) {
        oauthOptions.queryParams = { prompt: "select_account" }
    }
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: oauthOptions,
    })
    if (error) return { error }
    const url = data?.url
    if (!url) {
        return {
            error: new Error(
                "Could not start sign-in. Use email magic link or open the published login page."
            ),
        }
    }
    try {
        const target = window.top ?? window
        target.location.href = url
    } catch {
        const opened = window.open(url, "_blank", "noopener,noreferrer")
        if (!opened) {
            return {
                error: new Error(
                    `Popup blocked. Open ${LOGIN_PAGE_BASE} in a new browser tab to sign in with ${provider === "google" ? "Google" : "Apple"}.`
                ),
            }
        }
    }
    return { error: null }
}

function readAuthCallbackError(): string | null {
    if (typeof window === "undefined") return null
    try {
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""))
        const q = new URLSearchParams(window.location.search)
        const desc = hash.get("error_description") || q.get("error_description")
        if (desc) return decodeURIComponent(desc.replace(/\+/g, " "))
        const err = hash.get("error") || q.get("error")
        if (err) return decodeURIComponent(err.replace(/\+/g, " "))
    } catch {
        /* ignore */
    }
    return null
}

function createAuthGatewaySupabase(bucket: AuthBucket): SupabaseClient {
    const storageKey = bucket === "source" ? AUTH_STORAGE_SOURCE : AUTH_STORAGE_STAFF
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            storageKey,
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
        },
    })
}

async function promoteStaffSessionToStaffBucket(sourceClient: SupabaseClient): Promise<boolean> {
    const { data: { session } } = await sourceClient.auth.getSession()
    if (!session?.access_token || !session.refresh_token) return false
    const staffClient = createAuthGatewaySupabase("staff")
    const { error } = await staffClient.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
    })
    if (error) return false
    await sourceClient.auth.signOut({ scope: "local" })
    return true
}

const STAFF_EMAIL_DOMAINS = ["monarchcompetency.com"] as const
function isStaffEmail(email: string | null | undefined): boolean {
    if (!email) return false
    const lower = email.toLowerCase()
    return STAFF_EMAIL_DOMAINS.some((d) => lower.endsWith(`@${d}`))
}

function hasForceLoginParam(): boolean {
    if (typeof window === "undefined") return false
    const q = new URLSearchParams(window.location.search)
    return q.get("switch") === "1" || q.get("force_login") === "1"
}

function AutoRedirectTo({ path, delayMs, replace }: { path: string; delayMs: number; replace?: boolean }) {
    useEffect(() => {
        const go = () => {
            if (typeof window === "undefined") return
            if (replace) window.location.replace(path)
            else window.location.href = path
        }
        if (delayMs <= 0) {
            go()
            return
        }
        const t = setTimeout(go, delayMs)
        return () => clearTimeout(t)
    }, [path, delayMs, replace])
    return null
}

function GoogleMark() {
    return (
        <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </svg>
    )
}

function AppleMark({ fill = COLORS.coconut }: { fill?: string }) {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
            <path
                fill={fill}
                d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 2.01.16 3.53.88 4.55 2.17-4.06 2.25-3.19 6.9.78 8.22-.69 1.78-1.58 3.54-2.98 4.62zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
            />
        </svg>
    )
}

function AuthLogotype({ src }: { src: string }) {
    if (!src?.trim()) return null
    return (
        <img
            src={src}
            alt="Monarch Competency"
            width={390}
            height={75}
            style={{
                width: "100%",
                maxWidth: "390px",
                height: "75px",
                objectFit: "contain",
                objectPosition: "center",
                display: "block",
                margin: "0 auto 28px auto",
            }}
        />
    )
}

type AuthGatewayProps = {
    logotypeUrl?: string | { src?: string }
}

export default function AuthGateway({ logotypeUrl }: AuthGatewayProps) {
    const logotypeSrc = resolveLogotypeUrl(logotypeUrl)
    const [authBucket, setAuthBucket] = useState<AuthBucket | null>(null)
    const supabase = useMemo(
        () => (authBucket ? createAuthGatewaySupabase(authBucket) : null),
        [authBucket]
    )
    const [session, setSession] = useState<{ user?: { email?: string } } | null>(null)
    const [loading, setLoading] = useState(true)
    const [authMode, setAuthMode] = useState("options")
    const [email, setEmail] = useState("")
    const [magicLinkSent, setMagicLinkSent] = useState(false)
    const [error, setError] = useState("")
    const [promotingStaff, setPromotingStaff] = useState(false)
    const [switchClearing, setSwitchClearing] = useState(false)
    const staffPromoteStarted = useRef(false)
    const switchHandledRef = useRef(false)

    useEffect(() => {
        setAuthBucket(resolveLoginAuthBucket())
    }, [])

    useEffect(() => {
        const callbackErr = readAuthCallbackError()
        if (!callbackErr) return
        const lower = callbackErr.toLowerCase()
        if (lower.includes("expired") || lower.includes("invalid")) {
            setError(
                `${callbackErr} Request a new login link below (referral partners: use referral partner sign-in first).`
            )
        } else {
            setError(callbackErr)
        }
    }, [])

    useEffect(() => {
        if (!supabase) return
        let cancelled = false
        const finishLoading = (sess: unknown) => {
            if (!cancelled) {
                setSession(sess as typeof session)
                setLoading(false)
            }
        }
        supabase.auth
            .getSession()
            .then(({ data: { session: sess } }) => finishLoading(sess))
            .catch(() => finishLoading(null))
        const timeout = setTimeout(() => {
            if (!cancelled) setLoading(false)
        }, 4000)
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, sess) => {
            if (!cancelled) setSession(sess)
        })
        return () => {
            cancelled = true
            clearTimeout(timeout)
            subscription.unsubscribe()
        }
    }, [supabase])

    /** One-time stale-session clear when landing from logout (`switch=1`). Must not run after a fresh OAuth return. */
    useEffect(() => {
        if (!supabase || typeof window === "undefined" || switchHandledRef.current) return
        if (!hasForceLoginParam()) return
        switchHandledRef.current = true
        if (hasSupabaseAuthCallback()) {
            clearForceLoginParamsFromUrl()
            return
        }
        let cancelled = false
        void (async () => {
            try {
                const {
                    data: { session: existing },
                } = await supabase.auth.getSession()
                if (cancelled) return
                if (existing) {
                    setSwitchClearing(true)
                    await supabase.auth.signOut({ scope: "global" })
                    if (!cancelled) setSession(null)
                }
            } catch {
                /* ignore */
            } finally {
                clearForceLoginParamsFromUrl()
                if (!cancelled) setSwitchClearing(false)
            }
        })()
        return () => {
            cancelled = true
        }
    }, [supabase])

    const handlePromoteStaffToDashboard = async () => {
        if (!supabase || staffPromoteStarted.current) return
        staffPromoteStarted.current = true
        setPromotingStaff(true)
        try {
            const ok = await promoteStaffSessionToStaffBucket(supabase)
            if (ok && typeof window !== "undefined") window.location.replace("/dashboard")
            else setPromotingStaff(false)
        } catch {
            setPromotingStaff(false)
        }
    }

    const handleMagicLink = async () => {
        if (!supabase) return
        const bucket = resolveLoginAuthBucket()
        setAuthBucket(bucket)
        writeAuthBucketHint(bucket)
        setError("")
        setAuthMode("signing-in")
        const { error: err } = await supabase.auth.signInWithOtp({
            email,
            options: { emailRedirectTo: loginPageRedirectUrlFor(bucket) },
        })
        if (err) {
            setError(err.message)
            setAuthMode("magic-link")
        } else {
            setMagicLinkSent(true)
            setAuthMode("magic-link")
        }
    }

    const handleGoogleSignIn = async () => {
        if (!supabase) return
        const bucket = resolveLoginAuthBucket()
        setAuthBucket(bucket)
        writeAuthBucketHint(bucket)
        setError("")
        const { error: err } = await startProviderOAuth(
            supabase,
            "google",
            loginPageRedirectUrlFor(bucket),
            hasForceLoginParam()
        )
        if (err) setError(err.message)
    }

    const handleAppleSignIn = async () => {
        if (!supabase) return
        const bucket = resolveLoginAuthBucket()
        setAuthBucket(bucket)
        writeAuthBucketHint(bucket)
        setError("")
        const { error: err } = await startProviderOAuth(
            supabase,
            "apple",
            loginPageRedirectUrlFor(bucket),
            hasForceLoginParam()
        )
        if (err) setError(err.message)
    }

    const embeddedAuth = isEmbeddedAuthContext()
    const publishedLoginHref = loginPageRedirectUrlFor(authBucket ?? "source")

    if (!authBucket || !supabase || loading) {
        return (
            <div style={LOGIN_PAGE_SHELL}>
                <p style={{ color: COLORS.ashMuted, fontSize: "15px" }}>Loading…</p>
            </div>
        )
    }

    if (switchClearing) {
        return (
            <div style={LOGIN_PAGE_SHELL}>
                <p style={{ color: COLORS.ashMuted, fontSize: "14px" }}>Signing out…</p>
            </div>
        )
    }

    if (session) {
        const userEmail = session.user?.email ?? ""
        const phoneUser = (session.user as { phone?: string })?.phone
        const displayId = userEmail || phoneUser || "your account"
        const staff = isStaffEmail(userEmail)

        if (staff && authBucket === "source") {
            return (
                <div style={LOGIN_PAGE_SHELL}>
                    <div style={{ ...LOGIN_CARD, textAlign: "center" }}>
                        <AuthLogotype src={logotypeSrc} />
                        <p style={{ marginBottom: "12px", fontSize: "16px", color: COLORS.ash }}>
                            You&apos;re signed in as <strong>{displayId}</strong>
                        </p>
                        <p style={{ marginBottom: "20px", fontSize: "14px", color: COLORS.ashMuted, lineHeight: 1.55 }}>
                            This is an admissions staff account. Staff use the dashboard; referral partners sign in with a
                            non-@monarchcompetency email.
                        </p>
                        <button
                            type="button"
                            onClick={() => void handlePromoteStaffToDashboard()}
                            disabled={promotingStaff}
                            style={{ ...BUTTON_PRIMARY, marginBottom: "12px", width: "100%" }}
                        >
                            {promotingStaff ? "Opening dashboard…" : "Open admissions dashboard"}
                        </button>
                        <button
                            type="button"
                            onClick={async () => {
                                await supabase.auth.signOut({ scope: "global" })
                                setSession(null)
                                if (typeof window !== "undefined") {
                                    window.location.replace(`${LOGIN_PAGE_BASE}?bucket=source&switch=1`)
                                }
                            }}
                            style={{ ...BUTTON_SECONDARY, width: "100%" }}
                        >
                            Sign out and use a referral partner account
                        </button>
                    </div>
                </div>
            )
        }

        if (!staff && authBucket === "staff") {
            return (
                <div style={LOGIN_PAGE_SHELL}>
                    <div style={{ ...LOGIN_CARD, textAlign: "center" }}>
                        <AuthLogotype src={logotypeSrc} />
                        <p style={{ marginBottom: "12px", fontSize: "16px", color: COLORS.ash }}>
                            <strong>{displayId}</strong> is not an admissions staff account.
                        </p>
                        <p style={{ marginBottom: "20px", fontSize: "14px", color: COLORS.ashMuted }}>
                            Referral partners should use referral partner sign-in.
                        </p>
                        <button
                            type="button"
                            onClick={async () => {
                                await supabase.auth.signOut({ scope: "global" })
                                if (typeof window !== "undefined") {
                                    window.location.replace(`${LOGIN_PAGE_BASE}?bucket=source&switch=1`)
                                }
                            }}
                            style={{ ...BUTTON_PRIMARY, marginBottom: "12px" }}
                        >
                            Go to referral partner sign-in
                        </button>
                        <button
                            type="button"
                            onClick={async () => {
                                await supabase.auth.signOut({ scope: "global" })
                                if (typeof window !== "undefined") {
                                    window.location.replace(`${ADMIN_PAGE_BASE}?bucket=staff&switch=1`)
                                }
                            }}
                            style={{ ...BUTTON_SECONDARY }}
                        >
                            Sign out
                        </button>
                    </div>
                </div>
            )
        }

        const redirectPath = staff ? "/dashboard" : "/portal"
        const redirectLabel = staff ? "dashboard" : "referral portal"
        return (
            <div style={LOGIN_PAGE_SHELL}>
                <div style={{ ...LOGIN_CARD, textAlign: "center" }}>
                    <AuthLogotype src={logotypeSrc} />
                    <p style={{ marginBottom: "12px", fontSize: "16px", color: COLORS.ash }}>
                        You&apos;re signed in as <strong>{displayId}</strong>
                    </p>
                    <p style={{ marginBottom: "24px", fontSize: "14px", color: COLORS.ashMuted }}>
                        Redirecting you to the {redirectLabel}…
                    </p>
                    <button
                        type="button"
                        onClick={async () => {
                            const switchUrl =
                                authBucket === "staff"
                                    ? `${ADMIN_PAGE_BASE}?bucket=staff&switch=1`
                                    : `${LOGIN_PAGE_BASE}?bucket=source&switch=1`
                            await supabase.auth.signOut({ scope: "global" })
                            if (typeof window !== "undefined") window.location.replace(switchUrl)
                        }}
                        style={{ ...BUTTON_SECONDARY }}
                    >
                        Sign out and use a different account
                    </button>
                </div>
                <AutoRedirectTo path={redirectPath} delayMs={600} replace />
            </div>
        )
    }

    return (
        <div style={LOGIN_PAGE_SHELL}>
            <style>{AUTH_GATEWAY_HOVER_CSS}</style>
            <div style={LOGIN_CARD}>
                {error && (
                    <div
                        style={{
                            padding: "12px 16px",
                            marginBottom: "20px",
                            backgroundColor: COLORS.errorBg,
                            color: COLORS.errorText,
                            borderRadius: RADIUS.input,
                            fontSize: "14px",
                        }}
                    >
                        {error}
                    </div>
                )}

                {magicLinkSent && (
                    <div
                        style={{
                            padding: "24px",
                            backgroundColor: COLORS.successBg,
                            border: `1px solid ${COLORS.success}`,
                            borderRadius: RADIUS.card,
                            textAlign: "center",
                        }}
                    >
                        <p style={{ fontSize: "18px", fontWeight: 600, color: COLORS.successText, marginBottom: "8px" }}>
                            ✓ Check your email
                        </p>
                        <p style={{ color: COLORS.successText, marginBottom: "16px" }}>
                            We sent a login link to <strong>{email}</strong>
                        </p>
                        <p style={{ color: COLORS.successText, fontSize: "14px", marginBottom: "16px" }}>
                            Click the link in the email to continue. The link expires in 1 hour.
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                setMagicLinkSent(false)
                                setAuthMode("options")
                                setEmail("")
                            }}
                            style={{ ...BUTTON_SECONDARY, color: COLORS.success, borderColor: COLORS.success }}
                        >
                            Use different email
                        </button>
                    </div>
                )}

                {!magicLinkSent && authMode === "options" && (
                    <div>
                        <AuthLogotype src={logotypeSrc} />
                        {embeddedAuth && (
                            <div
                                style={{
                                    marginBottom: "20px",
                                    padding: "14px 16px",
                                    backgroundColor: COLORS.errorBg,
                                    border: `1px solid ${COLORS.error}`,
                                    borderRadius: RADIUS.card,
                                    fontSize: "13px",
                                    lineHeight: 1.5,
                                    color: COLORS.errorText,
                                }}
                            >
                                Google and Apple sign-in do not work inside Framer Preview. Use{" "}
                                <strong>Continue with Email</strong> here, or open the published page:{" "}
                                <a href={publishedLoginHref} style={{ color: COLORS.ash, fontWeight: 600 }}>
                                    {publishedLoginHref}
                                </a>
                            </div>
                        )}
                        {authBucket === "staff" && (
                            <p
                                style={{
                                    margin: "0 0 20px",
                                    fontSize: "13px",
                                    lineHeight: 1.5,
                                    color: COLORS.ashMuted,
                                    textAlign: "center",
                                }}
                            >
                                Referring a client or tracking referrals?{" "}
                                <a href={`${LOGIN_PAGE_BASE}?bucket=source`} style={{ color: COLORS.ash, fontWeight: 600 }}>
                                    Use referral partner sign-in
                                </a>
                            </p>
                        )}

                        <button
                            type="button"
                            className="auth-gw-btn-google"
                            onClick={handleGoogleSignIn}
                            style={OAUTH_GOOGLE}
                        >
                            <GoogleMark />
                            Sign in with Google
                        </button>

                        <button
                            type="button"
                            className="auth-gw-btn-apple"
                            onClick={handleAppleSignIn}
                            style={OAUTH_APPLE}
                        >
                            <AppleMark />
                            Sign in with Apple
                        </button>

                        <div style={{ display: "flex", alignItems: "center", margin: "24px 0", gap: "12px" }}>
                            <div style={{ flex: 1, height: "1px", backgroundColor: COLORS.coconut }} />
                            <span style={{ fontSize: "13px", color: COLORS.charcoal60, fontWeight: 500 }}>or</span>
                            <div style={{ flex: 1, height: "1px", backgroundColor: COLORS.coconut }} />
                        </div>

                        <button
                            type="button"
                            className="auth-gw-btn-email"
                            onClick={() => setAuthMode("magic-link")}
                            style={OAUTH_EMAIL}
                        >
                            Continue with Email
                        </button>

                        <p
                            style={{
                                marginTop: "24px",
                                fontSize: "12px",
                                lineHeight: 1.55,
                                color: COLORS.charcoal60,
                                textAlign: "center",
                            }}
                        >
                            By signing in, you agree to our Terms of Service and acknowledge that you are authorized to
                            submit referrals containing protected health information.
                        </p>
                    </div>
                )}

                {!magicLinkSent && (authMode === "magic-link" || authMode === "signing-in") && (
                    <div>
                        <AuthLogotype src={logotypeSrc} />
                        <div style={{ marginBottom: "20px" }}>
                            <label
                                style={{
                                    display: "block",
                                    marginBottom: "8px",
                                    fontWeight: 600,
                                    color: COLORS.ash,
                                    fontSize: "14px",
                                }}
                            >
                                Email address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@organization.com"
                                style={INPUT_BASE}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleMagicLink}
                            disabled={!email || authMode === "signing-in"}
                            style={{
                                ...BUTTON_PRIMARY,
                                width: "100%",
                                padding: "14px 20px",
                                marginBottom: "16px",
                                opacity: !email ? 0.6 : 1,
                                cursor: !email ? "not-allowed" : "pointer",
                            }}
                        >
                            {authMode === "signing-in" ? "Sending…" : "Send login link"}
                        </button>
                        <button
                            type="button"
                            onClick={() => setAuthMode("options")}
                            style={{
                                width: "100%",
                                padding: "12px",
                                fontSize: "14px",
                                color: COLORS.ashMuted,
                                background: "transparent",
                                border: "none",
                                cursor: "pointer",
                            }}
                        >
                            ← Back to sign-in options
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

addPropertyControls(AuthGateway, {
    logotypeUrl: {
        type: ControlType.Image,
        title: "Logotype",
        description: "Optional override. Default: Supabase public assets/AuthGateway_Logotype_390x75.png",
    },
})
