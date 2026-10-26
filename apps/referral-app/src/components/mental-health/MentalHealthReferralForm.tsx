import React, { useEffect, useMemo, useState } from "react"
import type { CSSProperties } from "react"
import { createAuthGatewaySupabase } from "../../lib/supabaseAuth"
import { portalPath } from "../../config/program"
import {
    MH_COLORS,
    MH_MARKETING_SITE_URL,
    submitMentalHealthReferralsDocumentsPath,
    submitMentalHealthReferralsPath,
} from "../../config/mentalHealth"
import {
    ARSON_OPTIONS,
    CMHS_WAIVER_OPTIONS,
    CONSENT_OPTIONS,
    DETOX_OPTIONS,
    DISCHARGE_TYPE_OPTIONS,
    DOCUMENT_CHECKLIST,
    DOSE_UNIT_OPTIONS,
    ENGLISH_PROFICIENCY_OPTIONS,
    ETHNICITY_OPTIONS,
    FACILITY_LOCATIONS,
    FREQUENCY_OPTIONS,
    GENDER_IDENTITY_OPTIONS,
    HOW_HEARD_OPTIONS,
    HOUSING_PRIOR_OPTIONS,
    IDD_OPTIONS,
    LOC_LEVEL_OPTIONS,
    LOCATION_OPTIONS,
    MARITAL_OPTIONS,
    MED_ADHERENCE_OPTIONS,
    MED_FREQUENCY_OPTIONS,
    MEDICAL_CONTROLLED_OPTIONS,
    MEDICARE_OPTIONS,
    MEDICAID_STATUS_OPTIONS,
    MH_STEP_SHORT_LABELS,
    MILITARY_OPTIONS,
    MOBILITY_OPTIONS,
    PATTERN_OF_USE_OPTIONS,
    PRONOUN_OPTIONS,
    RAE_OPTIONS,
    RACE_OPTIONS,
    RELATIONSHIP_OPTIONS,
    RISK_TIMELINE_OPTIONS,
    ROI_PERMISSION_OPTIONS,
    ROUTE_OPTIONS,
    RSO_OPTIONS,
    SEX_AT_BIRTH_OPTIONS,
    SSDI_OPTIONS,
    SUPERVISION_OPTIONS,
    TBI_OPTIONS,
    TREATMENT_LEVELS,
    URGENCY_OPTIONS,
    YES_NO,
    YES_NO_UNKNOWN,
    mapProfileTypeToMhRelationship,
    splitDisplayName,
    type Opt,
} from "./mhOptions"
import { CMA_BY_RAE, RAE_REGION_OPTIONS, cmaLabel, findCma, type RaeId } from "./mhRaeCma"
import { SUBSTANCE_GROUPS, SUBSTANCE_OPTIONS } from "./mhSubstances"
import {
    emptyContact,
    emptyCourtCaseRow,
    emptyMedicationRow,
    emptyPrescriberRow,
    emptySubstanceRow,
    emptyWarrantRow,
    initialMhFormState,
    personLabel,
    personSubject,
    wordingMode,
    type ActiveWarrantRow,
    type CourtCaseRow,
    type MedicationRow,
    type MhContact,
    type MhFormState,
    type PrescriberRow,
    type SubstanceRow,
    type TreatmentRow,
} from "./mhTypes"
import { buildMhInsertPayload, validateMhSubmit } from "./mhBuildPayload"

const supabase = createAuthGatewaySupabase("source")!

async function readInvokeError(err: unknown): Promise<string> {
    if (!err || typeof err !== "object") return String(err ?? "")
    const e = err as { message?: string; context?: { json?: () => Promise<unknown> } }
    if (e.context && typeof e.context.json === "function") {
        try {
            const body = (await e.context.json()) as { error?: string; message?: string; details?: string }
            if (body?.error) return body.details ? `${body.error} — ${body.details}` : body.error
            if (body?.message) return body.message
        } catch {
            // ignore
        }
    }
    return e.message || ""
}

const FONT = `"Montserrat", sans-serif`
const C = {
    ink: MH_COLORS.dark,
    blue: MH_COLORS.blue,
    blueMuted: MH_COLORS.blueMuted,
    blueBorder: MH_COLORS.blueBorder,
    white: "#FFFFFF",
    muted: "rgba(29, 29, 27, 0.62)",
    border: "rgba(29, 29, 27, 0.12)",
    borderLight: "#D6D3D1",
    error: "#8A2F2F",
    shell: "#F7F8F8",
} as const

const INPUT: CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    fontSize: "15px",
    fontFamily: FONT,
    color: C.ink,
    border: `1px solid ${C.border}`,
    borderRadius: "8px",
    backgroundColor: C.white,
    outline: "none",
    boxSizing: "border-box",
}

const LABEL: CSSProperties = {
    display: "block",
    fontSize: "13px",
    fontWeight: 600,
    color: C.ink,
    marginBottom: "6px",
}

const BTN_PRIMARY: CSSProperties = {
    padding: "12px 24px",
    fontSize: "15px",
    fontWeight: 600,
    fontFamily: FONT,
    color: C.white,
    backgroundColor: C.blue,
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
}

const BTN_SECONDARY: CSSProperties = {
    ...BTN_PRIMARY,
    color: C.ink,
    backgroundColor: "transparent",
    border: `1px solid ${C.border}`,
}

function formatPhone(raw: string): string {
    const d = raw.replace(/\D/g, "").slice(0, 10)
    if (d.length >= 6) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
    if (d.length >= 3) return `(${d.slice(0, 3)}) ${d.slice(3)}`
    if (d.length > 0) return `(${d}`
    return ""
}

function Field({
    label,
    children,
    hint,
}: {
    label: string
    children: React.ReactNode
    hint?: string
}) {
    return (
        <div style={{ marginBottom: "16px" }}>
            <label style={LABEL}>{label}</label>
            {hint ? <p style={{ margin: "0 0 6px", fontSize: "12px", color: C.muted }}>{hint}</p> : null}
            {children}
        </div>
    )
}

function RadioGroup({
    name,
    value,
    options,
    onChange,
    columns = 2,
}: {
    name: string
    value: string
    options: Opt[]
    onChange: (v: string) => void
    columns?: number
}) {
    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                gap: "8px 12px",
            }}
        >
            {options.map((o) => (
                <label
                    key={o.value}
                    style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "14px", cursor: "pointer" }}
                >
                    <input
                        type="radio"
                        name={name}
                        checked={value === o.value}
                        onChange={() => onChange(o.value)}
                        style={{ marginTop: "3px" }}
                    />
                    <span>{o.label}</span>
                </label>
            ))}
        </div>
    )
}

function CheckGroup({
    values,
    options,
    onChange,
    columns = 2,
}: {
    values: string[]
    options: Opt[]
    onChange: (next: string[]) => void
    columns?: number
}) {
    const toggle = (v: string) => {
        onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v])
    }
    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                gap: "8px 12px",
            }}
        >
            {options.map((o) => (
                <label
                    key={o.value}
                    style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "14px", cursor: "pointer" }}
                >
                    <input
                        type="checkbox"
                        checked={values.includes(o.value)}
                        onChange={() => toggle(o.value)}
                        style={{ marginTop: "3px" }}
                    />
                    <span>{o.label}</span>
                </label>
            ))}
        </div>
    )
}

function Select({
    value,
    options,
    onChange,
    empty = "Select…",
}: {
    value: string
    options: Opt[]
    onChange: (v: string) => void
    empty?: string
}) {
    return (
        <select value={value} onChange={(e) => onChange(e.target.value)} style={INPUT}>
            <option value="">{empty}</option>
            {options.map((o) => (
                <option key={o.value} value={o.value}>
                    {o.label}
                </option>
            ))}
        </select>
    )
}

function TrashIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
                d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

function MedicationTable({
    rows,
    onChange,
    isMobile,
}: {
    rows: MedicationRow[]
    onChange: (rows: MedicationRow[]) => void
    isMobile: boolean
}) {
    const patch = (i: number, p: Partial<MedicationRow>) => {
        const next = [...rows]
        next[i] = { ...next[i], ...p }
        onChange(next)
    }
    return (
        <div>
            {!isMobile ? (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "2fr 1fr 1fr 1.2fr 36px",
                        gap: "8px",
                        marginBottom: "6px",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: C.muted,
                    }}
                >
                    <span>Medication</span>
                    <span>Dose</span>
                    <span>Type</span>
                    <span>Frequency</span>
                    <span />
                </div>
            ) : null}
            {rows.map((row, i) => (
                <div
                    key={i}
                    style={{
                        display: "grid",
                        gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr 1fr 1.2fr 36px",
                        gap: "8px",
                        marginBottom: "8px",
                        alignItems: "center",
                    }}
                >
                    <input
                        style={INPUT}
                        placeholder="Medication name"
                        value={row.name}
                        onChange={(e) => patch(i, { name: e.target.value })}
                    />
                    <input
                        style={INPUT}
                        inputMode="decimal"
                        placeholder="0.0"
                        value={row.dose}
                        onChange={(e) => patch(i, { dose: e.target.value.replace(/[^\d.]/g, "") })}
                    />
                    <Select value={row.dose_unit} options={DOSE_UNIT_OPTIONS} onChange={(v) => patch(i, { dose_unit: v })} empty="Type" />
                    <Select value={row.frequency} options={MED_FREQUENCY_OPTIONS} onChange={(v) => patch(i, { frequency: v })} empty="Frequency" />
                    <button
                        type="button"
                        title="Remove medication"
                        aria-label="Remove medication"
                        onClick={() => onChange(rows.filter((_, j) => j !== i))}
                        style={{
                            ...BTN_SECONDARY,
                            padding: "8px",
                            color: C.error,
                            borderColor: C.borderLight,
                            display: "inline-flex",
                            justifyContent: "center",
                        }}
                    >
                        <TrashIcon />
                    </button>
                </div>
            ))}
            <button
                type="button"
                style={{ ...BTN_SECONDARY, padding: "8px 12px", fontSize: "13px" }}
                onClick={() => onChange([...rows, emptyMedicationRow()])}
            >
                Add medication
            </button>
        </div>
    )
}

function PrescriberList({
    rows,
    onChange,
    isMobile,
    label = "Prescriber",
}: {
    rows: PrescriberRow[]
    onChange: (rows: PrescriberRow[]) => void
    isMobile: boolean
    label?: string
}) {
    return (
        <div>
            {rows.map((row, i) => (
                <div
                    key={i}
                    style={{
                        display: "grid",
                        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr auto",
                        gap: "10px",
                        marginBottom: "10px",
                        alignItems: "end",
                    }}
                >
                    <Field label={`${label}${rows.length > 1 ? ` ${i + 1}` : ""}`}>
                        <input
                            style={INPUT}
                            value={row.name}
                            onChange={(e) => {
                                const next = [...rows]
                                next[i] = { ...next[i], name: e.target.value }
                                onChange(next)
                            }}
                        />
                    </Field>
                    <Field label="Prescriber phone">
                        <input
                            style={INPUT}
                            value={row.phone}
                            onChange={(e) => {
                                const next = [...rows]
                                next[i] = { ...next[i], phone: formatPhone(e.target.value) }
                                onChange(next)
                            }}
                        />
                    </Field>
                    {rows.length > 1 ? (
                        <button
                            type="button"
                            title="Remove prescriber"
                            aria-label="Remove prescriber"
                            onClick={() => onChange(rows.filter((_, j) => j !== i))}
                            style={{ ...BTN_SECONDARY, padding: "10px", marginBottom: "16px", color: C.error }}
                        >
                            <TrashIcon />
                        </button>
                    ) : (
                        <span />
                    )}
                </div>
            ))}
            <button
                type="button"
                style={{ ...BTN_SECONDARY, padding: "8px 12px", fontSize: "13px", marginBottom: "12px" }}
                onClick={() => onChange([...rows, emptyPrescriberRow()])}
            >
                Add prescriber
            </button>
        </div>
    )
}

function StepRail({
    steps,
    currentIndex,
    onSelect,
    mobile,
}: {
    steps: { id: number; label: string }[]
    currentIndex: number
    onSelect: (i: number) => void
    mobile: boolean
}) {
    if (mobile) {
        return (
            <nav aria-label="Form steps" style={{ overflowX: "auto", marginBottom: "12px" }}>
                <div style={{ display: "flex", gap: "8px", minWidth: "min-content" }}>
                    {steps.map((s, i) => {
                        const active = i === currentIndex
                        return (
                            <button
                                key={s.id}
                                type="button"
                                onClick={() => onSelect(i)}
                                style={{
                                    whiteSpace: "nowrap",
                                    padding: "8px 12px",
                                    borderRadius: "8px",
                                    border: active ? `1px solid ${C.blue}` : `1px solid ${C.borderLight}`,
                                    background: active ? C.blueMuted : C.white,
                                    cursor: "pointer",
                                    fontFamily: FONT,
                                    fontSize: "12px",
                                    fontWeight: active ? 700 : 500,
                                    color: C.ink,
                                }}
                            >
                                {i + 1}. {s.label}
                            </button>
                        )
                    })}
                </div>
            </nav>
        )
    }
    return (
        <nav
            aria-label="Form steps"
            style={{ width: "200px", flexShrink: 0, position: "sticky", top: "16px", alignSelf: "flex-start" }}
        >
            <p
                style={{
                    margin: "0 0 12px",
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: C.muted,
                }}
            >
                Steps
            </p>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {steps.map((s, i) => {
                    const active = i === currentIndex
                    return (
                        <li key={s.id} style={{ marginBottom: "4px" }}>
                            <button
                                type="button"
                                onClick={() => onSelect(i)}
                                style={{
                                    display: "block",
                                    width: "100%",
                                    textAlign: "left",
                                    padding: "8px 10px",
                                    borderRadius: "8px",
                                    border: "none",
                                    cursor: "pointer",
                                    fontFamily: FONT,
                                    background: active ? C.blueMuted : "transparent",
                                }}
                            >
                                <span style={{ display: "block", fontSize: "11px", fontWeight: 600, color: C.muted }}>
                                    Step {i + 1}
                                </span>
                                <span
                                    style={{
                                        display: "block",
                                        fontSize: "13px",
                                        fontWeight: active ? 700 : 500,
                                        color: C.ink,
                                    }}
                                >
                                    {s.label}
                                </span>
                            </button>
                        </li>
                    )
                })}
            </ul>
        </nav>
    )
}

const ALL_STEP_IDS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] as const

export default function MentalHealthReferralForm() {
    const [form, setForm] = useState<MhFormState>(() => initialMhFormState())
    const [stepIndex, setStepIndex] = useState(0)
    const [authStatus, setAuthStatus] = useState<"checking" | "authenticated" | "unauthenticated">("checking")
    const [userEmail, setUserEmail] = useState("")
    const [isMobile, setIsMobile] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")
    const [submitError, setSubmitError] = useState("")
    const [referralCode, setReferralCode] = useState("")
    /** Honeypot for public submit — leave empty. */
    const [companyUrl, setCompanyUrl] = useState("")
    const [savedProfile, setSavedProfile] = useState<{
        display_name: string | null
        organization: string | null
        title: string | null
        phone: string | null
        referral_source_type: string | null
    } | null>(null)
    const isPublicSubmit = authStatus === "unauthenticated"

    const applySavedProfile = (prev: MhFormState, prof: NonNullable<typeof savedProfile>, email: string): MhFormState => {
        const { first, last } = splitDisplayName(prof.display_name || "")
        const digits = String(prof.phone ?? "").replace(/\D/g, "")
        const mappedType = mapProfileTypeToMhRelationship(prof.referral_source_type)
        return {
            ...prev,
            referral_source_email: prev.referral_source_email || email,
            referral_source_first: prev.referral_source_first || first,
            referral_source_last: prev.referral_source_last || last,
            referral_source_organization: prev.referral_source_organization || (prof.organization?.trim() || ""),
            referral_source_title: prev.referral_source_title || (prof.title?.trim() || ""),
            referral_source_phone: prev.referral_source_phone || formatPhone(digits),
            // Only prefill relationship when it maps cleanly to an MH option
            referral_source_type: prev.referral_source_type || mappedType,
        }
    }

    const mode = wordingMode(form.referral_source_type)
    const pl = personLabel(mode)
    const ps = personSubject(mode)

    const visibleSteps = useMemo(() => {
        return ALL_STEP_IDS.filter((id) => {
            if (id === 0 && mode === "self") return false
            if (id === 1 && mode !== "professional") return false
            return true
        }).map((id) => ({ id, label: MH_STEP_SHORT_LABELS[id] }))
    }, [mode])

    useEffect(() => {
        if (stepIndex >= visibleSteps.length) setStepIndex(Math.max(0, visibleSteps.length - 1))
    }, [visibleSteps.length, stepIndex])

    const currentStepId = visibleSteps[stepIndex]?.id ?? 0

    useEffect(() => {
        const mq = window.matchMedia("(max-width: 860px)")
        const apply = () => setIsMobile(mq.matches)
        apply()
        mq.addEventListener("change", apply)
        return () => mq.removeEventListener("change", apply)
    }, [])

    useEffect(() => {
        const check = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession()
            if (session?.user) {
                setAuthStatus("authenticated")
                const email = session.user.email || ""
                setUserEmail(email)
                setForm((prev) => ({ ...prev, referral_source_email: prev.referral_source_email || email }))
            } else {
                setAuthStatus("unauthenticated")
            }
        }
        check()
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_e, session) => {
            if (session?.user) {
                setAuthStatus("authenticated")
                const email = session.user.email || ""
                setUserEmail(email)
                setForm((prev) => ({ ...prev, referral_source_email: prev.referral_source_email || email }))
            } else {
                setAuthStatus("unauthenticated")
                setUserEmail("")
                setSavedProfile(null)
            }
        })
        return () => subscription.unsubscribe()
    }, [])

    // Prefill referrer contact from referral_source_profiles (same source Competency uses).
    useEffect(() => {
        if (authStatus !== "authenticated") return
        let cancelled = false
        ;(async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession()
            const uid = session?.user?.id
            const email = session?.user?.email || ""
            if (!uid) return

            const { data: profile, error } = await supabase
                .from("referral_source_profiles")
                .select("display_name, organization, title, phone, referral_source_type")
                .eq("user_id", uid)
                .maybeSingle()
            if (error) console.warn("[MH referral] saved contact profile read:", error)
            if (cancelled) return

            const prof = (profile as {
                display_name: string | null
                organization: string | null
                title: string | null
                phone: string | null
                referral_source_type: string | null
            } | null) || null

            setSavedProfile(prof)
            if (!prof) return

            const hasAny =
                !!(prof.display_name?.trim()) ||
                !!(prof.organization?.trim()) ||
                !!(prof.title?.trim()) ||
                String(prof.phone ?? "").replace(/\D/g, "").length >= 7 ||
                !!(prof.referral_source_type?.trim())
            if (!hasAny) return

            setForm((prev) => applySavedProfile(prev, prof, email))
        })()
        return () => {
            cancelled = true
        }
    }, [authStatus])

    const set = <K extends keyof MhFormState>(key: K, value: MhFormState[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }))
    }

    const patchContact = (index: number, patch: Partial<MhContact>) => {
        setForm((prev) => {
            const contacts = [...prev.contacts]
            contacts[index] = { ...contacts[index], ...patch }
            return { ...prev, contacts }
        })
    }

    const goNext = () => setStepIndex((i) => Math.min(i + 1, visibleSteps.length - 1))
    const goBack = () => setStepIndex((i) => Math.max(i - 1, 0))

    const handleSubmit = async () => {
        setIsSubmitting(true)
        setSubmitError("")
        setSubmitStatus("idle")
        try {
            const {
                data: { session },
            } = await supabase.auth.getSession()
            // referral_source_email / name / type are NOT NULL — fill from session when needed
            const sessionEmail = (session?.user?.email || userEmail || "").trim()
            const formForSubmit: MhFormState = {
                ...form,
                referral_source_email: form.referral_source_email.trim() || sessionEmail,
            }
            const err = validateMhSubmit(formForSubmit)
            if (err) {
                setSubmitError(err)
                setSubmitStatus("error")
                setIsSubmitting(false)
                return
            }
            const isLoggedIn = !!session?.user?.id
            const payload = buildMhInsertPayload(formForSubmit, session?.user?.id ?? null, {
                submittedVia: isLoggedIn ? "portal" : "public_web",
            })

            let submittedId: string | undefined
            let code = ""

            if (isLoggedIn) {
                const { data, error } = await supabase
                    .from("referral_submissions")
                    .insert([payload])
                    .select("id, referral_code")
                if (error) {
                    const parts = [error.message, error.details, error.hint, error.code].filter(Boolean)
                    throw new Error(parts.join(" — ") || "Could not submit referral.")
                }
                submittedId = data?.[0]?.id as string | undefined
                code = (data?.[0]?.referral_code as string | undefined) || ""

                if (submittedId) {
                    void supabase.functions
                        .invoke("monarch-mh-referral-submitted-notify", {
                            body: { referral_id: submittedId },
                        })
                        .then(({ data: notifyData, error: notifyErr }) => {
                            if (notifyErr || (notifyData as { error?: string } | null)?.error) {
                                console.warn("[MH referral] submitted notify:", notifyErr, notifyData)
                            }
                        })
                        .catch((err) => console.warn("[MH referral] submitted notify:", err))
                }
            } else {
                // Public path: service-role edge insert (RLS blocks anon writes).
                const { data: fnData, error: fnErr } = await supabase.functions.invoke(
                    "monarch-mh-referral-public-submit",
                    {
                        body: {
                            payload,
                            company_url: companyUrl,
                        },
                    }
                )
                const result = fnData as {
                    ok?: boolean
                    id?: string
                    referral_code?: string | null
                    error?: string
                    details?: string
                    honey?: boolean
                } | null
                if (fnErr || result?.error) {
                    const detail = result?.error || result?.details || (await readInvokeError(fnErr))
                    throw new Error(detail || "Could not submit referral.")
                }
                if (result?.honey) {
                    // Bot honeypot — pretend success without a real code.
                    setReferralCode("")
                    setSubmitStatus("success")
                    return
                }
                submittedId = result?.id
                code = result?.referral_code || ""
            }

            const uid = session?.user?.id
            if (uid) {
                const displayName =
                    `${formForSubmit.referral_source_first} ${formForSubmit.referral_source_last}`.trim() || null
                const phoneDigits = (formForSubmit.referral_source_phone || "").replace(/\D/g, "") || null
                const { data: existing } = await supabase
                    .from("referral_source_profiles")
                    .select("fax, preferred_contact_method, notification_preferences, portal_access_preferred, portal_terms_acknowledged_at")
                    .eq("user_id", uid)
                    .maybeSingle()
                const prev = (existing || {}) as Record<string, unknown>
                const { error: upsertErr } = await supabase.from("referral_source_profiles").upsert(
                    {
                        user_id: uid,
                        referral_source_type: formForSubmit.referral_source_type?.trim() || null,
                        display_name: displayName,
                        organization: formForSubmit.referral_source_organization?.trim() || null,
                        title: formForSubmit.referral_source_title?.trim() || null,
                        phone: phoneDigits,
                        fax: (prev.fax as string | null | undefined) ?? null,
                        preferred_contact_method: (prev.preferred_contact_method as string | null | undefined) ?? null,
                        notification_preferences: (prev.notification_preferences as object | undefined) ?? {},
                        portal_access_preferred: (prev.portal_access_preferred as boolean | null | undefined) ?? true,
                        portal_terms_acknowledged_at:
                            (prev.portal_terms_acknowledged_at as string | null | undefined) ?? null,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: "user_id" }
                )
                if (upsertErr) console.warn("[MH referral] referral_source_profiles upsert:", upsertErr)
                else {
                    setSavedProfile({
                        display_name: displayName,
                        organization: formForSubmit.referral_source_organization?.trim() || null,
                        title: formForSubmit.referral_source_title?.trim() || null,
                        phone: phoneDigits,
                        referral_source_type: formForSubmit.referral_source_type?.trim() || null,
                    })
                }
            }

            setReferralCode(code)
            setSubmitStatus("success")
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Could not submit referral."
            console.error("[MH referral submit]", e)
            setSubmitError(msg)
            setSubmitStatus("error")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (authStatus === "checking") {
        return (
            <div style={{ padding: "48px 24px", textAlign: "center", fontFamily: FONT, color: C.muted }}>
                Loading…
            </div>
        )
    }

    if (submitStatus === "success") {
        const docsMailto = `mailto:referrals@monarchmentalhealth.org?subject=${encodeURIComponent(
            referralCode ? `MH referral documents — ${referralCode}` : "MH referral documents"
        )}`
        const loginPartners = `/login?bucket=source&redirect=${encodeURIComponent(portalPath())}`
        return (
            <div style={{ maxWidth: "640px", margin: "48px auto", padding: "24px", fontFamily: FONT }}>
                <div
                    style={{
                        background: C.white,
                        border: `1px solid ${C.blueBorder}`,
                        borderRadius: "12px",
                        padding: "28px",
                    }}
                >
                    <h1 style={{ marginTop: 0, color: C.ink }}>Referral submitted</h1>
                    <p style={{ color: C.muted, lineHeight: 1.5 }}>
                        Thank you. Admissions has received this Mental Health referral.
                    </p>
                    {referralCode ? (
                        <p style={{ fontSize: "18px", fontWeight: 700, color: C.ink }}>
                            Referral code: <span style={{ color: C.blue }}>{referralCode}</span>
                        </p>
                    ) : null}
                    {isPublicSubmit ? (
                        <p style={{ color: C.muted, lineHeight: 1.5, fontSize: "14px" }}>
                            To send supporting documents, email them to{" "}
                            <a href={docsMailto} style={{ color: C.blue }}>
                                referrals@monarchmentalhealth.org
                            </a>
                            {referralCode ? (
                                <>
                                    {" "}
                                    and include referral code <strong>{referralCode}</strong> in the subject
                                    line.
                                </>
                            ) : (
                                "."
                            )}{" "}
                            Or call admissions at 1 (800) 618-8719 (ext. 0).
                        </p>
                    ) : null}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "20px" }}>
                        {!isPublicSubmit ? (
                            <>
                                <a
                                    href={submitMentalHealthReferralsDocumentsPath(referralCode || undefined)}
                                    style={{ ...BTN_PRIMARY, textDecoration: "none" }}
                                >
                                    Upload documents
                                </a>
                                <a href={portalPath()} style={{ ...BTN_SECONDARY, textDecoration: "none" }}>
                                    Back to portal
                                </a>
                            </>
                        ) : (
                            <a href={docsMailto} style={{ ...BTN_PRIMARY, textDecoration: "none" }}>
                                Email documents
                            </a>
                        )}
                        <button
                            type="button"
                            style={BTN_SECONDARY}
                            onClick={() => {
                                const base = initialMhFormState(userEmail)
                                setForm(savedProfile ? applySavedProfile(base, savedProfile, userEmail) : base)
                                setStepIndex(0)
                                setSubmitStatus("idle")
                                setReferralCode("")
                                setCompanyUrl("")
                            }}
                        >
                            Submit another
                        </button>
                        {isPublicSubmit ? (
                            <a href={loginPartners} style={{ ...BTN_SECONDARY, textDecoration: "none" }}>
                                Referral partner sign-in
                            </a>
                        ) : null}
                    </div>
                </div>
            </div>
        )
    }

    const sectionTitle = (n: number, title: string) => (
        <h2 style={{ margin: "0 0 8px", fontSize: "22px", letterSpacing: "-0.02em", color: C.ink }}>
            {n} · {title}
        </h2>
    )

    const navRow = (
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", marginTop: "28px" }}>
            <button type="button" style={BTN_SECONDARY} onClick={goBack} disabled={stepIndex === 0}>
                Back
            </button>
            {stepIndex < visibleSteps.length - 1 ? (
                <button type="button" style={BTN_PRIMARY} onClick={goNext}>
                    Continue
                </button>
            ) : (
                <button type="button" style={BTN_PRIMARY} onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? "Submitting…" : "Submit referral"}
                </button>
            )}
        </div>
    )

    return (
        <div style={{ minHeight: "100vh", background: C.shell, fontFamily: FONT, color: C.ink }}>
            <div style={{ maxWidth: "1080px", margin: "0 auto", padding: isMobile ? "20px 16px 48px" : "32px 24px 64px" }}>
                <div style={{ marginBottom: "20px" }}>
                    <p style={{ margin: 0, fontSize: "12px", fontWeight: 700, letterSpacing: "0.08em", color: C.blue, textTransform: "uppercase" }}>
                        Monarch Mental Health
                    </p>
                    <h1 style={{ margin: "6px 0 0", fontSize: isMobile ? "26px" : "32px", letterSpacing: "-0.03em" }}>
                        Program referral
                    </h1>
                    {isPublicSubmit ? (
                        <p style={{ margin: "8px 0 0", color: C.muted, fontSize: "14px", lineHeight: 1.5 }}>
                            No account needed. Self-referrals, family, and professionals without a portal login
                            can submit here.{" "}
                            <a
                                href={`/login?bucket=source&redirect=${encodeURIComponent(submitMentalHealthReferralsPath())}`}
                                style={{ color: C.blue }}
                            >
                                Referral partners: sign in
                            </a>
                            {" · "}
                            <a href={MH_MARKETING_SITE_URL} style={{ color: C.blue }}>
                                Website
                            </a>
                        </p>
                    ) : (
                        <p style={{ margin: "8px 0 0", color: C.muted, fontSize: "14px" }}>
                            Signed in as {userEmail}.{" "}
                            <a href={portalPath()} style={{ color: C.blue }}>
                                Portal
                            </a>
                            {" · "}
                            <a href={MH_MARKETING_SITE_URL} style={{ color: C.blue }}>
                                Website
                            </a>
                        </p>
                    )}
                </div>

                <div style={{ display: "flex", gap: isMobile ? 0 : 28, flexDirection: isMobile ? "column" : "row" }}>
                    <StepRail
                        steps={visibleSteps}
                        currentIndex={stepIndex}
                        onSelect={setStepIndex}
                        mobile={isMobile}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Honeypot — hidden from people, bots often fill it */}
                        <label
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                left: "-10000px",
                                width: "1px",
                                height: "1px",
                                overflow: "hidden",
                            }}
                        >
                            Company website
                            <input
                                tabIndex={-1}
                                autoComplete="off"
                                value={companyUrl}
                                onChange={(e) => setCompanyUrl(e.target.value)}
                            />
                        </label>
                        <p style={{ color: C.muted, fontSize: "14px", marginBottom: "10px" }}>
                            Step {stepIndex + 1} of {visibleSteps.length}
                        </p>
                        <div
                            style={{
                                height: "4px",
                                background: C.borderLight,
                                borderRadius: "100px",
                                marginBottom: "24px",
                                overflow: "hidden",
                            }}
                        >
                            <div
                                style={{
                                    width: `${((stepIndex + 1) / visibleSteps.length) * 100}%`,
                                    height: "100%",
                                    background: C.blue,
                                    borderRadius: "100px",
                                    transition: "width 0.25s ease",
                                }}
                            />
                        </div>

                        <div
                            style={{
                                background: C.white,
                                border: `1px solid ${C.borderLight}`,
                                borderRadius: "12px",
                                padding: isMobile ? "20px" : "28px",
                            }}
                        >
                            {submitStatus === "error" && submitError ? (
                                <div
                                    style={{
                                        marginBottom: "16px",
                                        padding: "12px 14px",
                                        borderRadius: "8px",
                                        background: "#FAF2F2",
                                        color: C.error,
                                        fontSize: "14px",
                                    }}
                                >
                                    {submitError}
                                </div>
                            ) : null}

                            {/* —— 1 Referral source —— */}
                            {currentStepId === 0 && (
                                <div>
                                    {sectionTitle(1, "Referral source")}
                                    <Field label="Your relationship to the individual (mark one)">
                                        <RadioGroup
                                            name="relationship"
                                            value={form.referral_source_type}
                                            options={RELATIONSHIP_OPTIONS}
                                            onChange={(v) => set("referral_source_type", v)}
                                            columns={isMobile ? 1 : 2}
                                        />
                                    </Field>
                                    {form.referral_source_type === "other" ? (
                                        <Field label="If other, specify">
                                            <input
                                                style={INPUT}
                                                value={form.relationship_other}
                                                onChange={(e) => set("relationship_other", e.target.value)}
                                            />
                                        </Field>
                                    ) : null}
                                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px" }}>
                                        <Field label="First name">
                                            <input
                                                style={INPUT}
                                                value={form.referral_source_first}
                                                onChange={(e) => set("referral_source_first", e.target.value)}
                                            />
                                        </Field>
                                        <Field label="Last name">
                                            <input
                                                style={INPUT}
                                                value={form.referral_source_last}
                                                onChange={(e) => set("referral_source_last", e.target.value)}
                                            />
                                        </Field>
                                        {mode === "professional" ? (
                                            <>
                                                <Field label="Organization / agency">
                                                    <input
                                                        style={INPUT}
                                                        value={form.referral_source_organization}
                                                        onChange={(e) => set("referral_source_organization", e.target.value)}
                                                    />
                                                </Field>
                                                <Field label="Position / title">
                                                    <input
                                                        style={INPUT}
                                                        value={form.referral_source_title}
                                                        onChange={(e) => set("referral_source_title", e.target.value)}
                                                    />
                                                </Field>
                                            </>
                                        ) : null}
                                        <Field label="Phone">
                                            <input
                                                style={INPUT}
                                                value={form.referral_source_phone}
                                                onChange={(e) => set("referral_source_phone", formatPhone(e.target.value))}
                                            />
                                        </Field>
                                        <Field label="Email">
                                            <input
                                                style={INPUT}
                                                type="email"
                                                value={form.referral_source_email}
                                                onChange={(e) => set("referral_source_email", e.target.value)}
                                            />
                                        </Field>
                                    </div>
                                    <label style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "14px", marginBottom: "16px" }}>
                                        <input
                                            type="checkbox"
                                            checked={form.referrer_is_authorized_rep}
                                            onChange={(e) => set("referrer_is_authorized_rep", e.target.checked)}
                                            style={{ marginTop: "3px" }}
                                        />
                                        <span>
                                            I am the individual’s authorized signer / representative (POA, guardian, court-appointed, or other legal authority). Attach supporting documents.
                                        </span>
                                    </label>
                                    <Field label="Has this individual been referred to Monarch Mental Health before?">
                                        <RadioGroup
                                            name="prev"
                                            value={form.previous_monarch_referral}
                                            options={YES_NO_UNKNOWN}
                                            onChange={(v) => set("previous_monarch_referral", v)}
                                            columns={3}
                                        />
                                    </Field>
                                    {navRow}
                                </div>
                            )}

                            {/* —— 2 Level of care —— */}
                            {currentStepId === 1 && (
                                <div>
                                    {sectionTitle(2, "Level of care")}
                                    <p style={{ color: C.muted, fontSize: "14px", lineHeight: 1.5 }}>
                                        Professionals: please indicate the level of care determination if known. If you are unsure, leave this section blank.
                                    </p>
                                    <Field label="Level of care (LOC) assessment completed?">
                                        <RadioGroup name="loc_done" value={form.loc_completed} options={YES_NO} onChange={(v) => set("loc_completed", v)} />
                                    </Field>
                                    {form.loc_completed === "yes" ? (
                                        <>
                                            <Field label="Acuity / level determination">
                                                <RadioGroup name="loc_level" value={form.loc_level} options={LOC_LEVEL_OPTIONS} onChange={(v) => set("loc_level", v)} columns={3} />
                                            </Field>
                                            <Field label="Date of LOC assessment">
                                                <input type="date" style={INPUT} value={form.loc_date} onChange={(e) => set("loc_date", e.target.value)} />
                                            </Field>
                                            <Field label="Regional Accountable Entity (RAE)">
                                                <Select
                                                    value={form.loc_rae}
                                                    options={RAE_REGION_OPTIONS}
                                                    empty="Select RAE region…"
                                                    onChange={(v) => {
                                                        setForm((prev) => ({
                                                            ...prev,
                                                            loc_rae: v,
                                                            loc_cma_id: "",
                                                        }))
                                                    }}
                                                />
                                            </Field>
                                            {form.loc_rae && form.loc_rae in CMA_BY_RAE ? (
                                                <Field label="Case Management Agency (organized by RAE)" hint="Select the CMA for the counties served under this RAE.">
                                                    <Select
                                                        value={form.loc_cma_id}
                                                        options={CMA_BY_RAE[form.loc_rae as RaeId].map((c) => ({
                                                            value: c.id,
                                                            label: cmaLabel(c),
                                                        }))}
                                                        empty="Select CMA…"
                                                        onChange={(v) => set("loc_cma_id", v)}
                                                    />
                                                </Field>
                                            ) : null}
                                        </>
                                    ) : null}
                                    <Field label="CMHS – Home and Community-Based Services Waiver Status">
                                        <RadioGroup name="cmhs" value={form.loc_cmhs_waiver_status} options={CMHS_WAIVER_OPTIONS} onChange={(v) => set("loc_cmhs_waiver_status", v)} columns={2} />
                                    </Field>
                                    {form.referral_source_type !== "cma_case_manager" ? (
                                        <>
                                            <Field label="CMA case manager (if not you)">
                                                <input
                                                    style={INPUT}
                                                    value={form.loc_case_manager_name}
                                                    onChange={(e) => set("loc_case_manager_name", e.target.value)}
                                                    disabled={form.loc_case_manager_same_as_source}
                                                />
                                            </Field>
                                            <label style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "14px", marginBottom: "12px" }}>
                                                <input
                                                    type="checkbox"
                                                    checked={form.loc_case_manager_same_as_source}
                                                    onChange={(e) => {
                                                        const checked = e.target.checked
                                                        if (checked) {
                                                            const name = `${form.referral_source_first} ${form.referral_source_last}`.trim()
                                                            setForm((prev) => ({
                                                                ...prev,
                                                                loc_case_manager_same_as_source: true,
                                                                loc_case_manager_name: name || prev.loc_case_manager_name,
                                                                loc_case_manager_phone: prev.referral_source_phone,
                                                                loc_case_manager_email: prev.referral_source_email,
                                                            }))
                                                        } else {
                                                            set("loc_case_manager_same_as_source", false)
                                                        }
                                                    }}
                                                    style={{ marginTop: "3px" }}
                                                />
                                                <span>Same as referral source (name, phone, and email)</span>
                                            </label>
                                            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px" }}>
                                                <Field label="Case manager phone">
                                                    <input
                                                        style={INPUT}
                                                        value={form.loc_case_manager_phone}
                                                        onChange={(e) => set("loc_case_manager_phone", formatPhone(e.target.value))}
                                                        disabled={form.loc_case_manager_same_as_source}
                                                    />
                                                </Field>
                                                <Field label="Case manager email">
                                                    <input
                                                        style={INPUT}
                                                        type="email"
                                                        value={form.loc_case_manager_email}
                                                        onChange={(e) => set("loc_case_manager_email", e.target.value)}
                                                        disabled={form.loc_case_manager_same_as_source}
                                                    />
                                                </Field>
                                            </div>
                                            {form.loc_case_manager_name.trim() ? (
                                                <Field label="CMA case manager ROI permission" hint="If listed, mark one. Used to autofill the ROI.">
                                                    <RadioGroup
                                                        name="cma_roi"
                                                        value={form.loc_case_manager_roi_permission}
                                                        options={ROI_PERMISSION_OPTIONS}
                                                        onChange={(v) => set("loc_case_manager_roi_permission", v)}
                                                        columns={3}
                                                    />
                                                </Field>
                                            ) : null}
                                        </>
                                    ) : null}
                                    {navRow}
                                </div>
                            )}

                            {/* —— 3 Demographics —— */}
                            {currentStepId === 2 && (
                                <div>
                                    {sectionTitle(3, "Individual being referred: demographics")}
                                    <p style={{ color: C.muted, fontSize: "14px" }}>Provide what is available. Admissions may follow up on missing items.</p>
                                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px" }}>
                                        <Field label={`${pl.charAt(0).toUpperCase()}${pl.slice(1)} legal first name`}>
                                            <input style={INPUT} value={form.client_first_name} onChange={(e) => set("client_first_name", e.target.value)} />
                                        </Field>
                                        <Field label="Legal middle name">
                                            <input style={INPUT} value={form.client_middle_name} onChange={(e) => set("client_middle_name", e.target.value)} />
                                        </Field>
                                        <Field label="Legal last name">
                                            <input style={INPUT} value={form.client_last_name} onChange={(e) => set("client_last_name", e.target.value)} />
                                        </Field>
                                        <Field label="Chosen name">
                                            <input style={INPUT} value={form.client_preferred_name} onChange={(e) => set("client_preferred_name", e.target.value)} />
                                        </Field>
                                        <Field label="Date of birth">
                                            <input type="date" style={INPUT} value={form.client_dob} onChange={(e) => set("client_dob", e.target.value)} />
                                        </Field>
                                        <Field label="SSN (if available)">
                                            <input style={INPUT} value={form.client_ssn} onChange={(e) => set("client_ssn", e.target.value)} />
                                        </Field>
                                        <Field label="Phone">
                                            <input style={INPUT} value={form.client_phone} onChange={(e) => set("client_phone", formatPhone(e.target.value))} />
                                        </Field>
                                        <Field label="Email">
                                            <input style={INPUT} type="email" value={form.client_email} onChange={(e) => set("client_email", e.target.value)} />
                                        </Field>
                                    </div>
                                    <Field label="Street address">
                                        <input style={INPUT} value={form.client_address_line1} onChange={(e) => set("client_address_line1", e.target.value)} />
                                    </Field>
                                    <Field label="Address line 2">
                                        <input style={INPUT} value={form.client_address_line2} onChange={(e) => set("client_address_line2", e.target.value)} />
                                    </Field>
                                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr 1fr", gap: "12px" }}>
                                        <Field label="City">
                                            <input style={INPUT} value={form.client_city} onChange={(e) => set("client_city", e.target.value)} />
                                        </Field>
                                        <Field label="State">
                                            <input style={INPUT} value={form.client_state} onChange={(e) => set("client_state", e.target.value)} />
                                        </Field>
                                        <Field label="ZIP">
                                            <input style={INPUT} value={form.client_postal_code} onChange={(e) => set("client_postal_code", e.target.value)} />
                                        </Field>
                                    </div>
                                    <Field label="Gender identity (check all that apply)">
                                        <CheckGroup values={form.client_gender_identity} options={GENDER_IDENTITY_OPTIONS} onChange={(v) => set("client_gender_identity", v)} />
                                    </Field>
                                    {form.client_gender_identity.includes("additional_category") ? (
                                        <Field label="Please specify">
                                            <input style={INPUT} value={form.client_gender_detail} onChange={(e) => set("client_gender_detail", e.target.value)} />
                                        </Field>
                                    ) : null}
                                    <Field label="Sex assigned at birth">
                                        <RadioGroup name="sex" value={form.client_sex_at_birth} options={SEX_AT_BIRTH_OPTIONS} onChange={(v) => set("client_sex_at_birth", v)} columns={3} />
                                    </Field>
                                    <Field label="Preferred pronouns">
                                        <RadioGroup name="pronouns" value={form.client_pronouns} options={PRONOUN_OPTIONS} onChange={(v) => set("client_pronouns", v)} />
                                    </Field>
                                    <Field label="Primary language">
                                        <input style={INPUT} value={form.client_primary_language} onChange={(e) => set("client_primary_language", e.target.value)} />
                                    </Field>
                                    <Field label="English proficiency">
                                        <RadioGroup name="eng" value={form.client_english_proficiency} options={ENGLISH_PROFICIENCY_OPTIONS} onChange={(v) => set("client_english_proficiency", v)} columns={3} />
                                    </Field>
                                    <Field label="Interpreter needed?">
                                        <RadioGroup name="interp" value={form.interpreter_needed} options={YES_NO} onChange={(v) => set("interpreter_needed", v)} />
                                    </Field>
                                    <Field label="Race (check all that apply)">
                                        <CheckGroup values={form.client_race} options={RACE_OPTIONS} onChange={(v) => set("client_race", v)} />
                                    </Field>
                                    <Field label="Ethnicity">
                                        <RadioGroup name="eth" value={form.client_ethnicity} options={ETHNICITY_OPTIONS} onChange={(v) => set("client_ethnicity", v)} columns={3} />
                                    </Field>
                                    <Field label="Marital status">
                                        <RadioGroup name="marital" value={form.client_marital_status} options={MARITAL_OPTIONS} onChange={(v) => set("client_marital_status", v)} columns={3} />
                                    </Field>
                                    <Field label="Military affiliation">
                                        <RadioGroup name="mil" value={form.client_military_status} options={MILITARY_OPTIONS} onChange={(v) => set("client_military_status", v)} columns={2} />
                                    </Field>
                                    {mode !== "self" ? (
                                        <Field label={`Is ${ps} aware of, and do they consent to, this referral?`}>
                                            <RadioGroup name="consent" value={form.client_consents_to_referral} options={CONSENT_OPTIONS} onChange={(v) => set("client_consents_to_referral", v)} columns={3} />
                                        </Field>
                                    ) : null}
                                    {navRow}
                                </div>
                            )}

                            {/* —— 4 Coverage —— */}
                            {currentStepId === 3 && (
                                <div>
                                    {sectionTitle(4, "Coverage")}
                                    <p style={{ color: C.muted, fontSize: "14px" }}>Admission requires active Health First Colorado enrollment.</p>
                                    <Field label="Currently enrolled in Health First Colorado?">
                                        <RadioGroup name="medicaid" value={form.medicaid_status} options={MEDICAID_STATUS_OPTIONS} onChange={(v) => set("medicaid_status", v)} />
                                    </Field>
                                    {form.medicaid_status === "not_enrolled" ? (
                                        <Field label="If not enrolled: eligible to enroll?">
                                            <RadioGroup name="elig" value={form.medicaid_eligible} options={YES_NO_UNKNOWN} onChange={(v) => set("medicaid_eligible", v)} columns={3} />
                                        </Field>
                                    ) : null}
                                    {form.medicaid_status === "enrolled" ? (
                                        <>
                                            <Field label="Health First Colorado member ID">
                                                <input style={INPUT} value={form.medicaid_number} onChange={(e) => set("medicaid_number", e.target.value)} />
                                            </Field>
                                            <Field label="Medicaid RAE">
                                                <RadioGroup
                                                    name="rae"
                                                    value={form.medicaid_mco}
                                                    options={RAE_OPTIONS}
                                                    onChange={(v) => {
                                                        set("coverage_same_as_loc", false)
                                                        set("medicaid_mco", v)
                                                    }}
                                                    columns={1}
                                                />
                                            </Field>
                                        </>
                                    ) : null}
                                    <h3 style={{ fontSize: "15px", margin: "20px 0 8px" }}>Referring Case Management Agency (CMA)</h3>
                                    {(form.loc_completed === "yes" && (form.loc_rae || form.loc_cma_id || form.loc_case_manager_name)) ||
                                    form.referral_source_type === "cma_case_manager" ? (
                                        <label style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "14px", marginBottom: "12px" }}>
                                            <input
                                                type="checkbox"
                                                checked={form.coverage_same_as_loc}
                                                onChange={(e) => {
                                                    const checked = e.target.checked
                                                    if (!checked) {
                                                        set("coverage_same_as_loc", false)
                                                        return
                                                    }
                                                    const cma = findCma(form.loc_rae, form.loc_cma_id)
                                                    const cmName =
                                                        form.loc_case_manager_name.trim() ||
                                                        `${form.referral_source_first} ${form.referral_source_last}`.trim()
                                                    const contact = [form.loc_case_manager_phone, form.loc_case_manager_email]
                                                        .map((x) => x.trim())
                                                        .filter(Boolean)
                                                        .join(" / ")
                                                    setForm((prev) => ({
                                                        ...prev,
                                                        coverage_same_as_loc: true,
                                                        medicaid_mco: prev.loc_rae || prev.medicaid_mco,
                                                        cma_agency_name: cma?.name || prev.cma_agency_name,
                                                        cma_case_manager_name: cmName || prev.cma_case_manager_name,
                                                        cma_case_manager_contact:
                                                            contact ||
                                                            [prev.referral_source_phone, prev.referral_source_email]
                                                                .map((x) => x.trim())
                                                                .filter(Boolean)
                                                                .join(" / ") ||
                                                            prev.cma_case_manager_contact,
                                                    }))
                                                }}
                                                style={{ marginTop: "3px" }}
                                            />
                                            <span>
                                                Same as Level of care / referral source (prefill Medicaid RAE, CMA agency, case manager, and contact)
                                            </span>
                                        </label>
                                    ) : null}
                                    <Field label="CMA agency name">
                                        <input
                                            style={INPUT}
                                            value={form.cma_agency_name}
                                            onChange={(e) => {
                                                set("coverage_same_as_loc", false)
                                                set("cma_agency_name", e.target.value)
                                            }}
                                            disabled={form.coverage_same_as_loc}
                                        />
                                    </Field>
                                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px" }}>
                                        <Field label="Assigned case manager name">
                                            <input
                                                style={INPUT}
                                                value={form.cma_case_manager_name}
                                                onChange={(e) => {
                                                    set("coverage_same_as_loc", false)
                                                    set("cma_case_manager_name", e.target.value)
                                                }}
                                                disabled={form.coverage_same_as_loc}
                                            />
                                        </Field>
                                        <Field label="Case manager phone / email">
                                            <input
                                                style={INPUT}
                                                value={form.cma_case_manager_contact}
                                                onChange={(e) => {
                                                    set("coverage_same_as_loc", false)
                                                    set("cma_case_manager_contact", e.target.value)
                                                }}
                                                disabled={form.coverage_same_as_loc}
                                            />
                                        </Field>
                                    </div>
                                    <Field label="Private insurance?">
                                        <RadioGroup name="priv" value={form.has_private_insurance} options={YES_NO} onChange={(v) => set("has_private_insurance", v)} />
                                    </Field>
                                    {form.has_private_insurance === "yes" ? (
                                        <>
                                            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px" }}>
                                                <Field label="Insurance carrier">
                                                    <input style={INPUT} value={form.private_insurance_carrier} onChange={(e) => set("private_insurance_carrier", e.target.value)} />
                                                </Field>
                                                <Field label="Member ID">
                                                    <input style={INPUT} value={form.private_insurance_member_id} onChange={(e) => set("private_insurance_member_id", e.target.value)} />
                                                </Field>
                                            </div>
                                            <Field label="Describe the coverage">
                                                <textarea style={{ ...INPUT, minHeight: "72px" }} value={form.private_insurance_details} onChange={(e) => set("private_insurance_details", e.target.value)} />
                                            </Field>
                                        </>
                                    ) : null}
                                    <Field label="Medicare status">
                                        <RadioGroup name="medicare" value={form.medicare_status} options={MEDICARE_OPTIONS} onChange={(v) => set("medicare_status", v)} />
                                    </Field>
                                    {form.medicare_status === "active" || form.medicare_status === "pending" ? (
                                        <Field label="Medicare beneficiary ID">
                                            <input style={INPUT} value={form.medicare_number} onChange={(e) => set("medicare_number", e.target.value)} />
                                        </Field>
                                    ) : null}
                                    <Field label="SSI / SSDI status">
                                        <RadioGroup name="ssdi" value={form.ssdi_status} options={SSDI_OPTIONS} onChange={(v) => set("ssdi_status", v)} />
                                    </Field>
                                    <Field label="Additional benefits information">
                                        <textarea style={{ ...INPUT, minHeight: "72px" }} value={form.benefits_notes} onChange={(e) => set("benefits_notes", e.target.value)} />
                                    </Field>
                                    {navRow}
                                </div>
                            )}

                            {/* —— 5 Location —— */}
                            {currentStepId === 4 && (
                                <div>
                                    {sectionTitle(5, "Current location and housing")}
                                    <Field label="Current location">
                                        <RadioGroup name="loc" value={form.current_location_type} options={LOCATION_OPTIONS} onChange={(v) => set("current_location_type", v)} />
                                    </Field>
                                    {FACILITY_LOCATIONS.has(form.current_location_type) ? (
                                        <>
                                            <p style={{ color: C.muted, fontSize: "13px" }}>If currently in a facility or program:</p>
                                            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px" }}>
                                                <Field label="Facility name">
                                                    <input style={INPUT} value={form.facility_name} onChange={(e) => set("facility_name", e.target.value)} />
                                                </Field>
                                                <Field label="Facility phone">
                                                    <input style={INPUT} value={form.facility_contact_phone} onChange={(e) => set("facility_contact_phone", formatPhone(e.target.value))} />
                                                </Field>
                                            </div>
                                            <Field label="Facility address">
                                                <input style={INPUT} value={form.facility_address} onChange={(e) => set("facility_address", e.target.value)} />
                                            </Field>
                                            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px" }}>
                                                <Field label="Facility contact person">
                                                    <input style={INPUT} value={form.facility_contact_person} onChange={(e) => set("facility_contact_person", e.target.value)} />
                                                </Field>
                                                <Field label="Patient / resident ID">
                                                    <input style={INPUT} value={form.inmate_id} onChange={(e) => set("inmate_id", e.target.value)} />
                                                </Field>
                                            </div>
                                            <Field label="Expected discharge date">
                                                <input type="date" style={INPUT} value={form.expected_release_date} onChange={(e) => set("expected_release_date", e.target.value)} />
                                            </Field>
                                        </>
                                    ) : null}
                                    <Field label="Housing before the current situation">
                                        <RadioGroup name="housing" value={form.housing_prior} options={HOUSING_PRIOR_OPTIONS} onChange={(v) => set("housing_prior", v)} />
                                    </Field>
                                    <Field label="Housing notes">
                                        <textarea style={{ ...INPUT, minHeight: "72px" }} value={form.housing_notes} onChange={(e) => set("housing_notes", e.target.value)} />
                                    </Field>
                                    {navRow}
                                </div>
                            )}

                            {/* —— 6 Clinical —— */}
                            {currentStepId === 5 && (
                                <div>
                                    {sectionTitle(6, "Mental health and clinical information")}
                                    <Field label="Reason for referral (brief)">
                                        <textarea style={{ ...INPUT, minHeight: "80px" }} value={form.reason_for_referral} onChange={(e) => set("reason_for_referral", e.target.value)} />
                                    </Field>
                                    <Field label="Current diagnoses (most recent)">
                                        {form.diagnoses.map((d, i) => (
                                            <input
                                                key={i}
                                                style={{ ...INPUT, marginBottom: "8px" }}
                                                placeholder={`Diagnosis ${i + 1}`}
                                                value={d}
                                                onChange={(e) => {
                                                    const next = [...form.diagnoses]
                                                    next[i] = e.target.value
                                                    set("diagnoses", next)
                                                }}
                                            />
                                        ))}
                                        {form.diagnoses.length < 6 ? (
                                            <button type="button" style={{ ...BTN_SECONDARY, padding: "8px 12px", fontSize: "13px" }} onClick={() => set("diagnoses", [...form.diagnoses, ""])}>
                                                Add diagnosis
                                            </button>
                                        ) : null}
                                    </Field>
                                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px" }}>
                                        <Field label="Date of most recent evaluation">
                                            <input type="date" style={INPUT} value={form.eval_date} onChange={(e) => set("eval_date", e.target.value)} />
                                        </Field>
                                        <Field label="Type">
                                            <RadioGroup
                                                name="eval_type"
                                                value={form.eval_type}
                                                options={[
                                                    { value: "psychiatric", label: "Psychiatric" },
                                                    { value: "psychological", label: "Psychological" },
                                                ]}
                                                onChange={(v) => set("eval_type", v)}
                                            />
                                        </Field>
                                        <Field label="Evaluator">
                                            <input style={INPUT} value={form.eval_evaluator} onChange={(e) => set("eval_evaluator", e.target.value)} />
                                        </Field>
                                        <Field label="Organization">
                                            <input style={INPUT} value={form.eval_organization} onChange={(e) => set("eval_organization", e.target.value)} />
                                        </Field>
                                    </div>
                                    <Field label="Current psychiatric medications">
                                        <MedicationTable
                                            rows={form.psychiatric_medications}
                                            onChange={(rows) => set("psychiatric_medications", rows)}
                                            isMobile={isMobile}
                                        />
                                    </Field>
                                    <Field label="Medication adherence">
                                        <RadioGroup name="adh" value={form.medication_compliance} options={MED_ADHERENCE_OPTIONS} onChange={(v) => set("medication_compliance", v)} columns={2} />
                                    </Field>
                                    {form.medication_compliance === "partial" || form.medication_compliance === "not_taking" ? (
                                        <Field label="Medication barriers">
                                            <textarea style={{ ...INPUT, minHeight: "64px" }} value={form.medication_barriers} onChange={(e) => set("medication_barriers", e.target.value)} />
                                        </Field>
                                    ) : null}
                                    <Field label="Court-ordered medications upon discharge?">
                                        <RadioGroup name="com" value={form.court_ordered_meds} options={YES_NO_UNKNOWN} onChange={(v) => set("court_ordered_meds", v)} columns={3} />
                                    </Field>
                                    <Field label="Outpatient certification upon discharge (C.R.S. 27-65-111)?">
                                        <RadioGroup name="opc" value={form.outpatient_cert} options={YES_NO_UNKNOWN} onChange={(v) => set("outpatient_cert", v)} columns={3} />
                                    </Field>
                                    {form.outpatient_cert === "yes" ? (
                                        <Field label="If yes">
                                            <RadioGroup
                                                name="opc_term"
                                                value={form.outpatient_cert_term}
                                                options={[
                                                    { value: "long_term", label: "Long term" },
                                                    { value: "short_term", label: "Short term" },
                                                ]}
                                                onChange={(v) => set("outpatient_cert_term", v)}
                                            />
                                        </Field>
                                    ) : null}
                                    <Field label="Psychiatric history">
                                        <textarea style={{ ...INPUT, minHeight: "80px" }} value={form.psychiatric_history} onChange={(e) => set("psychiatric_history", e.target.value)} />
                                    </Field>
                                    <h3 style={{ fontSize: "15px", margin: "20px 0 8px" }}>Psychiatric prescriber(s)</h3>
                                    <PrescriberList
                                        rows={form.psychiatric_prescribers}
                                        onChange={(rows) => set("psychiatric_prescribers", rows)}
                                        isMobile={isMobile}
                                        label="Psychiatric prescriber"
                                    />
                                    <h3 style={{ fontSize: "15px", margin: "20px 0 8px" }}>Current outpatient provider</h3>
                                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px" }}>
                                        <Field label="Therapist name">
                                            <input style={INPUT} value={form.therapist_name} onChange={(e) => set("therapist_name", e.target.value)} />
                                        </Field>
                                        <Field label="Agency / clinic">
                                            <input style={INPUT} value={form.therapist_agency} onChange={(e) => set("therapist_agency", e.target.value)} />
                                        </Field>
                                        <Field label="Phone">
                                            <input style={INPUT} value={form.therapist_phone} onChange={(e) => set("therapist_phone", formatPhone(e.target.value))} />
                                        </Field>
                                        <Field label="Email">
                                            <input style={INPUT} type="email" value={form.therapist_email} onChange={(e) => set("therapist_email", e.target.value)} />
                                        </Field>
                                    </div>
                                    {form.therapist_name.trim() ? (
                                        <Field label="ROI intent and scope of disclosure" hint="Mark one. Used to autofill the ROI.">
                                            <RadioGroup name="th_roi" value={form.therapist_roi_permission} options={ROI_PERMISSION_OPTIONS} onChange={(v) => set("therapist_roi_permission", v)} columns={3} />
                                        </Field>
                                    ) : null}
                                    <Field label="History of traumatic brain injury (TBI)?">
                                        <RadioGroup name="tbi" value={form.tbi_history} options={TBI_OPTIONS} onChange={(v) => set("tbi_history", v)} />
                                    </Field>
                                    {form.tbi_history === "yes" || form.tbi_history === "suspected" ? (
                                        <Field label="TBI details">
                                            <input style={INPUT} value={form.tbi_details} onChange={(e) => set("tbi_details", e.target.value)} />
                                        </Field>
                                    ) : null}
                                    <Field label="Intellectual / developmental disability (IDD)?">
                                        <RadioGroup name="idd" value={form.idd_status} options={IDD_OPTIONS} onChange={(v) => set("idd_status", v)} />
                                    </Field>
                                    {form.idd_status === "yes_documented" || form.idd_status === "yes_undocumented" ? (
                                        <Field label="Co-occurring serious mental illness?">
                                            <RadioGroup name="smi" value={form.idd_co_occurring_smi} options={YES_NO_UNKNOWN} onChange={(v) => set("idd_co_occurring_smi", v)} columns={3} />
                                        </Field>
                                    ) : null}
                                    <h3 style={{ fontSize: "15px", margin: "20px 0 8px" }}>Treatment history</h3>
                                    <label style={{ display: "flex", gap: "8px", fontSize: "14px", marginBottom: "12px" }}>
                                        <input type="checkbox" checked={form.treatment_history_none} onChange={(e) => set("treatment_history_none", e.target.checked)} />
                                        No treatment history
                                    </label>
                                    {!form.treatment_history_none ? (
                                        <>
                                            {form.treatment_history.map((row, i) => (
                                                <div key={i} style={{ border: `1px solid ${C.borderLight}`, borderRadius: "8px", padding: "12px", marginBottom: "10px" }}>
                                                    <Field label="Level of care">
                                                        <Select value={row.level} options={TREATMENT_LEVELS} onChange={(v) => {
                                                            const next = [...form.treatment_history] as TreatmentRow[]
                                                            next[i] = { ...next[i], level: v }
                                                            set("treatment_history", next)
                                                        }} />
                                                    </Field>
                                                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "8px" }}>
                                                        <Field label="Facility">
                                                            <input style={INPUT} value={row.facility} onChange={(e) => {
                                                                const next = [...form.treatment_history]
                                                                next[i] = { ...next[i], facility: e.target.value }
                                                                set("treatment_history", next)
                                                            }} />
                                                        </Field>
                                                        <Field label="Treated for">
                                                            <input style={INPUT} value={row.treated_for} onChange={(e) => {
                                                                const next = [...form.treatment_history]
                                                                next[i] = { ...next[i], treated_for: e.target.value }
                                                                set("treatment_history", next)
                                                            }} />
                                                        </Field>
                                                        <Field label="Admit">
                                                            <input type="date" style={INPUT} value={row.admit} onChange={(e) => {
                                                                const next = [...form.treatment_history]
                                                                next[i] = { ...next[i], admit: e.target.value }
                                                                set("treatment_history", next)
                                                            }} />
                                                        </Field>
                                                        <Field label="Discharge">
                                                            <input type="date" style={INPUT} value={row.discharge} onChange={(e) => {
                                                                const next = [...form.treatment_history]
                                                                next[i] = { ...next[i], discharge: e.target.value }
                                                                set("treatment_history", next)
                                                            }} />
                                                        </Field>
                                                    </div>
                                                    <Field label="Discharge type">
                                                        <RadioGroup
                                                            name={`dx_${i}`}
                                                            value={row.discharge_type}
                                                            options={DISCHARGE_TYPE_OPTIONS}
                                                            onChange={(v) => {
                                                                const next = [...form.treatment_history]
                                                                next[i] = { ...next[i], discharge_type: v }
                                                                set("treatment_history", next)
                                                            }}
                                                        />
                                                    </Field>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                style={{ ...BTN_SECONDARY, padding: "8px 12px", fontSize: "13px", marginBottom: "12px" }}
                                                onClick={() =>
                                                    set("treatment_history", [
                                                        ...form.treatment_history,
                                                        { level: "", facility: "", treated_for: "", admit: "", discharge: "", discharge_type: "" },
                                                    ])
                                                }
                                            >
                                                Add stay
                                            </button>
                                            <Field label="Notes (more stays, outcomes)">
                                                <textarea style={{ ...INPUT, minHeight: "64px" }} value={form.previous_treatment_programs} onChange={(e) => set("previous_treatment_programs", e.target.value)} />
                                            </Field>
                                        </>
                                    ) : null}
                                    {navRow}
                                </div>
                            )}

                            {/* —— 7 Substance —— */}
                            {currentStepId === 6 && (
                                <div>
                                    {sectionTitle(7, "Substance use history")}
                                    <label style={{ display: "flex", gap: "8px", fontSize: "14px", marginBottom: "12px" }}>
                                        <input type="checkbox" checked={form.substance_use_none} onChange={(e) => set("substance_use_none", e.target.checked)} />
                                        No history of substance use
                                    </label>
                                    {!form.substance_use_none ? (
                                        <>
                                            {form.substance_use.map((row, i) => {
                                                const patchSub = (p: Partial<SubstanceRow>) => {
                                                    const next = [...form.substance_use]
                                                    next[i] = { ...next[i], ...p }
                                                    set("substance_use", next)
                                                }
                                                return (
                                                    <div key={i} style={{ border: `1px solid ${C.borderLight}`, borderRadius: "8px", padding: "12px", marginBottom: "10px" }}>
                                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                                            <span style={{ fontSize: "13px", fontWeight: 600, color: C.muted }}>Substance {i + 1}</span>
                                                            <button
                                                                type="button"
                                                                title="Delete this substance"
                                                                aria-label="Delete this substance"
                                                                onClick={() => set("substance_use", form.substance_use.filter((_, j) => j !== i))}
                                                                style={{ ...BTN_SECONDARY, padding: "6px 8px", color: C.error }}
                                                            >
                                                                <TrashIcon />
                                                            </button>
                                                        </div>
                                                        <Field label="Substance">
                                                            <select
                                                                value={row.substance}
                                                                onChange={(e) => patchSub({ substance: e.target.value })}
                                                                style={INPUT}
                                                            >
                                                                <option value="">Select substance…</option>
                                                                {SUBSTANCE_GROUPS.map((group) => (
                                                                    <optgroup key={group} label={group}>
                                                                        {SUBSTANCE_OPTIONS.filter((o) => o.group === group).map((o) => (
                                                                            <option key={o.value} value={o.value}>
                                                                                {o.label}
                                                                            </option>
                                                                        ))}
                                                                    </optgroup>
                                                                ))}
                                                            </select>
                                                        </Field>
                                                        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "8px" }}>
                                                            <Field label="Age of first use">
                                                                <input
                                                                    style={INPUT}
                                                                    inputMode="numeric"
                                                                    placeholder="e.g. 16"
                                                                    value={row.age_of_first_use}
                                                                    onChange={(e) => patchSub({ age_of_first_use: e.target.value.replace(/\D/g, "").slice(0, 3) })}
                                                                />
                                                            </Field>
                                                            <Field label="Last use">
                                                                <input
                                                                    type="date"
                                                                    style={INPUT}
                                                                    value={row.last_use}
                                                                    onChange={(e) => patchSub({ last_use: e.target.value })}
                                                                />
                                                            </Field>
                                                            <Field label="Amount">
                                                                <input
                                                                    style={INPUT}
                                                                    inputMode="decimal"
                                                                    placeholder="0.0"
                                                                    value={row.amount}
                                                                    onChange={(e) => patchSub({ amount: e.target.value.replace(/[^\d.]/g, "") })}
                                                                />
                                                            </Field>
                                                            <Field label="Type">
                                                                <Select value={row.amount_unit} options={DOSE_UNIT_OPTIONS} onChange={(v) => patchSub({ amount_unit: v })} />
                                                            </Field>
                                                            <Field label="Frequency">
                                                                <Select value={row.frequency} options={FREQUENCY_OPTIONS} onChange={(v) => patchSub({ frequency: v })} />
                                                            </Field>
                                                            <Field label="Route">
                                                                <Select value={row.route} options={ROUTE_OPTIONS} onChange={(v) => patchSub({ route: v })} />
                                                            </Field>
                                                            <Field label="Pattern of use">
                                                                <Select value={row.pattern_of_use} options={PATTERN_OF_USE_OPTIONS} onChange={(v) => patchSub({ pattern_of_use: v })} />
                                                            </Field>
                                                            <Field label="Length of current use" hint='If applicable, e.g. "2 years"'>
                                                                <input style={INPUT} value={row.length_of_current_use} onChange={(e) => patchSub({ length_of_current_use: e.target.value })} />
                                                            </Field>
                                                        </div>
                                                        <Field label="Method of acquisition" hint='e.g. "Dealer", "Online", "Theft"'>
                                                            <input style={INPUT} value={row.method_of_acquisition} onChange={(e) => patchSub({ method_of_acquisition: e.target.value })} />
                                                        </Field>
                                                        <Field label="Notes">
                                                            <input style={INPUT} value={row.notes} onChange={(e) => patchSub({ notes: e.target.value })} />
                                                        </Field>
                                                    </div>
                                                )
                                            })}
                                            <button
                                                type="button"
                                                style={{ ...BTN_SECONDARY, padding: "8px 12px", fontSize: "13px", marginBottom: "12px" }}
                                                onClick={() => set("substance_use", [...form.substance_use, emptySubstanceRow()])}
                                            >
                                                Add substance
                                            </button>
                                        </>
                                    ) : null}
                                    <Field label="Overall notes">
                                        <textarea style={{ ...INPUT, minHeight: "72px" }} value={form.substance_use_history} onChange={(e) => set("substance_use_history", e.target.value)} />
                                    </Field>
                                    <Field label="Needs medically supervised detox or inpatient stabilization?">
                                        <RadioGroup name="detox" value={form.detox_required} options={DETOX_OPTIONS} onChange={(v) => set("detox_required", v)} />
                                    </Field>
                                    {form.detox_required === "yes" || form.detox_required === "possibly" ? (
                                        <Field label="Detox details">
                                            <input style={INPUT} value={form.detox_details} onChange={(e) => set("detox_details", e.target.value)} />
                                        </Field>
                                    ) : null}
                                    {navRow}
                                </div>
                            )}

                            {/* —— 8 Medical —— */}
                            {currentStepId === 7 && (
                                <div>
                                    {sectionTitle(8, "Medical and nursing information")}
                                    <Field label="Medical / somatic diagnoses">
                                        {form.medical_diagnoses.map((d, i) => (
                                            <input
                                                key={i}
                                                style={{ ...INPUT, marginBottom: "8px" }}
                                                placeholder={`Diagnosis ${i + 1}`}
                                                value={d}
                                                onChange={(e) => {
                                                    const next = [...form.medical_diagnoses]
                                                    next[i] = e.target.value
                                                    set("medical_diagnoses", next)
                                                }}
                                            />
                                        ))}
                                        {form.medical_diagnoses.length < 6 ? (
                                            <button type="button" style={{ ...BTN_SECONDARY, padding: "8px 12px", fontSize: "13px" }} onClick={() => set("medical_diagnoses", [...form.medical_diagnoses, ""])}>
                                                Add diagnosis
                                            </button>
                                        ) : null}
                                    </Field>
                                    <Field label="Notes">
                                        <textarea style={{ ...INPUT, minHeight: "64px" }} value={form.medical_notes} onChange={(e) => set("medical_notes", e.target.value)} />
                                    </Field>
                                    <Field label="Are these conditions controlled by current medications?">
                                        <RadioGroup name="ctrl" value={form.medical_conditions_controlled} options={MEDICAL_CONTROLLED_OPTIONS} onChange={(v) => set("medical_conditions_controlled", v)} columns={2} />
                                    </Field>
                                    <Field label="Non-psychiatric medications">
                                        <MedicationTable
                                            rows={form.non_psychiatric_medications}
                                            onChange={(rows) => set("non_psychiatric_medications", rows)}
                                            isMobile={isMobile}
                                        />
                                    </Field>
                                    <h3 style={{ fontSize: "15px", margin: "20px 0 8px" }}>Medical / non-psychiatric prescriber(s)</h3>
                                    <PrescriberList
                                        rows={form.medical_prescribers}
                                        onChange={(rows) => set("medical_prescribers", rows)}
                                        isMobile={isMobile}
                                        label="Prescriber"
                                    />
                                    <Field label="Medication allergies">
                                        <textarea style={{ ...INPUT, minHeight: "56px" }} value={form.medication_allergies} onChange={(e) => set("medication_allergies", e.target.value)} />
                                    </Field>
                                    <Field label="Mobility / assistive devices">
                                        <RadioGroup name="mob" value={form.mobility_needs} options={MOBILITY_OPTIONS} onChange={(v) => set("mobility_needs", v)} columns={2} />
                                    </Field>
                                    <Field label="Support needed with ADLs / other assistive needs">
                                        <textarea style={{ ...INPUT, minHeight: "64px" }} value={form.adl_support_details} onChange={(e) => set("adl_support_details", e.target.value)} />
                                    </Field>
                                    <Field label="Acute medical needs">
                                        <textarea style={{ ...INPUT, minHeight: "64px" }} value={form.acute_medical_needs} onChange={(e) => set("acute_medical_needs", e.target.value)} />
                                    </Field>
                                    <Field label="Requires 24/7 nursing or medical care?">
                                        <RadioGroup name="n24" value={form.needs_24_7_nursing} options={YES_NO_UNKNOWN} onChange={(v) => set("needs_24_7_nursing", v)} columns={3} />
                                    </Field>
                                    <Field label="Special dietary needs / restrictions">
                                        <input style={INPUT} value={form.dietary_needs} onChange={(e) => set("dietary_needs", e.target.value)} />
                                    </Field>
                                    <Field label="Tobacco use">
                                        <RadioGroup name="tob" value={form.tobacco_use} options={YES_NO} onChange={(v) => set("tobacco_use", v)} />
                                    </Field>
                                    {navRow}
                                </div>
                            )}

                            {/* —— 9 Safety —— */}
                            {currentStepId === 8 && (
                                <div>
                                    {sectionTitle(9, "Safety and exclusionary screen")}
                                    <p style={{ color: C.muted, fontSize: "14px" }}>Select the timeframe for the most recent occurrence of each item.</p>
                                    {(
                                        [
                                            ["suicide_risk", "suicide_risk_detail", "Suicide / self-harm / ideation", "e.g. suicide, self-harm, and/or ideation"],
                                            ["violence_risk", "violence_risk_detail", "Violence / aggression / ideation", "e.g. violence, aggression, and/or ideation"],
                                            ["elopement_risk", "elopement_risk_detail", "Elopement / AMA", "e.g. elopement and/or AMA"],
                                            ["restraints", "restraints_detail", "Restraints (chemical or otherwise)", "Describe which restraints occurred"],
                                            ["seclusion", "seclusion_detail", "Isolation / seclusion", "Describe isolation / seclusion"],
                                        ] as const
                                    ).map(([key, detailKey, label, hint]) => (
                                        <div key={key}>
                                            <Field label={label}>
                                                <RadioGroup
                                                    name={key}
                                                    value={form[key]}
                                                    options={RISK_TIMELINE_OPTIONS}
                                                    onChange={(v) => {
                                                        set(key, v)
                                                        if (v === "no_history" || !v) set(detailKey, "")
                                                    }}
                                                    columns={2}
                                                />
                                            </Field>
                                            {form[key] && form[key] !== "no_history" ? (
                                                <Field label={`Which exactly occurred (${label})`} hint={hint}>
                                                    <input
                                                        style={INPUT}
                                                        value={form[detailKey]}
                                                        onChange={(e) => set(detailKey, e.target.value)}
                                                        placeholder={hint}
                                                    />
                                                </Field>
                                            ) : null}
                                        </div>
                                    ))}
                                    <Field label="Details of any suicide, violence, elopement, ideation history">
                                        <textarea style={{ ...INPUT, minHeight: "80px" }} value={form.safety_notes} onChange={(e) => set("safety_notes", e.target.value)} />
                                    </Field>
                                    <Field label="Any behaviors that may require a locked facility?">
                                        <RadioGroup name="lock" value={form.locked_facility_behaviors} options={YES_NO_UNKNOWN} onChange={(v) => set("locked_facility_behaviors", v)} columns={3} />
                                    </Field>
                                    <Field label="Documented incidents in the past six months?">
                                        <RadioGroup name="inc" value={form.incidents_6_months} options={YES_NO} onChange={(v) => set("incidents_6_months", v)} />
                                    </Field>
                                    {form.incidents_6_months === "yes" ? (
                                        <Field label="Describe incident(s)">
                                            <textarea style={{ ...INPUT, minHeight: "64px" }} value={form.incidents_details} onChange={(e) => set("incidents_details", e.target.value)} />
                                        </Field>
                                    ) : null}
                                    <Field label="Arson history or charges?">
                                        <RadioGroup name="arson" value={form.arson_history} options={ARSON_OPTIONS} onChange={(v) => set("arson_history", v)} />
                                    </Field>
                                    {form.arson_history === "yes_current" || form.arson_history === "yes_historical" ? (
                                        <Field label="Arson details">
                                            <input style={INPUT} value={form.arson_details} onChange={(e) => set("arson_details", e.target.value)} />
                                        </Field>
                                    ) : null}
                                    <Field label="Registered sex offender (RSO) status?">
                                        <RadioGroup name="rso" value={form.rso_status} options={RSO_OPTIONS} onChange={(v) => set("rso_status", v)} />
                                    </Field>
                                    {form.rso_status === "yes_registered" || form.rso_status === "yes_pending" ? (
                                        <Field label="RSO details">
                                            <input style={INPUT} value={form.rso_details} onChange={(e) => set("rso_details", e.target.value)} />
                                        </Field>
                                    ) : null}
                                    <Field label="Additional safety information">
                                        <textarea style={{ ...INPUT, minHeight: "72px" }} value={form.additional_safety_info} onChange={(e) => set("additional_safety_info", e.target.value)} />
                                    </Field>
                                    {navRow}
                                </div>
                            )}

                            {/* —— 10 Legal —— */}
                            {currentStepId === 9 && (
                                <div>
                                    {sectionTitle(10, "Legal and court-ordered mandates")}
                                    <p style={{ color: C.muted, fontSize: "14px" }}>
                                        Complete this section if the applicant has any active, pending, or unresolved legal cases or court mandates.
                                    </p>
                                    <Field label="Active court case?">
                                        <RadioGroup name="court" value={form.active_court_case} options={YES_NO} onChange={(v) => set("active_court_case", v)} />
                                    </Field>
                                    {form.active_court_case === "yes" ? (
                                        <>
                                            {form.court_cases.map((courtCase, i) => {
                                                const patchCase = (p: Partial<CourtCaseRow>) => {
                                                    const next = [...form.court_cases]
                                                    next[i] = { ...next[i], ...p }
                                                    set("court_cases", next)
                                                }
                                                return (
                                                    <div key={i} style={{ border: `1px solid ${C.borderLight}`, borderRadius: "8px", padding: "14px", marginBottom: "12px" }}>
                                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                                            <span style={{ fontSize: "13px", fontWeight: 600 }}>Court case {i + 1}</span>
                                                            {form.court_cases.length > 1 ? (
                                                                <button
                                                                    type="button"
                                                                    title="Remove court case"
                                                                    aria-label="Remove court case"
                                                                    onClick={() => set("court_cases", form.court_cases.filter((_, j) => j !== i))}
                                                                    style={{ ...BTN_SECONDARY, padding: "6px 8px", color: C.error }}
                                                                >
                                                                    <TrashIcon />
                                                                </button>
                                                            ) : null}
                                                        </div>
                                                        <Field label="Charges (brief summary)">
                                                            <textarea style={{ ...INPUT, minHeight: "72px" }} value={courtCase.charges} onChange={(e) => patchCase({ charges: e.target.value })} />
                                                        </Field>
                                                        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: "12px" }}>
                                                            <Field label="County">
                                                                <input style={INPUT} value={courtCase.county} onChange={(e) => patchCase({ county: e.target.value })} />
                                                            </Field>
                                                            <Field label="Case number">
                                                                <input style={INPUT} value={courtCase.case_number} onChange={(e) => patchCase({ case_number: e.target.value })} />
                                                            </Field>
                                                            <Field label="Next court date">
                                                                <input type="date" style={INPUT} value={courtCase.next_court_date} onChange={(e) => patchCase({ next_court_date: e.target.value })} />
                                                            </Field>
                                                        </div>
                                                        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: "12px" }}>
                                                            <Field label="Attorney name">
                                                                <input style={INPUT} value={courtCase.attorney_name} onChange={(e) => patchCase({ attorney_name: e.target.value })} />
                                                            </Field>
                                                            <Field label="Attorney phone">
                                                                <input style={INPUT} value={courtCase.attorney_phone} onChange={(e) => patchCase({ attorney_phone: formatPhone(e.target.value) })} />
                                                            </Field>
                                                            <Field label="Attorney email">
                                                                <input style={INPUT} type="email" value={courtCase.attorney_email} onChange={(e) => patchCase({ attorney_email: e.target.value })} />
                                                            </Field>
                                                        </div>
                                                        {courtCase.attorney_name.trim() ? (
                                                            <Field label="Attorney ROI permission">
                                                                <RadioGroup
                                                                    name={`atty_roi_${i}`}
                                                                    value={courtCase.attorney_roi_permission}
                                                                    options={ROI_PERMISSION_OPTIONS}
                                                                    onChange={(v) => patchCase({ attorney_roi_permission: v })}
                                                                    columns={3}
                                                                />
                                                            </Field>
                                                        ) : null}
                                                    </div>
                                                )
                                            })}
                                            <button
                                                type="button"
                                                style={{ ...BTN_SECONDARY, padding: "8px 12px", fontSize: "13px", marginBottom: "12px" }}
                                                onClick={() => set("court_cases", [...form.court_cases, emptyCourtCaseRow()])}
                                            >
                                                Add court case
                                            </button>
                                        </>
                                    ) : null}
                                    <Field label="Legal history summary">
                                        <textarea style={{ ...INPUT, minHeight: "72px" }} value={form.legal_history} onChange={(e) => set("legal_history", e.target.value)} />
                                    </Field>
                                    <h3 style={{ fontSize: "15px", margin: "20px 0 8px" }}>Protection / restraining orders</h3>
                                    <Field label="1. Subject to any active temporary or permanent protection / restraining orders?">
                                        <RadioGroup name="po" value={form.protection_order_active} options={YES_NO} onChange={(v) => set("protection_order_active", v)} />
                                    </Field>
                                    {form.protection_order_active === "yes" ? (
                                        <>
                                            <Field label="2. Applicant's status under this order (check all that apply)">
                                                <CheckGroup
                                                    values={form.protection_order_status}
                                                    options={[
                                                        { value: "restrained", label: "Restrained party" },
                                                        { value: "protected", label: "Protected party" },
                                                    ]}
                                                    onChange={(v) => set("protection_order_status", v)}
                                                />
                                            </Field>
                                            {form.protection_order_status.includes("restrained") ? (
                                                <>
                                                    <Field label="Protected party name(s)" hint="Required for compliance monitoring and facility safety.">
                                                        <input style={INPUT} value={form.protection_order_parties} onChange={(e) => set("protection_order_parties", e.target.value)} />
                                                    </Field>
                                                    <Field label="Order / case number">
                                                        <input style={INPUT} value={form.protection_order_case_number} onChange={(e) => set("protection_order_case_number", e.target.value)} />
                                                    </Field>
                                                </>
                                            ) : null}
                                            <Field label="4. Copy of the active protection order">
                                                <RadioGroup
                                                    name="pocopy"
                                                    value={form.protection_order_copy}
                                                    options={[
                                                        { value: "attached", label: "Attached (upload after submit)" },
                                                        { value: "unavailable", label: "Unavailable" },
                                                    ]}
                                                    onChange={(v) => set("protection_order_copy", v)}
                                                />
                                            </Field>
                                            {form.protection_order_copy === "unavailable" ? (
                                                <Field label="Reason unavailable">
                                                    <input style={INPUT} value={form.protection_order_unavailable_reason} onChange={(e) => set("protection_order_unavailable_reason", e.target.value)} />
                                                </Field>
                                            ) : null}
                                        </>
                                    ) : null}
                                    <Field label="Supervision">
                                        <RadioGroup name="sup" value={form.supervision} options={SUPERVISION_OPTIONS} onChange={(v) => set("supervision", v)} />
                                    </Field>
                                    {form.supervision && form.supervision !== "none" ? (
                                        <Field label="Officer name / contact">
                                            <input style={INPUT} value={form.officer_contact} onChange={(e) => set("officer_contact", e.target.value)} />
                                        </Field>
                                    ) : null}
                                    <Field label="Active warrants?">
                                        <RadioGroup
                                            name="warrants"
                                            value={form.active_warrants}
                                            options={YES_NO_UNKNOWN}
                                            onChange={(v) => {
                                                set("active_warrants", v)
                                                if (v === "yes" && form.active_warrant_details.length === 0) {
                                                    set("active_warrant_details", [emptyWarrantRow()])
                                                }
                                            }}
                                            columns={3}
                                        />
                                    </Field>
                                    {form.active_warrants === "yes" ? (
                                        <>
                                            {form.active_warrant_details.map((w, i) => {
                                                const patchW = (p: Partial<ActiveWarrantRow>) => {
                                                    const next = [...form.active_warrant_details]
                                                    next[i] = { ...next[i], ...p }
                                                    set("active_warrant_details", next)
                                                }
                                                return (
                                                    <div key={i} style={{ border: `1px solid ${C.borderLight}`, borderRadius: "8px", padding: "14px", marginBottom: "12px" }}>
                                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                                            <span style={{ fontSize: "13px", fontWeight: 600 }}>Warrant {i + 1}</span>
                                                            {form.active_warrant_details.length > 1 ? (
                                                                <button
                                                                    type="button"
                                                                    title="Remove warrant"
                                                                    aria-label="Remove warrant"
                                                                    onClick={() =>
                                                                        set(
                                                                            "active_warrant_details",
                                                                            form.active_warrant_details.filter((_, j) => j !== i)
                                                                        )
                                                                    }
                                                                    style={{ ...BTN_SECONDARY, padding: "6px 8px", color: C.error }}
                                                                >
                                                                    <TrashIcon />
                                                                </button>
                                                            ) : null}
                                                        </div>
                                                        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "10px" }}>
                                                            <Field label="County">
                                                                <input style={INPUT} value={w.county} onChange={(e) => patchW({ county: e.target.value })} />
                                                            </Field>
                                                            <Field label="Case">
                                                                <input style={INPUT} value={w.case_number} onChange={(e) => patchW({ case_number: e.target.value })} />
                                                            </Field>
                                                            <Field label="Charge">
                                                                <input style={INPUT} value={w.charge} onChange={(e) => patchW({ charge: e.target.value })} />
                                                            </Field>
                                                            <Field label="Issued">
                                                                <input type="date" style={INPUT} value={w.issued} onChange={(e) => patchW({ issued: e.target.value })} />
                                                            </Field>
                                                        </div>
                                                        <Field label="Notes">
                                                            <textarea style={{ ...INPUT, minHeight: "64px" }} value={w.notes} onChange={(e) => patchW({ notes: e.target.value })} />
                                                        </Field>
                                                    </div>
                                                )
                                            })}
                                            <button
                                                type="button"
                                                style={{ ...BTN_SECONDARY, padding: "8px 12px", fontSize: "13px", marginBottom: "12px" }}
                                                onClick={() => set("active_warrant_details", [...form.active_warrant_details, emptyWarrantRow()])}
                                            >
                                                Add warrant
                                            </button>
                                        </>
                                    ) : null}
                                    {navRow}
                                </div>
                            )}

                            {/* —— 11 Contacts —— */}
                            {currentStepId === 10 && (
                                <div>
                                    {sectionTitle(11, "Contacts and payee")}
                                    <p style={{ color: C.muted, fontSize: "13px", lineHeight: 1.5 }}>
                                        Contacts listed here can be added to the Authorization for Release of Information (ROI). Fields match ROI party slots:{" "}
                                        <strong style={{ fontWeight: 600 }}>Name</strong>, <strong style={{ fontWeight: 600 }}>Role</strong>,{" "}
                                        <strong style={{ fontWeight: 600 }}>Organization / phone / email</strong>, and permission (bilateral, send only, or receive only).
                                    </p>
                                    {form.contacts.map((c, i) => (
                                        <div key={i} style={{ border: `1px solid ${C.borderLight}`, borderRadius: "8px", padding: "14px", marginBottom: "12px" }}>
                                            <p style={{ margin: "0 0 10px", fontWeight: 600, fontSize: "14px", textTransform: "capitalize" }}>
                                                {c.type === "emergency"
                                                    ? "Emergency contact"
                                                    : c.type === "other"
                                                      ? "Other contact"
                                                      : c.type}
                                            </p>
                                            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "10px" }}>
                                                <Field label="Name" hint="Single field — maps to ROI party name">
                                                    <input style={INPUT} value={c.name} onChange={(e) => patchContact(i, { name: e.target.value })} />
                                                </Field>
                                                <Field label="Role" hint="Maps to ROI party role (e.g. Guardian, Case manager)">
                                                    <input style={INPUT} value={c.role} onChange={(e) => patchContact(i, { role: e.target.value })} />
                                                </Field>
                                                <Field label="Organization">
                                                    <input style={INPUT} value={c.organization} onChange={(e) => patchContact(i, { organization: e.target.value })} />
                                                </Field>
                                                <Field label="Phone">
                                                    <input style={INPUT} value={c.phone} onChange={(e) => patchContact(i, { phone: formatPhone(e.target.value) })} />
                                                </Field>
                                                <Field label="Email">
                                                    <input style={INPUT} type="email" value={c.email} onChange={(e) => patchContact(i, { email: e.target.value })} />
                                                </Field>
                                            </div>
                                            <Field label="ROI permission" hint="Mark one">
                                                <RadioGroup
                                                    name={`roi_${i}`}
                                                    value={c.roi_permission}
                                                    options={ROI_PERMISSION_OPTIONS}
                                                    onChange={(v) => patchContact(i, { roi_permission: v })}
                                                    columns={3}
                                                />
                                            </Field>
                                            {c.type !== "emergency" ? (
                                                <button
                                                    type="button"
                                                    style={{ ...BTN_SECONDARY, padding: "6px 10px", fontSize: "12px" }}
                                                    onClick={() => set("contacts", form.contacts.filter((_, j) => j !== i))}
                                                >
                                                    Remove
                                                </button>
                                            ) : null}
                                        </div>
                                    ))}
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
                                        {form.contacts.filter((c) => c.type === "guardian").length < 2 ? (
                                            <button type="button" style={{ ...BTN_SECONDARY, padding: "8px 12px", fontSize: "13px" }} onClick={() => set("contacts", [...form.contacts, emptyContact("guardian")])}>
                                                Add guardian
                                            </button>
                                        ) : null}
                                        {!form.contacts.some((c) => c.type === "payee") ? (
                                            <button type="button" style={{ ...BTN_SECONDARY, padding: "8px 12px", fontSize: "13px" }} onClick={() => set("contacts", [...form.contacts, emptyContact("payee")])}>
                                                Add payee
                                            </button>
                                        ) : null}
                                        {form.contacts.filter((c) => c.type === "professional").length < 3 ? (
                                            <button type="button" style={{ ...BTN_SECONDARY, padding: "8px 12px", fontSize: "13px" }} onClick={() => set("contacts", [...form.contacts, emptyContact("professional")])}>
                                                Add professional contact
                                            </button>
                                        ) : null}
                                        {form.contacts.filter((c) => c.type === "other").length < 3 ? (
                                            <button type="button" style={{ ...BTN_SECONDARY, padding: "8px 12px", fontSize: "13px" }} onClick={() => set("contacts", [...form.contacts, emptyContact("other")])}>
                                                Add other contact
                                            </button>
                                        ) : null}
                                    </div>
                                    {navRow}
                                </div>
                            )}

                            {/* —— 12 Documents —— */}
                            {currentStepId === 11 && (
                                <div>
                                    {sectionTitle(12, "Documents and checklist")}
                                    <p style={{ color: C.muted, fontSize: "14px" }}>
                                        Mark what you can provide. Missing items do not prevent submission. ★ Please attach if available — needed before a final decision. You can upload files after submit.
                                    </p>
                                    <div style={{ display: "grid", gap: "8px", marginBottom: "16px" }}>
                                        {DOCUMENT_CHECKLIST.map((doc) => (
                                            <label key={doc.code} style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "14px" }}>
                                                <input
                                                    type="checkbox"
                                                    checked={form.documents_available.includes(doc.code)}
                                                    onChange={() => {
                                                        const has = form.documents_available.includes(doc.code)
                                                        set(
                                                            "documents_available",
                                                            has
                                                                ? form.documents_available.filter((c) => c !== doc.code)
                                                                : [...form.documents_available, doc.code]
                                                        )
                                                    }}
                                                    style={{ marginTop: "3px" }}
                                                />
                                                <span>
                                                    {doc.starred ? <strong>★ </strong> : null}
                                                    {doc.label}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                    <Field label="Document notes">
                                        <textarea style={{ ...INPUT, minHeight: "64px" }} value={form.documents_notes} onChange={(e) => set("documents_notes", e.target.value)} />
                                    </Field>
                                    {navRow}
                                </div>
                            )}

                            {/* —— 13 Timeline —— */}
                            {currentStepId === 12 && (
                                <div>
                                    {sectionTitle(13, "Timeline and notes")}
                                    <Field label="Referral urgency">
                                        <RadioGroup name="urg" value={form.urgency_level} options={URGENCY_OPTIONS} onChange={(v) => set("urgency_level", v)} />
                                    </Field>
                                    {form.urgency_level === "immediate" || form.urgency_level === "within_1_2_weeks" ? (
                                        <Field label="Reason for urgency">
                                            <textarea style={{ ...INPUT, minHeight: "64px" }} value={form.urgency_reason} onChange={(e) => set("urgency_reason", e.target.value)} />
                                        </Field>
                                    ) : null}
                                    <Field label="Request earliest placement by">
                                        <input type="date" style={INPUT} value={form.requested_placement_by} onChange={(e) => set("requested_placement_by", e.target.value)} />
                                    </Field>
                                    <Field label="Additional notes or special considerations">
                                        <textarea style={{ ...INPUT, minHeight: "80px" }} value={form.additional_notes} onChange={(e) => set("additional_notes", e.target.value)} />
                                    </Field>
                                    <Field label="How did you hear about Monarch Mental Health?">
                                        <RadioGroup name="heard" value={form.referral_source_channel} options={HOW_HEARD_OPTIONS} onChange={(v) => set("referral_source_channel", v)} columns={1} />
                                    </Field>
                                    {form.referral_source_channel === "other" ? (
                                        <Field label="If other, specify">
                                            <input style={INPUT} value={form.how_heard_other} onChange={(e) => set("how_heard_other", e.target.value)} />
                                        </Field>
                                    ) : null}
                                    {navRow}
                                </div>
                            )}

                            {/* —— 14 Attestation —— */}
                            {currentStepId === 13 && (
                                <div>
                                    {sectionTitle(14, "Attestation and signature")}
                                    <p style={{ fontSize: "14px", lineHeight: 1.55, color: C.ink }}>
                                        {mode === "self"
                                            ? "I attest that the information I've provided is accurate to the best of my knowledge. I authorize Monarch to receive the health information in this referral and to contact me."
                                            : "I attest that the information provided is accurate to the best of my knowledge, and that I am authorized to submit this referral. I authorize Monarch to receive the protected health information included in this referral, and to contact the applicant or their legally authorized representative."}
                                    </p>
                                    <label style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "14px", margin: "16px 0" }}>
                                        <input
                                            type="checkbox"
                                            checked={form.attestation_checked}
                                            onChange={(e) => set("attestation_checked", e.target.checked)}
                                            style={{ marginTop: "3px" }}
                                        />
                                        <span>I agree to the attestation above.</span>
                                    </label>
                                    <Field label="Typed full name">
                                        <input style={INPUT} value={form.attestation_name} onChange={(e) => set("attestation_name", e.target.value)} />
                                    </Field>
                                    {form.attestation_name.trim() ? (
                                        <>
                                            <Field label="Signature style">
                                                <RadioGroup
                                                    name="sigstyle"
                                                    value={form.attestation_signature_style}
                                                    options={[
                                                        { value: "typed", label: "Typed (plain)" },
                                                        { value: "script", label: "Script (cursive font)" },
                                                    ]}
                                                    onChange={(v) => set("attestation_signature_style", v as "typed" | "script")}
                                                />
                                            </Field>
                                            <div
                                                style={{
                                                    marginBottom: "16px",
                                                    padding: "16px",
                                                    border: `1px dashed ${C.blueBorder}`,
                                                    borderRadius: "8px",
                                                    fontSize: form.attestation_signature_style === "script" ? "28px" : "16px",
                                                    fontFamily:
                                                        form.attestation_signature_style === "script"
                                                            ? `"Segoe Script", "Bradley Hand", "Apple Chancery", cursive`
                                                            : FONT,
                                                    color: C.ink,
                                                }}
                                            >
                                                {form.attestation_name}
                                            </div>
                                        </>
                                    ) : null}
                                    {mode === "professional" ? (
                                        <p style={{ fontSize: "13px", color: C.muted }}>
                                            Organization: {form.referral_source_organization || "—"} · Role: {form.referral_source_title || "—"}
                                        </p>
                                    ) : null}
                                    {navRow}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
