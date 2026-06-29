# Phased E2E referral process (decoded from PDF)

Source: [`PHASED_E2E_ REFERRAL_PROCESS_WITH_TECH_STACK_ADDITIONS.pdf`](PHASED_E2E_%20REFERRAL_PROCESS_WITH_TECH_STACK_ADDITIONS.pdf) (exported from Chromium; pages 2, 6–8 are diagram images with no text layer).

Use with [`REFERRAL_LIFECYCLE_E2E_REFERENCE.md`](REFERRAL_LIFECYCLE_E2E_REFERENCE.md) for current build status.

---

## Design principles (from PDF cover)

- **PHI-free email rule:** Emails are notification only; action happens in the portal.
- **Open upload channel:** Keep post-submit upload working while adding structured document requests.
- **Stepper timeline:** Sets expectations for referral sources and becomes the skeleton for admissions SOP.
- **Phase 5 loop:** Dashed “request additional” path routes back to Phase 2 document request → another Resend notification; can repeat without a new referral row.
- **Stack additions (coral on diagram):** `/r/[token]` token pages and **DocuSeal**. **Resend** is existing.
- **Ink signature fallback:** Manual ROI upload converges with DocuSeal at bundle review — admissions does not need to know which path was used.
- **Messaging:** Ambient at every phase, not its own phase.

---

## Phase 1 — Referral submission (referral source)

| Step | Description |
|------|-------------|
| 1 | Source reads the **process timeline** at the top of the stepper before filling the form. |
| 2 | Completes stepper steps 1–3 (contact, demographics, collateral contacts; collateral capability per contact). |
| 3 | **Step 4 — Document inventory:** For each document type, one of: **in my custody (available upon request)**, **exists but not in my custody (can help obtain)**, or **unknown**. **No uploads on this step.** Not a hard stop. |
| 4 | Submit → **MON-XXXX** code, `pending_review`, inventory snapshot on row, redirect to portal. |

**Repo alignment:** Step 4 implemented in `ReferralForm.tsx` as **Documents Inventory** (inventory stored in `documents_available` jsonb as `{ type, status }[]`).

---

## Phase 2 — Admissions triage (staff)

| Step | Description |
|------|-------------|
| 5 | Referral appears `pending_review`; staff opens modal — clinical packet + **inventory snapshot**. |
| 6 | Assign to self/colleague → `under_review`. |
| 7 | **Request Documents** in modal: checklist pre-filled from inventory (`in_custody` / `can_obtain`); staff select needs, ROI flag, optional due date, message, send. |
| 8 | If ROI required: token link + **DOB gate** in same communication. |
| 9 | **Resend:** subject like “Referral MON-XXXX needs your attention” — **no PHI**; action in portal. |

**Repo alignment:** Triage, assign, status, share links — **working**. **Request Documents** UI + `create_referral_document_request()` RPC + `referral_document_request_*` tables — **working** (migration `20260527120000_referral_document_requests.sql`, dashboard modal). PHI-free Resend (step 9) — **built, deferred**: edge function deployed; `REFERRAL_DOCUMENT_REQUEST_EMAIL_ENABLED = false` in dashboard until `monarchcompetency.com` DNS moves off Wix and domain is verified in Resend ([`SUPABASE_REFERRAL_DOCUMENT_REQUEST_NOTIFY.md`](SUPABASE_REFERRAL_DOCUMENT_REQUEST_NOTIFY.md)).

---

## Phase 3 — Document collection (referral source)

| Step | Description |
|------|-------------|
| 10 | Portal shows **Documents Requested** on referral card; per-item status + upload or ROI signing action. |
| 11 | Standard docs: upload → attaches in dashboard; **open upload** always available in portal. |
| 12 | ROI: **DocuSeal** embedded **or** upload ink-signed copy; third party can receive forwarded token link. |

**Repo alignment:** Portal upload + `DocumentUploadForm` — **working**. Documents Requested section — **working**. Upload → auto-mark request items `uploaded` (`sync_document_request_items_on_upload`, migration `20260529120000`) — **working**. DocuSeal — **planned**.

---

## Phase 4 — ROI signing (signer)

| Step | Description |
|------|-------------|
| 13 | Signer opens `/r/[token]` — no login; optional DOB gate. |
| 14 | DocuSeal session embedded; tamper-evident audit trail on completion. |
| 15 | Webhook → Edge Function → PDF to `referrals/{id}/roi/`, ROI section **verified**, activity log, notify source + staff. |

**Repo alignment:** **Planned** (only automated step in the PDF).

---

## Phase 5 — Bundle review (staff)

| Step | Description |
|------|-------------|
| 16 | Realtime status updates in modal (Supabase realtime). |
| 17 | Per document: verify, waive (with reason), or flag insufficient / request replacement. |
| 18 | **Request Additional Documents** → new request records + distinct notification email. |
| 19 | Loop can repeat; each round tracked in document request records. |

**Repo alignment:** Section workflows (ROI/Insurance/Safety) — **working**. Per-item verify / waive / insufficient / re-request in dashboard (`update_referral_document_request_item_status`, migration `20260528120000`) — **working**; portal shows status + staff note. Realtime — **planned**.

---

## Phase 6 — Decision and closure (staff)

| Step | Description |
|------|-------------|
| 20 | Decision → `accepted`, `waitlisted`, or `declined`. |
| 21 | Notify source: “Referral MON-XXXX has been updated” — no outcome in email; outcome in portal. |
| 22 | Accepted → **Ritten CSV** export; record retained. |
| 23 | Waitlisted → stays in active queue; can move to accepted/declined later. |
| 24 | Declined → archived; source sees status in portal. |

**Repo alignment:** Status + Ritten export + archive — **working**; PHI-free status email — **planned**.

---

## Diagram pages (no extractable text)

Pages 2, 6, 7, 8 are raster flowcharts. Open the PDF for visual layout (phases, coral badges, dashed loops).

---

## Changelog

| Date | Change |
|------|--------|
| 2026-05-17 | Text extracted via PyMuPDF; cross-linked to lifecycle reference and ReferralForm inventory step. |
| 2026-05-18 | Phase 2.7: document request batches/items schema + admissions Request documents panel. |
| 2026-05-19 | Phase 2.9: PHI-free Resend notify built (`monarch-referral-document-request-notify`); sending deferred until DNS off Wix. |
| 2026-05-20 | Phase 5.17: Staff document request item review (verify, waive, insufficient, re-request). |
| 2026-05-21 | Phase 3.11: Upload syncs open document request items to `uploaded` by document type. |
