import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1"

type NotifyPayload = {
    referral_id?: string
}

const MH_PROGRAM_ID = "prog_mental_health"

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const json = (status: number, body: Record<string, unknown>) =>
    new Response(JSON.stringify(body), {
        status,
        headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
        },
    })

const escapeHtml = (s: string) =>
    s
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;")

const LOVED_ONE = new Set(["family_member", "poa_guardian"])

/** PHI-free submitter label per MMH_REFERRAL_FORM_SPEC §9. */
function submitterLabel(row: {
    referral_source_type?: string | null
    referral_source_name?: string | null
    mh_intake?: Record<string, unknown> | null
}): { subject: string; line: string } {
    const type = String(row.referral_source_type || "").trim()
    const mode =
        type === "self"
            ? "self"
            : LOVED_ONE.has(type)
              ? "loved_one"
              : (row.mh_intake?.wording_mode as string) || "professional"

    if (mode === "self" || type === "self") {
        return {
            subject: "New self-referral received",
            line: "New self-referral received.",
        }
    }

    const full = String(row.referral_source_name || "").trim()
    const parts = full.split(/\s+/).filter(Boolean)
    let label = full || "a referral partner"

    if (mode === "loved_one" && parts.length >= 1) {
        const first = parts[0]
        const lastInitial = parts.length > 1 ? `${parts[parts.length - 1][0]}.` : ""
        label = lastInitial ? `${first} ${lastInitial}` : first
    }

    return {
        subject: `New referral received from ${label}`,
        line: `New referral received from ${label}.`,
    }
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
        const resendApiKey = Deno.env.get("RESEND_API_KEY")
        const fromEmail =
            Deno.env.get("MH_REFERRAL_NOTIFY_FROM") ??
            Deno.env.get("REFERRAL_NOTIFY_FROM_EMAIL") ??
            Deno.env.get("CONTACT_FROM_EMAIL")
        const toEmail =
            Deno.env.get("MH_REFERRAL_NOTIFY_TO") ??
            "referrals@monarchmentalhealth.org"
        const dashboardBase = (
            Deno.env.get("MH_STAFF_DASHBOARD_BASE_URL") ??
            Deno.env.get("REFERRAL_APP_BASE_URL") ??
            "https://monarch-two-theta.vercel.app"
        ).replace(/\/$/, "")

        if (!supabaseUrl || !serviceRoleKey) {
            return json(500, { error: "Missing Supabase configuration." })
        }
        if (!resendApiKey || !fromEmail) {
            return json(500, {
                error:
                    "Missing server configuration (RESEND_API_KEY / MH_REFERRAL_NOTIFY_FROM or CONTACT_FROM_EMAIL).",
            })
        }

        const payload = (await req.json()) as NotifyPayload
        const referralId = (payload.referral_id ?? "").trim()
        if (!referralId) {
            return json(400, { error: "Missing required field: referral_id." })
        }

        const admin = createClient(supabaseUrl, serviceRoleKey)
        const { data: row, error: rowError } = await admin
            .from("referral_submissions")
            .select(
                "id, referral_code, referral_source_type, referral_source_name, current_program_id, intended_program_id, mh_intake, created_at",
            )
            .eq("id", referralId)
            .maybeSingle()

        if (rowError) {
            console.error("[monarch-mh-referral-submitted-notify] load", rowError)
            return json(500, { error: "Could not load referral." })
        }
        if (!row) {
            return json(404, { error: "Referral not found." })
        }

        const programId =
            (row.current_program_id as string | null) ||
            (row.intended_program_id as string | null)
        if (programId !== MH_PROGRAM_ID) {
            return json(400, {
                error: "Referral is not a Mental Health program submission.",
            })
        }

        // Only notify for recently created rows (limits replay abuse).
        const createdAt = new Date((row.created_at as string) || 0)
        if (
            Number.isNaN(createdAt.getTime()) ||
            Date.now() - createdAt.getTime() > 24 * 60 * 60 * 1000
        ) {
            return json(400, {
                error: "Referral is too old to send a submission notification for.",
            })
        }

        const { subject, line } = submitterLabel({
            referral_source_type: row.referral_source_type as string | null,
            referral_source_name: row.referral_source_name as string | null,
            mh_intake: (row.mh_intake as Record<string, unknown> | null) ?? null,
        })

        const code = String(row.referral_code || "").trim()
        const dashboardUrl = `${dashboardBase}/dashboard`
        const text = [
            line,
            "",
            code ? `Referral code: ${code}` : null,
            `Open the admissions dashboard: ${dashboardUrl}`,
            "",
            "This message does not include protected health information about the individual being referred.",
        ]
            .filter((x) => x !== null)
            .join("\n")

        const html = `
<div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1d1d1b;">
  <h2 style="margin: 0 0 12px;">Monarch Mental Health</h2>
  <p style="margin: 0 0 16px;">${escapeHtml(line)}</p>
  ${code ? `<p style="margin: 0 0 8px;"><strong>Referral code:</strong> ${escapeHtml(code)}</p>` : ""}
  <p style="margin: 0 0 16px;"><a href="${escapeHtml(dashboardUrl)}">Open admissions dashboard</a></p>
  <p style="margin: 0; font-size: 12px; color: #555;">
    This message does not include protected health information about the individual being referred.
  </p>
</div>
        `.trim()

        const resendResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${resendApiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: fromEmail,
                to: [toEmail],
                subject,
                text,
                html,
            }),
        })

        const resendBodyText = await resendResponse.text()
        if (!resendResponse.ok) {
            console.error(
                "[monarch-mh-referral-submitted-notify] Resend error",
                resendResponse.status,
                resendBodyText,
            )
            return json(502, {
                error: "Email provider request failed.",
                details: resendBodyText,
                status: resendResponse.status,
            })
        }

        let resendId: string | null = null
        try {
            if (resendBodyText) {
                const parsed = JSON.parse(resendBodyText) as { id?: string }
                resendId = parsed?.id ?? null
            }
        } catch {
            // ignore
        }

        return json(200, { ok: true, id: resendId, to: toEmail })
    } catch (error) {
        return json(500, {
            error: "Unexpected error while sending notification.",
            details: error instanceof Error ? error.message : String(error),
        })
    }
})
