#!/usr/bin/env node
/**
 * Audit DocuSeal template: naming, spellcheck hints, conditionals, prefill keys.
 *
 *   DOCUSEAL_API_KEY=... node scripts/audit-docuseal-template.mjs [templateId]
 */
import { writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const templateId = process.argv[2] || process.env.DOCUSEAL_ROI_TEMPLATE_ID || "3756335"
const apiKey = process.env.DOCUSEAL_API_KEY
if (!apiKey) {
    console.error("Set DOCUSEAL_API_KEY")
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

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "docs")
const rawPath = join(outDir, `docuseal-template-${templateId}-raw.json`)
writeFileSync(rawPath, JSON.stringify(body, null, 2))

const fields = body.fields || []
const SNAKE = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/

const prefillKeys = [
    "legal_first_name",
    "legal_middle_name",
    "legal_last_name",
    "date_of_birth",
    "last_four_ssn",
    "referral_reference_code",
]

const issues = []
const conditional = []

for (const f of fields) {
    const name = f.name || ""
    const title = f.title || ""
    const type = f.type || ""
    const cond =
        f.conditions ||
        f.condition ||
        f.conditional ||
        (f.preferences && f.preferences.condition) ||
        null

    if (cond) {
        conditional.push({ name, type, title, condition: cond })
    }

    if (name && !SNAKE.test(name)) {
        const suggested = name
            .replace(/^§\d+\s*/i, "")
            .replace(/[§]/g, "")
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_|_$/g, "")
            .replace(/_+/g, "_")
        issues.push({
            kind: "naming",
            name,
            title,
            type,
            message: `Not snake_case`,
            suggested: suggested || name,
        })
    }

    if (/\s{2,}/.test(name)) {
        issues.push({ kind: "naming", name, message: "Extra spaces in name" })
    }
    if (/§/.test(name)) {
        issues.push({ kind: "naming", name, message: "Contains § section prefix" })
    }
}

const names = new Set(fields.map((f) => f.name))
const dupes = fields
    .map((f) => f.name)
    .filter((n, i, a) => a.indexOf(n) !== i)

console.log(`Template: ${body.name} (id ${body.id})`)
console.log(`Fields: ${fields.length}`)
console.log(`Raw JSON: ${rawPath}\n`)

console.log("=== Prefill keys ===")
for (const k of prefillKeys) {
    const f = fields.find((x) => x.name === k)
    console.log(`${names.has(k) ? "✓" : "✗"} ${k}${f?.title ? `  title="${f.title}"` : ""}`)
}

console.log("\n=== Conditional fields ===")
if (conditional.length === 0) {
    // Dump any field keys that might hold conditions
    const sample = fields.find((f) => Object.keys(f).some((k) => /cond/i.test(k)))
    if (sample) {
        console.log("Sample field keys:", Object.keys(sample).join(", "))
    }
    // Check preferences on all fields
    for (const f of fields) {
        const prefs = f.preferences
        if (prefs && JSON.stringify(prefs).match(/cond/i)) {
            conditional.push({
                name: f.name,
                type: f.type,
                preferences: prefs,
            })
        }
    }
}
if (conditional.length) {
    for (const c of conditional) {
        console.log(JSON.stringify(c, null, 2))
    }
} else {
    console.log("(No condition data in API response — see builder Condition buttons)")
}

console.log("\n=== Naming issues (non snake_case or § prefix) ===")
for (const i of issues.filter((x) => x.kind === "naming")) {
    console.log(`- ${i.name} (${i.type})${i.suggested ? ` → suggest: ${i.suggested}` : ""}`)
}

if (dupes.length) {
    console.log("\n=== Duplicate names ===")
    console.log([...new Set(dupes)].join(", "))
}

const reportPath = join(outDir, `DOCUSEAL_TEMPLATE_${templateId}_AUDIT.md`)
const lines = [
    `# DocuSeal template ${templateId} audit`,
    ``,
    `Generated: ${new Date().toISOString()}`,
    `Template: **${body.name}**`,
    ``,
    `## Prefill fields (Monarch edge function)`,
    ``,
    `| API name | Present | Title |`,
    `|----------|---------|-------|`,
    ...prefillKeys.map((k) => {
        const f = fields.find((x) => x.name === k)
        return `| \`${k}\` | ${f ? "yes" : "**missing**"} | ${f?.title || "—"} |`
    }),
    ``,
    `## Naming convention (snake_case API names)`,
    ``,
    `| Current name | Type | Suggested rename | Notes |`,
    `|--------------|------|------------------|-------|`,
    ...issues
        .filter((x) => x.kind === "naming")
        .map(
            (i) =>
                `| \`${i.name}\` | ${i.type || ""} | \`${i.suggested || ""}\` | ${i.message} |`
        ),
    ``,
    `## All fields`,
    ``,
    `| name | title | type | required |`,
    `|------|-------|------|----------|`,
    ...[...fields]
        .sort((a, b) => String(a.name).localeCompare(String(b.name)))
        .map(
            (f) =>
                `| \`${f.name}\` | ${f.title || ""} | ${f.type} | ${f.required ? "yes" : "no"} |`
        ),
    ``,
    `## Conditional fields`,
    ``,
    conditional.length
        ? conditional.map((c) => `- \`${c.name}\`: \`${JSON.stringify(c.condition || c.preferences)}\``).join("\n")
        : "_Condition rules not returned by GET /templates — document from builder (fields with Condition button)._",
    ``,
]

writeFileSync(reportPath, lines.join("\n"))
console.log(`\nWrote ${reportPath}`)
