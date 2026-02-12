import { useState, useEffect, useRef } from "react"
import { createClient } from "@supabase/supabase-js"

// ============================================================================
// INITIAL FORM STATE
// ============================================================================
const initialFormState = {
    // Step 0 — Source type
    referral_source_type: "",

    // Step 1 — Contact info
    referral_source_name: "",
    referral_source_email: "",
    referral_source_phone: "",
    referral_source_organization: "",
    referral_source_title: "",
    urgent_placement: false,
    can_provide_collateral: "",
    previous_monarch_referral: "",

    // Step 2 — Additional contacts
    emergency_contact_name: "",
    emergency_contact_relationship: "",
    emergency_contact_phone: "",
    emergency_contact_can_provide_info: false,
    additional_contacts: [] as any[],

    // Step 3 — Demographics
    client_first_name: "",
    client_middle_name: "",
    client_last_name: "",
    client_preferred_name: "",
    client_dob: "",
    client_ssn: "",
    client_gender: "",
    client_sex_at_birth: "",
    client_pronouns: "",
    client_primary_language: "",
    client_english_proficiency: "",
    interpreter_needed: false,
    client_ethnicity: "",
    client_marital_status: "",
    client_phone: "",
    client_email: "",
    client_consents_to_referral: "",

    // Step 4 — Documents
    documents_available: [] as string[],
    documents_notes: "",
    uploaded_documents: [] as any[],

    // Step 5 — Insurance & benefits
    medicaid_status: "",
    medicaid_id: "",
    medicaid_number: "",
    medicare_status: "",
    medicare_number: "",
    has_private_insurance: false,
    private_insurance_details: "",
    ssdi_status: "",
    benefits_notes: "",

    // Step 6 — Legal
    case_number: "",
    court_jurisdiction: "",
    judge_name: "",
    courtroom: "",
    next_court_date: "",
    charges: "",
    competency_status: "",
    competency_eval_date: "",
    competency_evaluator: "",
    attorney_name: "",
    attorney_phone: "",
    attorney_email: "",
    on_probation: false,
    probation_officer_contact: "",
    on_parole: false,
    parole_officer_contact: "",
    active_warrants: "",
    has_bond_holds: "",
    bond_holds_details: "",
    pr_bond_to_monarch: "",
    pr_bond_judge_contact: "",
    pr_bond_da_contact: "",
    pr_bond_other_contacts: "",

    // Step 7 — Location
    current_location_type: "",
    facility_name: "",
    facility_address: "",
    inmate_id: "",
    facility_contact_person: "",
    facility_contact_phone: "",
    currently_incarcerated: false,
    expected_release_date: "",
    housing_prior: "",
    housing_post_program: "",
    housing_notes: "",

    // Step 8 — Clinical
    current_diagnoses: "",
    medication_compliance: "",
    current_medications: "",
    medication_barriers: "",
    psychiatric_history: "",
    previous_treatment_programs: "",
    tbi_history: "",
    tbi_details: "",
    idd_status: "",
    idd_details: "",

    // Step 9 — Substance use
    substance_use_pattern: "",
    substance_use_current: "",
    substance_use_history: "",
    detox_required: "",
    detox_details: "",

    // Step 10 — Medical
    medical_conditions: "",
    medical_conditions_controlled: "",
    medications_non_psychiatric: "",
    medication_allergies: "",
    mobility_needs: "",
    adl_support_needed: false,
    adl_support_details: "",
    acute_medical_needs: "",

    // Step 11 — Safety & risk
    suicide_risk: "",
    suicide_risk_details: "",
    violence_risk: "",
    violence_risk_details: "",
    elopement_risk: "",
    elopement_risk_details: "",
    arson_history: "",
    arson_details: "",
    rso_status: "",
    rso_details: "",
    medical_needs: false,
    safety_notes: "",

    // Step 12 — Urgency & notes
    urgency_level: "",
    urgency_reason: "",
    additional_notes: "",
    referral_source_channel: "",

    // Legacy fields (kept for DB compat, dropped from form UI)
    medicaid_mco: "",
    expected_payer: "",
}

// ============================================================================
// EMPTY CONTACT TEMPLATE
// ============================================================================
const emptyContact = {
    name: "",
    organization: "",
    phone_email: "",
    role: "",
    can_provide_info: false,
}

// ============================================================================
// COLORADO JUDICIAL DISTRICTS
// ============================================================================
const CO_JUDICIAL_DISTRICTS = [
    "1st - Jefferson & Gilpin",
    "2nd - Denver",
    "3rd - Huerfano & Las Animas",
    "4th - El Paso & Teller",
    "5th - Clear Creek, Eagle, Lake, & Summit",
    "6th - Archuleta, La Plata, & San Juan",
    "7th - Delta, Gunnison, Hinsdale, Montrose, Ouray, & San Miguel",
    "8th - Jackson & Larimer",
    "9th - Garfield, Pitkin, & Rio Blanco",
    "10th - Pueblo",
    "11th - Chaffee, Custer, Fremont, & Park",
    "12th - Alamosa, Conejos, Costilla, Mineral, Rio Grande, & Saguache",
    "13th - Kit Carson, Logan, Morgan, Phillips, Sedgwick, Washington, & Yuma",
    "14th - Grand, Moffat, & Routt",
    "15th - Baca, Cheyenne, Kiowa, & Prowers",
    "16th - Bent, Crowley, & Otero",
    "17th - Adams & Broomfield",
    "18th - Arapahoe, Douglas, Elbert, & Lincoln",
    "19th - Weld",
    "20th - Boulder",
    "21st - Mesa",
    "22nd - Dolores & Montezuma",
]

// ============================================================================
// DOCUMENT TYPE OPTIONS
// ============================================================================
const DOCUMENT_OPTIONS = [
    { value: "valid_co_id", label: "Valid Colorado ID" },
    { value: "expired_co_id", label: "Expired Colorado ID" },
    { value: "out_of_state_id", label: "Out-of-State ID" },
    { value: "social_security_card", label: "Social Security Card" },
    { value: "birth_certificate", label: "Birth Certificate" },
    { value: "insurance_cards", label: "Insurance Card(s)" },
    { value: "court_order", label: "Court Order / Competency Order" },
    { value: "competency_eval", label: "Competency Evaluation Report" },
    { value: "psychiatric_records", label: "Psychiatric Records" },
    { value: "medical_records", label: "Medical Records" },
    { value: "medication_list", label: "Medication List (MAR)" },
    { value: "signed_roi", label: "Signed ROI(s)" },
    { value: "none_available", label: "None Available" },
]

// ============================================================================
// FILE UPLOAD DOCUMENT TYPES (for per-file labeling)
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

const ACCEPTED_FILE_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ACCEPTED_EXTENSIONS = ".pdf,.jpg,.jpeg,.png,.doc,.docx"

// ============================================================================
// STEP TITLES
// ============================================================================
const STEP_TITLES = [
    "Who is making this referral?",
    "Your Contact Information",
    "Additional Contacts",
    "Individual Being Referred — Demographics",
    "Documents & Identification",
    "Insurance & Benefits",
    "Legal Status & Court Information",
    "Current Location & Situation",
    "Mental Health & Clinical Information",
    "Substance Use History",
    "Medical & Somatic Information",
    "Safety & Risk Assessment",
    "Additional Notes & Urgency",
    "Review & Submit",
]

// ============================================================================
// SUPABASE CLIENT & REDIRECT
// ============================================================================
const supabase = createClient(
    "https://esbmnympligtknhtkary.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzYm1ueW1wbGlndGtuaHRrYXJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MjY5NzcsImV4cCI6MjA4MTAwMjk3N30.TeHhOnsUuAzSx9q5z1VMYHnAWlL63QKxVIRKNeRCRbk"
)
const FORM_REDIRECT_URL = "https://monarchy.framer.website/submit-referrals"

// ============================================================================
// COLORS (Geometric/Minimal Design System)
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
// SHARED STYLES
// ============================================================================
const S = {
    label: {
        display: "block",
        marginBottom: "6px",
        fontWeight: "600",
        fontSize: "14px",
        letterSpacing: "0.02em",
        color: C.ash,
    } as React.CSSProperties,
    input: {
        width: "100%",
        padding: "12px",
        fontSize: "16px",
        border: `1px solid ${C.border}`,
        borderRadius: "0px",
        backgroundColor: C.white,
        color: C.ash,
        boxSizing: "border-box" as const,
        fontFamily: "system-ui, -apple-system, sans-serif",
    } as React.CSSProperties,
    select: {
        width: "100%",
        padding: "12px",
        fontSize: "16px",
        border: `1px solid ${C.border}`,
        borderRadius: "0px",
        backgroundColor: C.white,
        color: C.ash,
        boxSizing: "border-box" as const,
    } as React.CSSProperties,
    textarea: {
        width: "100%",
        padding: "12px",
        fontSize: "16px",
        border: `1px solid ${C.border}`,
        borderRadius: "0px",
        backgroundColor: C.white,
        color: C.ash,
        fontFamily: "system-ui, -apple-system, sans-serif",
        boxSizing: "border-box" as const,
    } as React.CSSProperties,
    fieldGroup: {
        marginBottom: "20px",
    } as React.CSSProperties,
    sectionHeader: {
        fontSize: "16px",
        fontWeight: "700",
        color: C.stoneCloud,
        marginTop: "32px",
        marginBottom: "16px",
        paddingBottom: "8px",
        borderBottom: `2px solid ${C.moonstone}`,
        letterSpacing: "0.04em",
        textTransform: "uppercase" as const,
    } as React.CSSProperties,
    stepTitle: {
        fontSize: "22px",
        fontWeight: "700",
        marginBottom: "8px",
        color: C.ash,
    } as React.CSSProperties,
    stepDesc: {
        fontSize: "14px",
        color: C.textMuted,
        marginBottom: "24px",
    } as React.CSSProperties,
    callout: {
        padding: "16px",
        backgroundColor: C.infoBg,
        border: `1px solid ${C.infoBorder}`,
        borderRadius: "0px",
        marginBottom: "24px",
        fontSize: "14px",
        color: C.infoText,
        lineHeight: "1.5",
    } as React.CSSProperties,
    warningCallout: {
        padding: "16px",
        backgroundColor: C.warningBg,
        border: `1px solid ${C.warningBorder}`,
        borderRadius: "0px",
        marginBottom: "24px",
        fontSize: "14px",
        color: C.warningText,
        lineHeight: "1.5",
    } as React.CSSProperties,
    btnPrimary: {
        padding: "12px 24px",
        fontSize: "16px",
        fontWeight: "600",
        color: C.white,
        backgroundColor: C.stoneCloud,
        border: "none",
        borderRadius: "0px",
        cursor: "pointer",
        letterSpacing: "0.02em",
    } as React.CSSProperties,
    btnSecondary: {
        padding: "12px 24px",
        fontSize: "16px",
        fontWeight: "600",
        color: C.stoneCloud,
        backgroundColor: "transparent",
        border: `2px solid ${C.stoneCloud}`,
        borderRadius: "0px",
        cursor: "pointer",
    } as React.CSSProperties,
    btnSubmit: {
        padding: "14px 32px",
        fontSize: "16px",
        fontWeight: "700",
        color: C.white,
        backgroundColor: C.success,
        border: "none",
        borderRadius: "0px",
        cursor: "pointer",
        letterSpacing: "0.02em",
    } as React.CSSProperties,
    navRow: {
        display: "flex",
        justifyContent: "space-between",
        marginTop: "32px",
    } as React.CSSProperties,
    reviewBlock: {
        backgroundColor: C.shell,
        padding: "20px",
        borderRadius: "0px",
        marginBottom: "16px",
        border: `1px solid ${C.borderLight}`,
    } as React.CSSProperties,
    reviewTitle: {
        fontSize: "14px",
        fontWeight: "700",
        marginBottom: "12px",
        color: C.stoneCloud,
        letterSpacing: "0.04em",
        textTransform: "uppercase" as const,
    } as React.CSSProperties,
    checkboxRow: {
        display: "flex",
        alignItems: "center",
        cursor: "pointer",
        padding: "10px 12px",
        border: `1px solid ${C.borderLight}`,
        borderRadius: "0px",
        marginBottom: "8px",
    } as React.CSSProperties,
    checkboxInput: {
        marginRight: "10px",
        width: "18px",
        height: "18px",
        accentColor: C.stoneCloud,
    } as React.CSSProperties,
}

// ============================================================================
// FORMAT HELPERS
// ============================================================================
const fmt = (val: string) =>
    val
        ? val
              .replace(/_/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase())
        : ""

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function ReferralForm() {
    const [currentStep, setCurrentStep] = useState(0)
    const totalSteps = 13
    const [showFamilyForm, setShowFamilyForm] = useState(false)
    const [formData, setFormData] = useState(initialFormState)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitStatus, setSubmitStatus] = useState("idle")
    const [submittedReferralCode, setSubmittedReferralCode] = useState("")
    const [isMobile, setIsMobile] = useState(false)

    // Portal state
    const [showPortal, setShowPortal] = useState(true)

    // File upload state
    const [pendingFiles, setPendingFiles] = useState<{ file: File; documentType: string }[]>([])
    const [fileUploadError, setFileUploadError] = useState("")
    const [codeCopied, setCodeCopied] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Session timeout state
    const [sessionTimeLeft, setSessionTimeLeft] = useState<number | null>(null)

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
                const email = session.user.email || ""
                setUserEmail(email)
                setFormData((prev) => ({ ...prev, referral_source_email: email }))
            } else {
                setAuthStatus("unauthenticated")
            }
        }
        checkSession()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setAuthStatus("authenticated")
                const email = session.user.email || ""
                setUserEmail(email)
                setFormData((prev) => ({ ...prev, referral_source_email: email }))
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

    // 10-minute idle timeout after submission
    useEffect(() => {
        if (submitStatus !== "success") {
            setSessionTimeLeft(null)
            return
        }
        setSessionTimeLeft(600) // 10 minutes
        const interval = setInterval(() => {
            setSessionTimeLeft((prev) => {
                if (prev === null) return null
                if (prev <= 1) {
                    clearInterval(interval)
                    supabase.auth.signOut()
                    return 0
                }
                return prev - 1
            })
        }, 1000)
        return () => clearInterval(interval)
    }, [submitStatus])

    // ========================================================================
    // HANDLERS
    // ========================================================================
    const handleInputChange = (e: any) => {
        const { name, value, type, checked } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }))
    }

    const handlePhoneChange = (e: any) => {
        const { name, value } = e.target
        const digitsOnly = value.replace(/\D/g, "")
        const limited = digitsOnly.slice(0, 10)
        let formatted = limited
        if (limited.length >= 6) {
            formatted = `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`
        } else if (limited.length >= 3) {
            formatted = `(${limited.slice(0, 3)}) ${limited.slice(3)}`
        } else if (limited.length > 0) {
            formatted = `(${limited}`
        }
        setFormData((prev) => ({ ...prev, [name]: formatted }))
    }

    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
    }

    const handleEmailBlur = (e: any) => {
        const email = e.target.value
        if (email && !validateEmail(email)) {
            e.target.setCustomValidity("Please enter a valid email address (e.g., name@example.com)")
            e.target.reportValidity()
        } else {
            e.target.setCustomValidity("")
        }
    }

    // Document checkbox toggle
    const handleDocToggle = (docValue: string) => {
        setFormData((prev) => {
            const current = [...prev.documents_available]
            if (current.includes(docValue)) {
                return { ...prev, documents_available: current.filter((d) => d !== docValue) }
            } else {
                // If selecting "none_available", clear all others
                if (docValue === "none_available") {
                    return { ...prev, documents_available: ["none_available"] }
                }
                // If selecting anything else, remove "none_available"
                const filtered = current.filter((d) => d !== "none_available")
                return { ...prev, documents_available: [...filtered, docValue] }
            }
        })
    }

    // Additional contacts
    const addContact = () => {
        setFormData((prev) => ({
            ...prev,
            additional_contacts: [...prev.additional_contacts, { ...emptyContact }],
        }))
    }

    const updateContact = (index: number, field: string, value: any) => {
        setFormData((prev) => {
            const updated = [...prev.additional_contacts]
            updated[index] = { ...updated[index], [field]: value }
            return { ...prev, additional_contacts: updated }
        })
    }

    const removeContact = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            additional_contacts: prev.additional_contacts.filter((_, i) => i !== index),
        }))
    }

    // ========================================================================
    // FILE UPLOAD HELPERS
    // ========================================================================
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return
        const newFiles = Array.from(e.target.files)
        const valid: { file: File; documentType: string }[] = []
        const errors: string[] = []

        newFiles.forEach((file) => {
            if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
                errors.push(`${file.name}: Unsupported file type`)
            } else if (file.size > MAX_FILE_SIZE) {
                errors.push(`${file.name}: File too large (max 10MB)`)
            } else {
                valid.push({ file, documentType: "other" })
            }
        })

        if (errors.length > 0) {
            setFileUploadError(errors.join(". "))
        } else {
            setFileUploadError("")
        }

        setPendingFiles((prev) => [...prev, ...valid])
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    const removePendingFile = (index: number) => {
        setPendingFiles((prev) => prev.filter((_, i) => i !== index))
    }

    const updateFileType = (index: number, type: string) => {
        setPendingFiles((prev) => {
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

    const copyReferralCode = async () => {
        try {
            await navigator.clipboard.writeText(submittedReferralCode)
            setCodeCopied(true)
            setTimeout(() => setCodeCopied(false), 2000)
        } catch (_e) {
            // Fallback for older browsers
            const el = document.createElement("textarea")
            el.value = submittedReferralCode
            document.body.appendChild(el)
            el.select()
            document.execCommand("copy")
            document.body.removeChild(el)
            setCodeCopied(true)
            setTimeout(() => setCodeCopied(false), 2000)
        }
    }

    const handleSignOut = async () => {
        setSessionTimeLeft(null)
        await supabase.auth.signOut()
    }

    // ========================================================================
    // SUBMIT
    // ========================================================================
    const handleSubmit = async () => {
        setIsSubmitting(true)
        setSubmitStatus("idle")

        try {
            const isPriority = [
                "court",
                "legal_representative",
                "probation_parole",
                "mental_health_facility",
                "case_management",
                "other_professional",
            ].includes(formData.referral_source_type)

            const cleanedData: any = { ...formData }

            // Clean date fields — empty string → null
            const dateFields = [
                "client_dob",
                "competency_eval_date",
                "next_court_date",
                "expected_release_date",
            ]
            dateFields.forEach((field) => {
                if (cleanedData[field] === "") cleanedData[field] = null
            })

            // Clean jsonb text fields
            if (cleanedData.current_medications === "") cleanedData.current_medications = null

            // Ensure jsonb arrays are proper
            if (!Array.isArray(cleanedData.documents_available)) cleanedData.documents_available = []
            if (!Array.isArray(cleanedData.additional_contacts)) cleanedData.additional_contacts = []
            if (!Array.isArray(cleanedData.uploaded_documents)) cleanedData.uploaded_documents = []

            // Strip phone formatting before saving
            const phoneFields = [
                "referral_source_phone",
                "facility_contact_phone",
                "emergency_contact_phone",
                "attorney_phone",
                "client_phone",
            ]
            phoneFields.forEach((field) => {
                if (cleanedData[field]) {
                    cleanedData[field] = cleanedData[field].replace(/\D/g, "")
                }
            })

            // Remove local-only fields not in DB
            // (none currently, but placeholder for future)

            const { data, error } = await supabase
                .from("referral_submissions")
                .insert([
                    {
                        ...cleanedData,
                        is_priority_referral: isPriority,
                        status: "pending_review",
                    },
                ])
                .select()

            if (error) throw error

            console.log("Success!", data)
            const referralId = data?.[0]?.id
            const referralCode = data?.[0]?.referral_code

            // Capture the referral code from the returned data
            if (referralCode) {
                setSubmittedReferralCode(referralCode)
            }

            // Upload pending files to Supabase Storage
            if (pendingFiles.length > 0 && referralId) {
                const uploadedDocs: any[] = []
                const failedFiles: string[] = []

                for (let i = 0; i < pendingFiles.length; i++) {
                    const { file, documentType } = pendingFiles[i]
                    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
                    const storagePath = `referrals/${referralId}/${timestamp}_${file.name}`

                    const { error: uploadErr } = await supabase.storage
                        .from("referral-documents")
                        .upload(storagePath, file, {
                            cacheControl: "3600",
                            upsert: false,
                        })

                    if (uploadErr) {
                        console.error(`Upload error for ${file.name}:`, uploadErr)
                        failedFiles.push(file.name)
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
                }

                // Update the referral record with uploaded file metadata
                if (uploadedDocs.length > 0) {
                    const { error: updateErr } = await supabase
                        .from("referral_submissions")
                        .update({ uploaded_documents: uploadedDocs })
                        .eq("id", referralId)

                    if (updateErr) {
                        console.error("Failed to update uploaded_documents:", updateErr)
                    }
                }

                if (failedFiles.length > 0) {
                    setFileUploadError(
                        `Referral submitted successfully, but ${failedFiles.length} file(s) failed to upload: ${failedFiles.join(", ")}. You can re-upload using your referral code.`
                    )
                }
            }

            setSubmitStatus("success")
        } catch (error) {
            console.error("Error submitting form:", error)
            setSubmitStatus("error")
        } finally {
            setIsSubmitting(false)
        }
    }

    const resetForm = () => {
        setFormData({ ...initialFormState, referral_source_email: userEmail })
        setCurrentStep(0)
        setShowFamilyForm(false)
        setSubmitStatus("idle")
        setSubmittedReferralCode("")
        setPendingFiles([])
        setFileUploadError("")
        setCodeCopied(false)
        setShowPortal(true)
        setSessionTimeLeft(null)
    }

    // ========================================================================
    // RENDER HELPERS
    // ========================================================================
    const renderField = (
        label: string,
        name: string,
        type: string = "text",
        opts?: { placeholder?: string; rows?: number; options?: { value: string; label: string }[] }
    ) => {
        if (type === "select" && opts?.options) {
            return (
                <div style={S.fieldGroup}>
                    <label style={S.label}>{label}</label>
                    <select name={name} value={(formData as any)[name]} onChange={handleInputChange} style={S.select}>
                        <option value="">Select...</option>
                        {opts.options.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>
                </div>
            )
        }
        if (type === "textarea") {
            return (
                <div style={S.fieldGroup}>
                    <label style={S.label}>{label}</label>
                    <textarea
                        name={name}
                        value={(formData as any)[name]}
                        onChange={handleInputChange}
                        placeholder={opts?.placeholder || ""}
                        rows={opts?.rows || 3}
                        style={S.textarea}
                    />
                </div>
            )
        }
        if (type === "tel") {
            return (
                <div style={S.fieldGroup}>
                    <label style={S.label}>{label}</label>
                    <input
                        type="tel"
                        name={name}
                        value={(formData as any)[name]}
                        onChange={handlePhoneChange}
                        placeholder="(555) 555-5555"
                        style={S.input}
                    />
                </div>
            )
        }
        if (type === "email") {
            return (
                <div style={S.fieldGroup}>
                    <label style={S.label}>{label}</label>
                    <input
                        type="email"
                        name={name}
                        value={(formData as any)[name]}
                        onChange={handleInputChange}
                        onBlur={handleEmailBlur}
                        placeholder={opts?.placeholder || ""}
                        style={S.input}
                    />
                </div>
            )
        }
        return (
            <div style={S.fieldGroup}>
                <label style={S.label}>{label}</label>
                <input
                    type={type}
                    name={name}
                    value={(formData as any)[name]}
                    onChange={handleInputChange}
                    placeholder={opts?.placeholder || ""}
                    style={S.input}
                />
            </div>
        )
    }

    const renderCheckbox = (label: string, name: string) => (
        <div style={S.fieldGroup}>
            <label style={S.checkboxRow}>
                <input
                    type="checkbox"
                    name={name}
                    checked={(formData as any)[name]}
                    onChange={handleInputChange}
                    style={S.checkboxInput}
                />
                <span style={{ fontWeight: "500", fontSize: "15px" }}>{label}</span>
            </label>
        </div>
    )

    const renderNav = (back: number | null, next: number | null, nextLabel?: string) => (
        <div style={S.navRow}>
            {back !== null ? (
                <button onClick={() => setCurrentStep(back)} style={S.btnSecondary}>
                    ← Previous
                </button>
            ) : (
                <div />
            )}
            {next !== null && (
                <button onClick={() => setCurrentStep(next)} style={S.btnPrimary}>
                    {nextLabel || "Next →"}
                </button>
            )}
        </div>
    )

    const renderReviewLine = (label: string, value: any) => {
        if (!value && value !== false) return null
        if (typeof value === "boolean") {
            return (
                <p style={{ marginBottom: "6px", fontSize: "14px" }}>
                    <strong>{label}:</strong> {value ? "Yes" : "No"}
                </p>
            )
        }
        return (
            <p style={{ marginBottom: "6px", fontSize: "14px" }}>
                <strong>{label}:</strong> {value}
            </p>
        )
    }

    const renderEditButton = (stepNum: number) => (
        <button
            onClick={() => setCurrentStep(stepNum)}
            style={{
                fontSize: "12px",
                color: C.moonstone,
                background: "none",
                border: "none",
                cursor: "pointer",
                fontWeight: "600",
                float: "right" as const,
                letterSpacing: "0.04em",
                textTransform: "uppercase" as const,
            }}
        >
            EDIT
        </button>
    )

    // ========================================================================
    // RENDER
    // ========================================================================
    // ========================================================================
    // AUTH GATE — checking / unauthenticated
    // ========================================================================
    if (authStatus === "checking") {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
                <div style={{ textAlign: "center" }}>
                    <div style={{
                        width: "40px", height: "40px", border: `3px solid ${C.coconut}`,
                        borderTopColor: C.moonstone, borderRadius: "50%",
                        animation: "spin 0.8s linear infinite", margin: "0 auto 16px",
                    }} />
                    <p style={{ color: C.textMuted, fontSize: "14px" }}>Verifying session...</p>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            </div>
        )
    }

    if (authStatus === "unauthenticated") {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
                <div style={{
                    textAlign: "center", maxWidth: "440px", padding: "40px",
                    backgroundColor: C.white, border: `1px solid ${C.border}`,
                }}>
                    <img src="https://esbmnympligtknhtkary.supabase.co/storage/v1/object/public/assets/monarch-logo.png" alt="Monarch Competency" style={{ height: "48px", margin: "0 auto 20px", display: "block", objectFit: "contain" }} />
                    <h2 style={{ fontSize: "20px", fontWeight: "700", color: C.ash, marginBottom: "8px" }}>
                        Sign In Required
                    </h2>
                    <p style={{ fontSize: "14px", color: C.textMuted, marginBottom: "24px", lineHeight: "1.5" }}>
                        This secure referral form is available to authorized professionals only.
                        Please sign in to continue.
                    </p>

                    {authError && (
                        <div style={{
                            padding: "10px 14px", marginBottom: "16px",
                            backgroundColor: C.errorBg, color: C.error,
                            fontSize: "13px", border: `1px solid ${C.error}`,
                        }}>
                            {authError}
                        </div>
                    )}

                    {!showMagicLink ? (
                        <>
                            <button
                                onClick={async () => {
                                    setAuthError("")
                                    await supabase.auth.signInWithOAuth({
                                        provider: "google",
                                        options: { redirectTo: FORM_REDIRECT_URL },
                                    })
                                }}
                                style={{
                                    width: "100%",
                                    padding: "14px",
                                    fontSize: "15px",
                                    fontWeight: "600",
                                    backgroundColor: C.white,
                                    color: C.ash,
                                    border: `2px solid ${C.borderLight}`,
                                    borderRadius: "0px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "12px",
                                    marginBottom: "16px",
                                }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                                Continue with Google
                            </button>

                            <div style={{ display: "flex", alignItems: "center", margin: "20px 0" }}>
                                <div style={{ flex: 1, height: "1px", backgroundColor: C.borderLight }} />
                                <span style={{ padding: "0 16px", color: C.textMuted, fontSize: "13px" }}>or</span>
                                <div style={{ flex: 1, height: "1px", backgroundColor: C.borderLight }} />
                            </div>

                            <button
                                onClick={() => { setShowMagicLink(true); setAuthError("") }}
                                style={{
                                    width: "100%",
                                    padding: "14px",
                                    fontSize: "15px",
                                    fontWeight: "600",
                                    backgroundColor: "transparent",
                                    color: C.ash,
                                    border: `2px solid ${C.ash}`,
                                    borderRadius: "0px",
                                    cursor: "pointer",
                                }}
                            >
                                Continue with Email
                            </button>
                        </>
                    ) : !magicLinkSent ? (
                        <>
                            <input
                                type="email"
                                placeholder="Enter your email address"
                                value={magicLinkEmail}
                                onChange={(e) => setMagicLinkEmail(e.target.value)}
                                style={{ ...S.input, marginBottom: "12px", textAlign: "center" }}
                            />
                            <button
                                onClick={async () => {
                                    setAuthError("")
                                    if (!magicLinkEmail) {
                                        setAuthError("Please enter your email address.")
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
                                }}
                                style={{ ...S.btnPrimary, width: "100%", marginBottom: "12px" }}
                            >
                                Send Magic Link
                            </button>
                            <button
                                onClick={() => { setShowMagicLink(false); setAuthError("") }}
                                style={{
                                    background: "none", border: "none", cursor: "pointer",
                                    color: C.textMuted, fontSize: "13px", textDecoration: "underline",
                                }}
                            >
                                Back to sign in options
                            </button>
                        </>
                    ) : (
                        <div style={{
                            padding: "16px", backgroundColor: C.successBg,
                            border: `1px solid ${C.success}`, fontSize: "14px", color: C.success,
                        }}>
                            <strong>Check your email!</strong>
                            <p style={{ margin: "8px 0 0", fontSize: "13px" }}>
                                We sent a sign-in link to <strong>{magicLinkEmail}</strong>.
                                Click the link in your email to continue.
                            </p>
                        </div>
                    )}

                    <p style={{ fontSize: "12px", color: C.textMuted, marginTop: "16px" }}>
                        For family members or self-referrals, please use the{" "}
                        <a href="/submit-referrals" style={{ color: C.moonstone }}>public inquiry form</a>.
                    </p>
                </div>
            </div>
        )
    }

    // ========================================================================
    // AUTHENTICATED — RENDER FORM
    // ========================================================================
    return (
        <div style={{ padding: isMobile ? "20px" : "40px", maxWidth: "800px", margin: "0 auto" }}>
            <h1
                style={{
                    color: C.stoneCloud,
                    marginBottom: "8px",
                    fontSize: isMobile ? "22px" : "28px",
                    fontWeight: "700",
                    letterSpacing: "0.02em",
                }}
            >
                {showPortal && submitStatus !== "success" ? "Referral Portal" : "Monarch Competency Referral"}
            </h1>

            {/* ============================================================ */}
            {/* PORTAL — Two-option landing after login                    */}
            {/* ============================================================ */}
            {showPortal && submitStatus !== "success" && !showFamilyForm && (
                <div>
                    <p style={{ color: C.textMuted, fontSize: "15px", marginBottom: "32px", lineHeight: "1.5" }}>
                        What would you like to do?
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <div
                            onClick={() => setShowPortal(false)}
                            style={{
                                padding: "24px",
                                backgroundColor: C.shell,
                                border: `2px solid ${C.borderLight}`,
                                borderRadius: "0px",
                                cursor: "pointer",
                                transition: "border-color 0.2s ease",
                            }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = C.ash }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = C.borderLight }}
                        >
                            <p style={{ fontSize: "20px", marginBottom: "10px" }}>&#x1F4CB;</p>
                            <h3 style={{ fontSize: "18px", fontWeight: "700", color: C.ash, marginBottom: "8px" }}>
                                Submit New Referral
                            </h3>
                            <p style={{ fontSize: "14px", color: C.textMuted, lineHeight: "1.5", margin: 0 }}>
                                Start a new professional referral for competency restoration services.
                            </p>
                        </div>

                        <div
                            onClick={() => {
                                try {
                                    window.location.href = "https://monarchy.framer.website/submit-referrals/documents"
                                } catch (_e) {
                                    // Fallback for Framer preview
                                }
                            }}
                            style={{
                                padding: "24px",
                                backgroundColor: C.shell,
                                border: `2px solid ${C.borderLight}`,
                                borderRadius: "0px",
                                cursor: "pointer",
                                transition: "border-color 0.2s ease",
                            }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = C.ash }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = C.borderLight }}
                        >
                            <p style={{ fontSize: "20px", marginBottom: "10px" }}>&#x1F4CE;</p>
                            <h3 style={{ fontSize: "18px", fontWeight: "700", color: C.ash, marginBottom: "8px" }}>
                                Upload Documents
                            </h3>
                            <p style={{ fontSize: "14px", color: C.textMuted, lineHeight: "1.5", margin: 0 }}>
                                Attach documents to an existing referral using your referral code.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {!showPortal && !showFamilyForm && submitStatus !== "success" && (
                <p style={{ color: C.textMuted, fontSize: "14px", marginBottom: "16px" }}>
                    Step {currentStep} of {totalSteps}
                </p>
            )}

            {/* Progress Bar */}
            {!showPortal && !showFamilyForm && submitStatus !== "success" && (
                <div
                    style={{
                        width: "100%",
                        height: "6px",
                        backgroundColor: C.coconut,
                        borderRadius: "0px",
                        marginBottom: "32px",
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            width: `${(currentStep / totalSteps) * 100}%`,
                            height: "100%",
                            backgroundColor: C.moonstone,
                            transition: "width 0.3s ease",
                        }}
                    />
                </div>
            )}

            <div>
                {/* ============================================================ */}
                {/* STEP 0 — WHO IS MAKING THIS REFERRAL?                        */}
                {/* ============================================================ */}
                {!showPortal && currentStep === 0 && !showFamilyForm && (
                    <div>
                        <button
                            onClick={() => setShowPortal(true)}
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
                            {"\u2190"} Back
                        </button>
                        <h2 style={{ ...S.stepTitle, textAlign: "center" }}>
                            Who is making this referral?
                        </h2>
                        <p style={{ ...S.stepDesc, textAlign: "center" }}>
                            Please select the option that best describes your role
                        </p>

                        {[
                            {
                                value: "court",
                                label: "Court System",
                                desc: "Judge, court coordinator, or court-appointed professional",
                            },
                            {
                                value: "legal_representative",
                                label: "Legal Representative",
                                desc: "Attorney, public defender, or legal advocate",
                            },
                            {
                                value: "probation_parole",
                                label: "Probation/Parole",
                                desc: "Probation officer, parole officer, or corrections professional",
                            },
                            {
                                value: "mental_health_facility",
                                label: "Mental Health/Medical Facility",
                                desc: "Hospital, psychiatric facility, or treatment center staff",
                            },
                            {
                                value: "case_management",
                                label: "Case Management/Social Services",
                                desc: "Case manager, social worker, or community services professional",
                            },
                            {
                                value: "other_professional",
                                label: "Other Professional",
                                desc: "Another professional not listed above (e.g., housing, advocacy, other agency)",
                            },
                            {
                                value: "family",
                                label: "Family Member or Friend",
                                desc: "I am a family member, friend, or loved one",
                            },
                            {
                                value: "self_referral",
                                label: "Self-Referral",
                                desc: "I am referring myself",
                            },
                        ].map((option) => (
                            <button
                                key={option.value}
                                onClick={() => {
                                    setFormData((prev) => ({
                                        ...prev,
                                        referral_source_type: option.value,
                                    }))
                                    if (
                                        option.value === "family" ||
                                        option.value === "self_referral"
                                    ) {
                                        setShowFamilyForm(true)
                                    } else {
                                        setCurrentStep(1)
                                    }
                                }}
                                style={{
                                    width: "100%",
                                    padding: "18px 20px",
                                    marginBottom: "12px",
                                    border: `2px solid ${C.borderLight}`,
                                    borderRadius: "0px",
                                    backgroundColor: C.white,
                                    cursor: "pointer",
                                    textAlign: "left",
                                    transition: "border-color 0.2s",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = C.moonstone
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = C.borderLight
                                }}
                            >
                                <div
                                    style={{
                                        fontWeight: "600",
                                        fontSize: "17px",
                                        color: C.ash,
                                        marginBottom: "4px",
                                    }}
                                >
                                    {option.label}
                                </div>
                                <div style={{ fontSize: "14px", color: C.textMuted }}>
                                    {option.desc}
                                </div>
                            </button>
                        ))}

                        <div
                            style={{
                                marginTop: "24px",
                                padding: "16px",
                                backgroundColor: C.shell,
                                borderRadius: "0px",
                                fontSize: "14px",
                                color: C.textMuted,
                                textAlign: "center",
                                lineHeight: "1.5",
                            }}
                        >
                            Monarch Competency serves individuals referred through
                            Colorado's court system for competency restoration
                            services. If you are a family member or individual, we
                            will provide information about our program and next
                            steps.
                        </div>
                    </div>
                )}

                {/* ============================================================ */}
                {/* FAMILY/SELF FORM (unchanged from original)                   */}
                {/* ============================================================ */}
                {showFamilyForm && submitStatus === "success" && (
                    <div style={{ textAlign: "center", padding: "40px 20px" }}>
                        <div style={{
                            width: "56px", height: "56px", borderRadius: "50%",
                            backgroundColor: C.successBg, color: C.success,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "28px", margin: "0 auto 20px",
                        }}>✓</div>
                        <h2 style={{ fontSize: "22px", fontWeight: "700", color: C.ash, marginBottom: "12px" }}>
                            Thank you! We received your inquiry.
                        </h2>
                        <p style={{ fontSize: "15px", color: C.textMuted, marginBottom: "24px", lineHeight: "1.6" }}>
                            A member of our team will contact you soon to discuss your situation
                            and explain next steps.
                        </p>
                        <button onClick={resetForm} style={{ ...S.btnSecondary, color: C.success, borderColor: C.success }}>
                            Submit Another Inquiry
                        </button>
                    </div>
                )}

                {showFamilyForm && submitStatus !== "success" && (
                    <div>
                        <h2
                            style={{
                                fontSize: "24px",
                                fontWeight: "600",
                                color: C.stoneCloud,
                                marginBottom: "16px",
                            }}
                        >
                            Thank You for Reaching Out
                        </h2>

                        <div
                            style={{
                                backgroundColor: C.infoBg,
                                border: `2px solid ${C.infoBorder}`,
                                padding: "20px",
                                borderRadius: "0px",
                                marginBottom: "32px",
                            }}
                        >
                            <p
                                style={{
                                    fontSize: "16px",
                                    color: C.infoText,
                                    marginBottom: "12px",
                                    fontWeight: "500",
                                }}
                            >
                                We appreciate you contacting Monarch Competency
                                Restoration. Our program serves individuals
                                referred through Colorado's court system with
                                specific competency restoration needs.
                            </p>
                            <p
                                style={{
                                    fontSize: "16px",
                                    color: C.infoText,
                                    margin: 0,
                                }}
                            >
                                Please share your contact information below, and
                                our team will reach out to discuss your situation,
                                explain our admission criteria, and help connect
                                you with appropriate resources.
                            </p>
                        </div>

                        <div style={S.fieldGroup}>
                            <label style={S.label}>Who needs assistance?</label>
                            <select
                                name="referral_source_type"
                                value={formData.referral_source_type}
                                onChange={handleInputChange}
                                style={S.select}
                            >
                                <option value="self_referral">Myself</option>
                                <option value="family">
                                    A loved one (family member or friend)
                                </option>
                            </select>
                        </div>

                        {renderField("Your Name", "referral_source_name")}
                        {renderField("Best Phone Number to Reach You", "referral_source_phone", "tel")}
                        {renderField("Email Address", "referral_source_email", "email")}

                        {renderField("Best Time to Contact You", "additional_notes", "select", {
                            options: [
                                { value: "Morning (8am-12pm)", label: "Morning (8am-12pm)" },
                                { value: "Afternoon (12pm-5pm)", label: "Afternoon (12pm-5pm)" },
                                { value: "Evening (5pm-8pm)", label: "Evening (5pm-8pm)" },
                                { value: "Anytime", label: "Anytime" },
                            ],
                        })}

                        {renderField("Brief Description of Situation", "safety_notes", "textarea", {
                            placeholder:
                                "Please share a brief description of what brings you to Monarch Competency...",
                            rows: 4,
                        })}

                        {submitStatus === "error" && (
                            <div
                                style={{
                                    marginBottom: "20px",
                                    padding: "16px",
                                    backgroundColor: C.errorBg,
                                    color: C.error,
                                    borderRadius: "0px",
                                }}
                            >
                                Error submitting inquiry. Please try again or call us directly.
                            </div>
                        )}

                        <div style={S.navRow}>
                            <button
                                onClick={() => {
                                    setShowFamilyForm(false)
                                    setCurrentStep(0)
                                }}
                                style={S.btnSecondary}
                            >
                                ← Back
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                style={{
                                    ...S.btnSubmit,
                                    backgroundColor: isSubmitting ? C.moonstone : C.success,
                                    cursor: isSubmitting ? "not-allowed" : "pointer",
                                }}
                            >
                                {isSubmitting ? "Submitting..." : "Submit Inquiry"}
                            </button>
                        </div>
                    </div>
                )}

                {/* ============================================================ */}
                {/* STEP 1 — YOUR CONTACT INFORMATION                            */}
                {/* ============================================================ */}
                {currentStep === 1 && (
                    <div>
                        <h2 style={S.stepTitle}>{STEP_TITLES[1]}</h2>
                        <p style={S.stepDesc}>
                            Your professional contact details
                        </p>

                        <div style={S.callout}>
                            Collateral information is needed to support the referral and facilitate intake.
                            ROIs and supporting documents can be uploaded in Step 4.
                        </div>

                        {renderField("Full Name", "referral_source_name")}
                        {renderField("Organization / Agency", "referral_source_organization")}
                        {renderField("Title / Position", "referral_source_title")}
                        {renderField("Phone Number", "referral_source_phone", "tel")}
                        {renderField("Email Address", "referral_source_email", "email")}

                        {renderField(
                            "Can you provide collateral information for this referral?",
                            "can_provide_collateral",
                            "select",
                            {
                                options: [
                                    { value: "yes", label: "Yes" },
                                    { value: "no", label: "No" },
                                    { value: "partial", label: "Partial / Some information" },
                                ],
                            }
                        )}

                        {renderField(
                            "Has this individual been referred to Monarch previously?",
                            "previous_monarch_referral",
                            "select",
                            {
                                options: [
                                    { value: "yes", label: "Yes" },
                                    { value: "no", label: "No" },
                                    { value: "unknown", label: "Unknown" },
                                ],
                            }
                        )}

                        <div style={{ ...S.fieldGroup, marginTop: "8px" }}>
                            <label style={S.checkboxRow}>
                                <input
                                    type="checkbox"
                                    name="urgent_placement"
                                    checked={formData.urgent_placement}
                                    onChange={handleInputChange}
                                    style={S.checkboxInput}
                                />
                                <span style={{ fontWeight: "600", fontSize: "15px", color: C.ash }}>
                                    Request Urgent Placement
                                </span>
                            </label>
                        </div>

                        {renderNav(0, 2)}
                    </div>
                )}

                {/* ============================================================ */}
                {/* STEP 2 — ADDITIONAL CONTACTS                                 */}
                {/* ============================================================ */}
                {currentStep === 2 && (
                    <div>
                        <h2 style={S.stepTitle}>{STEP_TITLES[2]}</h2>
                        <p style={S.stepDesc}>
                            Emergency contact and other professionals involved in this individual's care
                        </p>

                        <h3 style={S.sectionHeader}>Emergency Contact</h3>
                        {renderField("Emergency Contact Name", "emergency_contact_name", "text", {
                            placeholder: "Family member or guardian",
                        })}
                        {renderField("Emergency Contact Phone", "emergency_contact_phone", "tel")}
                        {renderField("Relationship to Client", "emergency_contact_relationship", "text", {
                            placeholder: "e.g., Mother, Guardian, Spouse",
                        })}
                        {renderCheckbox(
                            "Emergency contact can provide collateral information",
                            "emergency_contact_can_provide_info"
                        )}

                        <h3 style={S.sectionHeader}>Additional Professional Contacts</h3>
                        <p style={{ fontSize: "14px", color: C.textMuted, marginBottom: "16px" }}>
                            Add any other professionals involved in this individual's care or case
                            (e.g., case managers, treatment providers, probation officers).
                        </p>

                        {formData.additional_contacts.map((contact, index) => (
                            <div
                                key={index}
                                style={{
                                    border: `1px solid ${C.border}`,
                                    padding: "16px",
                                    marginBottom: "16px",
                                    backgroundColor: C.shell,
                                    borderRadius: "0px",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        marginBottom: "12px",
                                    }}
                                >
                                    <span style={{ fontWeight: "600", fontSize: "14px", color: C.stoneCloud }}>
                                        Contact #{index + 1}
                                    </span>
                                    <button
                                        onClick={() => removeContact(index)}
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
                                <div style={S.fieldGroup}>
                                    <label style={S.label}>Contact Name</label>
                                    <input
                                        type="text"
                                        value={contact.name}
                                        onChange={(e) => updateContact(index, "name", e.target.value)}
                                        style={S.input}
                                    />
                                </div>
                                <div style={S.fieldGroup}>
                                    <label style={S.label}>Organization & Title</label>
                                    <input
                                        type="text"
                                        value={contact.organization}
                                        onChange={(e) => updateContact(index, "organization", e.target.value)}
                                        placeholder="e.g., Public Defender's Office - Attorney"
                                        style={S.input}
                                    />
                                </div>
                                <div style={S.fieldGroup}>
                                    <label style={S.label}>Phone / Email</label>
                                    <input
                                        type="text"
                                        value={contact.phone_email}
                                        onChange={(e) => updateContact(index, "phone_email", e.target.value)}
                                        style={S.input}
                                    />
                                </div>
                                <div style={S.fieldGroup}>
                                    <label style={S.label}>Role / Affiliation</label>
                                    <input
                                        type="text"
                                        value={contact.role}
                                        onChange={(e) => updateContact(index, "role", e.target.value)}
                                        placeholder="e.g., Defense Attorney, Case Manager"
                                        style={S.input}
                                    />
                                </div>
                                <label style={S.checkboxRow}>
                                    <input
                                        type="checkbox"
                                        checked={contact.can_provide_info}
                                        onChange={(e) =>
                                            updateContact(index, "can_provide_info", e.target.checked)
                                        }
                                        style={S.checkboxInput}
                                    />
                                    <span style={{ fontWeight: "500", fontSize: "14px" }}>
                                        Can provide collateral information
                                    </span>
                                </label>
                            </div>
                        ))}

                        <button
                            onClick={addContact}
                            style={{
                                padding: "10px 20px",
                                fontSize: "14px",
                                fontWeight: "600",
                                color: C.stoneCloud,
                                backgroundColor: "transparent",
                                border: `1px dashed ${C.moonstone}`,
                                borderRadius: "0px",
                                cursor: "pointer",
                                width: "100%",
                            }}
                        >
                            + Add Another Contact
                        </button>

                        {renderNav(1, 3)}
                    </div>
                )}

                {/* ============================================================ */}
                {/* STEP 3 — DEMOGRAPHICS                                        */}
                {/* ============================================================ */}
                {currentStep === 3 && (
                    <div>
                        <h2 style={S.stepTitle}>{STEP_TITLES[3]}</h2>
                        <p style={S.stepDesc}>
                            Basic identifying information about the individual being referred
                        </p>

                        <div style={S.callout}>
                            While specific information is needed for intake processing, please provide
                            what you have available. Our intake team will follow up if missing
                            information is critical.
                        </div>

                        {renderField("Legal First Name", "client_first_name")}
                        {renderField("Legal Middle Name", "client_middle_name")}
                        {renderField("Legal Last Name", "client_last_name")}
                        {renderField("Aliases / Nicknames / Previous Names", "client_preferred_name", "text", {
                            placeholder: "Any known aliases or previous names",
                        })}

                        {renderField("Date of Birth", "client_dob", "date")}
                        {renderField("SSN (if available)", "client_ssn", "text", {
                            placeholder: "Optional — XXX-XX-XXXX",
                        })}

                        {renderField("Gender Identity", "client_gender", "select", {
                            options: [
                                { value: "male", label: "Male" },
                                { value: "female", label: "Female" },
                                { value: "non_binary", label: "Non-binary" },
                                { value: "transgender_male", label: "Transgender Male" },
                                { value: "transgender_female", label: "Transgender Female" },
                                { value: "other", label: "Other" },
                                { value: "prefer_not_to_say", label: "Prefer not to say" },
                            ],
                        })}

                        {renderField("Sex Assigned at Birth", "client_sex_at_birth", "select", {
                            options: [
                                { value: "male", label: "Male" },
                                { value: "female", label: "Female" },
                            ],
                        })}

                        {renderField("Preferred Pronouns", "client_pronouns", "select", {
                            options: [
                                { value: "he_him", label: "He/Him" },
                                { value: "she_her", label: "She/Her" },
                                { value: "they_them", label: "They/Them" },
                                { value: "other", label: "Other" },
                            ],
                        })}

                        {renderField("Primary Language", "client_primary_language", "text", {
                            placeholder: "e.g., English, Spanish",
                        })}

                        {renderField("English Proficiency", "client_english_proficiency", "select", {
                            options: [
                                { value: "fluent", label: "Fluent" },
                                { value: "conversational", label: "Conversational" },
                                { value: "limited", label: "Limited" },
                                { value: "none", label: "None" },
                                { value: "unknown", label: "Unknown" },
                            ],
                        })}

                        {renderCheckbox("Interpreter Needed", "interpreter_needed")}

                        {renderField("Racial/Ethnic Background", "client_ethnicity", "select", {
                            options: [
                                { value: "american_indian_alaska_native", label: "American Indian / Alaska Native" },
                                { value: "asian", label: "Asian" },
                                { value: "black_african_american", label: "Black / African American" },
                                { value: "hispanic_latino", label: "Hispanic / Latino" },
                                { value: "native_hawaiian_pacific_islander", label: "Native Hawaiian / Pacific Islander" },
                                { value: "white", label: "White" },
                                { value: "two_or_more", label: "Two or More Races" },
                                { value: "other", label: "Other" },
                                { value: "prefer_not_to_say", label: "Prefer not to say" },
                            ],
                        })}

                        {renderField("Marital Status", "client_marital_status", "select", {
                            options: [
                                { value: "single", label: "Single" },
                                { value: "married", label: "Married" },
                                { value: "divorced", label: "Divorced" },
                                { value: "separated", label: "Separated" },
                                { value: "widowed", label: "Widowed" },
                                { value: "domestic_partnership", label: "Domestic Partnership" },
                                { value: "unknown", label: "Unknown" },
                            ],
                        })}

                        {renderField("Client Phone", "client_phone", "tel")}
                        {renderField("Client Email", "client_email", "email")}

                        {renderField(
                            "Does the client consent to this referral?",
                            "client_consents_to_referral",
                            "select",
                            {
                                options: [
                                    { value: "yes", label: "Yes" },
                                    { value: "no", label: "No" },
                                    { value: "unable_to_consent", label: "Unable to consent / Unknown" },
                                ],
                            }
                        )}

                        {renderNav(2, 4)}
                    </div>
                )}

                {/* ============================================================ */}
                {/* STEP 4 — DOCUMENTS & IDENTIFICATION                          */}
                {/* ============================================================ */}
                {currentStep === 4 && (
                    <div>
                        <h2 style={S.stepTitle}>{STEP_TITLES[4]}</h2>
                        <p style={S.stepDesc}>
                            Select which documents are available and upload any you have on hand
                        </p>

                        <div style={S.callout}>
                            Documents can also be uploaded after submission using your referral
                            code. You will receive a code and upload link upon submission.
                        </div>

                        <h3 style={S.sectionHeader}>Documents Available</h3>
                        <p style={{ fontSize: "14px", color: C.textMuted, marginBottom: "12px" }}>
                            Check all documents that are available for this referral:
                        </p>

                        {DOCUMENT_OPTIONS.map((doc) => (
                            <label
                                key={doc.value}
                                style={{
                                    ...S.checkboxRow,
                                    backgroundColor: formData.documents_available.includes(doc.value)
                                        ? C.coconut
                                        : C.white,
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={formData.documents_available.includes(doc.value)}
                                    onChange={() => handleDocToggle(doc.value)}
                                    style={S.checkboxInput}
                                />
                                <span style={{ fontWeight: "500", fontSize: "14px" }}>{doc.label}</span>
                            </label>
                        ))}

                        <h3 style={{ ...S.sectionHeader, marginTop: "32px" }}>Upload Documents</h3>
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
                            <p style={{ fontSize: "16px", color: C.ash, fontWeight: "600", marginBottom: "8px" }}>
                                Click to select files
                            </p>
                            <p style={{ color: C.textMuted, fontSize: "13px", margin: 0 }}>
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

                        {/* File upload error */}
                        {fileUploadError && (
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
                                {fileUploadError}
                            </div>
                        )}

                        {/* Pending files list with document type selector */}
                        {pendingFiles.length > 0 && (
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
                                    Selected Files ({pendingFiles.length})
                                </p>
                                {pendingFiles.map((entry, index) => (
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
                                                onClick={() => removePendingFile(index)}
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

                        {renderField("Document Notes / Descriptions", "documents_notes", "textarea", {
                            placeholder:
                                "Describe any documents you plan to provide or any notes about document availability...",
                            rows: 3,
                        })}

                        {renderNav(3, 5)}
                    </div>
                )}

                {/* ============================================================ */}
                {/* STEP 5 — INSURANCE & BENEFITS                                */}
                {/* ============================================================ */}
                {currentStep === 5 && (
                    <div>
                        <h2 style={S.stepTitle}>{STEP_TITLES[5]}</h2>
                        <p style={S.stepDesc}>
                            Insurance coverage and benefits information
                        </p>

                        <h3 style={S.sectionHeader}>Medicaid</h3>
                        {renderField("Medicaid Status", "medicaid_status", "select", {
                            options: [
                                { value: "active", label: "Active" },
                                { value: "suspended", label: "Suspended" },
                                { value: "pending", label: "Application Pending" },
                                { value: "not_eligible", label: "Not Eligible" },
                                { value: "unknown", label: "Unknown" },
                            ],
                        })}
                        {renderField("Medicaid Number", "medicaid_number", "text", {
                            placeholder: "Medicaid member ID number",
                        })}

                        <h3 style={S.sectionHeader}>Medicare</h3>
                        {renderField("Medicare Status", "medicare_status", "select", {
                            options: [
                                { value: "active", label: "Active" },
                                { value: "pending", label: "Pending" },
                                { value: "not_eligible", label: "Not Eligible" },
                                { value: "unknown", label: "Unknown" },
                            ],
                        })}
                        {renderField("Medicare Number", "medicare_number", "text", {
                            placeholder: "Medicare beneficiary ID",
                        })}

                        <h3 style={S.sectionHeader}>Other Insurance</h3>
                        {renderCheckbox("Has Private Insurance", "has_private_insurance")}
                        {formData.has_private_insurance &&
                            renderField(
                                "Private Insurance Details",
                                "private_insurance_details",
                                "textarea",
                                {
                                    placeholder: "Insurance company, plan name, member ID...",
                                    rows: 2,
                                }
                            )}

                        <h3 style={S.sectionHeader}>Benefits</h3>
                        {renderField("SSI/SSDI Status", "ssdi_status", "select", {
                            options: [
                                { value: "receiving_ssi", label: "Receiving SSI" },
                                { value: "receiving_ssdi", label: "Receiving SSDI" },
                                { value: "receiving_both", label: "Receiving SSI & SSDI" },
                                { value: "applied_pending", label: "Applied / Pending" },
                                { value: "not_receiving", label: "Not Receiving" },
                                { value: "unknown", label: "Unknown" },
                            ],
                        })}
                        {renderField(
                            "Additional Benefits Information",
                            "benefits_notes",
                            "textarea",
                            {
                                placeholder: "Any other relevant benefits or funding information...",
                                rows: 2,
                            }
                        )}

                        {renderNav(4, 6)}
                    </div>
                )}

                {/* ============================================================ */}
                {/* STEP 6 — LEGAL STATUS & COURT INFORMATION                    */}
                {/* ============================================================ */}
                {currentStep === 6 && (
                    <div>
                        <h2 style={S.stepTitle}>{STEP_TITLES[6]}</h2>
                        <p style={S.stepDesc}>
                            Case details, competency status, and legal representation
                        </p>

                        <h3 style={S.sectionHeader}>Court Case</h3>
                        {renderField("County / Judicial District", "court_jurisdiction", "select", {
                            options: CO_JUDICIAL_DISTRICTS.map((d) => ({ value: d, label: d })),
                        })}
                        {renderField("Case Number", "case_number", "text", {
                            placeholder: "Court case number",
                        })}
                        {renderField("Assigned Judge", "judge_name", "text", {
                            placeholder: "Judge's name",
                        })}
                        {renderField("Courtroom", "courtroom", "text", {
                            placeholder: "Courtroom number or designation",
                        })}
                        {renderField("Next Court Date", "next_court_date", "date")}
                        {renderField("Charges (Brief Summary)", "charges", "textarea", {
                            placeholder: "Brief description of pending charges",
                            rows: 3,
                        })}

                        <h3 style={S.sectionHeader}>Competency Status</h3>
                        {renderField("Competency Status", "competency_status", "select", {
                            options: [
                                { value: "evaluation_ordered", label: "Evaluation Ordered" },
                                { value: "found_incompetent", label: "Found Incompetent to Proceed" },
                                { value: "restoration_ordered", label: "Restoration Ordered" },
                                { value: "in_restoration", label: "Currently in Restoration" },
                                { value: "restored", label: "Restored to Competency" },
                                { value: "not_restorable", label: "Found Not Restorable" },
                                { value: "pending_evaluation", label: "Pending Evaluation" },
                            ],
                        })}
                        {renderField("Competency Evaluation Date", "competency_eval_date", "date")}
                        {renderField("Evaluating Clinician / Organization", "competency_evaluator", "text", {
                            placeholder: "Name of evaluator or organization",
                        })}

                        <h3 style={S.sectionHeader}>Legal Representation</h3>
                        {renderField("Defense Attorney", "attorney_name", "text", {
                            placeholder: "Defense attorney or public defender",
                        })}
                        {renderField("Attorney Phone", "attorney_phone", "tel")}
                        {renderField("Attorney Email", "attorney_email", "email")}

                        <h3 style={S.sectionHeader}>Supervision & Bond Status</h3>
                        {renderCheckbox("Currently on Probation", "on_probation")}
                        {formData.on_probation &&
                            renderField("Probation Officer Name / Contact", "probation_officer_contact", "text", {
                                placeholder: "PO name, phone, or email",
                            })}

                        {renderCheckbox("Currently on Parole", "on_parole")}
                        {formData.on_parole &&
                            renderField("Parole Officer Contact", "parole_officer_contact", "text", {
                                placeholder: "Parole officer name, phone, or email",
                            })}

                        {renderField("Active Warrants?", "active_warrants", "select", {
                            options: [
                                { value: "yes", label: "Yes" },
                                { value: "no", label: "No" },
                                { value: "unknown", label: "Unknown" },
                            ],
                        })}

                        {renderField("Bond Holds?", "has_bond_holds", "select", {
                            options: [
                                { value: "yes", label: "Yes" },
                                { value: "no", label: "No" },
                                { value: "unknown", label: "Unknown" },
                            ],
                        })}
                        {formData.has_bond_holds === "yes" &&
                            renderField("Bond Hold Details", "bond_holds_details", "textarea", {
                                placeholder: "Describe bond holds...",
                                rows: 2,
                            })}

                        {renderField("PR Bond to Monarch?", "pr_bond_to_monarch", "select", {
                            options: [
                                { value: "yes", label: "Yes" },
                                { value: "no", label: "No" },
                                { value: "pending", label: "Pending" },
                                { value: "not_applicable", label: "Not Applicable" },
                            ],
                        })}

                        {formData.pr_bond_to_monarch === "yes" && (
                            <>
                                <div style={S.callout}>
                                    PR Bond notification contacts — who should be notified upon
                                    admission or discharge?
                                </div>
                                {renderField("Judge Contact", "pr_bond_judge_contact", "text", {
                                    placeholder: "Judge name, phone, or email for notifications",
                                })}
                                {renderField("DA Contact", "pr_bond_da_contact", "text", {
                                    placeholder: "District Attorney contact for notifications",
                                })}
                                {renderField("Other Parties to Notify", "pr_bond_other_contacts", "textarea", {
                                    placeholder: "Any other parties who should be notified...",
                                    rows: 2,
                                })}
                            </>
                        )}

                        {renderNav(5, 7)}
                    </div>
                )}

                {/* ============================================================ */}
                {/* STEP 7 — CURRENT LOCATION & SITUATION                        */}
                {/* ============================================================ */}
                {currentStep === 7 && (
                    <div>
                        <h2 style={S.stepTitle}>{STEP_TITLES[7]}</h2>
                        <p style={S.stepDesc}>
                            Where is the individual currently located?
                        </p>

                        {renderField("Current Location Type", "current_location_type", "select", {
                            options: [
                                { value: "county_jail", label: "County Jail" },
                                { value: "state_prison", label: "State Prison / DOC" },
                                { value: "hospital_medical", label: "Hospital (Medical)" },
                                { value: "hospital_psychiatric", label: "Psychiatric Hospital" },
                                { value: "state_hospital", label: "State Hospital (CMHIP)" },
                                { value: "treatment_facility", label: "Treatment Facility" },
                                { value: "residential_program", label: "Residential Program" },
                                { value: "community_supervised", label: "Community (Supervised Release)" },
                                { value: "community_unsupervised", label: "Community (Unsupervised)" },
                                { value: "homeless_shelter", label: "Homeless / Shelter" },
                                { value: "other", label: "Other" },
                            ],
                        })}

                        {renderField("Facility Name", "facility_name", "text", {
                            placeholder: "Name of jail, hospital, or facility",
                        })}
                        {renderField("Facility Address", "facility_address", "text", {
                            placeholder: "Street address, city, state",
                        })}
                        {renderField("Inmate / Patient ID Number", "inmate_id", "text", {
                            placeholder: "Booking number or patient ID",
                        })}
                        {renderField("Facility Contact Person", "facility_contact_person", "text", {
                            placeholder: "Name of contact at facility",
                        })}
                        {renderField("Facility Contact Phone", "facility_contact_phone", "tel")}

                        {renderCheckbox("Currently Incarcerated", "currently_incarcerated")}
                        {formData.currently_incarcerated &&
                            renderField("Expected Release Date", "expected_release_date", "date")}

                        <h3 style={S.sectionHeader}>Housing History</h3>
                        {renderField("Housing Prior to Current Situation", "housing_prior", "select", {
                            options: [
                                { value: "own_home", label: "Own Home / Apartment" },
                                { value: "family_friend", label: "Living with Family / Friend" },
                                { value: "group_home", label: "Group Home / Assisted Living" },
                                { value: "shelter", label: "Shelter" },
                                { value: "homeless", label: "Homeless / Unsheltered" },
                                { value: "transitional", label: "Transitional Housing" },
                                { value: "other", label: "Other" },
                                { value: "unknown", label: "Unknown" },
                            ],
                        })}

                        {renderField("Post-Program Housing Plan", "housing_post_program", "select", {
                            options: [
                                { value: "return_home", label: "Return to Own Home" },
                                { value: "family_friend", label: "Family / Friend" },
                                { value: "group_home", label: "Group Home / Assisted Living" },
                                { value: "transitional", label: "Transitional Housing" },
                                { value: "needs_placement", label: "Needs Placement Assistance" },
                                { value: "unknown", label: "Unknown / TBD" },
                            ],
                        })}

                        {renderField("Housing Notes", "housing_notes", "textarea", {
                            placeholder: "Any additional housing information or concerns...",
                            rows: 2,
                        })}

                        {renderNav(6, 8)}
                    </div>
                )}

                {/* ============================================================ */}
                {/* STEP 8 — MENTAL HEALTH & CLINICAL                            */}
                {/* ============================================================ */}
                {currentStep === 8 && (
                    <div>
                        <h2 style={S.stepTitle}>{STEP_TITLES[8]}</h2>
                        <p style={S.stepDesc}>
                            Mental health diagnoses, medications, and treatment history
                        </p>

                        {renderField("Mental Health Diagnoses", "current_diagnoses", "textarea", {
                            placeholder: "List any known psychiatric diagnoses",
                            rows: 3,
                        })}

                        {renderField("Medication Compliance", "medication_compliance", "select", {
                            options: [
                                { value: "compliant", label: "Compliant / Taking as prescribed" },
                                { value: "partially_compliant", label: "Partially Compliant" },
                                { value: "non_compliant", label: "Non-Compliant / Refusing" },
                                { value: "not_prescribed", label: "Not Currently Prescribed" },
                                { value: "unknown", label: "Unknown" },
                            ],
                        })}

                        {renderField("Current Psychiatric Medications", "current_medications", "textarea", {
                            placeholder: "List medications with dosages (e.g., Risperidone 2mg twice daily)",
                            rows: 4,
                        })}

                        {formData.medication_compliance === "partially_compliant" ||
                        formData.medication_compliance === "non_compliant"
                            ? renderField("Medication Barriers", "medication_barriers", "textarea", {
                                  placeholder: "Describe barriers to medication compliance...",
                                  rows: 2,
                              })
                            : null}

                        {renderField("Psychiatric History", "psychiatric_history", "textarea", {
                            placeholder: "Previous hospitalizations, treatment history, etc.",
                            rows: 3,
                        })}

                        {renderField("Previous Treatment Programs", "previous_treatment_programs", "textarea", {
                            placeholder:
                                "List any previous treatment programs (competency restoration, residential, etc.)",
                            rows: 3,
                        })}

                        <h3 style={S.sectionHeader}>Traumatic Brain Injury (TBI)</h3>
                        {renderField("History of TBI?", "tbi_history", "select", {
                            options: [
                                { value: "yes", label: "Yes" },
                                { value: "no", label: "No" },
                                { value: "suspected", label: "Suspected" },
                                { value: "unknown", label: "Unknown" },
                            ],
                        })}
                        {(formData.tbi_history === "yes" || formData.tbi_history === "suspected") &&
                            renderField("TBI Details", "tbi_details", "textarea", {
                                placeholder: "Describe TBI history, severity, and any related limitations...",
                                rows: 2,
                            })}

                        <h3 style={S.sectionHeader}>Intellectual / Developmental Disability (IDD)</h3>
                        {renderField("Known IDD?", "idd_status", "select", {
                            options: [
                                { value: "yes_documented", label: "Yes — Documented" },
                                { value: "yes_undocumented", label: "Yes — Undocumented / Suspected" },
                                { value: "no", label: "No" },
                                { value: "unknown", label: "Unknown" },
                            ],
                        })}
                        {(formData.idd_status === "yes_documented" ||
                            formData.idd_status === "yes_undocumented") &&
                            renderField("IDD Details", "idd_details", "textarea", {
                                placeholder: "Describe diagnosis, functional level, support needs...",
                                rows: 2,
                            })}

                        {renderNav(7, 9)}
                    </div>
                )}

                {/* ============================================================ */}
                {/* STEP 9 — SUBSTANCE USE                                       */}
                {/* ============================================================ */}
                {currentStep === 9 && (
                    <div>
                        <h2 style={S.stepTitle}>{STEP_TITLES[9]}</h2>
                        <p style={S.stepDesc}>
                            Substance use history and current status
                        </p>

                        {renderField("Substance Use Pattern", "substance_use_pattern", "select", {
                            options: [
                                { value: "no_history", label: "No History of Substance Use" },
                                { value: "historical_only", label: "Historical Use Only (1+ year sober)" },
                                { value: "in_recovery", label: "In Recovery (active program)" },
                                { value: "occasional", label: "Occasional / Social Use" },
                                { value: "regular", label: "Regular Use" },
                                { value: "daily", label: "Daily Use" },
                                { value: "iv_use", label: "IV Drug Use" },
                                { value: "unknown", label: "Unknown" },
                            ],
                        })}

                        {formData.substance_use_pattern &&
                            formData.substance_use_pattern !== "no_history" &&
                            formData.substance_use_pattern !== "unknown" &&
                            renderField(
                                "Current Use (Last 90 Days)",
                                "substance_use_current",
                                "textarea",
                                {
                                    placeholder:
                                        "Describe current substances used, frequency, route of administration...",
                                    rows: 3,
                                }
                            )}

                        {renderField("Past Substance Use History", "substance_use_history", "textarea", {
                            placeholder: "History of substance use or addiction, previous treatment...",
                            rows: 3,
                        })}

                        {renderField(
                            "Needs Medically Supervised Detox?",
                            "detox_required",
                            "select",
                            {
                                options: [
                                    { value: "yes", label: "Yes" },
                                    { value: "no", label: "No" },
                                    { value: "possibly", label: "Possibly / Under Evaluation" },
                                    { value: "unknown", label: "Unknown" },
                                ],
                            }
                        )}

                        {(formData.detox_required === "yes" || formData.detox_required === "possibly") &&
                            renderField("Detox Details", "detox_details", "textarea", {
                                placeholder: "Substances requiring detox, last use date, withdrawal risk...",
                                rows: 2,
                            })}

                        {renderNav(8, 10)}
                    </div>
                )}

                {/* ============================================================ */}
                {/* STEP 10 — MEDICAL & SOMATIC                                  */}
                {/* ============================================================ */}
                {currentStep === 10 && (
                    <div>
                        <h2 style={S.stepTitle}>{STEP_TITLES[10]}</h2>
                        <p style={S.stepDesc}>
                            Physical health conditions, medications, and care needs
                        </p>

                        {renderField("Medical / Somatic Diagnoses", "medical_conditions", "textarea", {
                            placeholder: "Physical health conditions, chronic illnesses, etc.",
                            rows: 3,
                        })}

                        {renderField(
                            "Are conditions controlled by current medications?",
                            "medical_conditions_controlled",
                            "select",
                            {
                                options: [
                                    { value: "yes", label: "Yes — Well Controlled" },
                                    { value: "partially", label: "Partially Controlled" },
                                    { value: "no", label: "No — Uncontrolled" },
                                    { value: "not_applicable", label: "Not Applicable" },
                                    { value: "unknown", label: "Unknown" },
                                ],
                            }
                        )}

                        {renderField("Non-Psychiatric Medications", "medications_non_psychiatric", "textarea", {
                            placeholder: "List non-psychiatric medications with dosages...",
                            rows: 3,
                        })}

                        {renderField("Medication Allergies", "medication_allergies", "textarea", {
                            placeholder: "List any known medication allergies or adverse reactions...",
                            rows: 2,
                        })}

                        {renderField("Mobility / Assistive Device Needs", "mobility_needs", "select", {
                            options: [
                                { value: "independent", label: "Fully Independent" },
                                { value: "cane_walker", label: "Cane / Walker" },
                                { value: "wheelchair", label: "Wheelchair" },
                                { value: "bedbound", label: "Bedbound / Limited Mobility" },
                                { value: "other", label: "Other Assistive Needs" },
                            ],
                        })}

                        {renderCheckbox("Requires ADL (Activities of Daily Living) Support", "adl_support_needed")}
                        {formData.adl_support_needed &&
                            renderField("ADL Support Details", "adl_support_details", "textarea", {
                                placeholder: "Describe ADL support needs (bathing, dressing, feeding, etc.)...",
                                rows: 2,
                            })}

                        {renderField("Acute Medical Needs", "acute_medical_needs", "textarea", {
                            placeholder:
                                "Any acute medical issues requiring immediate attention (wound care, dialysis, etc.)...",
                            rows: 2,
                        })}

                        {renderNav(9, 11)}
                    </div>
                )}

                {/* ============================================================ */}
                {/* STEP 11 — SAFETY & RISK ASSESSMENT                           */}
                {/* ============================================================ */}
                {currentStep === 11 && (
                    <div>
                        <h2 style={S.stepTitle}>{STEP_TITLES[11]}</h2>
                        <p style={S.stepDesc}>
                            Important safety information for care planning
                        </p>

                        <div style={S.warningCallout}>
                            Please provide accurate risk assessment information. This helps us
                            ensure appropriate care and safety for everyone. Select the timeframe
                            that best describes each risk factor.
                        </div>

                        <h3 style={S.sectionHeader}>Self-Harm / Suicide Risk</h3>
                        {renderField("Suicide / Self-Harm History", "suicide_risk", "select", {
                            options: [
                                { value: "current", label: "Current (within 30 days)" },
                                { value: "recent", label: "Recent (within 90 days)" },
                                { value: "recovering", label: "Recovering (4-12 months)" },
                                { value: "historical", label: "Historical (1+ year ago)" },
                                { value: "no_history", label: "No History" },
                            ],
                        })}
                        {formData.suicide_risk &&
                            formData.suicide_risk !== "no_history" &&
                            renderField("Suicide Risk Details", "suicide_risk_details", "textarea", {
                                placeholder: "Describe history, most recent incident, current ideation level...",
                                rows: 2,
                            })}

                        <h3 style={S.sectionHeader}>Violence / Aggression</h3>
                        {renderField("Violence / Aggression History", "violence_risk", "select", {
                            options: [
                                { value: "current", label: "Current (within 30 days)" },
                                { value: "recent", label: "Recent (within 90 days)" },
                                { value: "recovering", label: "Recovering (4-12 months)" },
                                { value: "historical", label: "Historical (1+ year ago)" },
                                { value: "no_history", label: "No History" },
                            ],
                        })}
                        {formData.violence_risk &&
                            formData.violence_risk !== "no_history" &&
                            renderField("Violence Risk Details", "violence_risk_details", "textarea", {
                                placeholder: "Describe history, targets, triggers, most recent incident...",
                                rows: 2,
                            })}

                        <h3 style={S.sectionHeader}>Elopement / AMA Risk</h3>
                        {renderField("Elopement / AMA History", "elopement_risk", "select", {
                            options: [
                                { value: "current", label: "Current (within 30 days)" },
                                { value: "recent", label: "Recent (within 90 days)" },
                                { value: "recovering", label: "Recovering (4-12 months)" },
                                { value: "historical", label: "Historical (1+ year ago)" },
                                { value: "no_history", label: "No History" },
                            ],
                        })}
                        {formData.elopement_risk &&
                            formData.elopement_risk !== "no_history" &&
                            renderField("Elopement Details", "elopement_risk_details", "textarea", {
                                placeholder: "Describe elopement/AMA history, circumstances...",
                                rows: 2,
                            })}

                        <h3 style={S.sectionHeader}>Special Population Flags</h3>
                        {renderField("Arson History / Charges?", "arson_history", "select", {
                            options: [
                                { value: "yes_current", label: "Yes — Current Charges" },
                                { value: "yes_historical", label: "Yes — Historical" },
                                { value: "no", label: "No" },
                                { value: "unknown", label: "Unknown" },
                            ],
                        })}
                        {(formData.arson_history === "yes_current" ||
                            formData.arson_history === "yes_historical") &&
                            renderField("Arson Details", "arson_details", "textarea", {
                                placeholder: "Describe arson charges or history...",
                                rows: 2,
                            })}

                        {renderField("Registered Sex Offender (RSO) Status?", "rso_status", "select", {
                            options: [
                                { value: "yes_registered", label: "Yes — Currently Registered" },
                                { value: "yes_charges", label: "Yes — Pending Charges" },
                                { value: "no", label: "No" },
                                { value: "unknown", label: "Unknown" },
                            ],
                        })}
                        {(formData.rso_status === "yes_registered" ||
                            formData.rso_status === "yes_charges") &&
                            renderField("RSO Details", "rso_details", "textarea", {
                                placeholder: "Describe registration status, offense type, restrictions...",
                                rows: 2,
                            })}

                        <h3 style={S.sectionHeader}>Additional Safety</h3>
                        {renderCheckbox("Requires Specialized Medical Care", "medical_needs")}
                        {renderField("Additional Safety Information", "safety_notes", "textarea", {
                            placeholder:
                                "Any additional behavioral concerns, special accommodations, or safety considerations...",
                            rows: 4,
                        })}

                        {renderNav(10, 12)}
                    </div>
                )}

                {/* ============================================================ */}
                {/* STEP 12 — ADDITIONAL NOTES & URGENCY                         */}
                {/* ============================================================ */}
                {currentStep === 12 && (
                    <div>
                        <h2 style={S.stepTitle}>{STEP_TITLES[12]}</h2>
                        <p style={S.stepDesc}>
                            Final details about urgency, additional context, and how you found us
                        </p>

                        {renderField("Referral Urgency", "urgency_level", "select", {
                            options: [
                                { value: "immediate", label: "Immediate — Needs placement ASAP" },
                                { value: "urgent", label: "Urgent — Within 1-2 weeks" },
                                { value: "standard", label: "Standard — Normal processing timeline" },
                                { value: "planning_ahead", label: "Planning Ahead — Future placement" },
                            ],
                        })}

                        {(formData.urgency_level === "immediate" ||
                            formData.urgency_level === "urgent") &&
                            renderField("Reason for Urgency", "urgency_reason", "textarea", {
                                placeholder:
                                    "Describe why this referral requires urgent attention (court deadlines, safety concerns, etc.)...",
                                rows: 3,
                            })}

                        {renderField("Additional Notes or Special Considerations", "additional_notes", "textarea", {
                            placeholder:
                                "Include any other relevant information about this referral...",
                            rows: 6,
                        })}

                        {renderField("How did you hear about Monarch Competency?", "referral_source_channel", "select", {
                            options: [
                                { value: "court_referral", label: "Court Referral" },
                                { value: "colleague", label: "Colleague / Professional Referral" },
                                { value: "website", label: "Website / Online Search" },
                                { value: "conference", label: "Conference / Training" },
                                { value: "previous_experience", label: "Previous Experience with Monarch" },
                                { value: "other", label: "Other" },
                            ],
                        })}

                        <div style={S.callout}>
                            On the next step, you will review all information before submitting the
                            referral.
                        </div>

                        {renderNav(11, 13, "Review & Submit →")}
                    </div>
                )}

                {/* ============================================================ */}
                {/* STEP 13 — REVIEW & SUBMIT                                    */}
                {/* ============================================================ */}
                {currentStep === 13 && submitStatus !== "success" && (
                    <div>
                        <h2 style={S.stepTitle}>{STEP_TITLES[13]}</h2>
                        <p style={S.stepDesc}>
                            Please review the information below before submitting
                        </p>

                        {/* Referral Source */}
                        <div style={S.reviewBlock}>
                            <h3 style={S.reviewTitle}>
                                Referral Source {renderEditButton(1)}
                            </h3>
                            {renderReviewLine("Type", fmt(formData.referral_source_type))}
                            {renderReviewLine("Name", formData.referral_source_name)}
                            {renderReviewLine("Organization", formData.referral_source_organization)}
                            {renderReviewLine("Title", formData.referral_source_title)}
                            {renderReviewLine("Email", formData.referral_source_email)}
                            {renderReviewLine("Phone", formData.referral_source_phone)}
                            {renderReviewLine("Can Provide Collateral", fmt(formData.can_provide_collateral))}
                            {renderReviewLine("Previous Referral", fmt(formData.previous_monarch_referral))}
                            {formData.urgent_placement && (
                                <p style={{ marginBottom: "6px", fontSize: "14px", color: C.warningText, fontWeight: "600" }}>
                                    URGENT PLACEMENT REQUESTED
                                </p>
                            )}
                        </div>

                        {/* Additional Contacts */}
                        <div style={S.reviewBlock}>
                            <h3 style={S.reviewTitle}>
                                Additional Contacts {renderEditButton(2)}
                            </h3>
                            {renderReviewLine("Emergency Contact", formData.emergency_contact_name)}
                            {renderReviewLine("EC Phone", formData.emergency_contact_phone)}
                            {renderReviewLine("EC Relationship", formData.emergency_contact_relationship)}
                            {formData.emergency_contact_can_provide_info && (
                                <p style={{ marginBottom: "6px", fontSize: "14px" }}>
                                    <strong>EC Can Provide Info:</strong> Yes
                                </p>
                            )}
                            {formData.additional_contacts.length > 0 && (
                                <div style={{ marginTop: "8px" }}>
                                    <strong style={{ fontSize: "13px" }}>
                                        Additional Contacts ({formData.additional_contacts.length}):
                                    </strong>
                                    {formData.additional_contacts.map((c, i) => (
                                        <p key={i} style={{ fontSize: "13px", marginBottom: "4px", marginLeft: "12px" }}>
                                            {c.name} {c.organization && `— ${c.organization}`} {c.role && `(${c.role})`}
                                        </p>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Client Demographics */}
                        <div style={S.reviewBlock}>
                            <h3 style={S.reviewTitle}>
                                Client Demographics {renderEditButton(3)}
                            </h3>
                            {renderReviewLine(
                                "Name",
                                [formData.client_first_name, formData.client_middle_name, formData.client_last_name]
                                    .filter(Boolean)
                                    .join(" ")
                            )}
                            {renderReviewLine("Aliases", formData.client_preferred_name)}
                            {renderReviewLine("DOB", formData.client_dob)}
                            {renderReviewLine("Gender", fmt(formData.client_gender))}
                            {renderReviewLine("Sex at Birth", fmt(formData.client_sex_at_birth))}
                            {renderReviewLine("Pronouns", fmt(formData.client_pronouns))}
                            {renderReviewLine("Language", formData.client_primary_language)}
                            {renderReviewLine("English Proficiency", fmt(formData.client_english_proficiency))}
                            {formData.interpreter_needed && renderReviewLine("Interpreter Needed", "Yes")}
                            {renderReviewLine("Ethnicity", fmt(formData.client_ethnicity))}
                            {renderReviewLine("Marital Status", fmt(formData.client_marital_status))}
                            {renderReviewLine("Client Phone", formData.client_phone)}
                            {renderReviewLine("Client Email", formData.client_email)}
                            {renderReviewLine("Consents to Referral", fmt(formData.client_consents_to_referral))}
                        </div>

                        {/* Documents */}
                        <div style={S.reviewBlock}>
                            <h3 style={S.reviewTitle}>
                                Documents & Identification {renderEditButton(4)}
                            </h3>
                            {formData.documents_available.length > 0 ? (
                                <p style={{ fontSize: "14px", marginBottom: "6px" }}>
                                    <strong>Available:</strong>{" "}
                                    {formData.documents_available
                                        .map((d) => {
                                            const found = DOCUMENT_OPTIONS.find((o) => o.value === d)
                                            return found ? found.label : d
                                        })
                                        .join(", ")}
                                </p>
                            ) : (
                                <p style={{ fontSize: "14px", color: C.textMuted }}>No documents selected</p>
                            )}
                            {renderReviewLine("Notes", formData.documents_notes)}
                        </div>

                        {/* Insurance */}
                        <div style={S.reviewBlock}>
                            <h3 style={S.reviewTitle}>
                                Insurance & Benefits {renderEditButton(5)}
                            </h3>
                            {renderReviewLine("Medicaid", fmt(formData.medicaid_status))}
                            {renderReviewLine("Medicaid #", formData.medicaid_number)}
                            {renderReviewLine("Medicare", fmt(formData.medicare_status))}
                            {renderReviewLine("Medicare #", formData.medicare_number)}
                            {formData.has_private_insurance && renderReviewLine("Private Insurance", formData.private_insurance_details || "Yes")}
                            {renderReviewLine("SSI/SSDI", fmt(formData.ssdi_status))}
                            {renderReviewLine("Benefits Notes", formData.benefits_notes)}
                        </div>

                        {/* Legal */}
                        <div style={S.reviewBlock}>
                            <h3 style={S.reviewTitle}>
                                Legal Status & Court {renderEditButton(6)}
                            </h3>
                            {renderReviewLine("Jurisdiction", formData.court_jurisdiction)}
                            {renderReviewLine("Case Number", formData.case_number)}
                            {renderReviewLine("Judge", formData.judge_name)}
                            {renderReviewLine("Courtroom", formData.courtroom)}
                            {renderReviewLine("Next Court Date", formData.next_court_date)}
                            {renderReviewLine("Charges", formData.charges)}
                            {renderReviewLine("Competency Status", fmt(formData.competency_status))}
                            {renderReviewLine("Eval Date", formData.competency_eval_date)}
                            {renderReviewLine("Evaluator", formData.competency_evaluator)}
                            {renderReviewLine("Attorney", formData.attorney_name)}
                            {renderReviewLine("Attorney Phone", formData.attorney_phone)}
                            {renderReviewLine("Attorney Email", formData.attorney_email)}
                            {formData.on_probation && renderReviewLine("Probation", formData.probation_officer_contact || "Yes")}
                            {formData.on_parole && renderReviewLine("Parole", formData.parole_officer_contact || "Yes")}
                            {renderReviewLine("Active Warrants", fmt(formData.active_warrants))}
                            {renderReviewLine("Bond Holds", fmt(formData.has_bond_holds))}
                            {renderReviewLine("Bond Details", formData.bond_holds_details)}
                            {renderReviewLine("PR Bond to Monarch", fmt(formData.pr_bond_to_monarch))}
                        </div>

                        {/* Location */}
                        <div style={S.reviewBlock}>
                            <h3 style={S.reviewTitle}>
                                Current Location {renderEditButton(7)}
                            </h3>
                            {renderReviewLine("Location Type", fmt(formData.current_location_type))}
                            {renderReviewLine("Facility", formData.facility_name)}
                            {renderReviewLine("Facility Address", formData.facility_address)}
                            {renderReviewLine("Inmate/Patient ID", formData.inmate_id)}
                            {renderReviewLine("Facility Contact", formData.facility_contact_person)}
                            {renderReviewLine("Facility Phone", formData.facility_contact_phone)}
                            {formData.currently_incarcerated && renderReviewLine("Currently Incarcerated", "Yes")}
                            {renderReviewLine("Expected Release", formData.expected_release_date)}
                            {renderReviewLine("Prior Housing", fmt(formData.housing_prior))}
                            {renderReviewLine("Post-Program Housing", fmt(formData.housing_post_program))}
                            {renderReviewLine("Housing Notes", formData.housing_notes)}
                        </div>

                        {/* Clinical */}
                        <div style={S.reviewBlock}>
                            <h3 style={S.reviewTitle}>
                                Mental Health & Clinical {renderEditButton(8)}
                            </h3>
                            {renderReviewLine("Diagnoses", formData.current_diagnoses)}
                            {renderReviewLine("Med Compliance", fmt(formData.medication_compliance))}
                            {renderReviewLine("Psych Medications", formData.current_medications)}
                            {renderReviewLine("Med Barriers", formData.medication_barriers)}
                            {renderReviewLine("Psych History", formData.psychiatric_history)}
                            {renderReviewLine("Previous Programs", formData.previous_treatment_programs)}
                            {renderReviewLine("TBI History", fmt(formData.tbi_history))}
                            {renderReviewLine("TBI Details", formData.tbi_details)}
                            {renderReviewLine("IDD Status", fmt(formData.idd_status))}
                            {renderReviewLine("IDD Details", formData.idd_details)}
                        </div>

                        {/* Substance Use */}
                        <div style={S.reviewBlock}>
                            <h3 style={S.reviewTitle}>
                                Substance Use {renderEditButton(9)}
                            </h3>
                            {renderReviewLine("Pattern", fmt(formData.substance_use_pattern))}
                            {renderReviewLine("Current Use", formData.substance_use_current)}
                            {renderReviewLine("History", formData.substance_use_history)}
                            {renderReviewLine("Detox Required", fmt(formData.detox_required))}
                            {renderReviewLine("Detox Details", formData.detox_details)}
                        </div>

                        {/* Medical */}
                        <div style={S.reviewBlock}>
                            <h3 style={S.reviewTitle}>
                                Medical & Somatic {renderEditButton(10)}
                            </h3>
                            {renderReviewLine("Medical Conditions", formData.medical_conditions)}
                            {renderReviewLine("Controlled by Meds", fmt(formData.medical_conditions_controlled))}
                            {renderReviewLine("Non-Psych Meds", formData.medications_non_psychiatric)}
                            {renderReviewLine("Med Allergies", formData.medication_allergies)}
                            {renderReviewLine("Mobility", fmt(formData.mobility_needs))}
                            {formData.adl_support_needed && renderReviewLine("ADL Support", formData.adl_support_details || "Yes")}
                            {renderReviewLine("Acute Needs", formData.acute_medical_needs)}
                        </div>

                        {/* Safety & Risk */}
                        <div
                            style={{
                                ...S.reviewBlock,
                                backgroundColor: C.warningBg,
                                border: `2px solid ${C.warningBorder}`,
                            }}
                        >
                            <h3 style={{ ...S.reviewTitle, color: C.warningText }}>
                                Safety & Risk Assessment {renderEditButton(11)}
                            </h3>
                            {renderReviewLine("Suicide Risk", fmt(formData.suicide_risk))}
                            {renderReviewLine("Suicide Details", formData.suicide_risk_details)}
                            {renderReviewLine("Violence Risk", fmt(formData.violence_risk))}
                            {renderReviewLine("Violence Details", formData.violence_risk_details)}
                            {renderReviewLine("Elopement Risk", fmt(formData.elopement_risk))}
                            {renderReviewLine("Elopement Details", formData.elopement_risk_details)}
                            {renderReviewLine("Arson", fmt(formData.arson_history))}
                            {renderReviewLine("Arson Details", formData.arson_details)}
                            {renderReviewLine("RSO Status", fmt(formData.rso_status))}
                            {renderReviewLine("RSO Details", formData.rso_details)}
                            {formData.medical_needs && renderReviewLine("Medical Needs", "Yes")}
                            {renderReviewLine("Safety Notes", formData.safety_notes)}
                        </div>

                        {/* Urgency & Notes */}
                        <div style={S.reviewBlock}>
                            <h3 style={S.reviewTitle}>
                                Urgency & Notes {renderEditButton(12)}
                            </h3>
                            {renderReviewLine("Urgency Level", fmt(formData.urgency_level))}
                            {renderReviewLine("Urgency Reason", formData.urgency_reason)}
                            {renderReviewLine("Additional Notes", formData.additional_notes)}
                            {renderReviewLine("How Found Monarch", fmt(formData.referral_source_channel))}
                        </div>

                        {/* Error */}
                        {submitStatus === "error" && (
                            <div
                                style={{
                                    marginBottom: "20px",
                                    padding: "16px",
                                    backgroundColor: C.errorBg,
                                    color: C.error,
                                    borderRadius: "0px",
                                }}
                            >
                                Error submitting referral. Please try again.
                            </div>
                        )}

                        {/* Submit Navigation */}
                        <div style={S.navRow}>
                            <button onClick={() => setCurrentStep(12)} style={S.btnSecondary}>
                                ← Previous
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                style={{
                                    ...S.btnSubmit,
                                    backgroundColor: isSubmitting ? C.moonstone : C.success,
                                    cursor: isSubmitting ? "not-allowed" : "pointer",
                                }}
                            >
                                {isSubmitting ? "Submitting..." : "Submit Referral"}
                            </button>
                        </div>
                    </div>
                )}

                {/* ============================================================ */}
                {/* SUCCESS CONFIRMATION                                         */}
                {/* ============================================================ */}
                {submitStatus === "success" && !showFamilyForm && (
                    <div
                        style={{
                            textAlign: "center",
                            padding: "40px 20px",
                        }}
                    >
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
                            Referral Submitted Successfully
                        </h2>

                        <p style={{ fontSize: "16px", color: C.textMuted, marginBottom: "24px" }}>
                            Thank you for your referral. Our admissions team will review it
                            and follow up shortly.
                        </p>

                        {submittedReferralCode && (
                            <div
                                style={{
                                    backgroundColor: C.shell,
                                    border: `2px solid ${C.moonstone}`,
                                    borderRadius: "0px",
                                    padding: "24px",
                                    marginBottom: "16px",
                                    maxWidth: "400px",
                                    margin: "0 auto 16px auto",
                                }}
                            >
                                <p
                                    style={{
                                        fontSize: "13px",
                                        color: C.textMuted,
                                        marginBottom: "8px",
                                        letterSpacing: "0.04em",
                                        textTransform: "uppercase",
                                        fontWeight: "600",
                                    }}
                                >
                                    Your Referral Code
                                </p>
                                <p
                                    style={{
                                        fontSize: "32px",
                                        fontWeight: "700",
                                        color: C.stoneCloud,
                                        letterSpacing: "0.1em",
                                        marginBottom: "12px",
                                        fontFamily: "monospace",
                                    }}
                                >
                                    {submittedReferralCode}
                                </p>
                                <button
                                    onClick={copyReferralCode}
                                    style={{
                                        padding: "8px 20px",
                                        fontSize: "14px",
                                        fontWeight: "600",
                                        color: codeCopied ? C.success : C.ash,
                                        backgroundColor: codeCopied ? C.successBg : "transparent",
                                        border: `2px solid ${codeCopied ? C.success : C.ash}`,
                                        borderRadius: "0px",
                                        cursor: "pointer",
                                        marginBottom: "12px",
                                        letterSpacing: "0.02em",
                                        transition: "all 0.2s ease",
                                    }}
                                >
                                    {codeCopied ? "Copied!" : "Copy Code"}
                                </button>
                                <p style={{ fontSize: "14px", color: C.textMuted, lineHeight: "1.5" }}>
                                    Save this code to upload documents later. You can visit the
                                    document upload page and enter this code along with your email
                                    address to submit additional documents.
                                </p>
                            </div>
                        )}

                        {submittedReferralCode && (
                            <div
                                style={{
                                    ...S.warningCallout,
                                    maxWidth: "400px",
                                    margin: "0 auto 24px auto",
                                    textAlign: "center",
                                    fontWeight: "600",
                                }}
                            >
                                This code will not be displayed again. Please copy or write it down now.
                            </div>
                        )}

                        {/* File upload warning (if some files failed) */}
                        {fileUploadError && (
                            <div
                                style={{
                                    ...S.warningCallout,
                                    maxWidth: "500px",
                                    margin: "0 auto 24px auto",
                                    textAlign: "left",
                                }}
                            >
                                {fileUploadError}
                            </div>
                        )}

                        <div
                            style={{
                                backgroundColor: C.infoBg,
                                border: `1px solid ${C.infoBorder}`,
                                borderRadius: "0px",
                                padding: "20px",
                                marginBottom: "24px",
                                textAlign: "left",
                                maxWidth: "500px",
                                margin: "0 auto 24px auto",
                            }}
                        >
                            <p
                                style={{
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    color: C.infoText,
                                    marginBottom: "8px",
                                }}
                            >
                                What Happens Next
                            </p>
                            <ul
                                style={{
                                    fontSize: "14px",
                                    color: C.infoText,
                                    margin: 0,
                                    paddingLeft: "20px",
                                    lineHeight: "1.6",
                                }}
                            >
                                <li>Our admissions team will review your referral</li>
                                <li>We may follow up for additional information</li>
                                <li>You will receive confirmation at your provided email</li>
                                <li>Use your referral code to upload supporting documents anytime</li>
                            </ul>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
                            <button
                                onClick={() => { setSessionTimeLeft(null); resetForm() }}
                                style={{
                                    ...S.btnSecondary,
                                    color: C.success,
                                    borderColor: C.success,
                                    width: "100%",
                                    maxWidth: "320px",
                                }}
                            >
                                Submit Another Referral
                            </button>

                            <button
                                onClick={() => {
                                    setSessionTimeLeft(null)
                                    try {
                                        window.location.href = `https://monarchy.framer.website/submit-referrals/documents?code=${submittedReferralCode}`
                                    } catch (_e) {
                                        // Fallback
                                    }
                                }}
                                style={{
                                    ...S.btnSecondary,
                                    color: C.ash,
                                    borderColor: C.ash,
                                    width: "100%",
                                    maxWidth: "320px",
                                }}
                            >
                                Upload Documents
                            </button>

                            <button
                                onClick={handleSignOut}
                                style={{
                                    padding: "10px 24px",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    color: C.textMuted,
                                    backgroundColor: "transparent",
                                    border: "none",
                                    borderRadius: "0px",
                                    cursor: "pointer",
                                    width: "100%",
                                    maxWidth: "320px",
                                }}
                            >
                                Sign Off
                            </button>
                        </div>

                        {/* Session timeout countdown */}
                        {sessionTimeLeft !== null && sessionTimeLeft <= 60 && sessionTimeLeft > 0 && (
                            <p
                                style={{
                                    fontSize: "13px",
                                    color: C.textMuted,
                                    marginTop: "20px",
                                    textAlign: "center",
                                }}
                            >
                                Session ending in {Math.floor(sessionTimeLeft / 60)}:{String(sessionTimeLeft % 60).padStart(2, "0")}...
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
