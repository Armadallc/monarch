# Monarch DNS & email — master reference

**Living doc** for DNS, email authentication, website routing, and migration off Wix.  
**Last updated:** 2026-07-03 (Seth / platform work session)  
**End state:** Website on Framer + PHI app on Vercel; **all mail on Google Workspace**; **DNS hosted outside Wix** (target: Cloudflare). Wix is temporary DNS only today.

**Related (detail elsewhere):**
- Audit worksheet (fill-in blanks): [`DNS_EMAIL_AUDIT_CHECKLIST.md`](DNS_EMAIL_AUDIT_CHECKLIST.md)
- Contact form / Resend: [`SUPABASE_CONTACT_FORM_EDGE_FUNCTION.md`](SUPABASE_CONTACT_FORM_EDGE_FUNCTION.md)
- Referral notify email: [`SUPABASE_REFERRAL_DOCUMENT_REQUEST_NOTIFY.md`](SUPABASE_REFERRAL_DOCUMENT_REQUEST_NOTIFY.md)
- Marketing go-live: [`WIX_TO_FRAMER_GO_LIVE_TODAY.md`](WIX_TO_FRAMER_GO_LIVE_TODAY.md)
- Form addresses: [`FORM_EMAILS.md`](FORM_EMAILS.md)

---

## 1. Architecture (three layers)

| Layer | Competency today | Notes |
|-------|------------------|-------|
| **Registrar** | GoDaddy | Owns domain renewal |
| **DNS host** | **Wix** (`ns8.wixdns.net`, `ns9.wixdns.net`) | Temporary — migrate to Cloudflare later |
| **Marketing website** | **Framer** | `www.monarchcompetency.com` → `sites.framer.app` |
| **PHI app** | **Vercel** (staging) | Target: `app.monarchcompetency.com` — not on marketing DNS yet |
| **Email (MX)** | **Google Workspace** | Do **not** change MX without a planned cutover |

```
GoDaddy (registrar)
    └── NS → Wix DNS  ← edit records here today
            ├── www CNAME → sites.framer.app     (website)
            ├── @ A records → Wix IPs             (apex — may still show old Wix)
            ├── MX → Google                        (inbound mail)
            └── TXT → SPF, DKIM, DMARC, verify    (email auth)
Google Workspace ← sends/receives @monarchcompetency.com
Framer ← serves www
```

---

## 2. Where to edit (quick links)

| Task | Console |
|------|---------|
| DNS records (Competency + MH `.org`) | [Wix → Domains → DNS Records](https://manage.wix.com/dashboard/f11ffc79-6ff7-4230-b920-fe6120834aa1/domain-settings) → **Manage** → monarchcompetency.com |
| DKIM / Gmail auth | [Google Admin → Authenticate email](https://admin.google.com/ac/apps/gmail/authenticateemail) |
| Workspace domains | Google Admin → Account → Domains |
| Framer custom domain | Framer → Site settings → Domains |
| Registrar | GoDaddy |

**Google Admin super admin (2026-07):** `sbrown@monarchcompetency.com`

---

## 3. `monarchcompetency.com` — record inventory

**DNS editor:** Wix  
**Do not edit:** NS (locked), MX (unless mail cutover planned)

### Website & routing

| Type | Host (Wix style) | Value | Status | Notes |
|------|------------------|-------|--------|-------|
| CNAME | `www.monarchcompetency.com` | `sites.framer.app` | **Done** | Production marketing site |
| A | `monarchcompetency.com` | `31.43.160.6`, `31.43.161.6` | **Review** | Apex may still hit Wix; consider redirect `@` → `www` |
| CNAME | `en.monarchcompetency.com` | `cdn1.wixdns.net` | Legacy | Wix CDN; safe to leave until DNS migration |

### Mail (inbound) — **leave unchanged**

| Type | Host | Points to | Priority | Status |
|------|------|-----------|----------|--------|
| MX | `monarchcompetency.com` | `aspmx.l.google.com` | 1 | OK |
| MX | | `smtp.google.com` | 1 | Note — unusual duplicate priority-1; verify in Google Admin if issues |
| MX | | `alt1.aspmx.l.google.com` | 5 | OK |
| MX | | `alt2.aspmx.l.google.com` | 5 | OK |
| MX | | `alt3.aspmx.l.google.com` | 10 | OK |
| MX | | `alt4.aspmx.l.google.com` | 10 | OK |

### Email authentication (TXT)

| Host (Wix style) | Purpose | Target value | Status (2026-07-03) |
|------------------|---------|--------------|------------------------|
| `monarchcompetency.com` | **SPF** | `v=spf1 include:_spf.google.com ~all` | **Done in Wix** — confirm public DNS propagated (old broken `_spfm` record should be gone) |
| `monarchcompetency.com` | Google site verification | `google-site-verification=GZRaXF-...` | **Done** — keep |
| `google._domainkey.monarchcompetency.com` | **DKIM** | `v=DKIM1; k=rsa; p=...` (from Google Admin) | **Done in Wix** + **Start authentication clicked** in Google Admin (2048-bit, `google` selector) |
| `_dmarc.monarchcompetency.com` | **DMARC** (monitor only) | `v=DMARC1; p=none; rua=mailto:hello@monarchcompetency.com` | **Done** (Wix, 2026-07-03) |

**Old broken SPF (remove if still present):**  
`v=spf1 include:dc-aa8e722993._spfm.monarchcompetency.com ~all` — referenced a missing subdomain.

### Safe-edit rules

| OK to edit | Do not touch without plan |
|------------|---------------------------|
| TXT (SPF, DKIM, DMARC, verification) | **MX** (breaks all org email) |
| CNAME `www` (careful — breaks site) | **NS** (Wix-locked) |
| Apex A / redirect | |

---

## 3b. `monarchmentalhealth.org` — record inventory

**DNS editor:** Wix ([MH DNS records](https://manage.wix.com/my-domains/dns?domainName=monarchmentalhealth.org))  
**Website today:** **Still Wix** — `www` → `cdn1.wixdns.net` (not Framer yet)  
**Mail:** Google Workspace MX — **leave unchanged**

### Website & routing

| Type | Host | Value | Status | Notes |
|------|------|-------|--------|-------|
| CNAME | `www.monarchmentalhealth.org` | `cdn1.wixdns.net` | **Wix live** | Change to `sites.framer.app` at Framer cutover |
| A | `monarchmentalhealth.org` | `185.230.63.171`, `.186`, `.107` | Wix apex | Redirect `@` → `www` when on Framer |
| CNAME | `en.monarchmentalhealth.org` | `cdn1.wixdns.net` | Legacy | Wix CDN |

### Mail (inbound) — **leave unchanged**

Google MX set (`aspmx.l.google.com` priority 10, alt1–alt4 20–50). OK.

### Email authentication (TXT)

| Host | Purpose | Target value | Status (2026-07-03) |
|------|---------|--------------|------------------------|
| `monarchmentalhealth.org` | **SPF** | `v=spf1 include:_spf.google.com ~all` | **Done** — duplicate `_spfm` removed |
| `monarchmentalhealth.org` | Google site verification | `google-site-verification=SIINq366...` | **Done** — keep |
| `google._domainkey.monarchmentalhealth.org` | **DKIM** | From Google Admin (2048-bit, `google` selector) | **TODO** |
| `_dmarc.monarchmentalhealth.org` | **DMARC** | `v=DMARC1; p=none; rua=mailto:hello@monarchmentalhealth.org` | **TODO** |

**Track A next (email):** Same flow as Competency §3 — Generate DKIM in Google Admin → TXT in Wix → Start authentication → add DMARC TXT.

---

## 4. Change log

| Date | Who | Change | Where |
|------|-----|--------|-------|
| 2026-07-03 | Seth | Framer live on `www` (prior session) | Wix CNAME |
| 2026-07-03 | Seth | SPF fixed → `include:_spf.google.com` | Wix TXT |
| 2026-07-03 | Seth | DKIM: Generate new record (2048, `google` selector) → TXT in Wix → **Start authentication** | Google Admin + Wix TXT |
| 2026-07-03 | Seth | DMARC TXT on `_dmarc.monarchcompetency.com` (`p=none`) | Wix TXT |
| 2026-07-03 | Seth | MH `.org` duplicate SPF removed | Wix TXT |
| — | — | MH `.org` DKIM + DMARC | Not done |
| — | — | MH `www` → Framer CNAME | Not done — site still on Wix |
| — | — | DNS export / screenshot | Not done |
| — | — | Section A–G audit checklist filled | Not done |

---

## 5. TODO (prioritized)

### P0 — verify today’s work

- [ ] **Wix UI:** Confirm SPF row shows `include:_spf.google.com` (only one SPF on `@`)
- [ ] **Wix UI:** Confirm `google._domainkey.monarchcompetency.com` TXT exists
- [ ] **Google Admin:** DKIM status no longer “Not authenticating email”
- [ ] **Test mail:** Send from `@monarchcompetency.com` → personal Gmail → **Show original** → `spf=pass` and `dkim=pass`
- [ ] **Public DNS check** (after ~1 hr):

```bash
dig +short TXT monarchcompetency.com
dig +short TXT google._domainkey.monarchcompetency.com
dig +short TXT _dmarc.monarchcompetency.com
```

Expected (verified 2026-07-03 via Google DNS 8.8.8.8): SPF `include:_spf.google.com`, DMARC `p=none`, DKIM on `google._domainkey`.

### P1 — Competency hygiene (this week)

- [x] Add **DMARC** TXT on `_dmarc.monarchcompetency.com` (`p=none`) — **done**
- [ ] **Apex redirect:** `monarchcompetency.com` → `https://www.monarchcompetency.com` (if apex still shows Wix)
- [ ] **Screenshot/export** all Wix DNS for `monarchcompetency.com` (migration prep)
- [ ] Fill [`DNS_EMAIL_AUDIT_CHECKLIST.md`](DNS_EMAIL_AUDIT_CHECKLIST.md) sections A–G
- [ ] Confirm **hello@**, **referrals@**, **admissions@** exist in Google (users or aliases) per [`FORM_EMAILS.md`](FORM_EMAILS.md)

### P2 — Other domains

| Domain | DNS host | Issue | Action |
|--------|----------|-------|--------|
| `monarchmentalhealth.org` | Wix | DKIM + DMARC | Repeat Google Admin + Wix TXT flow (SPF done) |
| `monarchmentalhealth.org` | Wix | **`www` still Wix CDN** | CNAME → `sites.framer.app` when MH Framer ready |
| `monarchsoberlivinghomes.com` | GoDaddy | Mail on **GoDaddy/PPE**, not Google | Decide G1: migrate to Google or keep hybrid |
| `monarchmentalhealth.com` | Dan.com | For sale / redirect? | Section E in audit checklist |

### P3 — After DNS moves off Wix

- [ ] **Choose DNS provider** (target: Cloudflare) — decision G2
- [ ] Copy all records from Wix → new host; lower TTL beforehand
- [ ] Switch nameservers at GoDaddy; verify www, MX, SPF, DKIM, DMARC
- [ ] **Resend:** Verify `monarchcompetency.com` (and optional `send.` subdomain) for contact form + referral notify
- [ ] Enable contact form webhook ([`SUPABASE_CONTACT_FORM_EDGE_FUNCTION.md`](SUPABASE_CONTACT_FORM_EDGE_FUNCTION.md))
- [ ] Enable referral document-request email (`REFERRAL_DOCUMENT_REQUEST_EMAIL_ENABLED`) — [`SUPABASE_REFERRAL_DOCUMENT_REQUEST_NOTIFY.md`](SUPABASE_REFERRAL_DOCUMENT_REQUEST_NOTIFY.md)
- [ ] **Vercel:** `app.monarchcompetency.com` CNAME when PHI app goes production

### P4 — Deferred product

- [ ] Mobile breakpoint cleanup (Framer marketing)
- [ ] Supabase custom SMTP for auth emails (optional) — [`SUPABASE_AUTH_EMAIL_AND_PROVIDERS.md`](SUPABASE_AUTH_EMAIL_AND_PROVIDERS.md)

---

## 6. Wix → Cloudflare migration (when ready)

**Goal:** Stop using Wix as DNS host; keep Framer + Google mail unchanged.

1. Create Cloudflare zone for `monarchcompetency.com` (and `monarchmentalhealth.org` if still on Wix NS).
2. **Export** current Wix records (section 3 table + screenshot).
3. Recreate in Cloudflare:
   - `www` CNAME → `sites.framer.app` (proxy optional — Framer often prefers DNS only / grey cloud)
   - All **MX** exactly as today
   - All **TXT** (SPF, DKIM, DMARC, google-site-verification)
   - Apex: redirect or A per Framer/Wix exit plan
4. Lower TTL to 300s on Wix 24h before cutover.
5. At GoDaddy registrar: change NS to Cloudflare assigned nameservers.
6. Wait for propagation; re-run verification commands; test mail + website.
7. Cancel/stop using Wix DNS (Wix site subscription separate from domain).

**Portable records:** Everything added in Wix (SPF, DKIM, DMARC) copies verbatim to Cloudflare.

---

## 7. Transactional email (Resend) — blocked until DNS

| Feature | Status | Blocker |
|---------|--------|---------|
| Contact form → `hello@` | Edge function deployed; form hidden on site | Resend domain verify + DNS records |
| Referral document-request notify | Built; flag off in dashboard | Same |

Wix sometimes limits custom TXT on subdomains; **Cloudflare migration unblocks Resend** cleanly.

---

## 8. Other domains (summary)

| Domain | NS | Mail | Website |
|--------|-----|------|---------|
| `monarchcompetency.com` | Wix | Google Workspace | Framer (`www`) |
| `monarchmentalhealth.org` | Wix | Google Workspace | **Wix site live** — Framer cutover pending |
| `monarchsoberlivinghomes.com` | GoDaddy | GoDaddy/PPE (not Google) | WordPress (GoDaddy hosting) |
| `monarchsoberliving.com` | — | — | Parking |
| `monarchmentalhealth.com` | Dan | — | For sale / TBD |

---

## 9. Decisions (record when made)

| ID | Decision | Choice (2026-07-03) |
|----|----------|---------------------|
| G1 | Single mail system | **Hybrid for now** — Competency + MH on Google; sober living on GoDaddy mail |
| G2 | DNS provider target | **Cloudflare** (intent; not migrated yet) |
| G3 | Canonical — Competency | `monarchcompetency.com` |
| G4 | Canonical — Mental health | `.org` (assumed; confirm in Admin) |
| G6 | Website — Competency | **Framer** (live on `www`) |
| G8 | hello@ / contact | Target `hello@monarchcompetency.com`; site also shows `info@` — **pick one canonical** |

---

## 10. Verification script

Re-run after any DNS change:

```bash
for d in monarchcompetency.com www.monarchcompetency.com \
  google._domainkey.monarchcompetency.com _dmarc.monarchcompetency.com; do
  echo "=== $d ==="
  dig +short TXT $d
  dig +short CNAME $d
  dig +short MX $d
done
dig +short NS monarchcompetency.com
```

---

## 11. Sign-off

| Role | Name | Date |
|------|------|------|
| Platform / IT | Seth Brown | 2026-07-03 (SPF + DKIM session) |
| Operations | | |
