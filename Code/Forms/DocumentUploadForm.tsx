import { useState, useEffect, useRef } from "react"
import { createClient } from "@supabase/supabase-js"

// ============================================================================
// MONARCH COMPETENCY — DOCUMENT UPLOAD
// ============================================================================
// Standalone Framer code component for /submit-referrals/documents
// Requires authenticated login. After auth, goes directly to referral
// code + email verification, then file upload flow.
// ============================================================================

const supabase = createClient(
    "https://esbmnympligtknhtkary.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzYm1ueW1wbGlndGtuaHRrYXJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MjY5NzcsImV4cCI6MjA4MTAwMjk3N30.TeHhOnsUuAzSx9q5z1VMYHnAWlL63QKxVIRKNeRCRbk"
)
const FORM_REDIRECT_URL = "https://monarchy.framer.website/submit-referrals/documents"
const LOGO_URL = "https://esbmnympligtknhtkary.supabase.co/storage/v1/object/public/assets/monarch-logo.png"

// ============================================================================
// COLORS (Matching geometric/minimal design system)
// ============================================================================
const C = {
    ash: "#2B2828",
    gunmetal: "#45434c",
    stoneCloud: "#4F666A",
    moonstone: "#7EACB5",
    tangerine: "#FFA089",
    coconut: "#E9EDF6",
    shell: "#F8F6F1",
    white: "#FFFFFF",
    success: "#166534",
    successBg: "#d1fae5",
    error: "#991B1B",
    errorBg: "#fee2e2",
    warningBg: "#FFF7ED",
    warningBorder: "#FED7AA",
    warningText: "#9A3412",
    infoBg: "#EFF6FF",
    infoBorder: "#BFDBFE",
    infoText: "#1E40AF",
    border: "#CBD5E1",
    borderLight: "#E2E8F0",
    textMuted: "#64748b",
}

// ============================================================================
// FILE UPLOAD DOCUMENT TYPES
// ============================================================================
const DOCUMENT_TYPE_OPTIONS = [
    { value: "valid_co_id", label: "Valid CO ID" },
    { value: "expired_co_id", label: "Expired CO ID" },
    { value: "out_of_state_id", label: "Out-of-State ID" },
    { value: "social_security_card", label: "Social Security Card" },
    { value: "birth_certificate", label: "Birth Certificate" },
    { value: "insurance_cards", label: "Insurance Card(s)" },
    { value: "court_order", label: "Court Order / Competency Order" },
    { value: "competency_eval_report", label: "Competency Eval Report" },
    { value: "psychiatric_records", label: "Psychiatric Records" },
    { value: "medical_records", label: "Medical Records" },
    { value: "medication_list", label: "Medication List (MAR)" },
    { value: "signed_roi", label: "Signed ROI(s)" },
    { value: "other", label: "Other" },
]

// ============================================================================
// ACCEPTED FILE TYPES
// ============================================================================
const ACCEPTED_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ACCEPTED_EXTENSIONS = ".pdf,.jpg,.jpeg,.png,.doc,.docx"

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function DocumentUploadForm() {
    const [step, setStep] = useState<"verify" | "upload" | "success">("verify")
    const [referralCode, setReferralCode] = useState("")
    const [email, setEmail] = useState("")
    const [isVerifying, setIsVerifying] = useState(false)
    const [verifyError, setVerifyError] = useState("")
    const [referralSummary, setReferralSummary] = useState<any>(null)
    const [referralId, setReferralId] = useState("")
    const [fileEntries, setFileEntries] = useState<{ file: File; documentType: string }[]>([])
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState("")
    const [uploadError, setUploadError] = useState("")
    const [uploadedCount, setUploadedCount] = useState(0)
    const [isMobile, setIsMobile] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Auth state
    const [authStatus, setAuthStatus] = useState<"checking" | "authenticated" | "unauthenticated">("checking")
    const [userEmail, setUserEmail] = useState("")
    const [showMagicLink, setShowMagicLink] = useState(false)
    const [magicLinkEmail, setMagicLinkEmail] = useState("")
    const [magicLinkSent, setMagicLinkSent] = useState(false)
    const [authError, setAuthError] = useState("")

    // Auth check on mount
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.user) {
                setAuthStatus("authenticated")
                const em = session.user.email || ""
                setUserEmail(em)
                setEmail(em) // Auto-fill for verify step
            } else {
                setAuthStatus("unauthenticated")
            }
        }
        checkSession()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setAuthStatus("authenticated")
                const em = session.user.email || ""
                setUserEmail(em)
                setEmail(em)
            } else {
                setAuthStatus("unauthenticated")
                setUserEmail("")
            }
        })
        return () => subscription.unsubscribe()
    }, [])

    // Responsive
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 810)
        check()
        window.addEventListener("resize", check)
        return () => window.removeEventListener("resize", check)
    }, [])

    // Check URL params for pre-filled code
    useEffect(() => {
        try {
            const params = new URLSearchParams(window.location.search)
            const code = params.get("code")
            if (code) setReferralCode(code.toUpperCase())
        } catch (e) {
            // Ignore — may not have window.location in Framer preview
        }
    }, [])

    // ========================================================================
    // AUTH HANDLERS
    // ========================================================================
    const handleGoogleLogin = async () => {
        setAuthError("")
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: FORM_REDIRECT_URL },
        })
        if (error) setAuthError(error.message)
    }

    const handleMagicLink = async () => {
        setAuthError("")
        if (!magicLinkEmail || !magicLinkEmail.includes("@")) {
            setAuthError("Please enter a valid email address.")
            return
        }
        const { error } = await supabase.auth.signInWithOtp({
            email: magicLinkEmail,
            options: { emailRedirectTo: FORM_REDIRECT_URL },
        })
        if (error) {
            setAuthError(error.message)
        } else {
            setMagicLinkSent(true)
        }
    }

    // ========================================================================
    // VERIFY REFERRAL CODE + EMAIL
    // ========================================================================
    const handleVerify = async () => {
        setIsVerifying(true)
        setVerifyError("")

        const trimmedCode = referralCode.trim().toUpperCase()
        const trimmedEmail = email.trim().toLowerCase()

        if (!trimmedCode || !trimmedEmail) {
            setVerifyError("Please enter both your referral code and email address.")
            setIsVerifying(false)
            return
        }

        try {
            const { data, error } = await supabase
                .from("referral_submissions")
                .select("id, referral_code, referral_source_email, client_first_name, client_last_name, client_dob, uploaded_documents")
                .eq("referral_code", trimmedCode)
                .single()

            if (error || !data) {
                setVerifyError("Referral code not found. Please check your code and try again.")
                setIsVerifying(false)
                return
            }

            // Verify email matches
            if (data.referral_source_email?.toLowerCase() !== trimmedEmail) {
                setVerifyError(
                    "Email address does not match the referral record. Please use the email you submitted the referral with."
                )
                setIsVerifying(false)
                return
            }

            // Create minimal summary (no PHI — just initials + DOB)
            const initials = `${(data.client_first_name || "?")[0]}. ${(data.client_last_name || "?")[0]}.`
            const dob = data.client_dob || "Not provided"

            setReferralSummary({ initials, dob })
            setReferralId(data.id)
            setStep("upload")
        } catch (err) {
            setVerifyError("An error occurred. Please try again.")
        } finally {
            setIsVerifying(false)
        }
    }

    // ========================================================================
    // FILE HANDLING
    // ========================================================================
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return
        const newFiles = Array.from(e.target.files)
        const valid: { file: File; documentType: string }[] = []
        const errors: string[] = []

        newFiles.forEach((file) => {
            if (!ACCEPTED_TYPES.includes(file.type)) {
                errors.push(`${file.name}: Unsupported file type`)
            } else if (file.size > MAX_FILE_SIZE) {
                errors.push(`${file.name}: File too large (max 10MB)`)
            } else {
                valid.push({ file, documentType: "other" })
            }
        })

        if (errors.length > 0) {
            setUploadError(errors.join(". "))
        } else {
            setUploadError("")
        }

        setFileEntries((prev) => [...prev, ...valid])
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    const removeFile = (index: number) => {
        setFileEntries((prev) => prev.filter((_, i) => i !== index))
    }

    const updateFileType = (index: number, type: string) => {
        setFileEntries((prev) => {
            const updated = [...prev]
            updated[index] = { ...updated[index], documentType: type }
            return updated
        })
    }

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    // ========================================================================
    // UPLOAD FILES
    // ========================================================================
    const handleUpload = async () => {
        if (fileEntries.length === 0) {
            setUploadError("Please select at least one file to upload.")
            return
        }

        setIsUploading(true)
        setUploadError("")
        setUploadProgress("Uploading...")

        try {
            const uploadedDocs: any[] = []
            let successCount = 0

            for (let i = 0; i < fileEntries.length; i++) {
                const { file, documentType } = fileEntries[i]
                setUploadProgress(`Uploading ${i + 1} of ${fileEntries.length}: ${file.name}`)

                const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
                const storagePath = `referrals/${referralId}/${timestamp}_${file.name}`

                const { error: uploadError } = await supabase.storage
                    .from("referral-documents")
                    .upload(storagePath, file, {
                        cacheControl: "3600",
                        upsert: false,
                    })

                if (uploadError) {
                    console.error(`Upload error for ${file.name}:`, uploadError)
                    setUploadError(`Failed to upload ${file.name}: ${uploadError.message}`)
                    continue
                }

                uploadedDocs.push({
                    filename: file.name,
                    storage_path: storagePath,
                    file_size: file.size,
                    mime_type: file.type,
                    uploaded_at: new Date().toISOString(),
                    document_type: documentType,
                })
                successCount++
            }

            if (uploadedDocs.length > 0) {
                // Fetch existing uploaded_documents and merge
                const { data: existing } = await supabase
                    .from("referral_submissions")
                    .select("uploaded_documents")
                    .eq("id", referralId)
                    .single()

                const existingDocs = existing?.uploaded_documents || []
                const allDocs = [...existingDocs, ...uploadedDocs]

                const { error: updateError } = await supabase
                    .from("referral_submissions")
                    .update({ uploaded_documents: allDocs })
                    .eq("id", referralId)

                if (updateError) {
                    setUploadError("Files uploaded but failed to update record. Please contact support.")
                } else {
                    setUploadedCount(successCount)
                    setStep("success")
                }
            }
        } catch (err) {
            setUploadError("An unexpected error occurred during upload. Please try again.")
        } finally {
            setIsUploading(false)
            setUploadProgress("")
        }
    }

    // ========================================================================
    // STYLES
    // ========================================================================
    const inputStyle: React.CSSProperties = {
        width: "100%",
        padding: "12px",
        fontSize: "16px",
        border: `1px solid ${C.border}`,
        borderRadius: "0px",
        backgroundColor: C.shell,
        color: C.ash,
        boxSizing: "border-box",
        fontFamily: "system-ui, -apple-system, sans-serif",
    }

    const labelStyle: React.CSSProperties = {
        display: "block",
        marginBottom: "6px",
        fontWeight: "600",
        fontSize: "14px",
        letterSpacing: "0.02em",
        color: C.ash,
    }

    // ========================================================================
    // RENDER — AUTH GATE
    // ========================================================================
    if (authStatus === "checking") {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
                <p style={{ color: C.textMuted, fontSize: "16px" }}>Loading...</p>
            </div>
        )
    }

    if (authStatus === "unauthenticated") {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", padding: "20px" }}>
                <div
                    style={{
                        width: "100%",
                        maxWidth: "400px",
                        padding: "40px 32px",
                        backgroundColor: C.white,
                        border: `1px solid ${C.borderLight}`,
                        borderRadius: "0px",
                        textAlign: "center",
                    }}
                >
                    <img
                        src={LOGO_URL}
                        alt="Monarch Competency"
                        style={{
                            maxWidth: "220px",
                            height: "auto",
                            margin: "0 auto 24px auto",
                            display: "block",
                        }}
                    />

                    <p style={{ fontSize: "14px", color: C.textMuted, marginBottom: "24px", lineHeight: "1.5" }}>
                        Sign in to upload documents for existing referrals
                    </p>

                    {authError && (
                        <div style={{ padding: "10px 14px", backgroundColor: C.errorBg, color: C.error, borderRadius: "0px", marginBottom: "16px", fontSize: "13px" }}>
                            {authError}
                        </div>
                    )}

                    {!showMagicLink && !magicLinkSent && (
                        <>
                            <button
                                onClick={handleGoogleLogin}
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    fontSize: "15px",
                                    fontWeight: "600",
                                    color: C.ash,
                                    backgroundColor: C.white,
                                    border: `1px solid ${C.border}`,
                                    borderRadius: "0px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "10px",
                                    marginBottom: "16px",
                                }}
                            >
                                <svg width="18" height="18" viewBox="0 0 48 48">
                                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                                </svg>
                                Sign in with Google
                            </button>

                            <div style={{ display: "flex", alignItems: "center", margin: "16px 0", gap: "12px" }}>
                                <div style={{ flex: 1, height: "1px", backgroundColor: C.borderLight }} />
                                <span style={{ fontSize: "12px", color: C.textMuted, fontWeight: "500" }}>or</span>
                                <div style={{ flex: 1, height: "1px", backgroundColor: C.borderLight }} />
                            </div>

                            <button
                                onClick={() => setShowMagicLink(true)}
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    fontSize: "15px",
                                    fontWeight: "600",
                                    color: C.ash,
                                    backgroundColor: "transparent",
                                    border: `2px solid ${C.ash}`,
                                    borderRadius: "0px",
                                    cursor: "pointer",
                                }}
                            >
                                Continue with Email
                            </button>
                        </>
                    )}

                    {showMagicLink && !magicLinkSent && (
                        <div>
                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={magicLinkEmail}
                                onChange={(e) => setMagicLinkEmail(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleMagicLink()}
                                style={{ ...inputStyle, marginBottom: "12px" }}
                            />
                            <button
                                onClick={handleMagicLink}
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    fontSize: "15px",
                                    fontWeight: "600",
                                    color: C.shell,
                                    backgroundColor: C.ash,
                                    border: "none",
                                    borderRadius: "0px",
                                    cursor: "pointer",
                                    marginBottom: "12px",
                                }}
                            >
                                Send Magic Link
                            </button>
                            <button
                                onClick={() => { setShowMagicLink(false); setAuthError("") }}
                                style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: "13px" }}
                            >
                                Back to sign in options
                            </button>
                        </div>
                    )}

                    {magicLinkSent && (
                        <div style={{ padding: "20px", backgroundColor: C.successBg, borderRadius: "0px" }}>
                            <p style={{ fontSize: "15px", fontWeight: "600", color: C.success, marginBottom: "8px" }}>
                                Check your email
                            </p>
                            <p style={{ fontSize: "14px", color: C.success }}>
                                We sent a sign-in link to <strong>{magicLinkEmail}</strong>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    // ========================================================================
    // RENDER — MAIN CONTENT (Authenticated)
    // ========================================================================
    return (
        <div
            style={{
                padding: isMobile ? "20px" : "40px",
                maxWidth: "600px",
                margin: "0 auto",
            }}
        >
            {/* ============================================================ */}
            {/* STEP 1: VERIFY CODE + EMAIL                                  */}
            {/* ============================================================ */}
            {step === "verify" && (
                <div>
                    <button
                        onClick={() => {
                            try { window.location.href = "https://monarchy.framer.website/submit-referrals" } catch (_e) {}
                        }}
                        style={{
                            background: "none",
                            border: "none",
                            color: C.textMuted,
                            fontSize: "14px",
                            fontWeight: "500",
                            cursor: "pointer",
                            padding: "0",
                            marginBottom: "16px",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            fontFamily: "inherit",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = C.ash }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = C.textMuted }}
                    >
                        {"\u2190"} Back to Referral Portal
                    </button>
                    <h1
                        style={{
                            color: C.ash,
                            fontSize: isMobile ? "22px" : "28px",
                            fontWeight: "700",
                            marginBottom: "8px",
                            letterSpacing: "0.02em",
                        }}
                    >
                        Upload Documents
                    </h1>
                    <p
                        style={{
                            color: C.textMuted,
                            fontSize: "15px",
                            marginBottom: "32px",
                            lineHeight: "1.5",
                        }}
                    >
                        Enter your referral code and email address to upload documents.
                    </p>

                    <div
                        style={{
                            backgroundColor: C.infoBg,
                            border: `1px solid ${C.infoBorder}`,
                            borderRadius: "0px",
                            padding: "16px",
                            marginBottom: "24px",
                            fontSize: "14px",
                            color: C.infoText,
                            lineHeight: "1.5",
                        }}
                    >
                        Enter the referral code you received when you submitted your
                        referral, along with the email address you used.
                    </div>

                    <div style={{ marginBottom: "20px" }}>
                        <label style={labelStyle}>Referral Code</label>
                        <input
                            type="text"
                            value={referralCode}
                            onChange={(e) =>
                                setReferralCode(e.target.value.toUpperCase())
                            }
                            placeholder="e.g., MON-A4K7"
                            style={{
                                ...inputStyle,
                                fontSize: "20px",
                                fontFamily: "monospace",
                                letterSpacing: "0.1em",
                                textAlign: "center",
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: "20px" }}>
                        <label style={labelStyle}>Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="The email used for the referral"
                            style={inputStyle}
                        />
                    </div>

                    {verifyError && (
                        <div
                            style={{
                                padding: "12px 16px",
                                backgroundColor: C.errorBg,
                                color: C.error,
                                borderRadius: "0px",
                                marginBottom: "16px",
                                fontSize: "14px",
                            }}
                        >
                            {verifyError}
                        </div>
                    )}

                    <button
                        onClick={handleVerify}
                        disabled={isVerifying}
                        style={{
                            width: "100%",
                            padding: "14px",
                            fontSize: "16px",
                            fontWeight: "700",
                            color: C.shell,
                            backgroundColor: isVerifying ? C.textMuted : C.ash,
                            border: "none",
                            borderRadius: "0px",
                            cursor: isVerifying ? "not-allowed" : "pointer",
                            letterSpacing: "0.02em",
                            marginBottom: "12px",
                        }}
                    >
                        {isVerifying ? "Verifying..." : "Verify & Continue"}
                    </button>

                </div>
            )}

            {/* ============================================================ */}
            {/* STEP 2: UPLOAD FILES                                         */}
            {/* ============================================================ */}
            {step === "upload" && (
                <div>
                    <h1
                        style={{
                            color: C.ash,
                            fontSize: isMobile ? "22px" : "28px",
                            fontWeight: "700",
                            marginBottom: "24px",
                            letterSpacing: "0.02em",
                        }}
                    >
                        Upload Documents
                    </h1>

                    {/* Referral Summary */}
                    <div
                        style={{
                            backgroundColor: C.shell,
                            border: `1px solid ${C.borderLight}`,
                            borderRadius: "0px",
                            padding: "16px",
                            marginBottom: "24px",
                        }}
                    >
                        <p
                            style={{
                                fontSize: "12px",
                                color: C.textMuted,
                                marginBottom: "4px",
                                letterSpacing: "0.04em",
                                textTransform: "uppercase",
                                fontWeight: "600",
                            }}
                        >
                            Uploading for Referral
                        </p>
                        <p
                            style={{
                                fontSize: "18px",
                                fontWeight: "700",
                                color: C.ash,
                                marginBottom: "4px",
                                fontFamily: "monospace",
                                letterSpacing: "0.05em",
                            }}
                        >
                            {referralCode}
                        </p>
                        {referralSummary && (
                            <p style={{ fontSize: "14px", color: C.textMuted, margin: 0 }}>
                                Client: {referralSummary.initials} — DOB: {referralSummary.dob}
                            </p>
                        )}
                    </div>

                    {/* Drop Zone */}
                    <div
                        style={{
                            border: `2px dashed ${C.border}`,
                            borderRadius: "0px",
                            padding: "32px 20px",
                            textAlign: "center",
                            backgroundColor: C.shell,
                            marginBottom: "16px",
                            cursor: "pointer",
                        }}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <p
                            style={{
                                fontSize: "16px",
                                color: C.ash,
                                fontWeight: "600",
                                marginBottom: "8px",
                            }}
                        >
                            Click to select files
                        </p>
                        <p style={{ fontSize: "13px", color: C.textMuted, margin: 0 }}>
                            PDF, JPG, PNG, DOC, DOCX — Max 10MB per file
                        </p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept={ACCEPTED_EXTENSIONS}
                            onChange={handleFileSelect}
                            style={{ display: "none" }}
                        />
                    </div>

                    {/* File List with Document Type */}
                    {fileEntries.length > 0 && (
                        <div style={{ marginBottom: "20px" }}>
                            <p
                                style={{
                                    fontSize: "13px",
                                    color: C.textMuted,
                                    marginBottom: "8px",
                                    fontWeight: "600",
                                    letterSpacing: "0.04em",
                                    textTransform: "uppercase",
                                }}
                            >
                                Selected Files ({fileEntries.length})
                            </p>
                            {fileEntries.map((entry, index) => (
                                <div
                                    key={index}
                                    style={{
                                        padding: "12px",
                                        backgroundColor: C.coconut,
                                        borderRadius: "0px",
                                        marginBottom: "6px",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            marginBottom: "8px",
                                        }}
                                    >
                                        <div>
                                            <span style={{ fontSize: "14px", fontWeight: "500", color: C.ash }}>
                                                {entry.file.name}
                                            </span>
                                            <span style={{ fontSize: "12px", color: C.textMuted, marginLeft: "8px" }}>
                                                ({formatFileSize(entry.file.size)})
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => removeFile(index)}
                                            style={{
                                                background: "none",
                                                border: "none",
                                                color: C.error,
                                                cursor: "pointer",
                                                fontSize: "13px",
                                                fontWeight: "600",
                                            }}
                                        >
                                            REMOVE
                                        </button>
                                    </div>
                                    <select
                                        value={entry.documentType}
                                        onChange={(e) => updateFileType(index, e.target.value)}
                                        style={{
                                            width: "100%",
                                            padding: "8px",
                                            fontSize: "14px",
                                            border: `1px solid ${C.border}`,
                                            borderRadius: "0px",
                                            backgroundColor: C.white,
                                            color: C.ash,
                                        }}
                                    >
                                        {DOCUMENT_TYPE_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Upload Progress */}
                    {uploadProgress && (
                        <p
                            style={{
                                fontSize: "14px",
                                color: C.ash,
                                marginBottom: "12px",
                                fontWeight: "500",
                            }}
                        >
                            {uploadProgress}
                        </p>
                    )}

                    {/* Error */}
                    {uploadError && (
                        <div
                            style={{
                                padding: "12px 16px",
                                backgroundColor: C.errorBg,
                                color: C.error,
                                borderRadius: "0px",
                                marginBottom: "16px",
                                fontSize: "14px",
                            }}
                        >
                            {uploadError}
                        </div>
                    )}

                    {/* Actions */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginTop: "24px",
                        }}
                    >
                        <button
                            onClick={() => {
                                setStep("verify")
                                setFileEntries([])
                                setUploadError("")
                            }}
                            style={{
                                padding: "12px 24px",
                                fontSize: "16px",
                                fontWeight: "600",
                                color: C.ash,
                                backgroundColor: "transparent",
                                border: `2px solid ${C.ash}`,
                                borderRadius: "0px",
                                cursor: "pointer",
                            }}
                        >
                            ← Back
                        </button>
                        <button
                            onClick={handleUpload}
                            disabled={isUploading || fileEntries.length === 0}
                            style={{
                                padding: "14px 32px",
                                fontSize: "16px",
                                fontWeight: "700",
                                color: C.shell,
                                backgroundColor:
                                    isUploading || fileEntries.length === 0
                                        ? C.textMuted
                                        : C.ash,
                                border: "none",
                                borderRadius: "0px",
                                cursor:
                                    isUploading || fileEntries.length === 0
                                        ? "not-allowed"
                                        : "pointer",
                                letterSpacing: "0.02em",
                            }}
                        >
                            {isUploading ? "Uploading..." : `Upload ${fileEntries.length} File${fileEntries.length !== 1 ? "s" : ""}`}
                        </button>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* STEP 3: SUCCESS                                              */}
            {/* ============================================================ */}
            {step === "success" && (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                    <div
                        style={{
                            width: "64px",
                            height: "64px",
                            backgroundColor: C.successBg,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 24px auto",
                            fontSize: "28px",
                        }}
                    >
                        ✓
                    </div>

                    <h2
                        style={{
                            fontSize: "24px",
                            fontWeight: "700",
                            color: C.success,
                            marginBottom: "12px",
                        }}
                    >
                        Documents Uploaded Successfully
                    </h2>

                    <p
                        style={{
                            fontSize: "16px",
                            color: C.textMuted,
                            marginBottom: "8px",
                        }}
                    >
                        {uploadedCount} document{uploadedCount !== 1 ? "s" : ""} uploaded
                        for referral{" "}
                        <strong style={{ fontFamily: "monospace", color: C.ash }}>
                            {referralCode}
                        </strong>
                    </p>

                    <p
                        style={{
                            fontSize: "14px",
                            color: C.textMuted,
                            marginBottom: "32px",
                        }}
                    >
                        Our admissions team will be notified of the new documents.
                    </p>

                    <div
                        style={{
                            display: "flex",
                            gap: "12px",
                            justifyContent: "center",
                            flexWrap: "wrap",
                        }}
                    >
                        <button
                            onClick={() => {
                                setFileEntries([])
                                setUploadError("")
                                setStep("upload")
                            }}
                            style={{
                                padding: "12px 24px",
                                fontSize: "15px",
                                fontWeight: "600",
                                color: C.ash,
                                backgroundColor: "transparent",
                                border: `2px solid ${C.ash}`,
                                borderRadius: "0px",
                                cursor: "pointer",
                            }}
                        >
                            Upload More Documents
                        </button>
                        <button
                            onClick={() => {
                                setStep("verify")
                                setReferralCode("")
                                setEmail(userEmail)
                                setFileEntries([])
                                setReferralSummary(null)
                                setReferralId("")
                                setUploadedCount(0)
                                setUploadError("")
                            }}
                            style={{
                                padding: "12px 24px",
                                fontSize: "15px",
                                fontWeight: "600",
                                color: C.textMuted,
                                backgroundColor: "transparent",
                                border: `1px solid ${C.border}`,
                                borderRadius: "0px",
                                cursor: "pointer",
                            }}
                        >
                            Different Referral
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
