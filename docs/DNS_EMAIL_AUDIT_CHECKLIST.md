# Monarch DNS & email audit — verification checklist

**Master reference (records, done/TODO, migration plan):** [`DNS_AND_EMAIL_REFERENCE.md`](DNS_AND_EMAIL_REFERENCE.md)

**Purpose:** Fill this in during a 30–45 minute pass through Google Admin, GoDaddy, Wix, and Dan. Brings the “messy picture” down to facts before any DNS migration.

**Audit date:** _______________  
**Completed by:** _______________  
**Google Admin super admin:** _______________

**Domains in scope**

| Program        | Primary domain (candidate)     | Also check                          |
|----------------|--------------------------------|-------------------------------------|
| Competency     | `monarchcompetency.com`        | —                                   |
| Mental health  | `monarchmentalhealth.org`      | `monarchmentalhealth.com` (Dan)     |
| Sober living   | `monarchsoberlivinghomes.com`  | `monarchsoberliving.com` (parking)  |

---

## A. Google Admin — Account → Domains → Manage domains

**URL:** [admin.google.com](https://admin.google.com) → Account → Domains → Manage domains

| # | Check | Answer / notes |
|---|--------|----------------|
| A1 | Primary domain is: | ☐ `monarchcompetency.com` ☐ Other: __________ |
| A2 | `monarchcompetency.com` status | ☐ Verified ☐ Pending ☐ Not listed |
| A3 | `monarchmentalhealth.org` listed? | ☐ Yes ☐ No — Type: ☐ Secondary ☐ Alias ☐ Not added |
| A4 | `monarchmentalhealth.com` listed? | ☐ Yes ☐ No |
| A5 | `monarchsoberlivinghomes.com` listed? | ☐ Yes ☐ No — Type: __________ |
| A6 | `monarchsoberliving.com` listed? | ☐ Yes ☐ No |
| A7 | Approx. **active** Workspace users (last 30 days) | ______ / ~120 expected |
| A8 | Approx. **suspended / former** users still in directory | ______ |
| A9 | Any `@monarchsoberliving*` addresses in Google? | ☐ Yes — count: ____ ☐ No |
| A10 | Any `@monarchmentalhealth.com` (not `.org`) in Google? | ☐ Yes ☐ No |

**Per domain listed in Google Admin — MX status (Admin shows if MX is correct):**

| Domain | Google says MX OK? | Notes |
|--------|-------------------|-------|
| `monarchcompetency.com` | ☐ Yes ☐ No ☐ N/A | |
| `monarchmentalhealth.org` | ☐ Yes ☐ No ☐ N/A | |
| `monarchsoberlivinghomes.com` | ☐ Yes ☐ No ☐ N/A | |
| `monarchsoberliving.com` | ☐ Yes ☐ No ☐ N/A | |
| Other: __________ | ☐ Yes ☐ No ☐ N/A | |

---

## B. Google Admin — Gmail authentication (per active email domain)

**URL:** Apps → Google Workspace → Gmail → Authenticate email

| Domain | DKIM status | DKIM TXT published in DNS? | SPF (Admin guidance) | DMARC started? |
|--------|-------------|----------------------------|----------------------|----------------|
| `monarchcompetency.com` | ☐ On ☐ Off | ☐ Yes ☐ No ☐ Unknown | | ☐ Yes ☐ No |
| `monarchmentalhealth.org` | ☐ On ☐ Off | ☐ Yes ☐ No ☐ Unknown | | ☐ Yes ☐ No |
| `monarchsoberlivinghomes.com` | ☐ On ☐ Off ☐ N/A | ☐ Yes ☐ No ☐ N/A | | ☐ Yes ☐ No |
| `monarchsoberliving.com` | ☐ On ☐ Off ☐ N/A | ☐ Yes ☐ No ☐ N/A | | ☐ Yes ☐ No |

**Target SPF (Google-only sending at `@`):** `v=spf1 include:_spf.google.com ~all` — **one record only per domain.**

---

## C. GoDaddy — Registrar & products

**URL:** [dcc.godaddy.com](https://dcc.godaddy.com) → My Products

| # | Check | Answer |
|---|--------|--------|
| C1 | All 5 domains renew under **one** GoDaddy account? | ☐ Yes ☐ No — accounts: __________ |
| C2 | Who has GoDaddy admin / billing access? | Name: __________ |
| C3 | `monarchsoberlivinghomes.com` — hosting product | ☐ WordPress ☐ cPanel ☐ Other: __________ |
| C4 | `monarchsoberliving.com` — intentional parking? | ☐ Yes ☐ No — should redirect to: __________ |
| C5 | `monarchmentalhealth.com` — listed for sale on Afternic/Dan? | ☐ Yes ☐ No ☐ Unknown |
| C6 | GoDaddy **Email / Microsoft 365** seats active? | ☐ Yes — count: ____ ☐ No |
| C7 | If yes, which domain(s)? | ☐ `monarchsoberliving.com` ☐ `monarchsoberlivinghomes.com` ☐ Other |

**GoDaddy Email users (if any) — sample addresses still in daily use:**

| Address | Still needed? | Migrate to Google? |
|---------|---------------|-------------------|
| | ☐ Yes ☐ No | ☐ Yes ☐ No |
| | ☐ Yes ☐ No | ☐ Yes ☐ No |
| | ☐ Yes ☐ No | ☐ Yes ☐ No |

---

## D. Wix — DNS export (competency + mental health `.org`)

**URL:** Wix dashboard → Domains → `monarchcompetency.com` / `monarchmentalhealth.org` → DNS Records

| # | Check | Done |
|---|--------|:----:|
| D1 | Export or screenshot **all** DNS records for `monarchcompetency.com` | ☐ |
| D2 | Export or screenshot **all** DNS records for `monarchmentalhealth.org` | ☐ |
| D3 | Confirm nameservers at GoDaddy still `ns8.wixdns.net` / `ns9.wixdns.net` | ☐ |
| D4 | Note any Wix email / Google connect wizard still “active” | ☐ Yes ☐ No |

**Known public-DNS issues to confirm in Wix UI:**

| Domain | Issue | Fixed in Wix? |
|--------|--------|:-------------:|
| `monarchcompetency.com` | SPF includes missing `_spfm` subdomain | ☐ |
| `monarchmentalhealth.org` | **Two** SPF TXT records at `@` | ☐ |

---

## E. Dan.com — `monarchmentalhealth.com` only

| # | Check | Answer |
|---|--------|--------|
| E1 | Do you still own / want this domain? | ☐ Keep ☐ Sell ☐ Redirect to `.org` |
| E2 | Can you change nameservers away from Dan? | ☐ Yes ☐ No ☐ Need to delist first |
| E3 | Anyone still uses `@monarchmentalhealth.com` email? | ☐ Yes ☐ No — who: __________ |

---

## F. Live mail test (15 minutes — use personal Gmail + one colleague)

Send **one test email** each direction; note deliverability (inbox / spam / bounce).

| From | To | Inbox? | Spam? | Bounce? | Notes |
|------|-----|:------:|:-----:|:-------:|-------|
| `@monarchcompetency.com` | `@monarchsoberlivinghomes.com` | ☐ | ☐ | ☐ | |
| `@monarchsoberlivinghomes.com` | `@monarchcompetency.com` | ☐ | ☐ | ☐ | |
| `@monarchcompetency.com` | `@monarchmentalhealth.org` | ☐ | ☐ | ☐ | |
| `@monarchmentalhealth.org` | `@monarchcompetency.com` | ☐ | ☐ | ☐ | |
| External Gmail | `hello@monarchcompetency.com` | ☐ | ☐ | ☐ | |
| External Gmail | `hello@monarchsoberlivinghomes.com` | ☐ | ☐ | ☐ | |

**Bounce message / headers (if any):** _______________________________________________

---

## G. Decisions to record (drives the “simple solution”)

| Decision | Choice |
|----------|--------|
| **G1. Single mail system** | ☐ All active mail → Google Workspace ☐ Keep GoDaddy for sober living ☐ Hybrid (document why) |
| **G2. Single DNS provider** | ☐ Cloudflare ☐ GoDaddy DNS ☐ Google Cloud DNS ☐ Undecided |
| **G3. Canonical domain — Competency** | `monarchcompetency.com` |
| **G4. Canonical domain — Mental health** | ☐ `.org` ☐ `.com` ☐ Other: __________ |
| **G5. Canonical domain — Sober living** | ☐ `monarchsoberlivinghomes.com` ☐ `monarchsoberliving.com` |
| **G6. Website — Competency** | ☐ Framer (target) ☐ Wix until cutover |
| **G7. Website — Sober living** | ☐ Keep WordPress ☐ Rebuild on Framer later |
| **G8. Contact / hello@ inboxes** | Competency: __________ MH: __________ SL: __________ |

---

## H. Public DNS snapshot (optional — re-run after changes)

```bash
for d in monarchcompetency.com monarchmentalhealth.org monarchmentalhealth.com monarchsoberliving.com monarchsoberlivinghomes.com; do
  echo "=== $d ==="
  dig +short NS $d
  dig +short MX $d
  dig +short TXT $d
done
```

---

## Sign-off

| Role | Name | Date |
|------|------|------|
| Platform / IT | | |
| Operations (email owner) | | |

**Next step after this checklist:** Consolidate DNS → fix MX/SPF/DKIM → Resend on `send.*` → Framer/Vercel cutover.

**Related:** `docs/PRODUCTION_STRATEGY_FRAMER_VERCEL.md`, `docs/SUPABASE_CONTACT_FORM_EDGE_FUNCTION.md`
