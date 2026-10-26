# Monarch Sober Living — docs

Marketing domain: **`www.monarchsoberlivinghomes.com`** (`monarchsoberliving.com` parking / redirect TBD).

## Docs

| Doc | Purpose |
|-----|---------|
| [`MONARCH_SOBER_LIVING_FRAMER_VERCEL_MIGRATION_CHECKLIST.md`](MONARCH_SOBER_LIVING_FRAMER_VERCEL_MIGRATION_CHECKLIST.md) | Framer + DNS + later app checklist + gather inventory |
| [`SOBER_LIVING_APPLICATION.md`](SOBER_LIVING_APPLICATION.md) | Application planning |
| [`BEHAVE_FULL_APPLICATION_FORM_REFERENCE.md`](BEHAVE_FULL_APPLICATION_FORM_REFERENCE.md) | Behave form capture |
| [`../PRODUCTION_STRATEGY_FRAMER_VERCEL.md`](../PRODUCTION_STRATEGY_FRAMER_VERCEL.md) | Framer marketing / Vercel PHI split |

## Code

New SL Framer components: `Code/Framer/sober-living/`

## Launch order

1. Marketing on Framer (`www`) — no PHI ← **gather / cutover next** (see migration checklist)
2. Later: program-scoped referrals in shared `apps/referral-app/` + Supabase

### Snapshot (2026-10-26)

| Item | Status |
|------|--------|
| Live site | WordPress (GoDaddy IP) |
| DNS | Cloudflare NS |
| Mail | Google MX; SPF still hybrid |
| Framer / PHI | Not started |
