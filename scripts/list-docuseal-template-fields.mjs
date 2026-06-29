#!/usr/bin/env node
/**
 * List field names for a DocuSeal template (for prefill alignment).
 *
 * Usage:
 *   DOCUSEAL_API_KEY=... node scripts/list-docuseal-template-fields.mjs [templateId]
 *
 * Default templateId: 3756335 (ROI v2.2)
 */
const templateId = process.argv[2] || process.env.DOCUSEAL_ROI_TEMPLATE_ID || "3756335"
const apiKey = process.env.DOCUSEAL_API_KEY
if (!apiKey) {
    console.error("Set DOCUSEAL_API_KEY (production key for template 3756335).")
    process.exit(1)
}

const res = await fetch(`https://api.docuseal.com/templates/${templateId}`, {
    headers: { "X-Auth-Token": apiKey },
})
const body = await res.json()
if (!res.ok) {
    console.error("API error:", res.status, body.error || body)
    process.exit(1)
}

const fields = body.fields || []
console.log(`Template: ${body.name} (id ${body.id})`)
console.log(`Fields: ${fields.length}\n`)

const prefillCandidates = [
    "legal_first_name",
    "legal_middle_name",
    "legal_last_name",
    "date_of_birth",
    "last_four_ssn",
    "internal_use_referral_reference_code",
    "roi_received_by",
]

console.log("--- All field names (sorted) ---")
for (const f of [...fields].sort((a, b) => String(a.name).localeCompare(String(b.name)))) {
    const req = f.required ? "required" : "optional"
    console.log(`${f.name}\t${f.type}\t${req}`)
}

console.log("\n--- Prefill candidates (Monarch → DocuSeal) ---")
const names = new Set(fields.map((f) => f.name))
for (const key of prefillCandidates) {
    const hit = names.has(key) ? "✓" : "✗ missing"
    console.log(`${hit}\t${key}`)
}
