# Monarch Mental Health — referral form spec

Blueprint for the **online** referral form (in `apps/referral-app`) and the **printable** form (`MMH-Referral-Form-v2.pdf`). Both ask the same questions in the same order. Review this before anything is built.

Status: **portal + public web submit** — `/submit-referrals/mental-health` works logged-in (portal) or without login via edge `monarch-mh-referral-public-submit` (`submitted_via = public_web`). One-time public document upload links still deferred (email docs for now).

---

## 1. Who uses it and how it's submitted

One form for everyone. The person filling it in picks their relationship in section 1, and the form adjusts its wording and which questions it shows.

| Who | How they submit |
|-----|-----------------|
| Professionals with a portal login | Inside the referral portal (logged in). Referral shows in their portal afterwards. |
| Professionals without a login, family members, the individual themselves | Public page, no login. Or print → fill → email to referrals@monarchmentalhealth.org. |

**Technical note:** today only logged-in users can save a referral to the database. The public page will send its answers to a small server endpoint that checks them and saves them (with spam protection), rather than opening the referrals table to anonymous writes. Attachments from the public page go through the same endpoint using one-time upload links.

Every referral is saved to the existing `referral_submissions` table with `intended_program_id = 'prog_mental_health'` (and the matching origin/current program ids), so Mental Health and Competency referrals stay separate.

### Wording modes

Chosen from the relationship answer in section 1:

| Mode | Relationships | What changes |
|------|---------------|--------------|
| **Professional** | CMA case manager, state hospital staff, hospital/facility clinician, social worker, other licensed provider, other professional, attorney/legal rep, other | Wording as on the printable ("the individual"). Level-of-care block shown. |
| **Loved one** | Family member, POA / guardian | Referrer details kept. Softer wording: "your loved one" instead of "the individual". Level-of-care block hidden. |
| **Self** | Self (the individual) | Referrer details skipped; the individual's own phone/email are used as the contact. Softer wording: "you / your". Level-of-care block hidden. |

Examples:

| Professional | Loved one | Self |
|---|---|---|
| Individual's legal first name | Your loved one's legal first name | Your legal first name |
| Is the individual aware of, and do they consent to, this referral? | Does your loved one know about, and agree to, this referral? | *(hidden — submitting it is consent)* |
| Current psychiatric medications | Medications your loved one takes for mental health | Medications you take for mental health |

### Light validation

"3/4 or 90% of a referral submitted is better than no referral at all."

**Required to submit (online):**
- Individual's first and last name.
- A way to reach someone: referrer phone **or** email (self mode: the individual's phone or email).
- Attestation checkbox and typed name.

Everything else is optional. Fields are checked only for format when filled in (date, phone, email, SSN shape). The emergency contact shows a "please add if you can" reminder but doesn't block submission. A completion percentage is saved (`form_completion_percentage`) so admissions can see how much is filled in.

---

## 2. Storage approach

- **Shared questions** (those the Competency form already asks) save to the **existing columns**, so the dashboard, review screens and Ritten export work the same for both programs.
- **New columns** only where the Ritten export or the shared dashboard needs them: address parts, race, gender identity, military status, requested placement date, attestation, how it was submitted.
- **Mental Health-only questions** (level of care, treatment-history table, substance-use table, restraints, restraining orders, etc.) save to one new structured field, `mh_intake` (jsonb), with the keys listed below. This keeps the Competency side unchanged.
- **All contacts** (emergency, guardians, payee, professional contacts) save to the existing `additional_contacts` list, each tagged with a `type`. The emergency contact is also copied to the existing `emergency_contact_*` columns for the dashboard.

Stored values are short codes (`snake_case`); people see friendly labels. Where Ritten has a fixed list, the codes map one-to-one to Ritten's options.

Legend: **existing** = column already in `referral_submissions`; **new** = new column; **mh** = key inside `mh_intake`.

---

## 3. Fields by step

The online form uses the same 14 sections as its stepper steps; the printable uses the same numbered section headings (v2 numbering kept).

### Section 1 — Referral source · page 1

Hidden entirely in self mode.

| Field | Options | Show if | Saves to |
|---|---|---|---|
| First name, last name | | | `referral_source_name` (existing; "First Last") |
| Organization / agency | | Professional | `referral_source_organization` (existing) |
| Position / title | | Professional | `referral_source_title` (existing) |
| Phone, email | | | `referral_source_phone`, `referral_source_email` (existing) |
| Relationship (mark one) | CMA case manager → `cma_case_manager` · State hospital staff → `state_hospital_staff` · Hospital or facility clinician → `facility_clinician` · Social worker → `social_worker` · Other licensed provider → `other_licensed_provider` · Other professional → `other_professional` · Family member → `family_member` · Attorney / legal representative → `attorney` · POA / guardian → `poa_guardian` · Self → `self` · Other → `other` | Always (asked first online) | `referral_source_type` (existing) |
| If other, specify | | Relationship = other | mh `relationship_other` |
| Authorized signer / representative (POA, guardian, court-appointed, other legal authority) | checkbox; prompts for authorized-representative documents | Loved one or professional mode | mh `referrer_is_authorized_rep`; signer for the ROI when checked |
| Referred to Monarch Mental Health before? | Yes / No / Unknown → `yes` `no` `unknown` | | `previous_monarch_referral` (existing) |

### Section 2 — Level of care · page 1

Shown to all professionals; hidden for loved one and self. Intro: "If you are unsure, leave this section blank."

| Field | Options | Show if | Saves to |
|---|---|---|---|
| LOC assessment completed? | Yes / No | Professional | mh `loc.completed` |
| Acuity / level determination | Level 1 → `level_1` · Level 2 → `level_2` · Not determined / not sure → `not_determined` | LOC completed = yes | mh `loc.level` |
| CMHS HCBS waiver status | Enrolled · Application pending · Not enrolled · Unknown → `enrolled` `pending` `not_enrolled` `unknown` | Professional | mh `loc.cmhs_waiver_status` |
| CMA or county | | LOC completed = yes | mh `loc.cma_or_county` |
| Date of LOC assessment | date | LOC completed = yes | mh `loc.date` |
| CMA case manager (if not you), phone, email | | Professional and relationship ≠ CMA case manager | mh `loc.case_manager_name/phone/email` |
| CMA case manager ROI permission (mark one) | Bilateral exchange → `bilateral` · Send only → `send_only` · Receive only → `receive_only` | Case manager name entered | mh `loc.case_manager_roi_permission` |

### Section 3 — Individual being referred: demographics · page 2

| Field | Options | Show if | Saves to |
|---|---|---|---|
| Legal first, middle, last name | | | `client_first_name`, `client_middle_name`, `client_last_name` (existing) |
| Chosen name | | | `client_preferred_name` (existing) |
| Date of birth | date | | `client_dob` (existing) |
| SSN (if available) | optional, masked | | `client_ssn` (existing) |
| Phone, email | | | `client_phone`, `client_email` (existing) |
| Mailing address | Online: street, line 2, city, state, ZIP. Printable: one line. | | `client_address_line1`, `client_address_line2`, `client_city`, `client_state`, `client_postal_code` (**new**) |
| Gender identity (**check all that apply**) | Male → `male` · Female → `female` · Transgender male → `transgender_male` · Transgender female → `transgender_female` · Non-binary / genderqueer → `genderqueer` · Prefer not to say → `decline_to_answer` · Another identity (please specify) → `additional_category` | | `client_gender_identity` (**new**, list) |
| Specify | text | "Another identity" checked | `client_gender_detail` (**new**) |
| Sex assigned at birth | Male / Female / Unknown → `male` `female` `unknown` (matches Ritten) | | `client_sex_at_birth` (existing) |
| Pronouns | He/him · She/her · They/them · Other → `he_him` `she_her` `they_them` `other` | | `client_pronouns` (existing) |
| Primary language | | | `client_primary_language` (existing) |
| English proficiency | Fluent · Conversational · Limited · None · Unknown | | `client_english_proficiency` (existing) |
| Interpreter needed? | Yes / No | | `interpreter_needed` (existing) |
| Race (check all that apply) | American Indian or Alaska Native → `american_indian_alaska_native` · Asian → `asian` · Black or African American → `black_african_american` · Native Hawaiian or Other Pacific Islander → `native_hawaiian_pacific_islander` · White → `white` · Decline to specify → `decline_to_specify` | | `client_race` (**new**, list) |
| Ethnicity | Hispanic or Latino → `hispanic_latino` · Not Hispanic or Latino → `not_hispanic_latino` · Decline to specify → `decline_to_specify` | | `client_ethnicity` (existing) |
| Marital status | Married · Unmarried · Unknown | | `client_marital_status` (existing) |
| Military affiliation | None · Veteran · Active duty / Guard / Reserve · Military family · Unknown | | `client_military_status` (**new**) |
| Aware of and consents to referral? | Yes · No · Unable to consent / unknown | Not self | `client_consents_to_referral` (existing) |

### Section 4 — Coverage · page 3

Intro: "Admission requires active Health First Colorado enrollment."

| Field | Options | Show if | Saves to |
|---|---|---|---|
| Currently enrolled in Health First Colorado? | Yes / No | | `medicaid_status` (existing: `enrolled` / `not_enrolled`) |
| Eligible to enroll? | Yes / No / Unknown | Not enrolled | mh `medicaid_eligible` |
| Health First Colorado member ID | | Enrolled | `medicaid_number` (existing) |
| Medicaid RAE | RAE 1 Rocky Mountain Health Plans · RAE 2 Northeast Health Partners · RAE 3 Colorado Community Health Alliance · RAE 4 Colorado Access · Unknown → `rae_1`…`rae_4`, `unknown` | Enrolled | `medicaid_mco` (existing) |
| Referring Case Management Agency (CMA): agency name, assigned case manager name, case manager phone / email | | | mh `cma.agency_name`, `cma.case_manager_name`, `cma.case_manager_contact` |
| Private insurance? | Yes / No | | `has_private_insurance` (existing) |
| Carrier, member ID, coverage | | Private insurance = yes | mh `private_insurance.carrier/member_id`; coverage → `private_insurance_details` (existing) |
| Medicare status | Active · Pending · Not eligible · Unknown | | `medicare_status` (existing) |
| Medicare beneficiary ID | | Medicare active or pending | `medicare_number` (existing) |
| SSI / SSDI status | Receiving SSI · Receiving SSDI · Receiving both · Applied / pending · Not receiving · Unknown | | `ssdi_status` (existing) |
| Additional benefits information | | | `benefits_notes` (existing) |

### Section 5 — Current location and housing · pages 3–4

| Field | Options | Show if | Saves to |
|---|---|---|---|
| Current location | State hospital · Psychiatric hospital · Medical hospital · Treatment facility · Residential program · Jail / detention · Community, housed · Shelter / unhoused · Other | | `current_location_type` (existing) |
| Facility name, phone, address, contact person, patient/resident ID | | Location is a facility or program (state hospital through jail) | `facility_name`, `facility_contact_phone`, `facility_address`, `facility_contact_person`, `inmate_id` (existing) |
| Expected discharge date (jail: "Expected release date") | date | Location is a facility or program | `expected_release_date` (existing) |
| Housing before the current situation | Rent / own · Assisted living · Homeless with shelter · Living with friend / relative · Homeless · Host home · Supportive housing · Other | | `housing_prior` (existing) |
| Housing notes | | | `housing_notes` (existing) |

"Earliest date placement request" moves to section 13 as "Request earliest placement by". v2 called this section "Current location and timing"; it's renamed because the timing question moved.

### Section 6 — Mental health and clinical information · pages 4–5

| Field | Options | Show if | Saves to |
|---|---|---|---|
| Reason for referral (brief) | | | mh `reason_for_referral` |
| Diagnoses (up to 6 online: add-a-row) | | | mh `diagnoses` (list); also joined into `current_diagnoses` (existing) |
| Most recent evaluation: date, type (psychiatric / psychological), evaluator, organization | | | mh `latest_evaluation` |
| Current psychiatric medications (name, dose, frequency; add-a-row) | | | `current_medications` (existing) |
| Medication adherence | Taking as prescribed · Partially adherent · Not taking / refusing · Not currently prescribed · Unknown | | `medication_compliance` (existing) |
| Medication barriers | | Partially adherent or not taking | `medication_barriers` (existing) |
| Court-ordered medications on discharge? | Yes / No / Unknown | | mh `court_ordered_meds` |
| Outpatient certification on discharge (C.R.S. 27-65-111)? | Yes / No / Unknown | | mh `outpatient_cert` |
| Long term / short term | | Outpatient cert = yes | mh `outpatient_cert_term` |
| Psychiatric history | | | `psychiatric_history` (existing) |
| Psychiatric prescriber, phone | | | mh `prescriber` |
| Current outpatient provider: therapist name, agency / clinic, phone, email | | | mh `therapist` |
| ROI intent and scope of disclosure | Bilateral exchange (both send and receive) → `bilateral` · Send only → `send_only` · Receive only → `receive_only` | Therapist name entered | mh `therapist.roi_permission` — fills the ROI (see ROI autofill) |
| TBI history | Yes · No · Suspected · Unknown | | `tbi_history` (existing) |
| TBI details | | TBI = yes or suspected | `tbi_details` (existing) |
| IDD | Yes, documented · Yes, undocumented / suspected · No · Unknown | | `idd_status` (existing) |
| Co-occurring serious mental illness? | Yes / No / Unknown | IDD = yes (either) | mh `idd_co_occurring_smi` |
| No treatment history | checkbox | | mh `treatment_history_none` |
| Treatment history table: level of care (inpatient, outpatient/IOP/PHP, residential, detox, hospital, therapist, other), facility, treated for, admit date, discharge date, discharge type (completed / self / unknown / other) | Online: tick a level to open its row; "add another stay" | "No treatment history" unchecked | mh `treatment_history` (list) |
| Notes (more stays, outcomes) | | | `previous_treatment_programs` (existing) |

Court-ordered meds or outpatient cert = yes shows: "Please attach documentation if available."

### Section 7 — Substance use history · page 6

| Field | Options | Show if | Saves to |
|---|---|---|---|
| No history of substance use | checkbox | | mh `substance_use_none` |
| Substance table: category (alcohol, opioids, benzodiazepines/sedatives, stimulants, THC/cannabis, hallucinogens, synthetic drugs, inhalants, tobacco/nicotine, other, unknown), last use, frequency, route, notes | Tick a category to open its row | "No history" unchecked | mh `substance_use` (list) |
| Overall notes | | | `substance_use_history` (existing) |
| Needs medically supervised detox or inpatient stabilization? | Yes · No · Possibly / under evaluation · Unknown | | `detox_required` (existing) |
| Detox details | | Yes or possibly | `detox_details` (existing) |

Online, Frequency and Route are dropdowns using the printable's key. Frequency: Hourly, Daily, Weekly, Monthly, Yearly, 1-2 times in the past month, 1-2 times in the past week, 3-6 times in the past week, No use in the past month, Other. Route: Oral, Intravenous, Intranasal, Intramuscular, Inhaled, Sublingual, Subcutaneous, Topical, Rectal, Other.

### Section 8 — Medical and nursing information · pages 6–7

| Field | Options | Show if | Saves to |
|---|---|---|---|
| Medical diagnoses (up to 6) + notes | | | `medical_conditions` (existing; joined list + notes) |
| Controlled by current medications? | Yes, well controlled · Partially · No, uncontrolled · Not applicable · Unknown | Any medical diagnosis entered | `medical_conditions_controlled` (existing) |
| Non-psychiatric medications | | | `medications_non_psychiatric` (existing) |
| Medication allergies | | | `medication_allergies` (existing) |
| Mobility / assistive devices | Fully independent · Cane / walker · Wheelchair · Bedbound / limited mobility · Other | | `mobility_needs` (existing) |
| ADL and other assistive needs | | | `adl_support_details` (existing; `adl_support_needed` set when filled) |
| Acute medical needs | | | `acute_medical_needs` (existing) |
| Requires 24/7 nursing or medical care? | Yes / No / Unknown | | mh `needs_24_7_nursing` |
| Special dietary needs | | | mh `dietary_needs` |
| Tobacco use | Yes / No | | mh `tobacco_use` |

### Section 9 — Safety and exclusionary screen · pages 7–8

| Field | Options | Show if | Saves to |
|---|---|---|---|
| Risk timeline — most recent occurrence of: suicide/self-harm/ideation, violence/aggression/ideation, elopement/AMA, restraints, isolation/seclusion | Within 30 days → `within_30_days` · Within 6 months → `within_6_months` · Within 12 months → `within_12_months` · No history → `no_history` | | `suicide_risk`, `violence_risk`, `elopement_risk` (existing); mh `restraints`, `seclusion` |
| Details of suicide, violence, elopement, ideation history | | | `safety_notes` (existing) |
| Behaviors that may require a locked facility? | Yes / No / Unknown | | mh `locked_facility_behaviors` |
| Documented incidents in past 6 months? | Yes / No | | mh `incidents_6_months` |
| Describe incident(s) | | Incidents = yes | mh `incidents_details` |
| Arson history or charges? | Yes, current charges · Yes, historical · No · Unknown | | `arson_history` (existing) |
| Arson details | | Arson = yes (either) | `arson_details` (existing) |
| RSO status | Yes, currently registered · Yes, pending charges · No · Unknown | | `rso_status` (existing) |
| RSO details | | RSO = yes (either) | `rso_details` (existing) |
| Additional safety information | | | mh `additional_safety_info` |

### Section 10 — Legal and court-ordered mandates · page 8

Intro: "Please complete this section if the applicant has any active, pending, or unresolved legal cases or court mandates."

| Field | Options | Show if | Saves to |
|---|---|---|---|
| Active court case? | Yes / No | | mh `active_court_case` |
| Charges, county, case number, next court date, attorney name, attorney phone | | Court case = yes | `charges`, `court_jurisdiction`, `case_number`, `next_court_date`, `attorney_name`, `attorney_phone` (existing) |
| Attorney email | | Attorney listed | mh `attorney.email` |
| Attorney ROI permission (mark one) | Bilateral exchange → `bilateral` · Send only → `send_only` · Receive only → `receive_only` | Attorney listed | mh `attorney.roi_permission` |
| Legal history summary | | | mh `legal_history` |
| 1. Subject to any active temporary or permanent protection / restraining orders? | No → `no` (skip to supervision) · Yes → `yes` | | mh `protection_order.active` |
| 2. Applicant's status under the order (check all that apply) | Restrained party → `restrained` · Protected party → `protected` | Q1 = yes | mh `protection_order.status` (list) |
| 3. Legal name(s) of protected party(ies), order / case number | Note: "required by Monarch Mental Health to monitor court-ordered communication boundaries and ensure program compliance." | Status includes restrained | mh `protection_order.protected_parties`, `protection_order.case_number` |
| 4. Copy of the active protection order | Attached → `attached` · Unavailable → `unavailable` + reason | Q1 = yes | mh `protection_order.copy`, `protection_order.unavailable_reason`; online, "Attached" opens the upload as document type `protection_order` |

Why we ask (staff-facing): compliance and monitoring, facility safety and boundary management, and intake documentation.
| Supervision | None · On probation · On parole · Pretrial | | mh `supervision`; also sets `on_probation` / `on_parole` (existing) |
| Officer name / contact | | Supervision ≠ none | `probation_officer_contact` or `parole_officer_contact` (existing; pretrial → probation field) |
| Active warrants? | Yes / No / Unknown | | `active_warrants` (existing) |

### Section 11 — Contacts and payee · page 9

Each contact: name, relationship, organization, role, phone, email, and **ROI permission** (mark one):

| Option | Code | Meaning |
|---|---|---|
| Bilateral exchange | `bilateral` | Monarch and this person may share, discuss, and request information to coordinate care. |
| One-way: Send only | `send_only` | Monarch may send updates / records to this person. |
| One-way: Receive only | `receive_only` | Monarch may request / receive records from this person. |

Stored as `roi_permission` on each `additional_contacts` entry. For the emergency contact, `emergency_contact_can_provide_info` (existing) is set true for bilateral or receive only.

| Contact | Online | Saves to |
|---|---|---|
| Emergency contact | One, with "please add if you can" reminder | `additional_contacts` (`type: emergency`) + `emergency_contact_name/relationship/phone`, `emergency_contact_can_provide_info` (existing) |
| Guardian | Up to 2 (add button) | `additional_contacts` (`type: guardian`) |
| Payee | Up to 1 | `additional_contacts` (`type: payee`) |
| Professional contacts | Up to 3 | `additional_contacts` (`type: professional`) |

Section note: "Contacts listed here are added to the Authorization for Release of Information (ROI) with these permissions; Monarch can only share information once a signed ROI covers them."

### Section 12 — Documents and checklist · page 10

**Attachments** — all optional. Intro: "Attach what you have. Missing items don't prevent submission."

Starred items show: "Please attach if available — we'll need these before a final decision."

| Document | Starred | Code |
|---|---|---|
| Current medication list (MAR), including PRN | ★ | `medication_list_mar` |
| Most recent social work progress notes | ★ | `social_work_progress_notes` |
| Most recent psychiatric progress notes (review for anything relevant to sections 9 and 10) | ★ | `psychiatric_progress_notes` |
| Health First Colorado / Medicare cards | | `insurance_cards` |
| Most recent nursing notes | | `nursing_notes` |
| Most recent psychiatric / psychological evaluation | | `evaluation` |
| Incident reports | | `incident_reports` |
| Legal history | | `legal_history` |
| Court-ordered medication or outpatient certification documentation | | `court_orders_cert` |
| LOC assessment / CMHS waiver documentation | | `loc_waiver_docs` |
| Authorized-representative documents (POA, guardianship, court appointment) | | `authorized_rep_docs` |
| Collateral (biopsychosocial assessments, treatment plans, therapy notes) | | `collateral` |
| ID: Colorado ID, Social Security card, birth certificate | | `identification` |
| Signed ROI(s) | | `signed_roi` |
| Protection order (from section 10, Q4) | | `protection_order` |

Checklist → `documents_available` (existing); notes → `documents_notes` (existing); files → existing `referral-documents` storage bucket.

### Section 13 — Timeline and notes · page 10

| Field | Options | Show if | Saves to |
|---|---|---|---|
| Referral urgency | Immediate → `immediate` · Within 1–2 weeks → `within_1_2_weeks` · Within 1–3 months → `within_1_3_months` · Planning ahead → `planning_ahead` | | `urgency_level` (existing) |
| Reason for urgency | | Immediate or within 1–2 weeks | `urgency_reason` (existing) |
| **Request earliest placement by** | date (moved here from page 3; doesn't need a discharge date) | | `requested_placement_by` (**new**) |
| Additional notes or special considerations | | | `additional_notes` (existing) |
| How did you hear about Monarch Mental Health? | Colleague / professional referral · Website / online search · Previous experience with Monarch · Conference / training · Other | | `referral_source_channel` (existing) |
| If other, specify | | Other | mh `how_heard_other` |

### Section 14 — Attestation and signature · page 10

| Field | Options | Show if | Saves to |
|---|---|---|---|
| Attestation | checkbox + typed full name (online); signature + printed name (printable) | | `attestation_name`, `attested_at` (**new**) |
| Signature style (online) | Typed (plain) → `typed` · Script (the typed name shown in a cursive signature font) → `script` | Name entered | mh `attestation_signature_style` |

**Online signature:** the signer checks the attestation box and types their full name. They can keep it as typed, or pick "script" to show the same name in a cursive signature font (an "adopt signature" pattern). No drawing pad. The submission stores the typed name, the style, `attested_at`, and the browser user agent (mh `attestation_user_agent`) as an audit trail. The name that's stored is always the typed text; the font is display only.
| Organization, role | | Professional | prefilled from section 1 |

**Attestation text:**

> I attest that the information provided is accurate to the best of my knowledge, and that I am authorized to submit this referral. I authorize Monarch to receive the protected health information included in this referral, and to contact the applicant or their legally authorized representative.

Self mode: "I attest that the information I've provided is accurate to the best of my knowledge. I authorize Monarch to receive the health information in this referral and to contact me."

The **For Monarch use only** box stays on the printable only; online, staff use the dashboard status.

`submitted_via` (**new**): `portal`, `public_web`, or `paper` (staff entering a paper referral).

---

## 4. Database changes (summary)

New columns on `referral_submissions`, all optional:

| Column | Type |
|---|---|
| `client_address_line1`, `client_address_line2`, `client_city`, `client_state`, `client_postal_code` | text |
| `client_gender_identity`, `client_race` | text[] |
| `client_gender_detail`, `client_military_status` | text |
| `requested_placement_by` | date |
| `attestation_name` | text |
| `attested_at` | timestamptz |
| `submitted_via` | text |
| `mh_intake` | jsonb |

No changes to existing columns. `prog_mental_health` was activated 2026-10-26 (`is_active = true` + staff memberships) for portal/dashboard use; marketing www cutover is separate.

---

## 5. Printable form changes (v2 → v3)

1. **Page 2, gender identity:** "mark one" → "check all that apply". Options: Male, Female, Transgender male, Transgender female, Non-binary / genderqueer, Prefer not to say, Another identity (please specify).
2. **Page 2, race:** remove "Other"; "Prefer not to say" → "Decline to specify". Use Ritten's wording: "Black or African American", "Native Hawaiian or Other Pacific Islander", "American Indian or Alaska Native".
3. **Page 2, Hispanic / Latino** → **Ethnicity (mark one):** Hispanic or Latino · Not Hispanic or Latino · Decline to specify.
4. **Page 1, level-of-care intro:** "CMA case managers, please indicate…" → "Professionals: please indicate the level of care determination if known. If you are unsure, or you are referring yourself or a loved one, leave this section blank."
5. **Page 3:** keep "Expected discharge date" with the note "(if currently in a facility or program)". Remove "Earliest date placement request".
6. **Page 10:** add "Request earliest placement by (MM/DD/YYYY)" next to referral urgency.
7. **Page 10, starred attachments:** "* Please attach to initial referral" → "* Please attach if available — needed before a final decision".
8. **Page 10, psychiatric progress notes:** "anything relevant to section 9" → "anything relevant to sections 9 and 10".
9. **Page 10, attestation:** replace with the text in section 14 above.
10. **Page 3, RAE:** list the four RAEs as checkboxes instead of a blank.
11. **Layout:** keeps the v2 page layout and 14 section headings. Adds the running footer ("Monarch Mental Health • Program Referral" / "Page N of 10"), more space under the page header, and the split discharge-type columns on page 5.
12. **Page 3:** section 5 renamed "Current location and housing".
13. **Pages 4 and 6:** diagnosis number columns narrowed to fit the numbers.
14. **Page 5:** therapist replaced by "Current outpatient provider information" (name, agency / clinic, phone, email) with ROI intent: bilateral exchange, or one-way send only / receive only.
15. **Page 8:** section 10 renamed "Legal and court-ordered mandates"; protection / restraining orders rewritten as four numbered questions (active order, applicant status, protected party names, copy attached / unavailable).
16. **Page 9:** "Can provide / can receive collateral" replaced by ROI permission: bilateral exchange, or one-way send only / receive only.
17. **Page 3:** "Referring Case Management Agency (CMA)" block added after Medicaid RAE (agency name, assigned case manager, case manager phone / email).
18. **Page 8:** attorney row adds email and an ROI permission row (bilateral exchange, or one-way send only / receive only).
19. **Pages 2–4 reflow:** the start of section 4 (enrollment, eligibility, member ID) moved to the bottom of page 2; housing before the current situation moved from page 4 to page 3, so section 5 sits on one page.
20. **Page 1:** CMA case manager ROI permission row added under the CMA / case manager fields in section 2.
21. **Page 2, sex assigned at birth:** "Unknown" added to match Ritten.

**Pending review (Christina, admissions):** the CMA name, case manager name and phone appear in both section 2 (page 1) and section 4 (page 3). Both stay for now; no changes until admissions weighs in.

v3 source: `printable/mmh-referral-form-v3-print.html` (open in Chrome or Safari → Print → Save as PDF).

---

## 6. ROI autofill from section 6 (therapist), section 10 (attorney) and section 11 (contacts)

The therapist (section 6), attorney (section 10) and contacts (section 11) prefill the parties on the Mental Health ROI with the permission chosen for each, so the signer only reviews and signs.

**Template:** a new MMH ROI template in DocuSeal, built from the 2025 bilateral ROI text (`Monarch Mental Health Authorization for Bilateral Release of Information Updated 2025 (1).rtf`) with the MMH logo at the top. The RTF has one blank list of "individuals or organizations"; the DocuSeal version uses the same party slots as the Competency ROI v2.2 so they can be filled automatically:

| DocuSeal field | Filled from |
|---|---|
| `release_party_1…6_name/role/contact` (Monarch may share with) | Section 2 CMA case manager, section 6 therapist, section 10 attorney and section 11 contacts marked **Bilateral exchange** or **Send only** |
| `receive_party_1…6_name/role/contact` (Monarch may receive from) | Section 2 CMA case manager, section 6 therapist, section 10 attorney and section 11 contacts marked **Bilateral exchange** or **Receive only** |
| `legal_first_name`, `legal_middle_name`, `legal_last_name`, `date_of_birth`, `last_four_ssn`, `internal_use_referral_reference_code` | Section 3 (same as Competency today) |
| Client address, phone, email (on the MMH ROI) | Section 3 |

Rules:
- **name** = contact name; **role** = relationship and role (e.g. "Guardian", "Psychiatrist"); **contact** = organization, phone, email joined.
- Bilateral fills both lists; send only fills "release to"; receive only fills "receive from". A contact with no permission marked isn't added.
- The **referrer** (professional mode) is added to both lists first, since the ROI asks to "include the referring organization".
- The **CMA case manager** (section 2) is added with the permission marked on page 1. If the referrer is the CMA case manager, they're added once, as the referrer.
- Order: referrer, CMA case manager, therapist, attorney, emergency contact, guardians, payee, professional contacts. If more than 6 qualify, the extras are left for the signer to add.
- Prefilled parties stay editable for the signer, who can remove anyone before signing.
- The edge function `monarch-roi-signing-session` picks the template by program (`DOCUSEAL_ROI_TEMPLATE_ID` for Competency, a new `DOCUSEAL_ROI_TEMPLATE_ID_MH` for Mental Health) and builds these values in `buildPrefillValues`. The same contact mapping can later be switched on for Competency.

---

## 7. Online form styling

- Match the Competency referral form: same layout, components and **vertical stepper on the left** listing sections 1–14, with MMH logo and colors (MMH blue `#7c9aaa`, dark `#1d1d1b`).
- Sections hidden by wording mode (section 2 for loved one and self) are skipped in the stepper.
- **ROI signing page fix:** the DocuSeal helper panel at the bottom of `/r` covers the lower half of the ROI when opened. Fix before the MMH ROI goes live (constrain the panel height and keep the document scrollable above it).

---

## 8. Decisions

1. **POA / guardian:** loved-one mode (softer wording). ✅
2. **Attestation:** submitting a referral authorizes Monarch to receive and securely transmit the PHI in it; an ROI isn't a prerequisite to referring. The v2 wording was wrong. ✅
3. **Printable v3:** produced from the repo. ✅
4. **ROI autofill** from the CMA case manager, therapist, attorney and section 11 contacts. ✅
5. **Sex assigned at birth:** matches Ritten (Male / Female / Unknown). ✅
6. **Online signature:** checkbox + typed name, with an optional cursive-font rendering of the typed name. The ROI is still signed separately in DocuSeal. ✅
7. **Notifications:** new Mental Health referrals email referrals@monarchmentalhealth.org (goes to Christina). No PHI in the email. ✅

## 9. Notification email

- **To:** referrals@monarchmentalhealth.org
- **Subject / body:** "New referral received from {submitter}", plus a link to the staff dashboard. Nothing about the individual being referred.
- **{submitter}:**
  - Professional: first and last name (e.g. "Jane Smith").
  - Loved one: first name and last initial (e.g. "Jane S.").
  - Self: no name. The email says "New self-referral received", because in a self-referral the submitter is the individual, and their name next to "referral" would itself be PHI.

## 10. Still open

- Christina (admissions) to review the duplicate CMA fields on pages 1 and 3.
