import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1"

/**
 * Public (no-login) MH referral submit.
 * Accepts a client-built insert row, forces program / via / auth fields server-side,
 * inserts with service role (RLS blocks anon inserts), then fires PHI-free notify.
 */

type PublicSubmitBody = {
    payload?: Record<string, unknown>
    /** Honeypot — must be empty. */
    company_url?: string
}

const MH_PROGRAM_ID = "prog_mental_health"
const MAX_BODY_BYTES = 400_000

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i

const json = (status: number, body: Record<string, unknown>) =>
    new Response(JSON.stringify(body), {
        status,
        headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
        },
    })

function asString(v: unknown): string {
    return typeof v === "string" ? v.trim() : ""
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders })
    }
    if (req.method !== "POST") {
        return json(405, { error: "Method not allowed" })
    }

    try {
        const contentLength = Number(req.headers.get("content-length") || "0")
        if (contentLength > MAX_BODY_BYTES) {
            return json(413, { error: "Request too large." })
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL")
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
        if (!supabaseUrl || !serviceRoleKey) {
            return json(500, { error: "Missing Supabase configuration." })
        }

        const rawText = await req.text()
        if (rawText.length > MAX_BODY_BYTES) {
            return json(413, { error: "Request too large." })
        }

        let body: PublicSubmitBody
        try {
            body = JSON.parse(rawText) as PublicSubmitBody
        } catch {
            return json(400, { error: "Invalid JSON body." })
        }

        // Silent success for bots that fill the honeypot.
        if (asString(body.company_url)) {
            return json(200, {
                ok: true,
                id: null,
                referral_code: null,
                honey: true,
            })
        }

        const incoming = body.payload
        if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) {
            return json(400, { error: "Missing payload." })
        }

        const clientFirst = asString(incoming.client_first_name)
        const clientLast = asString(incoming.client_last_name)
        const sourceType = asString(incoming.referral_source_type)
        const sourceEmail = asString(incoming.referral_source_email).toLowerCase()
        const attestationName = asString(incoming.attestation_name)
        const sourcePhone = asString(incoming.referral_source_phone)
        const clientPhone = asString(incoming.client_phone)
        const clientEmail = asString(incoming.client_email).toLowerCase()

        if (!sourceType) {
            return json(400, { error: "Relationship (referral_source_type) is required." })
        }
        if (!clientFirst || !clientLast) {
            return json(400, { error: "Individual first and last name are required." })
        }
        if (!attestationName) {
            return json(400, { error: "Attestation name is required." })
        }
        if (!sourceEmail || !EMAIL_RE.test(sourceEmail)) {
            return json(400, { error: "A valid contact email is required." })
        }
        if (sourceType === "self") {
            if (!clientPhone && !clientEmail && !sourcePhone && !sourceEmail) {
                return json(400, { error: "Phone or email is required for self-referrals." })
            }
        } else if (!asString(incoming.referral_source_name)) {
            return json(400, { error: "Referrer name is required." })
        }

        // Force server-controlled fields — never trust client for program / via / auth.
        const row: Record<string, unknown> = {
            ...incoming,
            origin_program_id: MH_PROGRAM_ID,
            intended_program_id: MH_PROGRAM_ID,
            current_program_id: MH_PROGRAM_ID,
            submitted_via: "public_web",
            submitted_by_user_id: null,
            status: "pending_review",
            is_priority_referral: false,
            portal_access_opt_in: null,
            referral_source_email: sourceEmail,
            client_first_name: clientFirst,
            client_last_name: clientLast,
            attestation_name: attestationName,
            attested_at:
                asString(incoming.attested_at) || new Date().toISOString(),
        }
        delete row.id
        delete row.referral_code
        delete row.created_at
        delete row.updated_at

        const admin = createClient(supabaseUrl, serviceRoleKey)
        const { data, error } = await admin
            .from("referral_submissions")
            .insert([row])
            .select("id, referral_code")
            .maybeSingle()

        if (error) {
            console.error("[monarch-mh-referral-public-submit] insert", error)
            return json(400, {
                error: error.message || "Could not save referral.",
                details: error.details ?? null,
                hint: error.hint ?? null,
            })
        }
        if (!data?.id) {
            return json(500, { error: "Insert returned no row." })
        }

        // Fire-and-forget PHI-free staff notify (same as portal path).
        try {
            const notifyRes = await fetch(
                `${supabaseUrl}/functions/v1/monarch-mh-referral-submitted-notify`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${serviceRoleKey}`,
                        apikey: serviceRoleKey,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ referral_id: data.id }),
                },
            )
            if (!notifyRes.ok) {
                const t = await notifyRes.text()
                console.warn(
                    "[monarch-mh-referral-public-submit] notify",
                    notifyRes.status,
                    t,
                )
            }
        } catch (notifyErr) {
            console.warn("[monarch-mh-referral-public-submit] notify", notifyErr)
        }

        return json(200, {
            ok: true,
            id: data.id,
            referral_code: data.referral_code ?? null,
        })
    } catch (error) {
        return json(500, {
            error: "Unexpected error while saving referral.",
            details: error instanceof Error ? error.message : String(error),
        })
    }
})
