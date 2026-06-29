import { serve } from "https://deno.land/std@0.224.0/http/server.ts"

type ContactPayload = {
    destinationEmail?: string
    emailSubjectPrefix?: string
    fromName?: string
    fromEmail?: string
    phone?: string
    message?: string
    pageUrl?: string
    timestamp?: string
    meta?: {
        userAgent?: string
        referrer?: string
        pathname?: string
    }
    captcha?: {
        enabled?: boolean
        token?: string | null
    }
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

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders })
    }

    if (req.method !== "POST") {
        return json(405, { error: "Method not allowed" })
    }

    try {
        const resendApiKey = Deno.env.get("RESEND_API_KEY")
        const fromEmail = Deno.env.get("CONTACT_FROM_EMAIL")
        const defaultDestination = Deno.env.get("CONTACT_DEFAULT_TO")
        const allowedToCsv = Deno.env.get("CONTACT_ALLOWED_TO") ?? ""

        if (!resendApiKey || !fromEmail) {
            return json(500, {
                error: "Missing server configuration (RESEND_API_KEY/CONTACT_FROM_EMAIL).",
            })
        }

        const payload = (await req.json()) as ContactPayload

        const senderName = (payload.fromName ?? "").trim()
        const senderEmail = (payload.fromEmail ?? "").trim()
        const senderPhone = (payload.phone ?? "").trim()
        const senderMessage = (payload.message ?? "").trim()
        const subjectPrefix = (payload.emailSubjectPrefix ?? "[Website] ").trim()
        const requestedDestination = (payload.destinationEmail ?? "").trim()

        if (!senderName || !senderEmail || !senderMessage) {
            return json(400, {
                error: "Missing required fields: fromName, fromEmail, message.",
            })
        }

        if (!EMAIL_RE.test(senderEmail)) {
            return json(400, { error: "Invalid fromEmail address." })
        }

        const allowedDestinations = allowedToCsv
            .split(",")
            .map((value) => value.trim().toLowerCase())
            .filter(Boolean)

        let toEmail = requestedDestination || defaultDestination || ""
        if (!toEmail) {
            return json(500, {
                error: "No destination email configured.",
            })
        }

        if (allowedDestinations.length > 0) {
            const normalized = toEmail.toLowerCase()
            if (!allowedDestinations.includes(normalized)) {
                toEmail = defaultDestination || allowedDestinations[0]
            }
        }

        const lines = [
            `Name: ${senderName}`,
            `Email: ${senderEmail}`,
            `Phone: ${senderPhone || "-"}`,
            "",
            "Message:",
            senderMessage,
            "",
            `Page URL: ${payload.pageUrl ?? "-"}`,
            `Timestamp: ${payload.timestamp ?? "-"}`,
            `Pathname: ${payload.meta?.pathname ?? "-"}`,
            `Referrer: ${payload.meta?.referrer ?? "-"}`,
            `User Agent: ${payload.meta?.userAgent ?? "-"}`,
        ]

        const text = lines.join("\n")

        const escapeHtml = (s: string) =>
            s
                .replaceAll("&", "&amp;")
                .replaceAll("<", "&lt;")
                .replaceAll(">", "&gt;")
                .replaceAll('"', "&quot;")
                .replaceAll("'", "&#39;")
                .replaceAll("\n", "<br/>")

        const escapedName = escapeHtml(senderName)
        const escapedEmail = escapeHtml(senderEmail)
        const escapedPhone = escapeHtml(senderPhone || "-")
        const escapedMessage = escapeHtml(senderMessage)

        const html = `
<div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1f1f1f;">
  <h2 style="margin-bottom: 8px;">New Contact Form Submission</h2>
  <p style="margin: 0 0 16px;"><strong>Name:</strong> ${escapedName}</p>
  <p style="margin: 0 0 6px;"><strong>Email:</strong> ${escapedEmail}</p>
  <p style="margin: 0 0 16px;"><strong>Phone:</strong> ${escapedPhone}</p>
  <p style="margin: 0 0 6px;"><strong>Message:</strong></p>
  <p style="margin: 0 0 16px;">${escapedMessage}</p>
  <hr />
  <p style="font-size: 12px; color: #555;"><strong>Page URL:</strong> ${payload.pageUrl ?? "-"}</p>
  <p style="font-size: 12px; color: #555;"><strong>Timestamp:</strong> ${payload.timestamp ?? "-"}</p>
  <p style="font-size: 12px; color: #555;"><strong>Pathname:</strong> ${payload.meta?.pathname ?? "-"}</p>
</div>
        `.trim()

        const subject = `${subjectPrefix}Contact Form - ${senderName}`.trim()

        const resendResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${resendApiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: fromEmail,
                to: [toEmail],
                reply_to: senderEmail,
                subject,
                text,
                html,
            }),
        })

        const resendBodyText = await resendResponse.text()

        if (!resendResponse.ok) {
            console.error(
                "[monarch-contact-form] Resend error",
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
            // Resend usually returns JSON; ignore parse issues
        }
        return json(200, { ok: true, id: resendId })
    } catch (error) {
        return json(500, {
            error: "Unexpected error while processing form.",
            details: error instanceof Error ? error.message : String(error),
        })
    }
})
