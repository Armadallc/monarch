# Monarch Mental Health — docs

Marketing domain: **`www.monarchmentalhealth.org`** (`.com` redirect TBD).

## Start here

| Doc | Purpose |
|-----|---------|
| [`MONARCH_MENTAL_HEALTH_FRAMER_VERCEL_MIGRATION_CHECKLIST.md`](MONARCH_MENTAL_HEALTH_FRAMER_VERCEL_MIGRATION_CHECKLIST.md) | Framer + DNS + later app checklist |
| [`MMH_REFERRAL_FORM_SPEC.md`](MMH_REFERRAL_FORM_SPEC.md) | Online + printable referral form: fields, conditional logic, storage, Ritten mapping |
| [`printable/mmh-referral-form-v3-print.html`](printable/mmh-referral-form-v3-print.html) | Printable referral form v3 — open in Chrome/Safari → Print → Save as PDF (10 letter pages) |
| [`MMH-Referral-Form-v2.pdf`](MMH-Referral-Form-v2.pdf) | Previous printable draft (v2) |
| [`LUX_CHATBOT_TRAINING_AND_PERFORMANCE.md`](LUX_CHATBOT_TRAINING_AND_PERFORMANCE.md) | Lux chatbot training notes |
| [`../PRODUCTION_STRATEGY_FRAMER_VERCEL.md`](../PRODUCTION_STRATEGY_FRAMER_VERCEL.md) | Framer marketing / Vercel PHI split |

## Reference files

| File | Purpose |
|------|---------|
| `Monarch Mental Health Authorization for Bilateral Release of Information Updated 2025 (1).rtf` | ROI source text (for the DocuSeal template) |
| `Logos/` | MMH logos (SVG) |
| `COLORADO_RAES.pdf` | Colorado RAE / BHST contacts by county |
| `printable/mental-health-admission-application-print.html` | Old admission application, kept for reference — replaced by the referral form |
| `MONARCH_MENTAL_HEALTH_RESIDENT_HANDBOOK.md` | Resident handbook (empty) |

## Code

- New MH Framer components: `Code/Framer/mental-health/`
- Lux chatbot: `apps/lux-chatbot/` (API) and `Code/Framer/lux_chatbot.tsx` (widget)

## Launch order

1. Marketing on Framer (`www`) — no PHI ← **next divert** (see migration checklist gather section)
2. Program-scoped referrals in shared `apps/referral-app/` + Supabase ← **in progress on staging**

### Portal / PHI progress (2026-10-26)

| Slice | Status |
|-------|--------|
| Printable v3 + form spec | Done |
| Authenticated MH form + portal entry | Done (staging) |
| Staff dashboard visibility (`prog_mental_health` + memberships) | Done |
| PHI-free submit notify → `referrals@` | Deployed; **Resend from-domain blocked** |
| Public (no-login) submit | Done locally + edge deployed; staging needs commit/push |
| One-time public doc uploads / DocuSeal MH ROI / doc-request MH brand | Deferred |
