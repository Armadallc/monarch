# Referral Form — All Questions Reference

> Extracted from `Code/Framer/ReferralForm.tsx`. Use this list to build a viewable/printable PDF or paper form.  
> Steps 0–13; optional/conditional questions noted.

---

## Step 0 — Who is making this referral?

**Choose one:**

- Court System
- Legal Representative
- Probation/Parole
- Mental Health/Medical Facility
- Case Management/Social Services
- Other Professional
- Family Member or Friend
- Self-Referral

*(Family/Friend and Self paths show a shorter flow; below is the full professional referral path.)*

---

## Step 1 — Your Contact Information

| # | Question | Field | Type |
|---|----------|--------|------|
| 1 | Full Name | referral_source_name | text |
| 2 | Organization / Agency | referral_source_organization | text |
| 3 | Title / Position | referral_source_title | text |
| 4 | Phone Number | referral_source_phone | tel |
| 5 | Email Address | referral_source_email | email |
| 6 | Can you provide collateral information for this referral? | can_provide_collateral | select: Yes / No / Partial / Some information |
| 7 | Has this individual been referred to Monarch previously? | previous_monarch_referral | select: Yes / No / Unknown |
| 8 | Request Urgent Placement | urgent_placement | checkbox |

---

## Step 2 — Additional Contacts

### Emergency Contact

| # | Question | Field | Type |
|---|----------|--------|------|
| 1 | Emergency Contact Name | emergency_contact_name | text (placeholder: Family member or guardian) |
| 2 | Emergency Contact Phone | emergency_contact_phone | tel |
| 3 | Relationship to Client | emergency_contact_relationship | text (e.g., Mother, Guardian, Spouse) |
| 4 | Emergency contact can provide collateral information | emergency_contact_can_provide_info | checkbox |

### Additional Professional Contacts (repeatable)

Per contact:

- Contact Name
- Organization & Title (e.g., Public Defender's Office - Attorney)
- Phone / Email
- Role / Affiliation (e.g., Defense Attorney, Case Manager)
- Can provide collateral information (checkbox)

*(Button: + Add Another Contact)*

---

## Step 3 — Individual Being Referred — Demographics

| # | Question | Field | Type |
|---|----------|--------|------|
| 1 | Legal First Name | client_first_name | text |
| 2 | Legal Middle Name | client_middle_name | text |
| 3 | Legal Last Name | client_last_name | text |
| 4 | Aliases / Nicknames / Previous Names | client_preferred_name | text |
| 5 | Date of Birth | client_dob | date |
| 6 | SSN (if available) | client_ssn | text (optional, XXX-XX-XXXX) |
| 7 | Gender Identity | client_gender | select: Male, Female, Non-binary, Transgender Male, Transgender Female, Other, Prefer not to say |
| 8 | Sex Assigned at Birth | client_sex_at_birth | select: Male, Female |
| 9 | Preferred Pronouns | client_pronouns | select: He/Him, She/Her, They/Them, Other |
| 10 | Primary Language | client_primary_language | text (e.g., English, Spanish) |
| 11 | English Proficiency | client_english_proficiency | select: Fluent, Conversational, Limited, None, Unknown |
| 12 | Interpreter Needed | interpreter_needed | checkbox |
| 13 | Racial/Ethnic Background | client_ethnicity | select: American Indian/Alaska Native, Asian, Black/African American, Hispanic/Latino, Native Hawaiian/Pacific Islander, White, Two or More, Other, Prefer not to say |
| 14 | Marital Status | client_marital_status | select: Single, Married, Divorced, Separated, Widowed, Domestic Partnership, Unknown |
| 15 | Client Phone | client_phone | tel |
| 16 | Client Email | client_email | email |
| 17 | Does the client consent to this referral? | client_consents_to_referral | select: Yes, No, Unable to consent / Unknown |

---

## Step 4 — Documents Inventory

For each document type below, select **one** status (stored in `documents_available` jsonb as `{ type, status }` on submit). **No file uploads on this step.**

| Document type | Status options |
|---------------|----------------|
| Valid Colorado ID | In my custody — available upon request / Can help obtain / Unknown |
| Expired Colorado ID | (same) |
| Out-of-State ID | (same) |
| Social Security Card | (same) |
| Birth Certificate | (same) |
| Insurance Card(s) | (same) |
| Court Order / Competency Order | (same) |
| Competency Evaluation Report | (same) |
| Psychiatric Records | (same) |
| Medical Records | (same) |
| Medication List (MAR) | (same) |
| Signed ROI(s) | (same) |

| # | Question | Field | Type |
|---|----------|--------|------|
| 1 | Additional notes (optional) | documents_notes | textarea |

Uploads happen after submission via the **portal** or **document upload** page when admissions requests files.

---

## Step 5 — Insurance & Benefits

### Medicaid

| # | Question | Field | Type |
|---|----------|--------|------|
| 1 | Medicaid Status | medicaid_status | select: Active, Suspended, Application Pending, Not Eligible, Unknown |
| 2 | Medicaid Number | medicaid_number | text (member ID) |

### Medicare

| # | Question | Field | Type |
|---|----------|--------|------|
| 3 | Medicare Status | medicare_status | select: Active, Pending, Not Eligible, Unknown |
| 4 | Medicare Number | medicare_number | text (beneficiary ID) |

### Other Insurance

| # | Question | Field | Type |
|---|----------|--------|------|
| 5 | Has Private Insurance | has_private_insurance | checkbox |
| 6 | Private Insurance Details | private_insurance_details | textarea (if yes) |

### Benefits

| # | Question | Field | Type |
|---|----------|--------|------|
| 7 | SSI/SSDI Status | ssdi_status | select: Receiving SSI, Receiving SSDI, Receiving SSI & SSDI, Applied/Pending, Not Receiving, Unknown |
| 8 | Additional Benefits Information | benefits_notes | textarea |

---

## Step 6 — Legal Status & Court Information

### Court Case

| # | Question | Field | Type |
|---|----------|--------|------|
| 1 | County / Judicial District | court_jurisdiction | select (CO judicial districts 1st–22nd) |
| 2 | Case Number | case_number | text |
| 3 | Assigned Judge | judge_name | text |
| 4 | Courtroom | courtroom | text |
| 5 | Next Court Date | next_court_date | date |
| 6 | Charges (Brief Summary) | charges | textarea |

### Competency Status

| # | Question | Field | Type |
|---|----------|--------|------|
| 7 | Competency Status | competency_status | select: Evaluation Ordered, Found Incompetent to Proceed, Restoration Ordered, Currently in Restoration, Restored to Competency, Found Not Restorable, Pending Evaluation |
| 8 | Competency Evaluation Date | competency_eval_date | date |
| 9 | Evaluating Clinician / Organization | competency_evaluator | text |

### Legal Representation

| # | Question | Field | Type |
|---|----------|--------|------|
| 10 | Defense Attorney | attorney_name | text |
| 11 | Attorney Phone | attorney_phone | tel |
| 12 | Attorney Email | attorney_email | email |

### Supervision & Bond Status

| # | Question | Field | Type |
|---|----------|--------|------|
| 13 | Currently on Probation | on_probation | checkbox |
| 14 | Probation Officer Name / Contact | probation_officer_contact | text (if on probation) |
| 15 | Currently on Parole | on_parole | checkbox |
| 16 | Parole Officer Contact | parole_officer_contact | text (if on parole) |
| 17 | Active Warrants? | active_warrants | select: Yes, No, Unknown |
| 18 | Bond Holds? | has_bond_holds | select: Yes, No, Unknown |
| 19 | Bond Hold Details | bond_holds_details | textarea (if yes) |
| 20 | PR Bond to Monarch? | pr_bond_to_monarch | select: Yes, No, Pending, Not Applicable |
| 21 | Judge Contact (PR bond notifications) | pr_bond_judge_contact | text (if PR bond yes) |
| 22 | DA Contact | pr_bond_da_contact | text (if PR bond yes) |
| 23 | Other Parties to Notify | pr_bond_other_contacts | textarea (if PR bond yes) |

---

## Step 7 — Current Location & Situation

| # | Question | Field | Type |
|---|----------|--------|------|
| 1 | Current Location Type | current_location_type | select: County Jail, State Prison/DOC, Hospital (Medical), Psychiatric Hospital, State Hospital (CMHIP), Treatment Facility, Residential Program, Community (Supervised/Unsupervised), Homeless/Shelter, Other |
| 2 | Facility Name | facility_name | text |
| 3 | Facility Address | facility_address | text |
| 4 | Inmate / Patient ID Number | inmate_id | text |
| 5 | Facility Contact Person | facility_contact_person | text |
| 6 | Facility Contact Phone | facility_contact_phone | tel |
| 7 | Currently Incarcerated | currently_incarcerated | checkbox |
| 8 | Expected Release Date | expected_release_date | date (if incarcerated) |

### Housing History

| # | Question | Field | Type |
|---|----------|--------|------|
| 9 | Housing Prior to Current Situation | housing_prior | select: Own Home/Apartment, Living with Family/Friend, Group Home/Assisted Living, Shelter, Homeless/Unsheltered, Transitional Housing, Other, Unknown |
| 10 | Post-Program Housing Plan | housing_post_program | select: Return to Own Home, Family/Friend, Group Home/Assisted Living, Transitional Housing, Needs Placement Assistance, Unknown/TBD |
| 11 | Housing Notes | housing_notes | textarea |

---

## Step 8 — Mental Health & Clinical Information

| # | Question | Field | Type |
|---|----------|--------|------|
| 1 | Mental Health Diagnoses | current_diagnoses | textarea |
| 2 | Medication Compliance | medication_compliance | select: Compliant, Partially Compliant, Non-Compliant/Refusing, Not Currently Prescribed, Unknown |
| 3 | Current Psychiatric Medications | current_medications | textarea |
| 4 | Medication Barriers | medication_barriers | textarea (if partially/non-compliant) |
| 5 | Psychiatric History | psychiatric_history | textarea |
| 6 | Previous Treatment Programs | previous_treatment_programs | textarea |

### Traumatic Brain Injury (TBI)

| # | Question | Field | Type |
|---|----------|--------|------|
| 7 | History of TBI? | tbi_history | select: Yes, No, Suspected, Unknown |
| 8 | TBI Details | tbi_details | textarea (if yes/suspected) |

### Intellectual / Developmental Disability (IDD)

| # | Question | Field | Type |
|---|----------|--------|------|
| 9 | Known IDD? | idd_status | select: Yes — Documented, Yes — Undocumented/Suspected, No, Unknown |
| 10 | IDD Details | idd_details | textarea (if yes) |

---

## Step 9 — Substance Use History

| # | Question | Field | Type |
|---|----------|--------|------|
| 1 | Substance Use Pattern | substance_use_pattern | select: No History, Historical Only (1+ year sober), In Recovery (active program), Occasional/Social, Regular, Daily, IV Drug Use, Unknown |
| 2 | Current Use (Last 90 Days) | substance_use_current | textarea (if not no_history/unknown) |
| 3 | Past Substance Use History | substance_use_history | textarea |
| 4 | Needs Medically Supervised Detox? | detox_required | select: Yes, No, Possibly/Under Evaluation, Unknown |
| 5 | Detox Details | detox_details | textarea (if yes/possibly) |

---

## Step 10 — Medical & Somatic Information

| # | Question | Field | Type |
|---|----------|--------|------|
| 1 | Medical / Somatic Diagnoses | medical_conditions | textarea |
| 2 | Are conditions controlled by current medications? | medical_conditions_controlled | select: Yes — Well Controlled, Partially Controlled, No — Uncontrolled, Not Applicable, Unknown |
| 3 | Non-Psychiatric Medications | medications_non_psychiatric | textarea |
| 4 | Medication Allergies | medication_allergies | textarea |
| 5 | Mobility / Assistive Device Needs | mobility_needs | select: Fully Independent, Cane/Walker, Wheelchair, Bedbound/Limited Mobility, Other Assistive Needs |
| 6 | Requires ADL (Activities of Daily Living) Support | adl_support_needed | checkbox |
| 7 | ADL Support Details | adl_support_details | textarea (if yes) |
| 8 | Acute Medical Needs | acute_medical_needs | textarea |

---

## Step 11 — Safety & Risk Assessment

### Self-Harm / Suicide Risk

| # | Question | Field | Type |
|---|----------|--------|------|
| 1 | Suicide / Self-Harm History | suicide_risk | select: Current (30 days), Recent (90 days), Recovering (4–12 months), Historical (1+ year), No History |
| 2 | Suicide Risk Details | suicide_risk_details | textarea (if not no_history) |

### Violence / Aggression

| # | Question | Field | Type |
|---|----------|--------|------|
| 3 | Violence / Aggression History | violence_risk | select: (same timeframe options) |
| 4 | Violence Risk Details | violence_risk_details | textarea (if not no_history) |

### Elopement / AMA Risk

| # | Question | Field | Type |
|---|----------|--------|------|
| 5 | Elopement / AMA History | elopement_risk | select: (same timeframe options) |
| 6 | Elopement Details | elopement_risk_details | textarea (if not no_history) |

### Special Population Flags

| # | Question | Field | Type |
|---|----------|--------|------|
| 7 | Arson History / Charges? | arson_history | select: Yes — Current Charges, Yes — Historical, No, Unknown |
| 8 | Arson Details | arson_details | textarea (if yes) |
| 9 | Registered Sex Offender (RSO) Status? | rso_status | select: Yes — Currently Registered, Yes — Pending Charges, No, Unknown |
| 10 | RSO Details | rso_details | textarea (if yes) |

### Additional Safety

| # | Question | Field | Type |
|---|----------|--------|------|
| 11 | Requires Specialized Medical Care | medical_needs | checkbox |
| 12 | Additional Safety Information | safety_notes | textarea |

---

## Step 12 — Additional Notes & Urgency

| # | Question | Field | Type |
|---|----------|--------|------|
| 1 | Referral Urgency | urgency_level | select: Immediate — Needs placement ASAP, Urgent — Within 1–2 weeks, Standard, Planning Ahead — Future placement |
| 2 | Reason for Urgency | urgency_reason | textarea (if immediate/urgent) |
| 3 | Additional Notes or Special Considerations | additional_notes | textarea |
| 4 | How did you hear about Monarch Competency? | referral_source_channel | select: Court Referral, Colleague/Professional Referral, Website/Online Search, Conference/Training, Previous Experience with Monarch, Other |

---

## Step 13 — Review & Submit

Review-only step: all sections listed with edit buttons (Referral Source, Additional Contacts, Client Demographics, Documents, Insurance, Legal, Current Location, Mental Health & Clinical, Substance Use, Medical & Somatic, Safety & Risk, Urgency & Notes). Submit button at bottom.

---

## Field name index (for developers)

All form state keys used in `ReferralForm.tsx` are listed in the "Field" column above. Use them to match exports, database columns, or a custom PDF layout.
