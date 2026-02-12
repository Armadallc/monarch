import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
    "https://esbmnympligtknhtkary.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzYm1ueW1wbGlndGtuaHRrYXJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MjY5NzcsImV4cCI6MjA4MTAwMjk3N30.TeHhOnsUuAzSx9q5z1VMYHnAWlL63QKxVIRKNeRCRbk"
)

// ============================================================================
// DESIGN SYSTEM — Monarch 2025
// ============================================================================

const COLORS = {
    ash: "#2B2828",
    ashMuted: "#2B282880",
    ashSubtle: "#2B282820",
    gunmetal: "#45434c",
    stoneCloud: "#4F666A",
    moonstone: "#7EACB5",
    tangerine: "#FFA089",
    tangerineLight: "#FFA08930",
    coconut: "#E9EDF6",
    coconut25: "rgba(233, 237, 246, 0.25)",
    shell: "#F8F6F1",
    white: "#FFFFFF",
    green: "#d1fae5",
    greenText: "#059669",
    redText: "#c0392b",
} as const

const FONT = `"Montserrat", sans-serif`

// ============================================================================
// INITIAL FORM STATE
// ============================================================================

const initialFormState = {
    inquiry_type: "",
    referral_source_name: "",
    referral_source_phone: "",
    referral_source_email: "",
    referral_source_relationship: "",
    referral_source_organization: "",
    referral_source_title: "",
    client_first_name: "",
    client_last_initial: "",
    client_approximate_age: "",
    client_current_location: "",
    situation_notes: "",
    how_heard_about_us: "",
}

// ============================================================================
// STEP INDICATOR
// ============================================================================

const StepIndicator = ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => (
    <div style={{ display: "flex", gap: "6px", marginBottom: "40px" }}>
        {Array.from({ length: totalSteps }, (_, i) => (
            <div key={i} style={{
                flex: 1, height: "2px",
                background: i <= currentStep ? COLORS.ash : COLORS.ashSubtle,
                transition: "background 0.3s ease",
            }} />
        ))}
    </div>
)

// ============================================================================
// MAIN FORM COMPONENT
// ============================================================================

export default function PublicInquiryForm() {
    const [formData, setFormData] = useState(initialFormState)
    const [currentStep, setCurrentStep] = useState(0)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitStatus, setSubmitStatus] = useState("idle")
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        if (!document.getElementById("montserrat-font")) {
            const link = document.createElement("link")
            link.id = "montserrat-font"
            link.rel = "stylesheet"
            link.href = "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap"
            document.head.appendChild(link)
        }
        const checkWidth = () => setIsMobile(window.innerWidth < 640)
        checkWidth()
        window.addEventListener("resize", checkWidth)
        return () => window.removeEventListener("resize", checkWidth)
    }, [])

    // ---- Responsive style helpers ----
    const labelStyle: React.CSSProperties = {
        display: "block",
        marginBottom: "8px",
        fontSize: "12px",
        fontWeight: 600,
        fontFamily: FONT,
        color: COLORS.ash,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
    }

    const inputStyle: React.CSSProperties = {
        width: "100%",
        padding: isMobile ? "12px 14px" : "14px 18px",
        fontSize: isMobile ? "14px" : "15px",
        fontFamily: FONT,
        color: COLORS.ash,
        border: `1px solid ${COLORS.ashSubtle}`,
        borderRadius: "0px",
        background: COLORS.white,
        outline: "none",
        transition: "border-color 0.2s ease",
        boxSizing: "border-box" as const,
        letterSpacing: "-0.01em",
    }

    const selectStyle: React.CSSProperties = {
        ...inputStyle,
        appearance: "none" as const,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%232B2828' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 16px center",
        paddingRight: "40px",
    }

    const textareaStyle: React.CSSProperties = {
        ...inputStyle,
        resize: "vertical" as const,
        lineHeight: "1.6",
    }

    const fieldGroup: React.CSSProperties = { marginBottom: "24px" }

    const btnBase: React.CSSProperties = {
        border: "none",
        borderRadius: "0px",
        cursor: "pointer",
        fontFamily: FONT,
        fontSize: isMobile ? "14px" : "15px",
        fontWeight: 600,
        letterSpacing: "-0.01em",
        transition: "all 0.2s ease",
        padding: isMobile ? "12px 24px" : "14px 32px",
    }

    const twoCol: React.CSSProperties = {
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
        gap: "16px",
    }

    // ---- Handlers ----
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        const digitsOnly = value.replace(/\D/g, "")
        const limited = digitsOnly.slice(0, 10)
        let formatted = limited
        if (limited.length >= 6) formatted = `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`
        else if (limited.length >= 3) formatted = `(${limited.slice(0, 3)}) ${limited.slice(3)}`
        else if (limited.length > 0) formatted = `(${limited}`
        setFormData((prev) => ({ ...prev, [name]: formatted }))
    }

    const resetForm = () => {
        setFormData(initialFormState)
        setCurrentStep(0)
        setSubmitStatus("idle")
    }

    const handleSubmit = async () => {
        setIsSubmitting(true)
        setSubmitStatus("idle")
        try {
            const cleanedData = { ...formData }
            if (cleanedData.referral_source_phone) {
                cleanedData.referral_source_phone = cleanedData.referral_source_phone.replace(/\D/g, "")
            }
            if (cleanedData.inquiry_type === "self") {
                cleanedData.client_first_name = cleanedData.referral_source_name.split(" ")[0]
                cleanedData.referral_source_relationship = "self"
            }
            const { data, error } = await supabase.from("referral_inquiries").insert([cleanedData]).select()
            if (error) throw error
            console.log("Success!", data)
            setSubmitStatus("success")
            setTimeout(() => resetForm(), 5000)
        } catch (error) {
            console.error("Error submitting form:", error)
            setSubmitStatus("error")
        } finally {
            setIsSubmitting(false)
        }
    }

    const isProfessionalRelationship = [
        "attorney", "court_staff", "probation_parole",
        "case_manager", "mental_health_professional", "medical_provider",
    ].includes(formData.referral_source_relationship)

    const totalSteps = formData.inquiry_type === "self" ? 2 : formData.inquiry_type === "other" ? 4 : 1
    const stepIndex = formData.inquiry_type === "self"
        ? currentStep
        : currentStep === 0 ? 0 : currentStep === 2 ? 1 : currentStep === 3 ? 2 : 0

    // ---- Nav buttons ----
    const BackButton = ({ onClick }: { onClick: () => void }) => (
        <button onClick={onClick} style={{ ...btnBase, background: "transparent", color: COLORS.ashMuted, border: `1px solid ${COLORS.ashSubtle}` }}>
            &larr; Back
        </button>
    )

    const NextButton = ({ onClick, label = "Next \u2192" }: { onClick: () => void; label?: string }) => (
        <button onClick={onClick} style={{ ...btnBase, background: COLORS.ash, color: COLORS.shell }}>
            {label}
        </button>
    )

    const SubmitButton = () => (
        <button onClick={handleSubmit} disabled={isSubmitting}
            style={{ ...btnBase, background: isSubmitting ? COLORS.ashSubtle : COLORS.ash, color: isSubmitting ? COLORS.ashMuted : COLORS.shell, cursor: isSubmitting ? "not-allowed" : "pointer" }}>
            {isSubmitting ? "Submitting..." : "Submit Inquiry"}
        </button>
    )

    // ---- Status messages ----
    const SuccessMessage = ({ message }: { message: string }) => (
        <div style={{ marginBottom: "24px", padding: "24px", borderLeft: `3px solid ${COLORS.greenText}`, background: COLORS.green }}>
            <div style={{ fontSize: "16px", fontWeight: 600, color: COLORS.greenText, fontFamily: FONT, marginBottom: "6px" }}>
                {message}
            </div>
            <p style={{ fontSize: "14px", color: COLORS.greenText, fontFamily: FONT, margin: "0 0 16px" }}>
                Someone from our admissions team will contact you within 24–48 hours.
            </p>
            <button onClick={resetForm} style={{ ...btnBase, background: "transparent", color: COLORS.greenText, padding: "8px 20px", fontSize: "13px", border: `1px solid ${COLORS.greenText}` }}>
                Submit Another Inquiry
            </button>
        </div>
    )

    const ErrorMessage = () => (
        <div style={{ marginBottom: "24px", padding: "14px 20px", borderLeft: `3px solid ${COLORS.tangerine}`, background: COLORS.tangerineLight, fontFamily: FONT, fontSize: "14px", color: COLORS.redText }}>
            Error submitting inquiry. Please try again or call us directly.
        </div>
    )

    return (
        <div style={{ fontFamily: FONT, padding: isMobile ? "32px 16px" : "48px 24px", maxWidth: "640px", margin: "0 auto", letterSpacing: "-0.02em" }}>
            {currentStep > 0 && <StepIndicator currentStep={stepIndex} totalSteps={totalSteps} />}

            {/* ============================================================ */}
            {/* Step 0: Self or Someone Else */}
            {/* ============================================================ */}
            {currentStep === 0 && (
                <div>
                    <h2 style={{ fontSize: isMobile ? "18px" : "20px", fontWeight: 600, marginBottom: "28px", color: COLORS.ash, fontFamily: FONT }}>
                        Is this inquiry for yourself?
                    </h2>

                    <button
                        onClick={() => { setFormData((prev) => ({ ...prev, inquiry_type: "self" })); setCurrentStep(1) }}
                        style={{
                            width: "100%", padding: isMobile ? "20px" : "24px 28px", marginBottom: "12px",
                            border: `1px solid ${COLORS.ashSubtle}`, borderRadius: "0px",
                            background: COLORS.white, cursor: "pointer", textAlign: "left",
                            transition: "all 0.2s ease",
                        }}
                        onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.borderColor = COLORS.ash }}
                        onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.borderColor = COLORS.ashSubtle }}
                    >
                        <div style={{ fontSize: isMobile ? "15px" : "16px", fontWeight: 600, color: COLORS.ash, fontFamily: FONT, marginBottom: "4px" }}>
                            Yes, I'm reaching out for myself
                        </div>
                        <div style={{ fontSize: "13px", color: COLORS.ashMuted, fontFamily: FONT }}>
                            I'd like to learn about services for my own situation
                        </div>
                    </button>

                    <button
                        onClick={() => { setFormData((prev) => ({ ...prev, inquiry_type: "other" })); setCurrentStep(2) }}
                        style={{
                            width: "100%", padding: isMobile ? "20px" : "24px 28px", marginBottom: "12px",
                            border: `1px solid ${COLORS.ashSubtle}`, borderRadius: "0px",
                            background: COLORS.white, cursor: "pointer", textAlign: "left",
                            transition: "all 0.2s ease",
                        }}
                        onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.borderColor = COLORS.ash }}
                        onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.borderColor = COLORS.ashSubtle }}
                    >
                        <div style={{ fontSize: isMobile ? "15px" : "16px", fontWeight: 600, color: COLORS.ash, fontFamily: FONT, marginBottom: "4px" }}>
                            No, I'm reaching out about someone else
                        </div>
                        <div style={{ fontSize: "13px", color: COLORS.ashMuted, fontFamily: FONT }}>
                            I'm a family member, friend, or professional referring someone
                        </div>
                    </button>

                    {/* Secure referral link — frosted glass */}
                    <div style={{
                        marginTop: "36px", padding: "20px 24px",
                        background: COLORS.coconut25,
                        backdropFilter: "blur(15px)",
                        WebkitBackdropFilter: "blur(15px)",
                        border: `1px solid ${COLORS.ashSubtle}`,
                    }}>
                        <p style={{ fontSize: "13px", color: COLORS.ash, fontFamily: FONT, margin: "0 0 4px", fontWeight: 600 }}>
                            Need to submit detailed client information?
                        </p>
                        <p style={{ fontSize: "13px", color: COLORS.ashMuted, fontFamily: FONT, margin: 0, lineHeight: "1.6" }}>
                            Professional referrals containing protected health information require a secure login.
                        </p>
                        <a href="/submit-referrals"
                            style={{
                                display: "inline-block", marginTop: "14px", padding: "10px 24px",
                                background: COLORS.ash, color: COLORS.coconut,
                                fontFamily: FONT, fontSize: "13px", fontWeight: 600,
                                textDecoration: "none", letterSpacing: "-0.01em",
                                transition: "opacity 0.2s ease",
                            }}
                            onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.85" }}
                            onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1" }}
                        >
                            Access Secure Form &rarr;
                        </a>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* Step 1: Self-Inquiry Form */}
            {/* ============================================================ */}
            {currentStep === 1 && (
                <div>
                    <h2 style={{ fontSize: isMobile ? "18px" : "20px", fontWeight: 600, marginBottom: "32px", color: COLORS.ash, fontFamily: FONT }}>
                        Tell us about yourself
                    </h2>

                    <div style={fieldGroup}>
                        <label style={labelStyle}>Your Name <span style={{ color: COLORS.tangerine }}>*</span></label>
                        <input type="text" name="referral_source_name" value={formData.referral_source_name} onChange={handleInputChange} style={inputStyle} />
                    </div>

                    <div style={twoCol}>
                        <div style={fieldGroup}>
                            <label style={labelStyle}>Phone <span style={{ color: COLORS.tangerine }}>*</span></label>
                            <input type="tel" name="referral_source_phone" value={formData.referral_source_phone} onChange={handlePhoneChange} placeholder="(555) 555-5555" style={inputStyle} />
                        </div>
                        <div style={fieldGroup}>
                            <label style={labelStyle}>Email <span style={{ color: COLORS.tangerine }}>*</span></label>
                            <input type="email" name="referral_source_email" value={formData.referral_source_email} onChange={handleInputChange} style={inputStyle} />
                        </div>
                    </div>

                    <div style={fieldGroup}>
                        <label style={labelStyle}>Your Approximate Age</label>
                        <input type="text" name="client_approximate_age" value={formData.client_approximate_age} onChange={handleInputChange} placeholder="e.g., 35, early 40s, late 20s" style={inputStyle} />
                    </div>

                    <div style={fieldGroup}>
                        <label style={labelStyle}>Tell us briefly about your situation</label>
                        <textarea name="situation_notes" value={formData.situation_notes} onChange={handleInputChange} rows={4} placeholder="What's going on and how can we help?" style={textareaStyle} />
                    </div>

                    <div style={fieldGroup}>
                        <label style={labelStyle}>How did you hear about Monarch?</label>
                        <input type="text" name="how_heard_about_us" value={formData.how_heard_about_us} onChange={handleInputChange} placeholder="Google, referral, social media, etc." style={inputStyle} />
                    </div>

                    {submitStatus === "success" && <SuccessMessage message="Thank you for reaching out!" />}
                    {submitStatus === "error" && <ErrorMessage />}

                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "40px", gap: "12px" }}>
                        <BackButton onClick={() => setCurrentStep(0)} />
                        <SubmitButton />
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* Step 2: About the Person Being Referred */}
            {/* ============================================================ */}
            {currentStep === 2 && (
                <div>
                    <h2 style={{ fontSize: isMobile ? "18px" : "20px", fontWeight: 600, marginBottom: "32px", color: COLORS.ash, fontFamily: FONT }}>
                        About the person you're referring
                    </h2>

                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 100px", gap: "16px" }}>
                        <div style={fieldGroup}>
                            <label style={labelStyle}>First Name <span style={{ color: COLORS.tangerine }}>*</span></label>
                            <input type="text" name="client_first_name" value={formData.client_first_name} onChange={handleInputChange} style={inputStyle} />
                        </div>
                        <div style={fieldGroup}>
                            <label style={labelStyle}>Last Initial <span style={{ color: COLORS.tangerine }}>*</span></label>
                            <input type="text" name="client_last_initial" value={formData.client_last_initial}
                                onChange={(e) => { const value = e.target.value.slice(0, 1).toUpperCase(); setFormData((prev) => ({ ...prev, client_last_initial: value })) }}
                                maxLength={1} placeholder="e.g., S" style={{ ...inputStyle, textTransform: "uppercase", textAlign: "center" }} />
                        </div>
                    </div>

                    <div style={fieldGroup}>
                        <label style={labelStyle}>Approximate Age</label>
                        <input type="text" name="client_approximate_age" value={formData.client_approximate_age} onChange={handleInputChange} placeholder="e.g., 35, early 40s, late 20s" style={inputStyle} />
                    </div>

                    <div style={fieldGroup}>
                        <label style={labelStyle}>Current Location <span style={{ color: COLORS.tangerine }}>*</span></label>
                        <select name="client_current_location" value={formData.client_current_location} onChange={handleInputChange} style={selectStyle}>
                            <option value="">Select location...</option>
                            <option value="community">Community (at home)</option>
                            <option value="jail">Jail / Detention Center</option>
                            <option value="hospital">Hospital</option>
                            <option value="treatment_facility">Treatment Facility</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div style={fieldGroup}>
                        <label style={labelStyle}>Brief background / reason for referral</label>
                        <textarea name="situation_notes" value={formData.situation_notes} onChange={handleInputChange} rows={4} placeholder="What's the situation? Why are you reaching out?" style={textareaStyle} />
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "40px", gap: "12px" }}>
                        <BackButton onClick={() => setCurrentStep(0)} />
                        <NextButton onClick={() => setCurrentStep(3)} />
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* Step 3: About You (Referral Source) */}
            {/* ============================================================ */}
            {currentStep === 3 && (
                <div>
                    <h2 style={{ fontSize: isMobile ? "18px" : "20px", fontWeight: 600, marginBottom: "32px", color: COLORS.ash, fontFamily: FONT }}>
                        About you
                    </h2>

                    <div style={fieldGroup}>
                        <label style={labelStyle}>Your Name <span style={{ color: COLORS.tangerine }}>*</span></label>
                        <input type="text" name="referral_source_name" value={formData.referral_source_name} onChange={handleInputChange} style={inputStyle} />
                    </div>

                    <div style={twoCol}>
                        <div style={fieldGroup}>
                            <label style={labelStyle}>Phone <span style={{ color: COLORS.tangerine }}>*</span></label>
                            <input type="tel" name="referral_source_phone" value={formData.referral_source_phone} onChange={handlePhoneChange} placeholder="(555) 555-5555" style={inputStyle} />
                        </div>
                        <div style={fieldGroup}>
                            <label style={labelStyle}>Email <span style={{ color: COLORS.tangerine }}>*</span></label>
                            <input type="email" name="referral_source_email" value={formData.referral_source_email} onChange={handleInputChange} style={inputStyle} />
                        </div>
                    </div>

                    <div style={fieldGroup}>
                        <label style={labelStyle}>Your relationship to this person <span style={{ color: COLORS.tangerine }}>*</span></label>
                        <select name="referral_source_relationship" value={formData.referral_source_relationship} onChange={handleInputChange} style={selectStyle}>
                            <option value="">Select relationship...</option>
                            <option value="family">Family Member</option>
                            <option value="friend">Friend</option>
                            <option value="attorney">Attorney / Legal Representative</option>
                            <option value="court_staff">Court Staff</option>
                            <option value="probation_parole">Probation / Parole Officer</option>
                            <option value="case_manager">Case Manager / Social Worker</option>
                            <option value="mental_health_professional">Mental Health Professional</option>
                            <option value="medical_provider">Medical Provider</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    {isProfessionalRelationship && (
                        <div style={twoCol}>
                            <div style={fieldGroup}>
                                <label style={labelStyle}>Organization</label>
                                <input type="text" name="referral_source_organization" value={formData.referral_source_organization} onChange={handleInputChange} placeholder="e.g., Denver County Court" style={inputStyle} />
                            </div>
                            <div style={fieldGroup}>
                                <label style={labelStyle}>Title / Role</label>
                                <input type="text" name="referral_source_title" value={formData.referral_source_title} onChange={handleInputChange} placeholder="e.g., Public Defender" style={inputStyle} />
                            </div>
                        </div>
                    )}

                    <div style={fieldGroup}>
                        <label style={labelStyle}>How did you hear about Monarch?</label>
                        <input type="text" name="how_heard_about_us" value={formData.how_heard_about_us} onChange={handleInputChange} placeholder="Google, colleague, previous referral, etc." style={inputStyle} />
                    </div>

                    {submitStatus === "success" && <SuccessMessage message="Thank you for your referral!" />}
                    {submitStatus === "error" && <ErrorMessage />}

                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "40px", gap: "12px" }}>
                        <BackButton onClick={() => setCurrentStep(2)} />
                        <SubmitButton />
                    </div>
                </div>
            )}
        </div>
    )
}
