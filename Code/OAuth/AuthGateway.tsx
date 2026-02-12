import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
    "https://esbmnympligtknhtkary.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzYm1ueW1wbGlndGtuaHRrYXJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MjY5NzcsImV4cCI6MjA4MTAwMjk3N30.TeHhOnsUuAzSx9q5z1VMYHnAWlL63QKxVIRKNeRCRbk"
)

export default function AuthGateway() {
    const [session, setSession] = useState(null)
    const [loading, setLoading] = useState(true)
    const [authMode, setAuthMode] = useState("options") // options, magic-link, signing-in
    const [email, setEmail] = useState("")
    const [magicLinkSent, setMagicLinkSent] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        // Check current session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setLoading(false)
        })

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
        })

        return () => subscription.unsubscribe()
    }, [])

    const handleMagicLink = async () => {
        setError("")
        setAuthMode("signing-in")

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo:
                    "https://outstanding-watching-274943.framer.app/secure-referral",
            },
        })

        if (error) {
            setError(error.message)
            setAuthMode("magic-link")
        } else {
            setMagicLinkSent(true)
        }
    }

    const handleGoogleSignIn = async () => {
        setError("")
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo:
                    "https://outstanding-watching-274943.framer.app/secure-referral",
            },
        })

        if (error) {
            setError(error.message)
        }
    }

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        setSession(null)
        setAuthMode("options")
        setMagicLinkSent(false)
        setEmail("")
    }

    if (loading) {
        return (
            <div style={{ padding: "40px", textAlign: "center" }}>
                <p>Loading...</p>
            </div>
        )
    }

    // User is authenticated - show placeholder for now
    if (session) {
        return (
            <div
                style={{ padding: "40px", maxWidth: "800px", margin: "0 auto" }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "24px",
                        padding: "16px",
                        backgroundColor: "#F0FDF4",
                        borderRadius: "8px",
                        border: "1px solid #BBF7D0",
                    }}
                >
                    <div>
                        <p
                            style={{
                                margin: 0,
                                fontSize: "14px",
                                color: "#166534",
                            }}
                        >
                            ✓ Signed in as <strong>{session.user.email}</strong>
                        </p>
                    </div>
                    <button
                        onClick={handleSignOut}
                        style={{
                            padding: "8px 16px",
                            fontSize: "14px",
                            color: "#DC2626",
                            backgroundColor: "transparent",
                            border: "1px solid #DC2626",
                            borderRadius: "6px",
                            cursor: "pointer",
                        }}
                    >
                        Sign Out
                    </button>
                </div>

                <div
                    style={{
                        padding: "40px",
                        backgroundColor: "#F8FAFC",
                        borderRadius: "8px",
                        textAlign: "center",
                    }}
                >
                    <h2 style={{ color: "#0E4B5E", marginBottom: "16px" }}>
                        Secure Referral Form
                    </h2>
                    <p style={{ color: "#64748B" }}>
                        The full PHI referral form will be displayed here.
                    </p>
                    <p style={{ color: "#64748B", fontSize: "14px" }}>
                        (We'll integrate TestForm.tsx in the next step)
                    </p>
                </div>
            </div>
        )
    }

    // Not authenticated - show login options
    return (
        <div style={{ padding: "40px", maxWidth: "500px", margin: "0 auto" }}>
            <h1 style={{ color: "#0E4B5E", marginBottom: "8px" }}>
                Secure Referral Portal
            </h1>
            <p
                style={{
                    color: "#64748b",
                    fontSize: "16px",
                    marginBottom: "32px",
                }}
            >
                This form contains protected health information and requires
                verification.
            </p>

            {error && (
                <div
                    style={{
                        padding: "12px 16px",
                        marginBottom: "20px",
                        backgroundColor: "#FEE2E2",
                        color: "#991B1B",
                        borderRadius: "8px",
                        fontSize: "14px",
                    }}
                >
                    {error}
                </div>
            )}

            {/* Magic Link Sent Confirmation */}
            {magicLinkSent && (
                <div
                    style={{
                        padding: "24px",
                        backgroundColor: "#F0FDF4",
                        border: "1px solid #BBF7D0",
                        borderRadius: "8px",
                        textAlign: "center",
                    }}
                >
                    <p
                        style={{
                            fontSize: "18px",
                            fontWeight: "600",
                            color: "#166534",
                            marginBottom: "8px",
                        }}
                    >
                        ✓ Check your email
                    </p>
                    <p style={{ color: "#166534", marginBottom: "16px" }}>
                        We sent a login link to <strong>{email}</strong>
                    </p>
                    <p
                        style={{
                            color: "#166534",
                            fontSize: "14px",
                            marginBottom: "16px",
                        }}
                    >
                        Click the link in the email to access the secure
                        referral form. The link expires in 1 hour.
                    </p>
                    <button
                        onClick={() => {
                            setMagicLinkSent(false)
                            setAuthMode("options")
                            setEmail("")
                        }}
                        style={{
                            padding: "10px 20px",
                            fontSize: "14px",
                            color: "#166534",
                            backgroundColor: "transparent",
                            border: "1px solid #166534",
                            borderRadius: "6px",
                            cursor: "pointer",
                        }}
                    >
                        Use different email
                    </button>
                </div>
            )}

            {/* Auth Options */}
            {!magicLinkSent && authMode === "options" && (
                <div>
                    <button
                        onClick={handleGoogleSignIn}
                        style={{
                            width: "100%",
                            padding: "16px",
                            marginBottom: "16px",
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "#1F2937",
                            backgroundColor: "#fff",
                            border: "2px solid #E5E7EB",
                            borderRadius: "8px",
                            cursor: "pointer",
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

                    <button
                        onClick={() => setAuthMode("magic-link")}
                        style={{
                            width: "100%",
                            padding: "16px",
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "#fff",
                            backgroundColor: "#0E4B5E",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                        }}
                    >
                        Continue with Email
                    </button>

                    <p
                        style={{
                            marginTop: "24px",
                            fontSize: "13px",
                            color: "#9CA3AF",
                            textAlign: "center",
                        }}
                    >
                        By signing in, you agree to our Terms of Service and
                        acknowledge that you are authorized to submit referrals
                        containing protected health information.
                    </p>
                </div>
            )}

            {/* Magic Link Form */}
            {!magicLinkSent && authMode === "magic-link" && (
                <div>
                    <div style={{ marginBottom: "20px" }}>
                        <label
                            style={{
                                display: "block",
                                marginBottom: "8px",
                                fontWeight: "600",
                            }}
                        >
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@organization.com"
                            style={{
                                width: "100%",
                                padding: "12px",
                                fontSize: "16px",
                                border: "1px solid #CBD5E1",
                                borderRadius: "8px",
                            }}
                        />
                    </div>

                    <button
                        onClick={handleMagicLink}
                        disabled={!email || authMode === "signing-in"}
                        style={{
                            width: "100%",
                            padding: "16px",
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "#fff",
                            backgroundColor: !email ? "#94A3B8" : "#0E4B5E",
                            border: "none",
                            borderRadius: "8px",
                            cursor: !email ? "not-allowed" : "pointer",
                            marginBottom: "16px",
                        }}
                    >
                        {authMode === "signing-in"
                            ? "Sending..."
                            : "Send Login Link"}
                    </button>

                    <button
                        onClick={() => setAuthMode("options")}
                        style={{
                            width: "100%",
                            padding: "12px",
                            fontSize: "14px",
                            color: "#64748B",
                            backgroundColor: "transparent",
                            border: "none",
                            cursor: "pointer",
                        }}
                    >
                        ← Back to options
                    </button>
                </div>
            )}
        </div>
    )
}
