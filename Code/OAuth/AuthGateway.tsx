import { useState, useEffect, useMemo } from "react"
import { createClient } from "@supabase/supabase-js"
import { COLORS, FONT, RADIUS, FROSTED_GLASS_STRONG, BUTTON_PRIMARY, BUTTON_SECONDARY, INPUT_BASE, SHADOWS } from "../DesignSystem"
import { isStaffEmailForProgram } from "../config/monarchProgramCompetency"

const SUPABASE_URL = "https://esbmnympligtknhtkary.supabase.co"
const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzYm1ueW1wbGlndGtuaHRrYXJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MjY5NzcsImV4cCI6MjA4MTAwMjk3N30.TeHhOnsUuAzSx9q5z1VMYHnAWlL63QKxVIRKNeRCRbk"

import {
    ACTIVE_MONARCH_PROGRAM,
    referralPartnerLoginUrl,
    staffLoginUrl,
} from "../config/monarchProgramCompetency"
/** Staff session storage — must match `ReferralDashboard.tsx`. */
const AUTH_STORAGE_STAFF = "sb-esbmnympligtknhtkary-auth-staff"
/** Referring-source session storage — must match `ReferralSourcePortal.tsx` and referrer forms. */
const AUTH_STORAGE_SOURCE = "sb-esbmnympligtknhtkary-auth-source"
/** Persisted hint when OAuth returns without `bucket` in the URL. Same key in localStorage + sessionStorage (must match ReferralSourcePortal). */
const AUTH_BUCKET_LS_KEY = "monarch_referrals_auth_bucket"
const AUTH_BUCKET_SS_KEY = "monarch_referrals_auth_bucket"

function writeAuthBucketHint(bucket: "staff" | "source"): void {
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

function readStoredAuthBucket(): "staff" | "source" | null {
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

/**
 * Which auth bucket the login page uses. OAuth often strips query params from the return URL,
 * so we persist `source` when `?bucket=source` is present and reuse it on `#access_token` / `?code=` returns.
 */
function normalizedPathname(): string {
    if (typeof window === "undefined") return "/"
    const p = window.location.pathname.replace(/\/+$/, "")
    return p || "/"
}

function isAdminLoginPath(): boolean {
    return normalizedPathname() === "/admin"
}

/** Client-only. Do not call during Framer SSR — `window` is undefined and would default to source. */
function resolveLoginAuthBucket(): "staff" | "source" {
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
        if (stored === "source" || stored === "staff") return stored
        return "source"
    }
    const stored = readStoredAuthBucket()
    if (stored === "source" || stored === "staff") return stored
    return "source"
}

/** Magic link / OAuth return URL — always include `bucket` so PKCE returns use the correct storage key. */
function loginPageRedirectUrlFor(bucket: "staff" | "source"): string {
    return bucket === "source" ? referralPartnerLoginUrl() : staffLoginUrl()
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

function createAuthGatewaySupabase(bucket: "staff" | "source") {
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

/** For testing: ?switch=1 or ?force_login=1 forces sign-out and shows login form so you can sign in as another user. */
function hasForceLoginParam(): boolean {
    if (typeof window === "undefined") return false
    const q = new URLSearchParams(window.location.search)
    return q.get("switch") === "1" || q.get("force_login") === "1"
}

function AutoRedirectTo({ path, delayMs }: { path: string; delayMs: number }) {
    useEffect(() => {
        const t = setTimeout(() => {
            if (typeof window !== "undefined") window.location.href = path
        }, delayMs)
        return () => clearTimeout(t)
    }, [path, delayMs])
    return null
}

export default function AuthGateway() {
    const [authBucket, setAuthBucket] = useState<"staff" | "source" | null>(null)
    const supabase = useMemo(
        () => (authBucket ? createAuthGatewaySupabase(authBucket) : null),
        [authBucket]
    )
    const [session, setSession] = useState<{ user?: { email?: string } } | null>(null)
    const [loading, setLoading] = useState(true)
    const [authMode, setAuthMode] = useState("options") // options | magic-link | signing-in
    const [email, setEmail] = useState("")
    const [magicLinkSent, setMagicLinkSent] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        setAuthBucket(resolveLoginAuthBucket())
    }, [])

    useEffect(() => {
        const callbackErr = readAuthCallbackError()
        if (!callbackErr) return
        const lower = callbackErr.toLowerCase()
        if (lower.includes("expired") || lower.includes("invalid")) {
            setError(
                `${callbackErr} Request a fresh link below (referral partners: open “Use referral partner sign-in” first, then Continue with Email).`
            )
        } else {
            setError(callbackErr)
        }
    }, [])

    useEffect(() => {
        if (!supabase) return
        let cancelled = false

        const finishLoading = (sess: any) => {
            if (!cancelled) {
                setSession(sess)
                setLoading(false)
            }
        }

        supabase.auth
            .getSession()
            .then(({ data: { session } }) => finishLoading(session))
            .catch(() => finishLoading(null))

        const timeout = setTimeout(() => {
            if (!cancelled) setLoading(false)
        }, 4000)

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!cancelled) setSession(session)
        })

        return () => {
            cancelled = true
            clearTimeout(timeout)
            subscription.unsubscribe()
        }
    }, [supabase])

    useEffect(() => {
        if (!supabase || !session || !hasForceLoginParam()) return
        supabase.auth.signOut().then(() => setSession(null))
    }, [session, supabase])

    const handleMagicLink = async () => {
        if (!supabase) return
        const bucket = resolveLoginAuthBucket()
        setAuthBucket(bucket)
        setError("")
        setAuthMode("signing-in")
        writeAuthBucketHint(bucket)

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: loginPageRedirectUrlFor(bucket),
            },
        })

        if (error) {
            setError(error.message)
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
        setError("")
        writeAuthBucketHint(bucket)
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: loginPageRedirectUrlFor(bucket),
            },
        })

        if (error) {
            setError(error.message)
        }
    }

    const handleAppleSignIn = async () => {
        if (!supabase) return
        const bucket = resolveLoginAuthBucket()
        setAuthBucket(bucket)
        setError("")
        writeAuthBucketHint(bucket)
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "apple",
            options: {
                redirectTo: loginPageRedirectUrlFor(bucket),
            },
        })
        if (error) setError(error.message)
    }

    const handleSignOut = async () => {
        if (!supabase) return
        await supabase.auth.signOut()
        setSession(null)
        setAuthMode("options")
        setMagicLinkSent(false)
        setEmail("")
    }

    if (!authBucket || !supabase || loading) {
        return (
            <div style={{ padding: "40px", textAlign: "center", fontFamily: FONT, color: COLORS.ashMuted }}>
                Loading...
            </div>
        )
    }

    if (session && hasForceLoginParam()) {
        return (
            <div style={{ padding: "40px", textAlign: "center", color: COLORS.ashMuted, fontSize: "14px", fontFamily: FONT }}>
                Signing out…
            </div>
        )
    }

    if (session) {
        const email = session.user?.email ?? ""
        const phoneUser = (session.user as { phone?: string })?.phone
        const displayId = email || phoneUser || "your account"
        const isStaff = isStaffEmailForProgram(email)
        const redirectPath = isStaff ? "/dashboard" : "/portal"
        const redirectLabel = isStaff ? "dashboard" : "portal"

        return (
            <div style={{ padding: "40px", maxWidth: "500px", margin: "0 auto", textAlign: "center" }}>
                <div style={{ padding: "32px", borderRadius: RADIUS.card, ...FROSTED_GLASS_STRONG, boxShadow: SHADOWS.modal }}>
                    <p style={{ marginBottom: "12px", fontSize: "16px", color: COLORS.ash, fontFamily: FONT }}>
                        You're signed in as <strong>{displayId}</strong>
                    </p>
                    <p style={{ marginBottom: "24px", fontSize: "14px", color: COLORS.ashMuted, fontFamily: FONT }}>
                        Redirecting you to the {redirectLabel}…
                    </p>
                    <button type="button" onClick={async () => { await supabase.auth.signOut(); setSession(null); setAuthMode("options"); setEmail("") }} style={{ ...BUTTON_SECONDARY }}>
                        Sign out and use a different account
                    </button>
                </div>
                <AutoRedirectTo path={redirectPath} delayMs={2500} />
            </div>
        )
    }

    return (
        <div style={{ padding: "40px", maxWidth: "500px", margin: "0 auto" }}>
            <div style={{ padding: "32px", borderRadius: RADIUS.card, ...FROSTED_GLASS_STRONG, boxShadow: SHADOWS.modal }}>
                <h1 style={{ color: COLORS.ash, marginBottom: "8px", fontFamily: FONT, fontSize: "24px", fontWeight: 700 }}>
                    Secure Referral Portal
                </h1>
                <p style={{ color: COLORS.ashMuted, fontSize: "16px", marginBottom: "16px", fontFamily: FONT }}>
                    This form contains protected health information and requires verification.
                </p>
                {authBucket === "staff" && (
                    <p style={{ color: COLORS.ashMuted, fontSize: "14px", marginBottom: "24px", fontFamily: FONT, lineHeight: 1.5 }}>
                        Referring a client or tracking referrals?{" "}
                        <a href={referralPartnerLoginUrl()} style={{ color: COLORS.ash, fontWeight: 600 }}>
                            Use referral partner sign-in
                        </a>
                    </p>
                )}

                {error && (
                    <div style={{ padding: "12px 16px", marginBottom: "20px", backgroundColor: COLORS.errorBg, color: COLORS.errorText, borderRadius: RADIUS.input, fontSize: "14px", fontFamily: FONT }}>
                        {error}
                    </div>
                )}

            {magicLinkSent && (
                <div style={{ padding: "24px", backgroundColor: COLORS.successBg, border: `1px solid ${COLORS.success}`, borderRadius: RADIUS.card, textAlign: "center" }}>
                    <p style={{ fontSize: "18px", fontWeight: 600, color: COLORS.successText, marginBottom: "8px", fontFamily: FONT }}>✓ Check your email</p>
                    <p style={{ color: COLORS.successText, marginBottom: "16px", fontFamily: FONT }}>We sent a login link to <strong>{email}</strong></p>
                    <p style={{ color: COLORS.successText, fontSize: "14px", marginBottom: "16px", fontFamily: FONT }}>Click the link in the email to access the secure referral form. The link expires in 1 hour.</p>
                    <button type="button" onClick={() => { setMagicLinkSent(false); setAuthMode("options"); setEmail("") }} style={{ ...BUTTON_SECONDARY, color: COLORS.success, borderColor: COLORS.success }}>
                        Use different email
                    </button>
                </div>
            )}

            {!magicLinkSent && authMode === "options" && (
                <div>
                    <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        style={{
                            ...BUTTON_SECONDARY,
                            width: "100%",
                            padding: "16px",
                            marginBottom: "12px",
                            fontSize: "16px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "12px",
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        Continue with Google
                    </button>

                    <button
                        type="button"
                        onClick={handleAppleSignIn}
                        style={{
                            ...BUTTON_SECONDARY,
                            width: "100%",
                            padding: "16px",
                            marginBottom: "12px",
                            fontSize: "16px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "12px",
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
                            <path
                                fill="currentColor"
                                d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 2.01.16 3.53.88 4.55 2.17-4.06 2.25-3.19 6.9.78 8.22-.69 1.78-1.58 3.54-2.98 4.62zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
                            />
                        </svg>
                        Continue with Apple
                    </button>

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            margin: "24px 0",
                        }}
                    >
                        <div
                            style={{
                                flex: 1,
                                height: "1px",
                                backgroundColor: "#E5E7EB",
                            }}
                        />
                        <span
                            style={{
                                padding: "0 16px",
                                color: "#9CA3AF",
                                fontSize: "14px",
                            }}
                        >
                            or
                        </span>
                        <div
                            style={{
                                flex: 1,
                                height: "1px",
                                backgroundColor: "#E5E7EB",
                            }}
                        />
                    </div>

                    <button type="button" onClick={() => setAuthMode("magic-link")} style={{ ...BUTTON_PRIMARY, width: "100%", padding: "16px" }}>
                        Continue with Email
                    </button>

                    <p style={{ marginTop: "24px", fontSize: "13px", color: COLORS.ashMuted, textAlign: "center", fontFamily: FONT }}>
                        By signing in, you agree to our Terms of Service and acknowledge that you are authorized to submit referrals containing protected health information.
                    </p>
                </div>
            )}

            {!magicLinkSent && (authMode === "magic-link" || authMode === "signing-in") && (
                <div>
                    <div style={{ marginBottom: "20px" }}>
                        <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, fontFamily: FONT, color: COLORS.ash }}>Email Address</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@organization.com" style={INPUT_BASE} />
                    </div>
                    <button type="button" onClick={handleMagicLink} disabled={!email || authMode === "signing-in"} style={{ ...BUTTON_PRIMARY, width: "100%", padding: "16px", opacity: !email ? 0.6 : 1, cursor: !email ? "not-allowed" : "pointer", marginBottom: "16px" }}>
                        {authMode === "signing-in" ? "Sending..." : "Send Login Link"}
                    </button>
                    <button type="button" onClick={() => setAuthMode("options")} style={{ width: "100%", padding: "12px", fontSize: "14px", color: COLORS.ashMuted, background: "transparent", border: "none", cursor: "pointer", fontFamily: FONT }}>
                        ← Back to options
                    </button>
                </div>
            )}
            </div>
        </div>
    )
}
