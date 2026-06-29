# Referral source — onboarding & help reference

**Version:** 1.0 · **Updated:** 2026-05-28  
**Audience:** Professional referral sources (court, legal, probation/parole, case management, facilities, etc.) — **not** Monarch staff.

**Where this content lives:**

| Surface | Purpose |
|---------|---------|
| **`/referrals`** (public) | Program criteria, how to refer, ROI overview, sign-in CTAs |
| **`/portal`** (authenticated) | Track referrals, messages, document requests, ROI links |
| **Portal → Help & support** | Quickstart + FAQ (mirror sections below) |

**Staff procedures:** [`ADMISSIONS_STAFF_ONBOARDING_AND_SOP.md`](ADMISSIONS_STAFF_ONBOARDING_AND_SOP.md).

---

## Part I — Before you sign in (`/referrals` page content)

Use plain language on the public page. Suggested section order (matches site IA in [`SITE_REFERRAL_AND_PORTAL_FLOW_REFERENCE.md`](SITE_REFERRAL_AND_PORTAL_FLOW_REFERENCE.md)):

### 1. Who should use the professional referral path

Monarch Competency serves individuals in **competency evaluation and restoration** pathways. The **professional referral** is for:

- Courts and court coordinators  
- Attorneys and legal representatives  
- Probation / parole  
- Case managers and behavioral health partners  
- Hospitals, jails, and facilities referring for competency services  

**Families and individuals** seeking general information should use the **public inquiry** at the bottom of this page — not the full clinical referral packet.

### 2. What you need before submitting

- Authority to refer and relevant **clinical/legal** information about the individual  
- **Contact information** for you (the referring professional) — this becomes your portal sign-in identity  
- Optional but helpful: existing evaluations, court orders, medication list, location details  
- Plan for **Release of Information (ROI)** — Monarch may request a signed ROI from the client or their authorized representative (see §4)

### 3. How to submit (three steps)

1. **Read** admission criteria and program fit on this page.  
2. **Sign in** at **Submit a referral** → `/login` (Google or one-time email link).  
3. Complete the **professional referral form** → save your **referral code** (e.g. `MON-A4K7`) from the confirmation screen.

You can return anytime: **Sign in** → **`/portal`** to track status, upload documents, respond to requests, and message admissions.

### 4. Release of Information (ROI) — what referral sources should know

Monarch often needs a **signed ROI** before records can be requested or shared.

| Who signs | How it usually works |
|-----------|----------------------|
| **Client or legal representative** | Monarch sends a **secure electronic signing link** (`/r?token=…`). The signer verifies **date of birth**, then completes the ROI in the browser (DocuSeal). |
| **Referring professional** | You may receive the link to **forward** to the correct signer, or see **Sign ROI** in your portal when admissions enables it. |
| **Ink-signed paper ROI** | If electronic signing is not possible, upload a scan via **Upload documents** (your referral code + your email on the referral). |

**Important:**

- ROI links are **personal and time-limited** — send only to the intended signer; do not post on social media or public boards.  
- The signer must use the **correct date of birth** on file for the referral.  
- When signing is complete, you will see status in the portal (**ROI signed** / documents on file). Email notifications are available in **My Profile** when enabled by Monarch.

### 5. Uploading additional documents

**You (the referring email on the referral)** can upload at any time:

- From the **referral detail** view in the portal, or  
- **`/submit-referrals/documents`** — enter **referral code** + the **same email** used on the referral.

**Someone else** (family, emergency contact) **cannot** upload with only the referral code unless Monarch sends them a **dedicated link**. If a third party needs to sign the ROI, wait for the **ROI signing link** from Monarch or your contact — do not share your portal password.

### 6. Public inquiry (self / family)

If you are **not** a professional referrer, scroll to **Inquiring for yourself or a loved one?** and use the **short inquiry form**. This is for questions and initial interest — not the same as a professional referral.

### 7. Sign-in FAQs (short, for `/referrals` or `/login`)

**Do I need an account before my first referral?**  
Sign in first; if you are new, Supabase creates an account when you use Google or the email link. Your referrals appear in the portal after submission.

**Can I use a personal Gmail?**  
Yes, if that is the email you will use consistently on referrals. Monarch recommends an **organizational email** when available.

**I did not receive the magic link.**  
Check spam/promotions; links expire — request a new one from `/login`.

**Who do I call?**  
Use the contact block on `/referrals` (e.g. `referrals@monarchcompetency.com`, desk line). For **case-specific** questions, use **Messages** in the portal on that referral when available.

---

## Part II — Portal quickstart (Help & support)

Paste or summarize in **`ReferralSourcePortal.tsx`** → Help modal.

1. **My referrals** lists every submission tied to your sign-in email (and account when used).  
2. Click a row for **detail**: status, timeline, **messages**, **section progress** (ROI, insurance, safety), **document requests**, and **share links**.  
3. **New referral** (+ menu) opens the full referral form.  
4. **My Profile** — update contact info and **email notification** toggles (status changes, messages, ROI signed, uploads, weekly summary).  
5. **Document requests** — when admissions sends a batch, open the referral to see what is needed, due dates, and whether **ROI is required**. Use **Sign ROI electronically** or the upload link as instructed.  
6. **Share links** — copy ROI or other links Monarch staff created; forward securely to the signer.  
7. Program information remains on the main site: `/referrals`.

---

## Part III — Portal FAQ (expandable)

### How do I submit a new referral?

Use **+** or **New referral** in the menu. Sign in if prompted. After submit, save your **referral code**.

### How do I upload documents?

Open the referral → use the upload action in detail, or go to **Upload documents** and enter **referral code** + **your referral source email**.

### What do status labels mean?

| Status | Meaning |
|--------|---------|
| Pending review | Received; awaiting initial triage |
| Under review | Admissions is actively working the referral |
| Accepted | Positive decision / moving forward |
| Declined | Not proceeding at this time |
| Waitlisted | In queue |

Overall status is set by Monarch; your portal shows progress and messages.

### What is a document request?

Admissions may send a **numbered round** listing documents (ID, court paperwork, etc.) and whether **ROI is required**. Upload each item or follow the **ROI signing** link. Item status updates as staff review uploads.

### How does electronic ROI signing work?

1. Open the referral — look for **ROI required** or a link under **Share links** / document request.  
2. Open **Sign ROI electronically** (or use the link admissions sent).  
3. Enter the client’s **date of birth** when prompted.  
4. Complete all steps in the signing form; confirmation appears when finished.  
5. A copy is stored with Monarch; you may see **ROI signed** in the portal.

If the link expired, contact admissions for a new one.

### Can my client or family upload instead of me?

**Not** with only the referral code and their personal email on the standard upload page. They need a **Monarch-issued link** (ROI signing or future upload token) or you upload on their behalf.

### Why don’t I see a referral I submitted?

Sign in with the **same email** used as **referral source email** on the form. If it is still missing, contact support (below).

### Sign-in or magic link problems

Check spam; wait a few minutes between requests; try Google sign-in if your organization allows it.

### Is the portal secure?

Yes — you only see your own referrals. Sign out on shared computers (menu → Sign out returns you to the public homepage).

### Emergencies

This portal is **not** for crisis response. Call **911** or your local crisis line for emergencies. Monarch admissions contact is for **referral logistics**, not emergency clinical intervention.

---

## Part IV — Contact (portal Help footer)

| Channel | Value |
|---------|--------|
| Email | `referrals@monarchcompetency.com` |
| Phone | `1-844-493-8255` |

*(Align with `PORTAL_HELP_*` constants in `ReferralSourcePortal.tsx`.)*

---

## Part V — Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-05-28 | Initial source-facing onboarding: `/referrals` outline, portal help, ROI (DocuSeal `/r`), document requests |

---

## Appendix — Copy snippets for `/referrals` (optional blocks)

**Hero subcopy:**  
*Learn about Monarch Competency admissions here. Professional partners sign in to submit and track referrals.*

**Professional CTA:**  
*Submit a referral* → `/login` · *Already submitted? Sign in to your portal* → `/login`

**ROI callout (short):**  
*After referral, Monarch may request a Release of Information (ROI). Signers receive a secure link to complete the form online; referring professionals can track status in the portal.*

**Third-party (one line):**  
*Only the referring professional can upload with referral code + email unless Monarch sends a separate secure link to another signer.*
