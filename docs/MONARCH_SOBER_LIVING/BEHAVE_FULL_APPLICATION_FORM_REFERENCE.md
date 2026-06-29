# Behave Health — Full application form (reference for Monarch Sober Living)

**Purpose:** Capture the structure and wording of the external **Behave Health** full application so we can later design Monarch Sober Living flows and map fields to **our** Supabase schema.

**Source URL (external EHR):** [https://app.behavehealth.com/pLl6Ao/forms/full-application](https://app.behavehealth.com/pLl6Ao/forms/full-application)

**Last reviewed:** 2026-01-31 (sidebar + bootstrap modal captured from UI shell screenshot)

**Optional screenshot:** If you keep a UI capture for design reference, store it under `docs/MONARCH_SOBER_LIVING/assets/` (or similar) and add a relative link here.

**Monarch resident field list (from HTML analysis):** [SOBER_LIVING_APPLICATION.md](./SOBER_LIVING_APPLICATION.md)

---

## Can Cursor “see” the live browser?

**No** — assistants only see what you **paste, attach, or commit** (e.g. this screenshot), not your live Cursor browser tab. What you sent is enough to lock in the **section list** and **entry modal** below. If you go deeper per section, keep using **screenshots or pasted field lists** (or DevTools metadata without sensitive payloads).

---

## Captured UI structure (from your screenshot)

### Layout pattern

- **Left:** Sidebar table of contents (jumps between sections; same long form).
- **Center:** Active section fields (e.g. **Personal Details**).
- **Footer:** **Highlight Required Fields**, **Submit Application** (often disabled until complete), **Save and Continue**.
- **Blocking modal (first step):** Titled **APPLICATION FORM** — collect identity + email so **auto-save** can run before the rest of the form.

### Bootstrap modal — “APPLICATION FORM”

| Field        | Type / pattern                         | Required |
| ------------ | -------------------------------------- | -------- |
| First Name   | Text                                   | Yes      |
| Last Name    | Text                                   | Yes      |
| Date of Birth | **MM / DD / YYYY** split inputs + calendar icon | Yes |
| Email        | Text, envelope affordance in field     | Yes      |

**Primary CTA:** **Continue to Application** (modal must be completed to proceed).

**Intro copy (blue info box, paraphrased):** Asks for contact details so the application **saves automatically** as the user progresses and they can return later.

### Main form — “Personal Details” (visible behind modal)

**Section intro (visible copy):** “Below you will find some questions that help us learn a bit about you so we can determine how we can help.”

**Fields partially visible behind modal (labels):** First Name (required), **Landline Phone Number**, **Email Address** — full set to confirm when modal is dismissed (may overlap modal fields by design).

### Sidebar — section order (table of contents)

Use this as the master checklist for detailed field inventory later:

1. Personal Details  
2. Contact Details  
3. Emergency Contact Details  
4. Demographics  
5. Questions  
6. Medical Insurance  
7. Program Cost  
8. Program Details  
9. Current Living Situation  
10. Personal Contacts (Family)  
11. Referrals  
12. Substance Use History  
13. Medical  
14. Mental Health  
15. Addictive Behaviors  
16. Communicable Diseases  
17. Medications  
18. Treatment History  
19. Recovery  
20. Assistance & Help  
21. Courts & Criminal Justice  
22. Restrictions  
23. Admissions  
24. Client Statements _(confirm exact title / order in your scroll)_

---

## Why this file is not auto-scraped

A plain HTTP fetch of the URL only returns the app shell title (**“EHR by Behave Health”**); questions and controls are loaded in the **browser** (JavaScript). There is no stable public HTML document to scrape from this repo.

Use the **capture workflow** below while the form is open in your authenticated session, then paste or summarize into the tables in this document.

---

## Capture workflow (recommended)

1. **Walk the full application** in order (note whether it is one long page or multiple steps / sections).
2. For **each section or step**, record:
   - Section title (as shown in UI)
   - Order index (1, 2, 3…)
3. For **each field**:
   - Label (exact text)
   - Control type: text, textarea, select, radio, checkbox group, date, phone, email, file upload, signature, etc.
   - Required vs optional (if indicated)
   - Options list (for selects/radios)
   - Validation hints (max length, masks, min/max)
   - Conditional logic (“show if…”)
4. **Screenshots:** Optional but useful — one per major section (store outside repo or in approved storage if PHI risk; **do not** commit real applicant data or filled PHI screenshots to git).
5. **Network (advanced):** With DevTools → **Network**, filter XHR/fetch while navigating; some SPAs expose JSON field schemas. Copy only **non-sensitive** metadata (field names/types) if useful for mapping — avoid logging payloads that contain answers.

---

## High-level outline

_Check off as each section is fully inventoried (field-level tables filled)._

- [ ] Personal Details  
- [ ] Contact Details  
- [ ] Emergency Contact Details  
- [ ] Demographics  
- [ ] Questions  
- [ ] Medical Insurance  
- [ ] Program Cost  
- [ ] Program Details  
- [ ] Current Living Situation  
- [ ] Personal Contacts (Family)  
- [ ] Referrals  
- [ ] Substance Use History  
- [ ] Medical  
- [ ] Mental Health  
- [ ] Addictive Behaviors  
- [ ] Communicable Diseases  
- [ ] Medications  
- [ ] Treatment History  
- [ ] Recovery  
- [ ] Assistance & Help  
- [ ] Courts & Criminal Justice  
- [ ] Restrictions  
- [ ] Admissions  
- [ ] Client Statements

---

## Field inventory (fill as you go)

| Step / section | Field label (UI) | Type | Required | Options / notes | Monarch / DB mapping (TBD) |
| ---------------- | ---------------- | ---- | -------- | --------------- | -------------------------- |
|                  |                  |      |          |                 |                            |

_Add rows above. If a section has repeating blocks (e.g. “previous address”), note “repeatable group” and describe min/max instances._

---

## Consents, signatures, and uploads

| Item | UI text summary | Format (checkbox / e-sign / upload) | Notes |
| ---- | --------------- | ------------------------------------- | ----- |
|      |                 |                                       |       |

---

## Submission behavior

- **Submit button label:** _(e.g. Submit application)_
- **Confirmation / next steps:** _(what the user sees after submit)_
- **Editable after submit:** yes / no / unknown
- **Email or PDF copy to applicant:** yes / no / unknown

---

## Notes for Monarch conversion (later)

- **RLS / PHI:** Sober living applications may contain PHI; align with HIPAA patterns used elsewhere (see [HIPAA_AUDIT_LOGGING.md](./HIPAA_AUDIT_LOGGING.md) and retention docs).
- **Single DB (planned):** Field mapping will live alongside other program schemas; keep **Behave-specific** names in this doc, then add a separate **mapping spec** when implementation starts (`*_MAPPING_SPEC.md` pattern used for Ritten export).
- **Framer vs portal:** Decide whether this intake is **public Framer form**, **authenticated portal**, or **staff-entered** — drives auth and storage design.

---

## Disclaimer

Behave Health is a **third-party product**. This document is for **internal planning** and field inventory only. Respect their terms of use; do not automate scraping of their authenticated app beyond what you would do manually as an authorized user documenting UX for migration planning.

---

## Avoid pasting full “View Page Source” / Save As HTML here

A **complete saved HTML page** had been appended after this disclaimer (very large: bundled CSS, ProseMirror styles, third-party scripts such as Stripe/analytics, and the hydrated app shell). That dump was **removed** — it does not belong in this Markdown reference:

- **Hard to review** in git or pull requests  
- **Bloats the repo** and slows the editor  
- **Risk:** saved pages can include session or fingerprint-related material  
- **Low signal for mapping:** many classes are hashed; stable field definitions usually come from **API responses** or **small DOM snippets**, not a full document dump  

**Prefer:** screenshots of the empty UI (stored under `docs/MONARCH_SOBER_LIVING/assets/` if you add them), rows in the **Field inventory** table above, or **short** DevTools excerpts (e.g. a single input’s `name` / `id`, or redacted JSON from the Network tab).
