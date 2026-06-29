import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1"

type NotifyPayload = {
    referral_id?: string
    batch_id?: string
}

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

const escapeHtml = (s: string) =>
    s
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;")

/** Only allow notify for batches created recently (limits abuse with public anon invoke). */
const BATCH_NOTIFY_MAX_AGE_MS = 24 * 60 * 60 * 1000

const formatDueDate = (iso: string | null): string | null => {
    if (!iso) return null
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return null
    return d.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "America/Denver",
    })
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
            Deno.env.get("REFERRAL_NOTIFY_FROM_EMAIL") ??
            Deno.env.get("CONTACT_FROM_EMAIL")
        const portalBase = (
            Deno.env.get("REFERRAL_PORTAL_BASE_URL") ??
            "https://monarchy.framer.website"
        ).replace(/\/$/, "")
        const replyTo =
            Deno.env.get("REFERRAL_NOTIFY_REPLY_TO") ??
            "admissions@monarchcompetency.com"
        const supportEmail =
            Deno.env.get("REFERRAL_NOTIFY_SUPPORT_EMAIL") ??
            "referrals@monarchcompetency.com"

        if (!supabaseUrl || !serviceRoleKey) {
            return json(500, { error: "Missing Supabase configuration." })
        }
        if (!resendApiKey || !fromEmail) {
            return json(500, {
                error:
                    "Missing server configuration (RESEND_API_KEY / REFERRAL_NOTIFY_FROM_EMAIL or CONTACT_FROM_EMAIL).",
            })
        }

        const payload = (await req.json()) as NotifyPayload
        const referralId = (payload.referral_id ?? "").trim()
        const batchId = (payload.batch_id ?? "").trim()
        if (!referralId || !batchId) {
            return json(400, {
                error: "Missing required fields: referral_id, batch_id.",
            })
        }

        const admin = createClient(supabaseUrl, serviceRoleKey)
        const { data: row, error: rowError } = await admin
            .from("referral_document_request_batches")
            .select(
                `
                id,
                referral_id,
                round_number,
                due_at,
                roi_required,
                created_at,
                created_by_user_id,
                referral_submissions (
                    referral_code,
                    referral_source_email
                )
            `,
            )
            .eq("id", batchId)
            .eq("referral_id", referralId)
            .maybeSingle()

        if (rowError) {
            console.error(
                "[monarch-referral-document-request-notify] load batch",
                rowError,
            )
            return json(500, { error: "Could not load document request." })
        }
        if (!row) {
            return json(404, { error: "Document request batch not found." })
        }

        const createdAt = new Date((row.created_at as string) || 0)
        if (
            Number.isNaN(createdAt.getTime()) ||
            Date.now() - createdAt.getTime() > BATCH_NOTIFY_MAX_AGE_MS
        ) {
            return json(400, {
                error:
                    "Document request batch is too old to send a notification for.",
            })
        }

        const createdBy = row.created_by_user_id as string | null
        if (!createdBy) {
            return json(400, {
                error: "Document request batch has no staff creator on file.",
            })
        }

        const submission = row.referral_submissions as {
            referral_code?: string | null
            referral_source_email?: string | null
        } | null
        const referralCode = (submission?.referral_code ?? "").trim()
        const toEmail = (submission?.referral_source_email ?? "").trim()

        if (!referralCode) {
            return json(500, { error: "Referral code missing on submission." })
        }
        if (!toEmail || !EMAIL_RE.test(toEmail)) {
            return json(400, {
                error:
                    "Referral source email is missing or invalid on this submission.",
            })
        }

        const portalUrl = `${portalBase}/portal`
        const loginUrl = `${portalBase}/login?bucket=source`
        const dueFormatted = formatDueDate(row.due_at as string | null)
        const roundNumber = Number(row.round_number) || 1
        const roiRequired = Boolean(row.roi_required)

        const subject = `Referral ${referralCode} needs your attention`

        const dueLine = dueFormatted
            ? `Requested due date: ${dueFormatted}.`
            : ""
        const roiLine = roiRequired
            ? "A signed release of information may be required — see your portal for details."
            : ""

        const textLines = [
            `Monarch Competency has requested documents for referral ${referralCode} (request round ${roundNumber}).`,
            "",
            "Sign in to your secure referral portal to see what is needed and upload files:",
            portalUrl,
            "",
            loginUrl !== portalUrl
                ? `Or sign in first: ${loginUrl}`
                : "",
            dueLine,
            roiLine,
            "",
            "This notification does not include clinical details. Please use the portal for all referral information.",
            "",
            `Questions? ${supportEmail}`,
        ].filter(Boolean)

        const text = textLines.join("\n")

        const htmlDue = dueFormatted
            ? `<p style="margin: 0 0 12px;"><strong>Requested due date:</strong> ${escapeHtml(dueFormatted)}</p>`
            : ""
        const htmlRoi = roiRequired
            ? `<p style="margin: 0 0 16px; padding: 12px; background: #f5f0e8; border-radius: 8px;">A signed <strong>release of information</strong> may be required. Open your portal for details.</p>`
            : ""

        const html = `
<div style="font-family: Arial, sans-serif; line-height: 1.55; color: #2b2828; max-width: 560px;">
  <p style="margin: 0 0 12px;">Monarch Competency has requested documents for referral <strong>${escapeHtml(referralCode)}</strong> (round ${roundNumber}).</p>
  <p style="margin: 0 0 16px;">Sign in to your secure referral portal to see what is needed and upload files:</p>
  <p style="margin: 0 0 20px;">
    <a href="${escapeHtml(portalUrl)}" style="display: inline-block; padding: 12px 20px; background: #7eacb5; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">Open referral portal</a>
  </p>
  ${htmlDue}
  ${htmlRoi}
  <p style="margin: 0 0 12px; font-size: 13px; color: #555;">This email is a notification only and does not include clinical details. Use the portal for all referral information.</p>
  <p style="margin: 0; font-size: 13px; color: #555;">Questions? <a href="mailto:${escapeHtml(supportEmail)}">${escapeHtml(supportEmail)}</a></p>
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
                reply_to: replyTo,
                subject,
                text,
                html,
            }),
        })

        const resendBodyText = await resendResponse.text()
        if (!resendResponse.ok) {
            console.error(
                "[monarch-referral-document-request-notify] Resend error",
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

        return json(200, {
            ok: true,
            id: resendId,
            to: toEmail,
            referral_code: referralCode,
        })
    } catch (error) {
        console.error("[monarch-referral-document-request-notify]", error)
        return json(500, {
            error: "Unexpected error while sending notification.",
            details: error instanceof Error ? error.message : String(error),
        })
    }
})
