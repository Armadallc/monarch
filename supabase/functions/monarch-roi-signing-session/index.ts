import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1"

type SessionPayload = {
    token?: string
    dob?: string
    /** Clear cached DocuSeal submission and create a new one (e.g. after test → production API key). */
    refresh_submission?: boolean
}

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const json = (status: number, body: Record<string, unknown>) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    })

const DOCUSEAL_API = "https://api.docuseal.com"
/** Monarch Competency ROI v2.2 — update Supabase secret DOCUSEAL_ROI_TEMPLATE_ID to match. */
const DEFAULT_TEMPLATE_ID = 3756335
/** Must match DocuSeal template 3756335 submitter role label exactly. */
const SIGNER_ROLE = "Authorizing Party"

/** Calendar date as YYYY-MM-DD (no UTC day shift). */
const normalizeDate = (value: string | null | undefined): string | null => {
    if (!value) return null
    const s = value.trim()
    if (!s) return null
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (m) return `${m[1]}-${m[2]}-${m[3]}`
    const d = new Date(s)
    if (Number.isNaN(d.getTime())) return null
    const y = d.getFullYear()
    const mo = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${y}-${mo}-${day}`
}

const lastFourSsn = (ssn: string | null | undefined): string | null => {
    if (!ssn) return null
    const digits = ssn.replace(/\D/g, "")
    if (digits.length < 4) return null
    return digits.slice(-4)
}

type PrefillExtras = {
    /** admissions_staff_profiles.display_name for referral_share_links.created_by_user_id */
    roi_received_by?: string | null
}

const buildPrefillValues = (
    referral: Record<string, unknown>,
    extras?: PrefillExtras
): Record<string, string> => {
    const values: Record<string, string> = {}
    const first = String(referral.client_first_name ?? "").trim()
    const middle = String(referral.client_middle_name ?? "").trim()
    const last = String(referral.client_last_name ?? "").trim()
    const dob = normalizeDate(String(referral.client_dob ?? ""))
    const ssn4 = lastFourSsn(String(referral.client_ssn ?? ""))
    const code = String(referral.referral_code ?? "").trim()

    if (first) values.legal_first_name = first
    if (middle) values.legal_middle_name = middle
    if (last) values.legal_last_name = last
    if (dob) values.date_of_birth = dob
    if (ssn4) values.last_four_ssn = ssn4
    if (code) values.internal_use_referral_reference_code = code

    const recvBy = String(extras?.roi_received_by ?? "").trim()
    if (recvBy) values.roi_received_by = recvBy

    return values
}

const createDocusealSubmission = async (
    apiKey: string,
    templateId: number,
    linkId: string,
    signerEmail: string,
    signerName: string,
    prefill: Record<string, string>
) => {
    const body = {
        template_id: templateId,
        send_email: false,
        order: "preserved",
        submitters: [
            {
                role: SIGNER_ROLE,
                email: signerEmail,
                name: signerName,
                external_id: linkId,
                send_email: false,
                values: prefill,
            },
        ],
    }

    const res = await fetch(`${DOCUSEAL_API}/submissions`, {
        method: "POST",
        headers: {
            "X-Auth-Token": apiKey,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
        const msg =
            typeof data?.error === "string"
                ? data.error
                : typeof data?.message === "string"
                  ? data.message
                  : `DocuSeal API ${res.status}`
        throw new Error(msg)
    }

    // POST /submissions returns an array of submitters (not { id, submitters }).
    type DocuSealSubmitter = {
        id?: number
        submission_id?: number
        slug?: string
        role?: string
        embed_src?: string
    }

    let submitters: DocuSealSubmitter[] = []
    if (Array.isArray(data)) {
        submitters = data as DocuSealSubmitter[]
    } else if (data && typeof data === "object") {
        const obj = data as Record<string, unknown>
        if (Array.isArray(obj.submitters)) {
            submitters = obj.submitters as DocuSealSubmitter[]
        }
    }

    const roleMatch = (role: string | undefined) => {
        const r = String(role ?? "").toLowerCase().replace(/[\s_-]+/g, "")
        const want = SIGNER_ROLE.toLowerCase().replace(/[\s_-]+/g, "")
        return r === want || r.includes(want) || want.includes(r)
    }

    const primary =
        submitters.find((s) => roleMatch(s.role)) ??
        submitters.find((s) => s.slug) ??
        submitters[0]

    const slug = primary?.slug?.trim()
    const submissionId =
        primary?.submission_id ??
        (typeof (data as Record<string, unknown>)?.id === "number"
            ? ((data as Record<string, unknown>).id as number)
            : undefined)

    if (!slug || !submissionId) {
        console.error(
            "[monarch-roi-signing-session] unexpected DocuSeal create response:",
            JSON.stringify(data).slice(0, 2000)
        )
        throw new Error("DocuSeal submission missing submitter slug or id")
    }

    const embedSrc =
        typeof primary?.embed_src === "string" && primary.embed_src.trim()
            ? primary.embed_src.trim()
            : undefined

    return { slug, submissionId, embedSrc }
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders })
    }

    if (req.method !== "POST") {
        return json(405, { error: "Method not allowed" })
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
        const docusealKey = Deno.env.get("DOCUSEAL_API_KEY")
        const templateId = Number(
            Deno.env.get("DOCUSEAL_ROI_TEMPLATE_ID") ?? DEFAULT_TEMPLATE_ID
        )

        if (!supabaseUrl || !serviceRoleKey) {
            return json(500, { error: "Missing Supabase configuration." })
        }
        if (!docusealKey) {
            return json(500, { error: "DocuSeal is not configured." })
        }

        const payload = (await req.json().catch(() => ({}))) as SessionPayload
        const token = payload.token?.trim()
        if (!token) {
            return json(400, { error: "Missing token." })
        }

        const supabase = createClient(supabaseUrl, serviceRoleKey)

        const { data: link, error: linkErr } = await supabase
            .from("referral_share_links")
            .select(
                "id, referral_id, token, label, expires_at, link_type, requires_dob, envelope_status, docuseal_template_id, docuseal_submission_id, docuseal_submitter_slug, signer_email, signer_name, completed_at, created_by_user_id, sent_at"
            )
            .eq("token", token)
            .maybeSingle()

        if (linkErr || !link) {
            return json(200, {
                gate: "invalid",
                error: "Link not found.",
                message: "This signing link is not valid. Ask Monarch staff for a new link.",
            })
        }

        if (link.link_type !== "roi_sign") {
            return json(200, {
                gate: "invalid",
                error: "This link is not for ROI signing.",
            })
        }

        if (new Date(link.expires_at) <= new Date()) {
            await supabase
                .from("referral_share_links")
                .update({ envelope_status: "expired" })
                .eq("id", link.id)
            return json(200, {
                gate: "expired",
                error: "This link has expired.",
                message: "This signing link has expired. Contact Monarch admissions for a new link.",
            })
        }

        if (
            link.envelope_status === "completed" ||
            link.envelope_status === "signer_completed"
        ) {
            return json(200, {
                gate: "completed",
                label: link.label,
                message: "This authorization has already been signed. Thank you.",
            })
        }

        if (link.requires_dob) {
            const dobInput = normalizeDate(payload.dob)
            if (!dobInput) {
                return json(200, {
                    gate: "dob_required",
                    label: link.label,
                    message:
                        "Enter the client date of birth to continue.",
                })
            }

            const { data: referral, error: refErr } = await supabase
                .from("referral_submissions")
                .select("client_dob")
                .eq("id", link.referral_id)
                .maybeSingle()

            if (refErr || !referral) {
                return json(500, { error: "Could not verify referral." })
            }

            const expected = normalizeDate(
                referral.client_dob as string | null | undefined
            )
            if (!expected) {
                return json(200, {
                    gate: "error",
                    error: "Date of birth is not on file for this referral.",
                    message:
                        "We cannot verify identity because this referral has no client date of birth on file. Please contact Monarch admissions, or ask staff to update the referral and send a new signing link.",
                })
            }
            if (expected !== dobInput) {
                return json(200, {
                    gate: "dob_mismatch",
                    error: "Date of birth does not match our records.",
                    message:
                        "The date of birth entered does not match our records. Check the format (YYYY-MM-DD) and try again, or contact Monarch admissions if you need help.",
                })
            }
        }

        let submitterSlug = link.docuseal_submitter_slug as string | null
        let submissionId = link.docuseal_submission_id as number | null
        let embedSrcFromApi: string | undefined
        let signerEmail = (link.signer_email as string | null)?.trim() || ""
        let signerName = (link.signer_name as string | null)?.trim() || ""

        const refreshSubmission = payload.refresh_submission === true
        if (refreshSubmission && link.envelope_status === "completed") {
            return json(200, {
                gate: "completed",
                label: link.label,
                message: "This authorization has already been signed.",
            })
        }
        if (refreshSubmission) {
            submitterSlug = null
            submissionId = null
        }

        if (!submitterSlug || !submissionId) {
            const { data: referral, error: refErr } = await supabase
                .from("referral_submissions")
                .select(
                    "client_first_name, client_middle_name, client_last_name, client_dob, client_ssn, referral_code, referral_source_email"
                )
                .eq("id", link.referral_id)
                .single()

            if (refErr || !referral) {
                return json(500, { error: "Referral not found." })
            }

            let roiReceivedBy: string | null = null
            const creatorId = link.created_by_user_id as string | null
            if (creatorId) {
                const { data: staffProf } = await supabase
                    .from("admissions_staff_profiles")
                    .select("display_name")
                    .eq("user_id", creatorId)
                    .maybeSingle()
                roiReceivedBy = (staffProf?.display_name as string | null)?.trim() || null
            }

            signerEmail =
                signerEmail ||
                (referral.referral_source_email as string | null)?.trim() ||
                "roi-signer@monarchcompetency.invalid"

            signerName =
                signerName ||
                [
                    referral.client_first_name,
                    referral.client_last_name,
                ]
                    .filter(Boolean)
                    .join(" ")
                    .trim() ||
                "Authorized signer"

            const tplId =
                (link.docuseal_template_id as number | null) ?? templateId

            const created = await createDocusealSubmission(
                docusealKey,
                tplId,
                link.id,
                signerEmail,
                signerName,
                buildPrefillValues(referral as Record<string, unknown>, {
                    roi_received_by: roiReceivedBy,
                })
            )

            submitterSlug = created.slug
            submissionId = created.submissionId
            embedSrcFromApi = created.embedSrc

            await supabase
                .from("referral_share_links")
                .update({
                    docuseal_submission_id: submissionId,
                    docuseal_submitter_slug: submitterSlug,
                    docuseal_template_id: tplId,
                    envelope_status: "embed_ready",
                    signer_email: signerEmail,
                    signer_name: signerName,
                })
                .eq("id", link.id)

            await supabase.rpc("log_referral_activity", {
                p_referral_id: link.referral_id,
                p_activity_type: "roi_signing_started",
                p_details: { share_link_id: link.id },
            })
        }

        const embedHost =
            Deno.env.get("DOCUSEAL_EMBED_HOST") ?? "https://docuseal.com"

        const embed_src =
            embedSrcFromApi ||
            `${embedHost.replace(/\/$/, "")}/s/${submitterSlug}`

        return json(200, {
            gate: "ready",
            label: link.label,
            embed_src,
            submission_id: submissionId,
            signer_email: signerEmail || undefined,
            signer_name: signerName || undefined,
        })
    } catch (e) {
        console.error("[monarch-roi-signing-session]", e)
        const msg = e instanceof Error ? e.message : "Unexpected error"
        if (/template.*not found/i.test(msg) || /production api key/i.test(msg)) {
            return json(200, {
                gate: "error",
                error: "ROI signing is not configured for this DocuSeal environment.",
                message:
                    "The DocuSeal test API key cannot access production template 3756335. Use a production API key in Supabase secrets, or set DOCUSEAL_ROI_TEMPLATE_ID to your test-mode template ID. Contact Monarch staff if you need a new link after this is fixed.",
            })
        }
        return json(200, {
            gate: "error",
            error: "Could not start signing session.",
            message: msg,
        })
    }
})
