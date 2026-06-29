# Admissions staff — onboarding & standard operating procedures

**Version:** 1.0 · **Updated:** 2026-05-28  
**Audience:** Monarch Competency admissions and authorized clinical/admin staff who use the **admin referral dashboard** (`/dashboard`), internal training pages, and printed SOP packets.  
**Not for public website.** Host staff training on a **non-indexed** Framer page; link the same content from dashboard **Help & support** and your hosted SOP PDF.

**Related:** [`REFERRAL_LIFECYCLE_E2E_REFERENCE.md`](REFERRAL_LIFECYCLE_E2E_REFERENCE.md), [`ROI_SIGNING_UX_AND_TEMPLATE_V2_2.md`](ROI_SIGNING_UX_AND_TEMPLATE_V2_2.md), [`HIPAA_AUDIT_LOGGING.md`](HIPAA_AUDIT_LOGGING.md), [`DATA_RETENTION_POLICY.md`](DATA_RETENTION_POLICY.md).

---

## How to use this document

| Use | What to publish |
|-----|-----------------|
| **New hire week 1** | Part I (onboarding checklist) |
| **Daily desk work** | Part II (SOPs) |
| **Hard copy / PDF** | Export Part II + Appendix A–C; add Monarch letterhead and revision table |
| **Dashboard Help modal** | Summarize Part II §2.3–2.8 in Quickstart + FAQ (see `ReferralDashboard.tsx`) |
| **Staff training page (Framer)** | Part I + Part II + links to login/dashboard |

---

## Part I — Onboarding (first week)

### 1.1 Before first login

| Step | Action | Owner |
|------|--------|--------|
| 1 | Confirm role is authorized for **ePHI** access; signed workforce agreements / confidentiality as required by Monarch. | HR / compliance |
| 2 | Receive a **Monarch Google Workspace** account (`@monarchcompetency.com`) on the staff allowlist for dashboard access. | IT / admin |
| 3 | Complete **HIPAA Security & Privacy** refresh if required (org curriculum). | Staff |
| 4 | Bookmark **staff sign-in** (`/admin`) and **dashboard** (`/dashboard`). Do **not** share these URLs on the public marketing site. | Staff |

**Sign-in:** Staff use **`/admin`** (AuthGateway, bucket `staff`). After Google or magic-link auth, you are routed to **`/dashboard`**. Referral sources use **`/login`** and **`/portal`** — different bucket; do not train sources on `/admin`.

### 1.2 First login

1. Open **`/admin`** on the production site (staging: `https://monarchy.framer.website/admin`).
2. Sign in with **Google** (work account) or **email magic link** if enabled.
3. Confirm you land on the **admissions dashboard**, not the referral source portal.
4. Open **My profile** (menu) and set **display name**, **title**, and **phone** — referral sources see name/title on assigned referrals; full contact appears in referral detail.
5. Open **Help & support** (menu) and note desk email/phone and SOP download link when published.

### 1.3 Vocabulary (use consistently)

| Term | Meaning |
|------|---------|
| **Referral code** | Short code on each professional submission (e.g. `MON-A4K7`). Safe to share with the **submitting organization** for uploads and support calls. |
| **Staff case reference** | Internal sequential ID (e.g. `REF-MC-042`). Use for **desk work, exports, and internal email** — not the primary ID for third parties unless policy says otherwise. |
| **Referral source portal** | Logged-in area for **non-staff** referrers (`/portal`). Staff normally do **not** impersonate referral sources without a documented break-glass procedure. |
| **Public inquiry** | Lightweight intake **without** a full professional referral (`referral_inquiries`); separate tab on the dashboard. |
| **Share link** | Tokenized URL (`/r?token=…`) for **ROI signing** (DocuSeal) or future upload-only flows — no login required for the signer. |
| **Document request** | Structured batch from admissions listing document types (and optional ROI) the source must provide; visible in portal and dashboard. |

### 1.4 Training checklist (supervisor signs off)

- [ ] Can log in at `/admin` and reach `/dashboard` reliably.
- [ ] Can locate a referral by **Staff case reference**, **Referral code**, client name, or date.
- [ ] Understands **overall status** vs **section workflows** (ROI, Insurance, Safety).
- [ ] Can **assign** a referral (or unassign) and knows assignee info appears in the source portal.
- [ ] Can send a **document request** and, when needed, create an **ROI signing link**.
- [ ] Knows ROI links use **`/r?token=…`**, DOB verification, and DocuSeal template **v2.2** (3756335).
- [ ] Can **revoke** a share link sent in error.
- [ ] Knows **never** to share dashboard credentials or export PHI to personal devices/email.
- [ ] Knows **Activity** is attributable and **10-year retention** applies (`DATA_RETENTION_POLICY.md`).
- [ ] Knows **view-only** opens from the source portal do **not** bump **Last activity** (views still audit).

---

## Part II — Standard operating procedures

### 2.1 Scope

These SOPs cover **day-to-day operations** in the Monarch referral stack (Supabase + Framer dashboard). They do **not** replace legal advice, BAAs, or your full compliance manual.

### 2.2 Roles and access

- **Admissions staff (`@monarchcompetency.com`):** Dashboard access; submissions scoped by **`staff_program_memberships`** (Competency program today).
- **Referral sources (external):** **`/portal`** only — their own submissions (RLS by email / `submitted_by_user_id`).
- **Assignment:** Staff can **assign** referrals to themselves or colleagues (`assigned_to_user_id`). Assignee **name and title** show in the source portal; use assignment when you own primary responsibility.

**SOP:** When you take ownership, assign to yourself and note handoffs in **section notes** or **messages** per team policy.

### 2.3 Daily triage — new submissions

| Step | Action |
|------|--------|
| 1 | Open **Referral Submissions**; sort by **Last activity** (default) or filter **Pending review**. |
| 2 | Open referral; scan **Activity** for `referral_submitted` and prior views. |
| 3 | Note **Referral code** (external) and **Staff case reference** (internal). |
| 4 | Triage clinically per admissions policy; set **overall status** when the workflow state is real (see §2.5). |
| 5 | Update **section workflows** (ROI, Insurance, Safety) as work progresses. |
| 6 | If documents are missing, use **Request documents** (§2.6) rather than ad-hoc email-only asks when possible. |
| 7 | Contact the source via **approved channels** (in-app messages, work email). **Minimum necessary** PHI only. |

### 2.4 Overall status changes

| Status | Typical meaning |
|--------|-----------------|
| `pending_review` | Submitted; awaiting initial triage |
| `under_review` | Actively worked by admissions |
| `accepted` | Positive outcome / moving toward admit |
| `declined` | Not proceeding |
| `waitlisted` | In queue; not closed |

**SOP:**

1. Change status only when the **workflow state** has actually changed.
2. After changing status, confirm **status history** and **Activity** reflect the update (automatic trigger).
3. The source portal shows a simplified **progress** view; align messaging with what they will see.

### 2.5 Section workflows (ROI, Insurance, Safety)

Parallel checklist on each referral — **does not** replace overall status.

| Section status | Meaning |
|----------------|---------|
| Not started | No work yet |
| In progress | Active (e.g. ROI link sent, awaiting signature) |
| Complete | Requirement satisfied |
| Not applicable | Document policy exception |

**SOP:** When you create an **ROI signing link**, ROI section moves to **in progress** automatically if it was **not started**. Mark **complete** after signed PDF is stored and reviewed.

### 2.6 Document requests

Use **Request documents** in the submission detail modal to send a structured batch to the referral source.

| Step | Action |
|------|--------|
| 1 | Confirm **Staff case reference** and client identity before sending. |
| 2 | Select document types (e.g. Colorado ID, court orders, signed ROI upload). |
| 3 | Set optional **due date** and message; check **ROI required** if a release is part of this round. |
| 4 | Send — creates batch **round N**; source sees it in portal; Activity logs `document_request_sent`. |
| 5 | If **ROI required**, system can auto-create an **ROI signing link** tied to the batch — copy from **Share links** and send through a **secure** channel. |
| 6 | As items arrive, update **item status** (uploaded, waived, insufficient, replaced). Uploads from the source can sync item status via DB trigger. |

**SOP:** Prefer portal/document-request workflow over “email us a PDF” so the source has one place to track open items.

### 2.7 ROI signing (DocuSeal)

**When:** Client or authorized party must sign Monarch’s **Release of Information (ROI) v2.2** electronically.

| Step | Action |
|------|--------|
| 1 | Open referral → **Share links** → type **ROI signing (DocuSeal)**. |
| 2 | Optional: label (e.g. “ROI — mother, Jane D.”), expiry (default 14 days), signer email/name if known. |
| 3 | **Create link** → copy URL: `https://…/r?token=…` (static `/r` page + query token). |
| 4 | Send link to the **signer only** via secure channel (encrypted email, secure text per policy). **Do not** post tokens in public forums or group chats. |
| 5 | Signer opens link → enters **date of birth** (must match referral `client_dob`) → completes embedded DocuSeal form. |
| 6 | On completion, webhook stores **signed PDF** in Supabase Storage; Activity shows `roi_signed`; envelope status **completed**. |
| 7 | Verify PDF in **documents**; set ROI **section** to **Complete**. |

**Troubleshooting:**

| Issue | Action |
|-------|--------|
| DOB mismatch | Confirm legal DOB on referral; signer re-enters; do not disable DOB gate without supervisor approval. |
| Link expired / revoked | Create a **new** link; add `&refresh=1` only when IT/docs specify (forces new DocuSeal submission against template v2.2). |
| Wrong person signed | Revoke link; follow incident policy if PHI was disclosed in error. |
| Template/field errors | Escalate to IT; reference `ROI_SIGNING_UX_AND_TEMPLATE_V2_2.md` and template **3756335**. |

**Staff-only ROI fields** (admit date, internal notes on template): **backlog** — complete in dashboard notes or manual PDF until staff-only ROI link ships.

### 2.8 Share links — general rules

| Step | Action |
|------|--------|
| 1 | Create only for the **correct** referral; verify **Staff case reference**. |
| 2 | Set **expiry** per policy. |
| 3 | **Revoke** when no longer needed or if sent in error (`share_link_revoked` in Activity). |
| 4 | **ROI signing** links are the primary third-party path today; legacy **general** links remain for future upload-only tokens. |

### 2.9 Communicating with referral sources

- Use **Messages** in the submission modal when appropriate; professional tone; **minimum necessary**.
- Sources see **non-internal** section notes and status timeline — do not put sensitive internal opinions in source-visible notes.
- For **urgent** clinical risk, follow **escalation protocol** (crisis line, supervisor, 911) — do not rely on the portal alone.

### 2.10 Documents outside the app

When documents arrive by **fax, secure email, or mail**:

1. Record receipt per policy.
2. Upload/index in the system if your workflow supports it.
3. Update **document request item** status so the portal reflects progress.
4. **Do not** store PHI on personal cloud drives or unencrypted SMS.

### 2.11 Inquiries tab (public)

**Inquiries** are separate from professional referrals (`referral_inquiries`).

| Step | Action |
|------|--------|
| 1 | Review new inquiries from homepage, `/referrals`, or `/contact`. |
| 2 | Update inquiry status; archive when closed. |
| 3 | Converting to a full referral is **manual** today — create or ask source to submit professional referral when appropriate. |

### 2.12 Exports and EMR

| Export | Use |
|--------|-----|
| **CSV (full)** | Internal spreadsheet for selected rows |
| **Ritten CSV** | Import mapping to Ritten.io — verify mapping spec before production imports |
| **Print/PDF** | Single referral printable view |
| **ZIP attachments** | Bulk download of files per referral |

**SOP:** Select rows first; nothing exports until selection is made. Exports contain PHI — handle per policy.

### 2.13 Archive

Use **Archive** to move closed cases out of the active list. **Unarchive** if reopened. Archiving does not delete data or audit history.

### 2.14 Audit and monitoring

- **Activity** records: views, status changes, notes, messages, assignment, share links, ROI events, document requests.
- Treat every action as **attributed** to your account.
- **“Audit Trail”** block on submission (IP, session metadata) may be **partial** until the form pipeline populates — see `AUDIT_LOGGING_AND_ACTIVITY.md`.

**SOP:** Do not ask IT to delete audit rows for convenience.

### 2.15 Incidents and mistakes

| Situation | Immediate action |
|-----------|------------------|
| Opened wrong referral | Close; internal note if policy requires; **do not** alter audit history |
| Sent ROI/link to wrong party | Revoke link; **breach/incident** procedure; notify privacy officer |
| Suspected unauthorized access | Report IT/security; preserve logs |
| System unavailable | Use documented backup contact tree (phone, paper log) |

### 2.16 Retention and disposal

- **Default:** **10 years** for referral data and audit logs.
- **No routine deletion** by admissions staff unless explicitly authorized.
- Purge utilities are **admin-only** with legal/compliance sign-off.

---

## Part III — Staff training page (Framer) — suggested sections

Use a **non-public**, noindex page (e.g. `/staff/training` or password-protected). Suggested block order:

1. **Welcome** — purpose, confidentiality reminder  
2. **Access** — `/admin`, `/dashboard`, allowlist, My profile  
3. **Dashboard tour** — Submissions vs Inquiries, sort/filter, assign, archive, export  
4. **Working a referral** — status, sections, messages, notes (internal vs source-visible)  
5. **ROI & document requests** — §2.6–2.7 above (with screenshots)  
6. **Share links & `/r` signing page** — what signers experience  
7. **HIPAA habits** — minimum necessary, no personal devices, Activity attribution  
8. **Escalation** — Appendix B contacts  
9. **Download SOP (PDF)** — same content as hard copy  

---

## Appendix A — Escalation contacts

| Role | Name / contact | When |
|------|----------------|------|
| Admissions lead | *(fill in)* | Workflow, clinical triage |
| Privacy officer | *(fill in)* | Incidents, ROI misuse |
| IT / Supabase admin | *(fill in)* | Login, ROI template, links broken |
| After-hours clinical | *(fill in)* | Urgent client safety |

---

## Appendix B — Production URLs (Competency staging site)

Replace with production domain when Wix → Framer cutover completes.

| Page | URL |
|------|-----|
| Staff sign-in | `https://monarchy.framer.website/admin` |
| Admissions dashboard | `https://monarchy.framer.website/dashboard` |
| Referral source login (support context) | `https://monarchy.framer.website/login` |
| ROI / share signing | `https://monarchy.framer.website/r?token=…` |
| Public referrals info | `https://monarchy.framer.website/referrals` |

---

## Appendix C — Revision history

| Version | Date | Changes |
|---------|------|---------|
| 0.1 (draft) | 2026-05-10 | Initial skeleton |
| 1.0 | 2026-05-28 | ROI (DocuSeal v2.2), document requests, share links, assignment, training-page outline; aligned to shipped dashboard |

---

*For referral **source**-facing copy, use [`REFERRAL_SOURCE_ONBOARDING.md`](REFERRAL_SOURCE_ONBOARDING.md).*
