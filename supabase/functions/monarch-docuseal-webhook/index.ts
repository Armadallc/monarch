import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1"

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type, x-docuseal-signature",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const json = (status: number, body: Record<string, unknown>) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    })

const DOCUSEAL_API = "https://api.docuseal.com"
/** Must match dashboard / portal uploads (DocumentUploadForm, ReferralDashboard). */
const STORAGE_BUCKET = "referral-documents"

/** DocuSeal file-upload field names to mirror into Supabase (not embedded in combined PDF). */
const ROI_SUPPORTING_FIELD_NAMES = new Set(["supporting_document_upload"])

type DocuSealSubmitter = {
    id?: number
    submission_id?: number
    external_id?: string
    role?: string
    status?: string
    values?: Array<{ field?: string; value?: unknown }>
    documents?: Array<{ url?: string; download_url?: string; name?: string }>
}

type UploadedDocEntry = {
    type: string
    name: string
    filename: string
    storage_path: string
    uploaded_at: string
    source: string
    mime_type?: string
    field_name?: string
}

const completedEvents = new Set([
    "submission.completed",
    "form.completed",
])

const extractSubmissionId = (
    body: Record<string, unknown>,
    data: Record<string, unknown>,
    submission: Record<string, unknown>
): number | null => {
    const raw =
        submission?.id ??
        data?.id ??
        data?.submission_id ??
        body?.submission_id
    const n = typeof raw === "number" ? raw : Number(raw)
    return Number.isFinite(n) && n > 0 ? n : null
}

const extractPdfUrl = (
    data: Record<string, unknown>,
    submission: Record<string, unknown>,
    submitters: DocuSealSubmitter[]
): string | null => {
    const top =
        (submission?.combined_document_url as string | undefined) ??
        (data?.combined_document_url as string | undefined) ??
        null
    if (top?.trim()) return top.trim()

    const documents = Array.isArray(data?.documents)
        ? (data.documents as Array<{ url?: string; download_url?: string }>)
        : Array.isArray(submission?.documents)
          ? (submission.documents as Array<{ url?: string; download_url?: string }>)
          : []

    if (documents.length > 0) {
        const first = documents[0]
        const u = first?.url ?? first?.download_url
        if (u?.trim()) return u.trim()
    }

    for (const s of submitters) {
        const docs = s.documents ?? []
        if (docs.length > 0) {
            const u = docs[0]?.url ?? docs[0]?.download_url
            if (u?.trim()) return u.trim()
        }
    }

    return null
}

const findShareLinkId = (submitters: DocuSealSubmitter[]): string | null => {
    for (const s of submitters) {
        const id = s?.external_id?.trim()
        if (id) return id
    }
    return null
}

const isDownloadableUrl = (value: string): boolean =>
    /^https?:\/\//i.test(value) &&
    !value.includes("docuseal.com/e/") &&
    !value.includes("/s/")

const urlsFromFieldValue = (value: unknown): string[] => {
    if (typeof value === "string" && isDownloadableUrl(value)) return [value]
    if (!Array.isArray(value)) return []
    const out: string[] = []
    for (const item of value) {
        if (typeof item === "string" && isDownloadableUrl(item)) out.push(item)
        else if (item && typeof item === "object") {
            const u = (item as { url?: string; download_url?: string }).url ??
                (item as { url?: string; download_url?: string }).download_url
            if (u && isDownloadableUrl(u)) out.push(u)
        }
    }
    return out
}

const collectSupportingFileUrls = (
    submitters: DocuSealSubmitter[],
    payloadValues?: Array<{ field?: string; value?: unknown }>
): Array<{ field: string; url: string }> => {
    const out: Array<{ field: string; url: string }> = []
    const seen = new Set<string>()

    const isSupportingField = (field: string): boolean => {
        if (ROI_SUPPORTING_FIELD_NAMES.has(field)) return true
        const norm = field.trim().toLowerCase().replace(/\s+/g, "_")
        if (ROI_SUPPORTING_FIELD_NAMES.has(norm)) return true
        return norm.includes("supporting_document")
    }

    const add = (field: string, url: string) => {
        if (!isSupportingField(field)) return
        if (seen.has(url)) return
        seen.add(url)
        out.push({ field, url })
    }

    for (const row of payloadValues ?? []) {
        const field = String(row?.field ?? "").trim()
        for (const url of urlsFromFieldValue(row?.value)) add(field, url)
    }

    for (const s of submitters) {
        for (const row of s.values ?? []) {
            const field = String(row?.field ?? "").trim()
            for (const url of urlsFromFieldValue(row?.value)) add(field, url)
        }
    }

    return out
}

const filenameFromUrl = (url: string, index: number): string => {
    try {
        const path = new URL(url).pathname
        const base = path.split("/").pop()?.split("?")[0]
        if (base && base.includes(".")) return base.replace(/[^\w.\-]+/g, "_")
    } catch {
        // ignore
    }
    return `roi-supporting-${index + 1}.pdf`
}

const fetchSubmissionDetails = async (
    apiKey: string,
    submissionId: number
): Promise<Record<string, unknown> | null> => {
    const res = await fetch(`${DOCUSEAL_API}/submissions/${submissionId}`, {
        headers: { "X-Auth-Token": apiKey },
    })
    if (!res.ok) return null
    return (await res.json()) as Record<string, unknown>
}

const mirrorSupportingFiles = async (
    supabase: ReturnType<typeof createClient>,
    referralId: string,
    files: Array<{ field: string; url: string }>,
    completedAt: string
): Promise<UploadedDocEntry[]> => {
    const entries: UploadedDocEntry[] = []
    const stamp = completedAt.replace(/[:.]/g, "-")

    for (let i = 0; i < files.length; i++) {
        const { field, url } = files[i]
        try {
            const res = await fetch(url)
            if (!res.ok) {
                console.warn(
                    "[monarch-docuseal-webhook] supporting file download failed",
                    res.status,
                    field
                )
                continue
            }
            const bytes = new Uint8Array(await res.arrayBuffer())
            const mime =
                res.headers.get("content-type")?.split(";")[0]?.trim() ||
                "application/octet-stream"
            const fname = filenameFromUrl(url, i)
            const storagePath = `referrals/${referralId}/roi/supporting/${stamp}_${fname}`

            const { error: uploadErr } = await supabase.storage
                .from(STORAGE_BUCKET)
                .upload(storagePath, bytes, {
                    contentType: mime,
                    upsert: false,
                })

            if (uploadErr) {
                console.warn(
                    "[monarch-docuseal-webhook] supporting upload failed",
                    uploadErr.message,
                    storagePath
                )
                continue
            }

            entries.push({
                type: "roi_supporting_document",
                name: fname,
                filename: fname,
                storage_path: storagePath,
                uploaded_at: completedAt,
                source: "docuseal",
                mime_type: mime,
                field_name: field,
            })
        } catch (e) {
            console.warn(
                "[monarch-docuseal-webhook] supporting file error",
                field,
                e
            )
        }
    }

    return entries
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders })
    }

    if (req.method !== "POST") {
        return json(405, { error: "Method not allowed" })
    }

    try {
        const webhookSecret = Deno.env.get("DOCUSEAL_WEBHOOK_SECRET")
        if (webhookSecret) {
            const headerSecret =
                req.headers.get("x-docuseal-secret") ??
                req.headers.get("x-webhook-secret")
            if (headerSecret !== webhookSecret) {
                console.warn("[monarch-docuseal-webhook] rejected: secret mismatch")
                return json(401, { error: "Invalid webhook secret" })
            }
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL")
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
        const docusealKey = Deno.env.get("DOCUSEAL_API_KEY")

        if (!supabaseUrl || !serviceRoleKey) {
            return json(500, { error: "Missing Supabase configuration." })
        }

        const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
        const eventType = String(body?.event_type ?? "")

        if (!completedEvents.has(eventType)) {
            return json(200, { ok: true, ignored: eventType || "unknown" })
        }

        const data = (body?.data ?? body) as Record<string, unknown>
        const submission = (data?.submission ?? data) as Record<string, unknown>
        const submissionId = extractSubmissionId(body, data, submission)

        const submitters: DocuSealSubmitter[] = Array.isArray(data?.submitters)
            ? (data.submitters as DocuSealSubmitter[])
            : Array.isArray(submission?.submitters)
              ? (submission.submitters as DocuSealSubmitter[])
              : []

        let shareLinkId = findShareLinkId(submitters)
        if (!shareLinkId) {
            const ext = String(
                data?.external_id ?? submission?.external_id ?? ""
            ).trim()
            if (ext) shareLinkId = ext
        }

        const supabase = createClient(supabaseUrl, serviceRoleKey)

        if (!shareLinkId && submissionId) {
            const { data: bySubmission } = await supabase
                .from("referral_share_links")
                .select("id")
                .eq("docuseal_submission_id", submissionId)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle()
            if (bySubmission?.id) shareLinkId = bySubmission.id as string
        }

        if (!shareLinkId) {
            console.warn(
                "[monarch-docuseal-webhook] ignored: no share link mapping",
                { eventType, submissionId, submitterCount: submitters.length }
            )
            return json(200, {
                ok: true,
                ignored: "no external_id / share link mapping",
            })
        }

        const { data: link, error: linkErr } = await supabase
            .from("referral_share_links")
            .select(
                "id, referral_id, envelope_status, signed_pdf_storage_path"
            )
            .eq("id", shareLinkId)
            .maybeSingle()

        if (linkErr || !link) {
            return json(404, { error: "Share link not found" })
        }

        if (
            link.envelope_status === "completed" &&
            link.signed_pdf_storage_path
        ) {
            return json(200, { ok: true, already: true })
        }

        let pdfUrl = extractPdfUrl(data, submission, submitters)
        let apiSubmitters = submitters
        const payloadValues = Array.isArray(data?.values)
            ? (data.values as Array<{ field?: string; value?: unknown }>)
            : undefined

        if (docusealKey && submissionId) {
            const sub = await fetchSubmissionDetails(docusealKey, submissionId)
            if (sub) {
                if (!pdfUrl) {
                    pdfUrl =
                        (sub.combined_document_url as string | undefined) ??
                        (Array.isArray(sub.documents)
                            ? (
                                  sub.documents as Array<{
                                      url?: string
                                  }>
                              )[0]?.url
                            : null) ??
                        (Array.isArray(sub.submitters)
                            ? (
                                  sub.submitters as DocuSealSubmitter[]
                              )[0]?.documents?.[0]?.url
                            : null) ??
                        null
                }
                if (Array.isArray(sub.submitters)) {
                    apiSubmitters = sub.submitters as DocuSealSubmitter[]
                }
            }
        }

        const supportingFiles = collectSupportingFileUrls(
            apiSubmitters,
            payloadValues
        )

        const completedAt = new Date().toISOString()
        let storagePath: string | null = link.signed_pdf_storage_path as
            | string
            | null

        const appendUploadedDocuments = async (
            entries: UploadedDocEntry[]
        ): Promise<void> => {
            if (entries.length === 0) return
            const { data: referral } = await supabase
                .from("referral_submissions")
                .select("uploaded_documents")
                .eq("id", link.referral_id)
                .single()
            const existing = Array.isArray(referral?.uploaded_documents)
                ? referral.uploaded_documents
                : []
            await supabase
                .from("referral_submissions")
                .update({ uploaded_documents: [...existing, ...entries] })
                .eq("id", link.referral_id)
        }

        const storeSupportingDocuments = async (): Promise<
            UploadedDocEntry[]
        > => {
            if (supportingFiles.length === 0) return []
            const entries = await mirrorSupportingFiles(
                supabase,
                link.referral_id,
                supportingFiles,
                completedAt
            )
            if (supportingFiles.length > 0 && entries.length === 0) {
                console.warn(
                    "[monarch-docuseal-webhook] supporting files expected but none stored",
                    { shareLinkId, count: supportingFiles.length }
                )
            }
            await appendUploadedDocuments(entries)
            return entries
        }

        const finalize = async (opts: {
            envelopeStatus: string
            pdfStored: boolean
            activityNote?: string
            supportingStored?: number
        }) => {
            await supabase
                .from("referral_share_links")
                .update({
                    envelope_status: opts.envelopeStatus,
                    completed_at: completedAt,
                    signed_pdf_storage_path: storagePath,
                    docuseal_submission_id: submissionId ?? null,
                })
                .eq("id", link.id)

            await supabase.from("referral_section_statuses").upsert(
                {
                    referral_id: link.referral_id,
                    section_key: "roi",
                    status: "complete",
                    updated_at: completedAt,
                },
                { onConflict: "referral_id,section_key" }
            )

            await supabase.rpc("log_referral_activity", {
                p_referral_id: link.referral_id,
                p_activity_type: "roi_signed",
                p_details: {
                    share_link_id: link.id,
                    storage_path: storagePath,
                    pdf_stored: opts.pdfStored,
                    supporting_stored: opts.supportingStored ?? 0,
                    note: opts.activityNote,
                },
            })
        }

        if (!pdfUrl) {
            console.warn(
                "[monarch-docuseal-webhook] No PDF URL; marking signer_completed",
                shareLinkId
            )
            const supportingEntries = await storeSupportingDocuments()
            await finalize({
                envelopeStatus: "signer_completed",
                pdfStored: false,
                supportingStored: supportingEntries.length,
                activityNote: "completed without downloadable pdf url",
            })
            return json(200, {
                ok: true,
                pdf: false,
                supporting_count: supportingEntries.length,
            })
        }

        const pdfRes = await fetch(pdfUrl)
        if (!pdfRes.ok) {
            console.error(
                "[monarch-docuseal-webhook] PDF download failed",
                pdfRes.status,
                shareLinkId
            )
            const supportingEntries = await storeSupportingDocuments()
            await finalize({
                envelopeStatus: "signer_completed",
                pdfStored: false,
                supportingStored: supportingEntries.length,
                activityNote: `pdf download failed (${pdfRes.status})`,
            })
            return json(200, {
                ok: true,
                pdf: false,
                download_status: pdfRes.status,
                supporting_count: supportingEntries.length,
            })
        }

        const pdfBytes = new Uint8Array(await pdfRes.arrayBuffer())
        const timestamp = completedAt.replace(/[:.]/g, "-")
        storagePath = `referrals/${link.referral_id}/roi/signed-${timestamp}.pdf`

        const { error: uploadErr } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(storagePath, pdfBytes, {
                contentType: "application/pdf",
                upsert: false,
            })

        if (uploadErr) {
            console.error(
                "[monarch-docuseal-webhook] Storage upload failed",
                uploadErr.message,
                { bucket: STORAGE_BUCKET, storagePath }
            )
            storagePath = null
            const supportingEntries = await storeSupportingDocuments()
            await finalize({
                envelopeStatus: "signer_completed",
                pdfStored: false,
                supportingStored: supportingEntries.length,
                activityNote: `storage upload failed: ${uploadErr.message}`,
            })
            return json(200, {
                ok: true,
                pdf: false,
                storage_error: uploadErr.message,
                supporting_count: supportingEntries.length,
            })
        }

        const supportingEntries = await storeSupportingDocuments()

        const fileLabel = `ROI-signed-${timestamp}.pdf`
        const docEntry: UploadedDocEntry = {
            type: "signed_roi",
            name: fileLabel,
            filename: fileLabel,
            storage_path: storagePath,
            uploaded_at: completedAt,
            source: "docuseal",
        }

        await appendUploadedDocuments([docEntry])

        const activityNote =
            supportingFiles.length > 0 && supportingEntries.length === 0
                ? "signed pdf stored; supporting uploads failed to mirror"
                : undefined

        await finalize({
            envelopeStatus: "completed",
            pdfStored: true,
            supportingStored: supportingEntries.length,
            activityNote,
        })

        return json(200, {
            ok: true,
            storage_path: storagePath,
            supporting_count: supportingEntries.length,
        })
    } catch (e) {
        console.error("[monarch-docuseal-webhook]", e)
        return json(500, {
            error: e instanceof Error ? e.message : "Unexpected error",
        })
    }
})
