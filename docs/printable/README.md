# Printable forms (Monarch Competency)

HTML sources for **Print → Save as PDF** — same workflow as the professional referral forms.

| File | Use on Resources page | Audience |
|------|----------------------|----------|
| `referral-form-professional-print.html` | Professional referral PDF (download) | Court, attorneys, clinicians — full packet |
| `referral-form-print.html` | Optional long reference / backup | Full step 0–13 questionnaire |
| **`public-inquiry-form-print.html`** | **General inquiry & self-referral PDF** | Individuals, families — matches `PublicInquiryForm` |
| **`mental-health-admission-application-print.html`** | **Monarch Mental Health admission application (PDF)** | MHTL admissions — host on Competency Resources or MH site |
| **`roi-v2-2-print.html`** | **ROI v2.2 — Authorization for Release of PHI (PDF)** | Signable release; portal e-sign preferred, else email Referrals@ |
| **`what-to-bring-checklist-print.html`** | **What to Bring — packing checklist (PDF)** | Clients & families preparing for admission |

## Generate the What to Bring checklist PDF

1. Open `what-to-bring-checklist-print.html` in Chrome or Safari.
2. Print → **Save as PDF** as e.g. `Monarch-Competency-What-To-Bring.pdf`.
3. Upload to Supabase **`assets`**; add to **`ResourcePDFList`**.

**Resources copy:**

- **Title:** What to Bring — Packing Checklist (PDF)
- **Description:** What to pack, what Monarch provides, and how we handle belongings and medications during your stay.

Source copy: `docs/CLIENT_WHAT_TO_BRING_CHECKLIST_DRAFT.md`

## Generate the ROI v2.2 PDF

1. Open `roi-v2-2-print.html` in Chrome or Safari.
2. Print → **Save as PDF** as e.g. `Monarch-Competency-ROI-v2.2.pdf`.
3. Upload to Supabase **`assets`**; add to **`ResourcePDFList`**.

Reference source: `docs/Monarch Competency ROI v2.2 Docuseal.pdf` (content only — no DocuSeal language on printable).

## Generate the self-referral / inquiry PDF

1. Open `public-inquiry-form-print.html` in Chrome or Safari (double-click, or drag into browser).
2. Click **Print / Save as PDF** (toolbar) or `Cmd+P` / `Ctrl+P`.
3. Destination: **Save as PDF**.
4. Save as e.g. `Monarch-General-Inquiry-Self-Referral.pdf`.

## Generate the Mental Health admission application PDF

1. Open `mental-health-admission-application-print.html` in Chrome or Safari.
2. Print → **Save as PDF** as e.g. `Monarch-Mental-Health-Admission-Application.pdf`.
3. Upload to Supabase **`assets`** (include `monarch-mental-health-logo.png` if hosting logo separately).
4. Add to **`ResourcePDFList`** on the Competency Resources page (or Mental Health site when live).

Contact on form: **hello@monarchmentalhealth.org** · **1 (800) 618-8719** (Admissions EXT 0 · Case mgmt EXT 1 · Clinical EXT 2)

Logo loads from `assets/monarch-mental-health-logo.png` beside this file.

## Host the PDF (pick one)

### Option A — Supabase public `assets` bucket (recommended if you use `ResourcePDFList`)

Your Resources page **`ResourcePDFList`** component expects a **public HTTPS URL** (same pattern as logos in Storage).

1. Generate the PDF (steps above).
2. Supabase Dashboard → **Storage** → bucket **`assets`** (public).
3. Upload e.g. `Monarch-General-Inquiry-Self-Referral.pdf`.
4. Copy the **public URL**, format:
   `https://esbmnympligtknhtkary.supabase.co/storage/v1/object/public/assets/Monarch-General-Inquiry-Self-Referral.pdf`
5. Framer → **Resources** page → **`ResourcePDFList`** → add array item:
   - **Title:** General inquiry & self-referral (PDF)
   - **URL:** paste Supabase public URL
6. Publish.

Use the same bucket/path pattern for the **professional referral PDF** if it is not uploaded yet.

### Option B — Framer file upload (simple link / card)

If Resources uses a normal **link + file upload** in Framer (not `ResourcePDFList`):

1. Framer → upload PDF to site **Assets**.
2. Link the download button/card to that asset.

No Supabase required for Option B.

## Resources page copy (either option)

- **Title:** General inquiry & self-referral (PDF)
- **Description:** For yourself or a loved one. Email completed form to hello@monarchcompetency.com or call (877) 835-1545.

## Monday go-live note

The **online** Public Inquiry form stays off until Vercel. This PDF is the interim intake path alongside phone and email.

## Field mapping

Aligned with `PublicInquiryForm.tsx` → `referral_inquiries`:

| PDF section | inquiry_type | Key fields |
|-------------|--------------|------------|
| Step 2 (yourself) | `self` | referral_source_name, phone, email, client_approximate_age, situation_notes, how_heard_about_us |
| Step 2–3 (someone else) | `other` | client_first_name, client_last_initial, client_approximate_age, client_current_location, situation_notes; referral_source_*, relationship, org/title |
